"""
Adaptive diagnostic quiz engine — plain rule-based "staircase" logic, not
LangGraph. Structured so the external contract used by the routes
(start / answer / result) doesn't need to change if this gets swapped for
a LangGraph state machine later.

Per subject, the engine probes each of the student's own-class topics; on
a wrong answer it steps down to that topic's prerequisite (one class
below) and re-probes, continuing until either a correct answer is given
(the gap "bottoms out" there) or a topic with no prerequisite is reached
(the floor — class 1, or class 3 for EVS, with no special-casing needed
since that's simply where prerequisite_codes runs out).
"""

import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from sqlmodel import select

from src.models.quiz import (
    AttemptStatus,
    GapStatus,
    Question,
    QuizAnswer,
    QuizAttempt,
    StudentTopicGap,
    Topic,
)
from src.models.student import Student
from src.services.bkt_service import P_INIT, get_student_topic_mastery

MAX_PROBES_PER_TOPIC = 1  # spec allows 1-2; 1 keeps a demo-length quiz
MAX_TOTAL_PROBES_PER_SUBJECT = 10
ALL_SUBJECTS = ["Mathematics", "English", "Hindi", "EVS"]


def _utcnow() -> datetime:
    return datetime.utcnow()


# ── Topic lookups ────────────────────────────────────────────────────────────
#
# Topics are static reference data (only change via an offline curriculum
# re-seed) and small in number (~80 rows), but the adaptive engine looks one
# up several times per single answer submission (validating the pending
# question, resolving the top-level topic for gap recording, checking the
# prerequisite floor, resolving the next topic to probe...). Round-tripping
# each of those to Postgres serially was the real source of the multi-second
# per-question pauses reported against the quiz (there is no live AI call in
# this request path — see docstring at the top of this file) — an in-process
# cache turns most of those into dict lookups.
_topic_cache: dict[str, Topic] = {}
_topic_cache_lock = asyncio.Lock()


async def _ensure_topic_cache(session: AsyncSession) -> None:
    if _topic_cache:
        return
    async with _topic_cache_lock:
        if _topic_cache:  # re-check: another request may have filled it while we waited
            return
        result = await session.execute(select(Topic))
        for topic in result.scalars().all():
            _topic_cache[topic.code] = topic


async def _get_topic_by_code(code: str, session: AsyncSession) -> Topic:
    await _ensure_topic_cache(session)
    topic = _topic_cache.get(code)
    if topic is not None:
        return topic

    # Cache miss — either a bad code, or a topic seeded after this process
    # started. Fall back to a direct lookup and cache the result either way.
    result = await session.execute(select(Topic).where(Topic.code == code))
    topic = result.scalar_one_or_none()
    if topic is None:
        raise RuntimeError(f"Topic code '{code}' not found — taxonomy/DB mismatch.")
    _topic_cache[code] = topic
    return topic


async def _topic_codes_for(subject: str, class_number: int, session: AsyncSession) -> list[str]:
    result = await session.execute(
        select(Topic.code)
        .where(Topic.subject == subject, Topic.class_number == class_number)
        .order_by(Topic.code)
    )
    return list(result.scalars().all())


def _tier_rank(question: Question, branch_name: Optional[str]) -> Optional[int]:
    """Lower is better. None means this question doesn't belong to any
    tier for this request (a different school's branch-grounded content)
    and must never be served. Mirrors the old 4-tier priority: this
    school's own module content first (reviewed over unreviewed), the
    generic NCERT bank as fallback (reviewed over unreviewed)."""
    if branch_name and question.module_id is not None and question.branch_name == branch_name:
        return 0 if question.reviewed else 1
    if question.module_id is None:
        return 2 if question.reviewed else 3
    return None


