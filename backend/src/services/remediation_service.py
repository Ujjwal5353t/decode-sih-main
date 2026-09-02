"""
Gap-driven remediation modules — service layer.

Turns each of a student's open StudentTopicGap rows into a small, focused
study unit: the crux of the *earlier-class* chapter the diagnostic traced
the gap back to (not the student's current-class content — see
resolve_teaching_topic), followed by a short retention quiz on exactly that
topic. Passing the quiz resolves the gap, closing the loop the diagnostic
quiz opened.

Deliberately not LLM-backed: the crux is extracted from the same
DocumentChunk content (via chunk_service's existing RAG search) that grounds
question generation, and the retention quiz reuses the existing Question
bank filtered to the resolved topic. No network call, no quota risk, and
both surfaces stay traceable to the same NCERT-aligned source chunks the
rest of the app already relies on.
"""

import random
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.quiz import GapStatus, Question, StudentTopicGap, Topic
from src.models.remediation import RemediationAttempt
from src.models.student import Student
from src.services import chunk_service, gamification_service

# Quiz questions offered per module. Kept small — this is a "check what you
# just reviewed" quiz, not another full diagnostic probe.
QUESTIONS_PER_MODULE = 5

# Fraction correct required to consider the gap closed.
PASS_THRESHOLD = 0.7

# How many chunk-derived key points to surface per module. Deliberately
# small — the whole point is a crux, not a re-run of the full lesson.
MAX_CRUX_POINTS = 4

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


async def _get_topic_by_code(code: str, session: AsyncSession) -> Topic:
    result = await session.execute(select(Topic).where(Topic.code == code))
    topic = result.scalar_one_or_none()
    if topic is None:
        raise RuntimeError(f"Topic code '{code}' not found — taxonomy/DB mismatch.")
    return topic


async def resolve_teaching_topic(
    gap_topic: Topic, target_class: int, session: AsyncSession
) -> Topic:
    """
    A StudentTopicGap's topic_id points at the student's *current-class*
    topic (see StudentTopicGap docstring) — first_identified_class is a
    separate number recording how far back the diagnostic actually traced
    the failure. This walks the same prerequisite_codes[0] chain the
    adaptive engine stepped down during the quiz (quiz_service.submit_answer)
    to recover the *specific* earlier-class topic that chain landed on —
    which is what the crux content and retention quiz must actually be
    about, not the student's own-grade topic.

    Terminates exactly where the diagnostic did, since it retraces the same
    single-parent chain; a cycle guard is defensive only (curriculum_seed.py
    is authored acyclic).
    """
    current = gap_topic
    seen = {current.code}
    while current.class_number > target_class and current.prerequisite_codes:
        next_code = current.prerequisite_codes[0]
        if next_code in seen:
            break
        current = await _get_topic_by_code(next_code, session)
        seen.add(current.code)
    return current


def _resolve_teaching_topic_local(
    gap_topic: Topic, target_class: int, topics_by_code: dict[str, Topic]
) -> Topic:
    """Same chain-walk as resolve_teaching_topic, but against an in-memory
    topic map instead of a DB round trip per hop — used by the batched
    list_learning_modules below, which pre-loads every topic once."""
    current = gap_topic
    seen = {current.code}
    while current.class_number > target_class and current.prerequisite_codes:
        next_code = current.prerequisite_codes[0]
        if next_code in seen or next_code not in topics_by_code:
            break
        current = topics_by_code[next_code]
        seen.add(current.code)
    return current


def _extract_crux_points(chunks_content: list[str]) -> list[str]:
    """First one or two sentences of each of the top-ranked chunks, deduped
    and capped — a condensed "what you need to know" rather than the full
    chapter prose."""
    points: list[str] = []
    seen_norm: set[str] = set()
    for content in chunks_content:
        # Chunks may begin with "Chapter N: Title\n" — strip that so a crux
        # point never starts with the chapter heading itself.
        body = content.split("\n", 1)[-1].strip() if content.startswith("Chapter") else content
        sentences = [s.strip() for s in _SENTENCE_SPLIT_RE.split(body) if s.strip()]
        for sentence in sentences[:2]:
            norm = sentence.lower()
            if norm in seen_norm or len(sentence) < 15:
                continue
            seen_norm.add(norm)
            points.append(sentence)
            if len(points) >= MAX_CRUX_POINTS:
                return points
    return points