async def _pick_question(
    topic_code: str, exclude_ids: list[str], branch_name: Optional[str], session: AsyncSession
) -> Optional[Question]:
    """
    Question source priority: this school's own uploaded module content
    first, the generic NCERT-aligned bank as fallback — within each source,
    reviewed questions are preferred over unreviewed ones. A school's own
    module content is preferred even unreviewed over the generic bank,
    since it's what the school actually teaches from.

    One round trip instead of up to four sequential tier queries — this was
    a real, measurable chunk of the per-question latency on a remote DB,
    stacked on top of every "serve the next question" step in the quiz.
    """
    topic = await _get_topic_by_code(topic_code, session)
    query = select(Question).where(
        Question.topic_id == topic.id,
        Question.is_active == True,  # noqa: E712
    )
    if exclude_ids:
        query = query.where(Question.id.notin_([uuid.UUID(i) for i in exclude_ids]))

    result = await session.execute(query)
    candidates = list(result.scalars().all())
    if not candidates:
        return None

    by_tier: dict[int, list[Question]] = {}
    for q in candidates:
        rank = _tier_rank(q, branch_name)
        if rank is not None:
            by_tier.setdefault(rank, []).append(q)

    for rank in sorted(by_tier):
        return random.choice(by_tier[rank])
    return None


# ── Lane construction ────────────────────────────────────────────────────────

def _new_lane(topic_queue: list[str], student_class: int) -> dict:
    lane = {
        "topic_queue": topic_queue,
        "queue_index": 0,
        "top_topic_code": None,
        "current_topic_code": None,
        "current_depth_class": student_class,
        "probes_used_this_topic": 0,
        "first_fail_class": None,
        "asked_question_ids": [],
        "skipped_topic_codes": [],
        "total_probes": 0,
        "gaps": [],
        "completed": False,
    }
    if topic_queue:
        lane["top_topic_code"] = topic_queue[0]
        lane["current_topic_code"] = topic_queue[0]
    else:
        lane["completed"] = True
    return lane


def _advance_to_next_top_topic(lane: dict, student_class: int) -> None:
    lane["queue_index"] += 1
    if lane["queue_index"] >= len(lane["topic_queue"]):
        lane["completed"] = True
        return
    next_code = lane["topic_queue"][lane["queue_index"]]
    lane["top_topic_code"] = next_code
    lane["current_topic_code"] = next_code
    lane["current_depth_class"] = student_class
    lane["probes_used_this_topic"] = 0
    lane["first_fail_class"] = None


# ── Attempt lifecycle ────────────────────────────────────────────────────────

async def start_or_resume_attempt(
    student_id: uuid.UUID,
    student_class: int,
    requested_subjects: Optional[list[str]],
    branch_name: Optional[str],
    session: AsyncSession,
) -> tuple[QuizAttempt, Optional[Question]]:
    existing = await session.execute(
        select(QuizAttempt).where(
            QuizAttempt.student_id == student_id,
            QuizAttempt.status == AttemptStatus.IN_PROGRESS,
        )
    )
    attempt = existing.scalar_one_or_none()
    if attempt is not None:
        question = await _serve_next_question(attempt, session)
        if question is None:
            await _finalize_attempt(attempt, session)
        return attempt, question

    # The diagnostic assessment is a one-time, mandatory step — not something
    # a student can retake on demand. A future periodic re-assessment would
    # add a new attempt through a different, deliberate flow; this just
    # prevents "again and again" retakes of the initial diagnostic.
    if await has_completed_diagnostic(student_id, session):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You've already completed your diagnostic assessment. "
                   "View your results instead of starting a new one.",
        )

    subjects = requested_subjects or list(ALL_SUBJECTS)
    subjects = [s for s in subjects if s in ALL_SUBJECTS]
    if student_class < 3:
        subjects = [s for s in subjects if s != "EVS"]
    if not subjects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid subjects to quiz on.",
        )

    lanes = {}
    for subject in subjects:
        topic_queue = await _topic_codes_for(subject, student_class, session)
        lanes[subject] = _new_lane(topic_queue, student_class)

    attempt = QuizAttempt(
        student_id=student_id,
        status=AttemptStatus.IN_PROGRESS,
        class_number_at_attempt=student_class,
        subjects=subjects,
        engine_state={
            "lanes": lanes,
            "subject_order": subjects,
            "current_subject_index": 0,
            "branch_name": branch_name,
        },
    )
    session.add(attempt)
    await session.flush()  # populate attempt.id without committing

    question = await _serve_next_question(attempt, session)
    if question is None:
        # No question bank exists yet for any topic in scope — finalize
        # immediately with an empty gap report rather than leaving the
        # attempt stuck in_progress forever.
        await _finalize_attempt(attempt, session)
    return attempt, question


def _compute_subject_scores(engine_state: dict, student_class: int) -> dict:
    """Distance-weighted mastery score per subject (0-100). A topic with no
    gap earns full credit; a *recovered* gap (wrong at grade level, correct
    at some lower class) earns partial credit proportional to how close that
    class is to the student's actual class. A gap that was never recovered
    (wrong all the way to the floor, or cut off by the safety probe cap
    before ever answering correctly) earns ZERO credit — it must never be
    scored as mastery just because the safety cap happened to stop probing
    at a class number close to the student's own. Topics skipped for lack
    of a question bank are excluded — no data to score them on."""
    subject_scores: dict = {}
    for subject, lane in engine_state["lanes"].items():
        skipped = set(lane["skipped_topic_codes"])
        tested_codes = [c for c in lane["topic_queue"] if c not in skipped]
        tested_count = len(tested_codes)
        if tested_count == 0:
            subject_scores[subject] = None
            continue

        gap_by_code = {g["topic_code"]: g for g in lane["gaps"]}
        weight = 100.0 / tested_count
        score = 0.0
        classes_behind = []
        for code in tested_codes:
            gap = gap_by_code.get(code)
            if gap is None:
                score += weight
            else:
                credit_ratio = (gap["deepest_probed_class"] / student_class) if gap["recovered"] else 0.0
                score += weight * credit_ratio
                classes_behind.append(student_class - gap["deepest_probed_class"])

        subject_scores[subject] = {
            "score": round(score, 1),
            "topics_tested": tested_count,
            "gaps_found": len(gap_by_code),
            "average_classes_behind": round(sum(classes_behind) / len(classes_behind), 1)
            if classes_behind
            else 0.0,
        }
    return subject_scores


async def _finalize_attempt(attempt: QuizAttempt, session: AsyncSession) -> None:
    if attempt.status == AttemptStatus.COMPLETED:
        return
    attempt.status = AttemptStatus.COMPLETED
    attempt.completed_at = _utcnow()

    subject_scores = _compute_subject_scores(attempt.engine_state, attempt.class_number_at_attempt)
    attempt.subject_scores = subject_scores
    scored = [v["score"] for v in subject_scores.values() if v is not None]
    attempt.overall_score = round(sum(scored) / len(scored), 1) if scored else None

    session.add(attempt)
    await _sync_student_topic_gaps(attempt, session)

    # Commit now (not just flush) — the background task below opens its own
    # DB session on a separate connection, so it won't see this attempt's
    # completed status/scores until this transaction is durably committed.
    # Safe to commit early here: both callers (start_or_resume_attempt,
    # submit_answer) return immediately after this function, with no further
    # writes on `session` in between.
    await session.commit()

    # Fire-and-forget: never block the student's finish-quiz response on an
    # LLM round trip. The task opens its own DB session and writes the
    # result back once done (see src/ai/quiz_summary_service.py).
    from src.ai.quiz_summary_service import run_summary_background

    asyncio.create_task(run_summary_background(attempt.id))


async def _serve_next_question(attempt: QuizAttempt, session: AsyncSession) -> Optional[Question]:
    """Finds (and skips over empty/exhausted lanes as needed) the next
    question to serve. Mutates attempt.engine_state in place. Returns None
    if the whole attempt is complete."""
    state = attempt.engine_state
    subject_order = state["subject_order"]
    branch_name = state.get("branch_name")
    max_iterations = len(subject_order) + sum(
        len(state["lanes"][s]["topic_queue"]) for s in subject_order
    ) + 1

    for _ in range(max_iterations):
        idx = state["current_subject_index"]
        if idx >= len(subject_order):
            flag_modified(attempt, "engine_state")
            return None

        subject = subject_order[idx]
        lane = state["lanes"][subject]

        if lane["completed"]:
            state["current_subject_index"] += 1
            continue

        question = await _pick_question(
            lane["current_topic_code"], lane["asked_question_ids"], branch_name, session
        )
        if question is not None:
            flag_modified(attempt, "engine_state")
            return question

        # No question bank yet for this topic — skip it without recording a
        # gap (we have no data to judge it on), and move to the next
        # top-level topic in this lane.
        if lane["top_topic_code"] not in lane["skipped_topic_codes"]:
            lane["skipped_topic_codes"].append(lane["top_topic_code"])
        _advance_to_next_top_topic(lane, attempt.class_number_at_attempt)

    flag_modified(attempt, "engine_state")
    return None