async def list_learning_modules(
    student: Student, session: AsyncSession
) -> list["LearningModuleOut"]:  # noqa: F821
    """
    Batched by construction: however many open gaps a student has, this does
    a small, fixed number of DB round trips (gaps, all topics, all relevant
    chunks in one shot, all question counts in one shot) rather than one
    round-trip set per gap — the per-gap version this replaced took ~2.5s per
    gap against the remote DB, which blew well past the frontend's request
    timeout for students with a double-digit gap count.
    """
    from src.schemas.remediation import LearningModuleOut

    result = await session.execute(
        select(StudentTopicGap)
        .where(
            StudentTopicGap.student_id == student.id,
            StudentTopicGap.status == GapStatus.OPEN,
        )
        .order_by(StudentTopicGap.subject, StudentTopicGap.updated_at.desc())
    )
    gaps = list(result.scalars().all())
    if not gaps:
        return []

    # Curriculum-wide topic set is tiny (~80 rows per quiz_service.py's own
    # cache docstring) — one query covers every gap's chain-walk locally.
    topics_result = await session.execute(select(Topic))
    all_topics = list(topics_result.scalars().all())
    topics_by_id = {t.id: t for t in all_topics}
    topics_by_code = {t.code: t for t in all_topics}

    teaching_topic_by_gap: dict[uuid.UUID, Topic] = {}
    for gap in gaps:
        gap_topic = topics_by_id.get(gap.topic_id)
        if gap_topic is None:
            continue  # taxonomy row removed since the gap was recorded — skip rather than crash
        teaching_topic_by_gap[gap.id] = _resolve_teaching_topic_local(
            gap_topic, gap.first_identified_class, topics_by_code
        )
    if not teaching_topic_by_gap:
        return []

    needed_subjects = {t.subject for t in teaching_topic_by_gap.values()}
    needed_classes = {t.class_number for t in teaching_topic_by_gap.values()}
    branch_name = student.branch_name or "SELF"

    from src.models.chunk import DocumentChunk

    chunks_result = await session.execute(
        select(DocumentChunk).where(
            (DocumentChunk.branch_name == branch_name) | (DocumentChunk.branch_name == "SELF"),
            DocumentChunk.subject.in_(needed_subjects),  # type: ignore[attr-defined]
            DocumentChunk.class_number.in_(needed_classes),  # type: ignore[attr-defined]
        )
    )
    chunks_by_pair: dict[tuple[str, int], list] = {}
    for chunk in chunks_result.scalars().all():
        chunks_by_pair.setdefault((chunk.subject, chunk.class_number), []).append(chunk)

    teaching_topic_ids = {t.id for t in teaching_topic_by_gap.values()}
    q_result = await session.execute(
        select(Question.topic_id).where(
            Question.topic_id.in_(teaching_topic_ids),  # type: ignore[attr-defined]
            Question.is_active == True,  # noqa: E712
        )
    )
    question_counts: dict[uuid.UUID, int] = {}
    for topic_id in q_result.scalars().all():
        question_counts[topic_id] = question_counts.get(topic_id, 0) + 1

    modules = []
    for gap in gaps:
        teaching_topic = teaching_topic_by_gap.get(gap.id)
        if teaching_topic is None:
            continue
        candidate_chunks = chunks_by_pair.get((teaching_topic.subject, teaching_topic.class_number), [])
        ranked = chunk_service.rank_chunks(
            candidate_chunks,
            query=f"{teaching_topic.name} {teaching_topic.description or ''}".strip(),
            top_k=3,
        )
        crux_points = _extract_crux_points([r.content for r in ranked])
        chapter_title = ranked[0].chapter_title if ranked else None
        quiz_question_count = question_counts.get(teaching_topic.id, 0)

        modules.append(
            LearningModuleOut(
                gap_id=gap.id,
                subject=gap.subject,
                topic_name=teaching_topic.name,
                topic_description=teaching_topic.description,
                origin_class=gap.first_identified_class,
                student_current_class=student.class_number or gap.first_identified_class,
                chapter_title=chapter_title,
                crux_points=crux_points,
                quiz_available=quiz_question_count > 0,
                quiz_question_count=min(quiz_question_count, QUESTIONS_PER_MODULE),
                updated_at=gap.updated_at.replace(tzinfo=timezone.utc).isoformat(),
            )
        )
    return modules


async def _get_gap_or_404(
    gap_id: uuid.UUID, student: Student, session: AsyncSession
) -> StudentTopicGap:
    gap = await session.get(StudentTopicGap, gap_id)
    if gap is None or gap.student_id != student.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found.")
    return gap