async def submit_answer(
    attempt: QuizAttempt,
    question_id: uuid.UUID,
    selected_option_index: int,
    session: AsyncSession,
) -> tuple[bool, Optional[Question], bool]:
    """Returns (finished, next_question, was_correct). was_correct reports
    the just-submitted answer — kept separate from the adaptive engine's own
    scoring so the UI can give the student instant right/wrong feedback
    (points, streaks, mascot reactions) without exposing engine internals."""
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This attempt is not in progress."
        )

    state = attempt.engine_state
    idx = state["current_subject_index"]
    subject_order = state["subject_order"]
    if idx >= len(subject_order):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attempt already complete.")

    subject = subject_order[idx]
    lane = state["lanes"][subject]

    question = await session.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    if question.topic_id != (await _get_topic_by_code(lane["current_topic_code"], session)).id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This question is not the currently pending question for this attempt.",
        )

    is_correct = selected_option_index == question.correct_option_index

    session.add(
        QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            topic_id=question.topic_id,
            subject=subject,
            class_number=lane["current_depth_class"],
            selected_option_index=selected_option_index,
            is_correct=is_correct,
        )
    )

    lane["total_probes"] += 1
    lane["probes_used_this_topic"] += 1
    lane["asked_question_ids"].append(str(question.id))

    top_topic = await _get_topic_by_code(lane["top_topic_code"], session)

    if is_correct:
        if lane["first_fail_class"] is not None:
            lane["gaps"].append({
                "topic_code": lane["top_topic_code"],
                "topic_name": top_topic.name,
                "subject": subject,
                "first_fail_class": lane["first_fail_class"],
                "deepest_probed_class": lane["current_depth_class"],
                "recovered": True,  # answered correctly at this (lower) depth
            })
        _advance_to_next_top_topic(lane, attempt.class_number_at_attempt)
    else:
        if lane["first_fail_class"] is None:
            lane["first_fail_class"] = lane["current_depth_class"]

        if lane["probes_used_this_topic"] < MAX_PROBES_PER_TOPIC:
            pass  # ask another question at the same depth
        else:
            current_topic = await _get_topic_by_code(lane["current_topic_code"], session)
            at_floor = len(current_topic.prerequisite_codes) == 0
            cap_reached = lane["total_probes"] >= MAX_TOTAL_PROBES_PER_SUBJECT
            if at_floor or cap_reached:
                lane["gaps"].append({
                    "topic_code": lane["top_topic_code"],
                    "topic_name": top_topic.name,
                    "subject": subject,
                    "first_fail_class": lane["first_fail_class"],
                    "deepest_probed_class": lane["current_depth_class"],
                    # Never answered correctly on this chain — even if the
                    # safety cap cut probing short before reaching the true
                    # floor, this must never be scored as mastery.
                    "recovered": False,
                })
                _advance_to_next_top_topic(lane, attempt.class_number_at_attempt)
            else:
                prereq_code = current_topic.prerequisite_codes[0]
                prereq_topic = await _get_topic_by_code(prereq_code, session)
                lane["current_topic_code"] = prereq_code
                lane["current_depth_class"] = prereq_topic.class_number
                lane["probes_used_this_topic"] = 0

    flag_modified(attempt, "engine_state")
    next_question = await _serve_next_question(attempt, session)

    if next_question is None:
        await _finalize_attempt(attempt, session)
        return True, None, is_correct

    session.add(attempt)
    return False, next_question, is_correct


# ── Gap persistence ──────────────────────────────────────────────────────────

async def _sync_student_topic_gaps(attempt: QuizAttempt, session: AsyncSession) -> None:
    """Upserts StudentTopicGap: new gaps -> open; topics tested and passed
    cleanly -> flip any existing open row to resolved. Topics skipped for
    lack of a question bank are left untouched (no data to judge them on)."""
    state = attempt.engine_state
    for subject, lane in state["lanes"].items():
        gap_topic_codes = {g["topic_code"] for g in lane["gaps"]}
        skipped = set(lane["skipped_topic_codes"])

        for gap in lane["gaps"]:
            topic = await _get_topic_by_code(gap["topic_code"], session)
            existing = await session.execute(
                select(StudentTopicGap).where(
                    StudentTopicGap.student_id == attempt.student_id,
                    StudentTopicGap.topic_id == topic.id,
                )
            )
            row = existing.scalar_one_or_none()
            if row is None:
                row = StudentTopicGap(
                    student_id=attempt.student_id,
                    topic_id=topic.id,
                    subject=subject,
                    status=GapStatus.OPEN,
                    first_identified_class=gap["deepest_probed_class"],
                    last_attempt_id=attempt.id,
                )
            else:
                row.status = GapStatus.OPEN
                row.first_identified_class = gap["deepest_probed_class"]
                row.last_attempt_id = attempt.id
                row.updated_at = _utcnow()
            session.add(row)

        for topic_code in lane["topic_queue"]:
            if topic_code in gap_topic_codes or topic_code in skipped:
                continue
            topic = await _get_topic_by_code(topic_code, session)
            existing = await session.execute(
                select(StudentTopicGap).where(
                    StudentTopicGap.student_id == attempt.student_id,
                    StudentTopicGap.topic_id == topic.id,
                    StudentTopicGap.status == GapStatus.OPEN,
                )
            )
            row = existing.scalar_one_or_none()
            if row is not None:
                row.status = GapStatus.RESOLVED
                row.last_attempt_id = attempt.id
                row.updated_at = _utcnow()
                session.add(row)


# ── Diagnostic status ────────────────────────────────────────────────────────