async def get_module_detail(
    gap_id: uuid.UUID, student: Student, session: AsyncSession
) -> "LearningModuleOut":  # noqa: F821
    """Single-gap detail view — unlike list_learning_modules, there is only
    one gap here, so the per-gap round trips list_learning_modules batches
    away aren't worth avoiding for just one item."""
    from src.schemas.remediation import LearningModuleOut

    gap = await _get_gap_or_404(gap_id, student, session)
    if gap.status != GapStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This gap has already been resolved.",
        )
    gap_topic = await session.get(Topic, gap.topic_id)
    if gap_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")

    teaching_topic = await resolve_teaching_topic(gap_topic, gap.first_identified_class, session)

    branch_name = student.branch_name or "SELF"
    ranked = await chunk_service.search_chunks_for_rag(
        session=session,
        branch_name=branch_name,
        class_number=teaching_topic.class_number,
        subject=teaching_topic.subject,
        query=f"{teaching_topic.name} {teaching_topic.description or ''}".strip(),
        top_k=3,
    )
    crux_points = _extract_crux_points([r.content for r in ranked])
    chapter_title = ranked[0].chapter_title if ranked else None

    q_count_result = await session.execute(
        select(Question.id).where(
            Question.topic_id == teaching_topic.id,
            Question.is_active == True,  # noqa: E712
        )
    )
    quiz_question_count = len(q_count_result.scalars().all())

    return LearningModuleOut(
        gap_id=gap.id,
        subject=gap.subject,
        topic_name=teaching_topic.name,
        topic_description=teaching_topic.description,
        origin_class=gap.first_identified_class,
        student_current_class=student.class_number or gap.first_identified_class,
        chapter_title=chapter_title,
        crux_points=crux_points,
        quiz_available=quiz_question_count > 0,
        quiz_question_count=min(quiz_question_count, QUESTIONS_PER_MODULE),
        updated_at=gap.updated_at.replace(tzinfo=timezone.utc).isoformat(),
    )


async def start_module_quiz(
    gap_id: uuid.UUID, student: Student, session: AsyncSession
) -> "ModuleQuizStartOut":  # noqa: F821
    from src.schemas.quiz import QuestionOut
    from src.schemas.remediation import ModuleQuizStartOut

    gap = await _get_gap_or_404(gap_id, student, session)
    if gap.status != GapStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This gap has already been resolved.",
        )
    gap_topic = await session.get(Topic, gap.topic_id)
    if gap_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")
    teaching_topic = await resolve_teaching_topic(gap_topic, gap.first_identified_class, session)

    result = await session.execute(
        select(Question).where(
            Question.topic_id == teaching_topic.id,
            Question.is_active == True,  # noqa: E712
        )
    )
    candidates = list(result.scalars().all())
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No retention quiz available for this module yet.",
        )
    random.shuffle(candidates)
    chosen = candidates[:QUESTIONS_PER_MODULE]

    return ModuleQuizStartOut(
        gap_id=gap.id,
        questions=[
            QuestionOut(
                id=q.id,
                subject=q.subject,
                class_number=q.class_number,
                topic_name=teaching_topic.name,
                topic_type=teaching_topic.topic_type,
                question_text=q.question_text,
                options=q.options,
                image_emoji=q.image_emoji,
                option_emojis=q.option_emojis,
                image_asset_key=q.image_asset_key,
                option_asset_keys=q.option_asset_keys,
            )
            for q in chosen
        ],
    )


async def submit_module_quiz(
    gap_id: uuid.UUID,
    answers: list[tuple[uuid.UUID, int]],
    student: Student,
    session: AsyncSession,
) -> "ModuleQuizResultOut":  # noqa: F821
    from src.schemas.remediation import ModuleQuizResultOut

    gap = await _get_gap_or_404(gap_id, student, session)
    if gap.status != GapStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This gap has already been resolved.",
        )
    if not answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers submitted.")

    gap_topic = await session.get(Topic, gap.topic_id)
    if gap_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found.")
    teaching_topic = await resolve_teaching_topic(gap_topic, gap.first_identified_class, session)

    question_ids = [qid for qid, _ in answers]
    result = await session.execute(select(Question).where(Question.id.in_(question_ids)))  # type: ignore[attr-defined]
    questions_by_id = {q.id: q for q in result.scalars().all()}

    correct_count = 0
    graded_ids: list[str] = []
    for question_id, selected_index in answers:
        question = questions_by_id.get(question_id)
        if question is None or question.topic_id != teaching_topic.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more answers reference a question outside this module.",
            )
        graded_ids.append(str(question_id))
        if selected_index == question.correct_option_index:
            correct_count += 1

    total_count = len(answers)
    score_percent = round((correct_count / total_count) * 100, 1) if total_count else 0.0
    passed = (correct_count / total_count) >= PASS_THRESHOLD if total_count else False

    attempt = RemediationAttempt(
        student_id=student.id,
        gap_id=gap.id,
        topic_id=teaching_topic.id,
        question_ids=graded_ids,
        correct_count=correct_count,
        total_count=total_count,
        score_percent=score_percent,
        passed=passed,
    )
    session.add(attempt)
    await session.flush()

    gap_resolved = False
    if passed:
        gap.status = GapStatus.RESOLVED
        gap.updated_at = datetime.utcnow()
        session.add(gap)
        gap_resolved = True

    xp_awarded = await gamification_service.on_gap_module_completed(
        session,
        student_id=student.id,
        attempt_id=attempt.id,
        score_percent=score_percent,
        passed=passed,
    )

    await session.commit()

    return ModuleQuizResultOut(
        gap_id=gap.id,
        correct_count=correct_count,
        total_count=total_count,
        score_percent=score_percent,
        passed=passed,
        gap_resolved=gap_resolved,
        xp_awarded=xp_awarded,
    )