async def has_completed_diagnostic(student_id: uuid.UUID, session: AsyncSession) -> bool:
    result = await session.execute(
        select(QuizAttempt.id)
        .where(
            QuizAttempt.student_id == student_id,
            QuizAttempt.status == AttemptStatus.COMPLETED,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def get_latest_completed_attempt(
    student_id: uuid.UUID, session: AsyncSession
) -> Optional[QuizAttempt]:
    result = await session.execute(
        select(QuizAttempt)
        .where(
            QuizAttempt.student_id == student_id,
            QuizAttempt.status == AttemptStatus.COMPLETED,
        )
        .order_by(QuizAttempt.completed_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_in_progress_attempt(
    student_id: uuid.UUID, session: AsyncSession
) -> Optional[QuizAttempt]:
    result = await session.execute(
        select(QuizAttempt).where(
            QuizAttempt.student_id == student_id,
            QuizAttempt.status == AttemptStatus.IN_PROGRESS,
        )
    )
    return result.scalar_one_or_none()


# ── Reporting ────────────────────────────────────────────────────────────────

async def compute_gap_report(attempt: QuizAttempt, session: AsyncSession) -> dict:
    if attempt.status != AttemptStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This attempt is not completed yet."
        )
    gaps = []
    for subject, lane in attempt.engine_state["lanes"].items():
        for g in lane["gaps"]:
            gaps.append({
                "subject": subject,
                "topic_code": g["topic_code"],
                "topic_name": g["topic_name"],
                "originating_class": g["deepest_probed_class"],
                "student_current_class": attempt.class_number_at_attempt,
            })
    return {
        "attempt_id": str(attempt.id),
        "subjects_covered": attempt.subjects,
        "gaps": gaps,
        "completed_at": attempt.completed_at,
        "overall_score": attempt.overall_score,
        "subject_scores": attempt.subject_scores,
        "student_class": attempt.class_number_at_attempt,
        "ai_summary": attempt.ai_summary,
        "ai_summary_status": attempt.ai_summary_status,
    }


async def get_current_gaps(student_id: uuid.UUID, session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(StudentTopicGap, Topic)
        .join(Topic, Topic.id == StudentTopicGap.topic_id)
        .where(
            StudentTopicGap.student_id == student_id,
            StudentTopicGap.status == GapStatus.OPEN,
        )
        .order_by(StudentTopicGap.subject, Topic.class_number)
    )
    gaps = []
    for gap_row, topic in result.all():
        gaps.append({
            "subject": gap_row.subject,
            "topic_code": topic.code,
            "topic_name": topic.name,
            "originating_class": gap_row.first_identified_class,
            "updated_at": gap_row.updated_at,
        })
    return gaps


async def get_subject_priority(student: Student, session: AsyncSession) -> list[dict]:
    """Ranks a student's subjects by how urgently they need review. The
    primary signal is now a Bayesian Knowledge Tracing (BKT) mastery
    estimate per topic (see bkt_service.py) averaged per subject — a
    probabilistic read of the student's full right/wrong history per
    topic, not just a gap count. The diagnostic quiz's already-recorded
    StudentTopicGap rows are still computed and returned (gap_count /
    avg_classes_behind / gap_topics) since the UI's explanatory text
    ("Review: X, Y") still uses them, and gap_count remains the tiebreaker
    for subjects tied on mastery (notably: subjects with no BKT evidence
    at all, which all land on the P_INIT default). See LEARNING_PATH.txt
    for the plain-language write-up.

    Priority order: lowest average mastery first (most urgent), then (as a
    tiebreaker) more open gaps, then further behind on average."""
    subjects = list(ALL_SUBJECTS)
    if student.class_number is not None and student.class_number < 3:
        subjects = [s for s in subjects if s != "EVS"]

    gaps = await get_current_gaps(student.id, session)
    gaps_by_subject: dict[str, list[dict]] = {s: [] for s in subjects}
    for gap in gaps:
        if gap["subject"] in gaps_by_subject:
            gaps_by_subject[gap["subject"]].append(gap)

    mastery_by_topic_id = await get_student_topic_mastery(student.id, session)

    rows = []
    for subject in subjects:
        subject_gaps = gaps_by_subject[subject]
        gap_count = len(subject_gaps)
        avg_behind = 0.0
        if gap_count and student.class_number is not None:
            classes_behind = [student.class_number - g["originating_class"] for g in subject_gaps]
            avg_behind = round(sum(classes_behind) / gap_count, 1)

        topic_ids = []
        if student.class_number is not None:
            result = await session.execute(
                select(Topic.id).where(
                    Topic.subject == subject, Topic.class_number == student.class_number
                )
            )
            topic_ids = list(result.scalars().all())

        if topic_ids:
            avg_mastery = round(
                sum(mastery_by_topic_id.get(topic_id, P_INIT) for topic_id in topic_ids)
                / len(topic_ids),
                2,
            )
        else:
            avg_mastery = round(P_INIT, 2)

        rows.append({
            "subject": subject,
            "gap_count": gap_count,
            "avg_classes_behind": avg_behind,
            "gap_topics": [g["topic_name"] for g in subject_gaps][:5],
            "avg_mastery": avg_mastery,
        })

    rows.sort(key=lambda r: (r["avg_mastery"], -r["gap_count"], -r["avg_classes_behind"]))
    for rank, row in enumerate(rows):
        row["priority_rank"] = rank
    return rows


async def get_class_quiz_summaries(
    branch_name: str, class_number: int, session: AsyncSession
) -> list[dict]:
    """Class teacher's roster view: every student in this branch+class, with
    their latest completed diagnostic (if any). Not on the timed quiz-taking
    path, so a per-student lookup is fine — class rosters are small and this
    is called far less often than the adaptive engine's own queries."""
    result = await session.execute(
        select(Student)
        .where(Student.branch_name == branch_name, Student.class_number == class_number)
        .order_by(Student.unique_number)
    )
    students = list(result.scalars().all())

    summaries = []
    for student in students:
        attempt = await get_latest_completed_attempt(student.id, session)
        if attempt is None:
            summaries.append({
                "student_unique_number": student.unique_number,
                "student_email": student.email,
                "completed": False,
                "overall_score": None,
                "gaps_found": 0,
                "ai_summary": None,
                "ai_summary_status": "pending",
                "completed_at": None,
            })
            continue
        gaps_found = sum(
            len(lane["gaps"]) for lane in attempt.engine_state.get("lanes", {}).values()
        )
        summaries.append({
            "student_unique_number": student.unique_number,
            "student_email": student.email,
            "completed": True,
            "overall_score": attempt.overall_score,
            "gaps_found": gaps_found,
            "ai_summary": attempt.ai_summary,
            "ai_summary_status": attempt.ai_summary_status,
            "completed_at": attempt.completed_at,
        })
    return summaries
