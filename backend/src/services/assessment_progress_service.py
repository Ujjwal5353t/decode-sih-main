"""
Assessment Progress Service — calculates consecutive assessment deltas,
growth rates, lagging indicators, and holistic mastery for students and parents.
"""

import json
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.lesson import Lesson
from src.models.quiz import GapStatus, QuizAttempt, StudentTopicGap, Topic
from src.models.student import Student
from src.models.teacher import (
    Assignment,
    AssignmentAttempt,
    AssignmentSubmission,
    TeacherFeedback,
)
from src.schemas.learning import (
    AssessmentAttemptTrend,
    AssessmentGrowthItem,
    ClassLeaderboardOut,
    DiagnosticGapSummary,
    LeaderboardEntryOut,
    ModuleProgressOut,
    StudentDetailedProgressOut,
    SubjectAssessmentProgressOut,
)
from src.services import learning_progress_service


def _safe_float(val: Optional[float], default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _classify_trend(initial: float, latest: float, deltas: list[float]) -> str:
    """Classify learning trajectory based on initial, latest, and consecutive attempt deltas."""
    if latest >= 85.0 and (not deltas or deltas[-1] >= -5.0):
        return "mastered"
    net_delta = latest - initial
    latest_step_delta = deltas[-1] if deltas else net_delta

    if latest_step_delta >= 5.0 or net_delta >= 8.0:
        return "improving"
    if latest_step_delta <= -5.0 or net_delta <= -8.0:
        return "declining"
    return "stable"


def _determine_status(latest_score: float, trend: str, total_attempts: int) -> tuple[str, bool]:
    """
    Returns (status, is_lagging).
    Status values: 'mastered' | 'progressing' | 'needs_attention' | 'lagging'
    """
    if latest_score >= 85.0:
        return "mastered", False
    if latest_score >= 60.0:
        if trend == "declining":
            return "needs_attention", True
        return "progressing", False
    # latest_score < 60.0
    if trend == "improving":
        return "needs_attention", True
    return "lagging", True


def _normalize_subject_key(s: Optional[str]) -> str:
    if not s:
        return ""
    import re
    clean = s.lower().strip()
    base = re.sub(r"\s*\([^)]*\)", "", clean).strip()
    if "environmental" in base or "evs" in base:
        return "evs"
    if "mathematics" in base or "math" in base:
        return "mathematics"
    if "english" in base:
        return "english"
    if "hindi" in base:
        return "hindi"
    if "science" in base and "social" not in base:
        return "science"
    if "social" in base:
        return "social studies"
    return base


def _match_subject(subj: Optional[str], target_subjects: Optional[set[str]]) -> bool:
    if not target_subjects:
        return True
    if not subj:
        return False
    norm = _normalize_subject_key(subj)
    return norm in target_subjects or (subj.strip().lower() in target_subjects)


async def calculate_student_detailed_progress(
    student: Student,
    session: AsyncSession,
    subject: Optional[str] = None,
    allowed_subjects: Optional[list[str]] = None,
) -> StudentDetailedProgressOut:
    """
    Compute comprehensive learning progress, consecutive assessment growth deltas,
    lagging topics, and progress metrics for a given student (optionally scoped by subject).
    """
    target_subjects: Optional[set[str]] = None
    raw_candidates = []
    if subject and subject.strip():
        raw_candidates.append(subject.strip())
    elif allowed_subjects:
        raw_candidates.extend([s.strip() for s in allowed_subjects if s and s.strip()])

    specific_candidates = [
        s for s in raw_candidates if s.lower() not in ("general", "all", "")
    ]
    if specific_candidates:
        target_subjects = {_normalize_subject_key(s) for s in specific_candidates}

    # 1. Fetch curriculum module & lesson progress
    module_progress = await learning_progress_service.get_student_progress(student, session)
    if target_subjects:
        module_progress.modules = [
            m for m in module_progress.modules if _match_subject(m.subject, target_subjects)
        ]
        module_progress.overall_percent = (
            round(sum(m.progress_percent for m in module_progress.modules) / len(module_progress.modules))
            if module_progress.modules
            else 0
        )

    # 2. Fetch diagnostic quiz gap report summary
    diagnostic_gaps: list[DiagnosticGapSummary] = []
    diag_overall_score: Optional[float] = None
    try:
        gaps_stmt = (
            select(StudentTopicGap, Topic)
            .join(Topic, StudentTopicGap.topic_id == Topic.id)
            .where(
                StudentTopicGap.student_id == student.id,
                StudentTopicGap.status == GapStatus.OPEN,
            )
            .order_by(StudentTopicGap.updated_at.desc())
        )
        gaps_res = await session.execute(gaps_stmt)
        for gap, topic in gaps_res.all():
            if not _match_subject(gap.subject, target_subjects):
                continue
            diagnostic_gaps.append(
                DiagnosticGapSummary(
                    subject=gap.subject,
                    topic_code=topic.code,
                    topic_name=topic.name,
                    originating_class=gap.first_identified_class,
                    student_current_class=student.class_number or 1,
                )
            )

        # Latest completed diagnostic attempt score
        latest_diag_stmt = (
            select(QuizAttempt)
            .where(
                QuizAttempt.student_id == student.id,
                QuizAttempt.status == "completed",
            )
            .order_by(QuizAttempt.completed_at.desc())
        )
        latest_diag_res = await session.execute(latest_diag_stmt)
        latest_diag_attempt = latest_diag_res.scalars().first()
        diag_overall_score = latest_diag_attempt.overall_score if latest_diag_attempt else None
    except Exception:
        diagnostic_gaps = []
        diag_overall_score = None

    # 3. Fetch all assignments available for this student's class & section
    assignments: list[Assignment] = []
    if student.class_number is not None:
        target_section = student.section or "A"
        is_self = student.enrollment_type == "self" or student.branch_name == "SELF"
        asgn_conditions = [
            Assignment.class_number == student.class_number,
        ]
        if not is_self and student.branch_name:
            asgn_conditions.append(
                or_(
                    Assignment.branch_name == student.branch_name,
                    Assignment.branch_name == "SELF",
                )
            )
            asgn_conditions.append(
                or_(
                    Assignment.section == target_section,
                    Assignment.section == "SELF",
                    Assignment.section == "ALL",
                )
            )
        asgn_stmt = (
            select(Assignment)
            .where(*asgn_conditions)
            .order_by(Assignment.created_at.desc())
        )
        asgn_res = await session.execute(asgn_stmt)
        assignments = list(asgn_res.scalars().all())

    # 4. Fetch all submissions, attempts, and feedback for this student
    subs_stmt = select(AssignmentSubmission).where(
        AssignmentSubmission.student_id == student.id
    )
    subs_res = await session.execute(subs_stmt)
    submissions_by_asgn: dict[uuid.UUID, AssignmentSubmission] = {
        sub.assignment_id: sub for sub in subs_res.scalars().all()
    }

    attempts_stmt = (
        select(AssignmentAttempt)
        .where(AssignmentAttempt.student_id == student.id)
        .order_by(AssignmentAttempt.started_at.asc(), AssignmentAttempt.attempt_number.asc())
    )
    attempts_res = await session.execute(attempts_stmt)
    attempts_by_asgn: dict[uuid.UUID, list[AssignmentAttempt]] = {}
    for att in attempts_res.scalars().all():
        attempts_by_asgn.setdefault(att.assignment_id, []).append(att)

    fb_stmt = select(TeacherFeedback).where(TeacherFeedback.student_id == student.id)
    fb_res = await session.execute(fb_stmt)
    feedback_by_asgn: dict[uuid.UUID, TeacherFeedback] = {
        fb.assignment_id: fb for fb in fb_res.scalars().all()
    }

    # 5. Process each assignment into an AssessmentGrowthItem with consecutive attempt tracking
    growth_items: list[AssessmentGrowthItem] = []
    
    # Also track any submitted assignment not in class list (historical)
    known_asgn_ids = {a.id for a in assignments}
    missing_asgn_ids = [aid for aid in submissions_by_asgn if aid not in known_asgn_ids]
    if missing_asgn_ids:
        missing_res = await session.execute(
            select(Assignment).where(Assignment.id.in_(missing_asgn_ids))  # type: ignore[attr-defined]
        )
        for historical_asgn in missing_res.scalars().all():
            assignments.append(historical_asgn)
            known_asgn_ids.add(historical_asgn.id)

    if target_subjects:
        assignments = [a for a in assignments if _match_subject(a.subject, target_subjects)]

    for asgn in assignments:
        sub = submissions_by_asgn.get(asgn.id)
        raw_attempts = attempts_by_asgn.get(asgn.id, [])
        fb = feedback_by_asgn.get(asgn.id)

        # Parse selected chapter numbers
        chapter_nums: list[int] = []
        if asgn.chapter_numbers:
            try:
                parsed = json.loads(asgn.chapter_numbers)
                if isinstance(parsed, list):
                    chapter_nums = [int(x) for x in parsed if isinstance(x, (int, str)) and str(x).isdigit()]
            except Exception:
                pass

        if not raw_attempts and not sub:
            # Not attempted yet
            continue

        # Sort attempts chronologically
        sorted_attempts = sorted(raw_attempts, key=lambda a: (a.started_at, a.attempt_number))

        attempt_trends: list[AssessmentAttemptTrend] = []
        deltas: list[float] = []
        prev_pct: Optional[float] = None

        for att in sorted_attempts:
            pct = _safe_float(att.percentage, default=(_safe_float(att.score) / max(1.0, _safe_float(att.max_score, 100.0))) * 100.0)
            delta = round(pct - prev_pct, 1) if prev_pct is not None else None
            if delta is not None:
                deltas.append(delta)

            attempt_trends.append(
                AssessmentAttemptTrend(
                    attempt_number=att.attempt_number,
                    score=_safe_float(att.score),
                    max_score=_safe_float(att.max_score, 100.0),
                    percentage=round(pct, 1),
                    is_passed=bool(att.is_passed if att.is_passed is not None else (pct >= 60.0)),
                    status=att.status or "submitted",
                    completed_at=att.completed_at or att.started_at,
                    delta_from_previous=delta,
                )
            )
            prev_pct = pct

        if attempt_trends:
            initial_score = attempt_trends[0].percentage
            latest_score = attempt_trends[-1].percentage
            best_score = max(a.percentage for a in attempt_trends)
            latest_time = attempt_trends[-1].completed_at
            latest_ai_fb = sorted_attempts[-1].ai_feedback if sorted_attempts else None
        elif sub:
            sub_pct = _safe_float(sub.percentage, default=(_safe_float(sub.score) / max(1.0, _safe_float(sub.max_score, 100.0))) * 100.0)
            initial_score = round(sub_pct, 1)
            latest_score = round(sub_pct, 1)
            best_score = round(sub_pct, 1)
            latest_time = sub.last_attempted_at or sub.attempted_at
            latest_ai_fb = None
            attempt_trends.append(
                AssessmentAttemptTrend(
                    attempt_number=1,
                    score=_safe_float(sub.score),
                    max_score=_safe_float(sub.max_score, 100.0),
                    percentage=round(sub_pct, 1),
                    is_passed=bool(sub.is_passed if sub.is_passed is not None else (sub_pct >= 60.0)),
                    status=sub.status or "submitted",
                    completed_at=latest_time,
                    delta_from_previous=None,
                )
            )
        else:
            continue

        score_delta = round(latest_score - initial_score, 1)
        trend = _classify_trend(initial_score, latest_score, deltas)
        status_label, is_lagging = _determine_status(latest_score, trend, len(attempt_trends))

        growth_items.append(
            AssessmentGrowthItem(
                assignment_id=asgn.id,
                title=asgn.title,
                subject=asgn.subject or "General",
                assignment_type=asgn.assignment_type,
                chapter_numbers=chapter_nums,
                total_attempts=max(len(attempt_trends), sub.total_attempts if sub else 1),
                initial_score=initial_score,
                latest_score=latest_score,
                best_score=best_score,
                score_delta=score_delta,
                trend=trend,
                status=status_label,
                is_lagging=is_lagging,
                latest_attempt_at=latest_time,
                attempts_history=attempt_trends,
                teacher_feedback=fb.feedback_text if fb else None,
                ai_feedback=latest_ai_fb,
            )
        )

    # 6. Group Assessments by Subject & Calculate Subject Mastery & Growth
    by_subject_items: dict[str, list[AssessmentGrowthItem]] = {}
    for item in growth_items:
        by_subject_items.setdefault(item.subject, []).append(item)

    # Ensure all modules' subjects are represented even if no assessments yet
    for m in module_progress.modules:
        if m.subject not in by_subject_items:
            by_subject_items[m.subject] = []

    subjects_progress: list[SubjectAssessmentProgressOut] = []
    module_by_sub = {m.subject: m for m in module_progress.modules}

    for subject, items in sorted(by_subject_items.items(), key=lambda x: x[0]):
        # Calculate subject-level consecutive growth
        sorted_sub_items = sorted(items, key=lambda i: i.latest_attempt_at)
        
        if sorted_sub_items:
            avg_score = round(sum(i.latest_score for i in sorted_sub_items) / len(sorted_sub_items), 1)
            # Net growth across chronological assessments in this subject
            if len(sorted_sub_items) > 1:
                first_asgn_score = sorted_sub_items[0].latest_score
                last_asgn_score = sorted_sub_items[-1].latest_score
                growth_delta = round(last_asgn_score - first_asgn_score, 1)
            else:
                growth_delta = sorted_sub_items[0].score_delta

            if avg_score >= 85.0 and growth_delta >= -5.0:
                sub_trend = "mastered"
                sub_status = "mastered"
            elif growth_delta >= 5.0:
                sub_trend = "improving"
                sub_status = "progressing" if avg_score >= 60.0 else "needs_attention"
            elif growth_delta <= -5.0 or avg_score < 60.0:
                sub_trend = "declining" if growth_delta <= -5.0 else "stable"
                sub_status = "lagging"
            else:
                sub_trend = "stable"
                sub_status = "progressing" if avg_score >= 60.0 else "lagging"

            lagging_count = sum(1 for i in sorted_sub_items if i.is_lagging)
        else:
            avg_score = 0.0
            growth_delta = 0.0
            sub_trend = "stable"
            sub_status = "needs_attention"
            lagging_count = 0

        # Subject module completion
        mod = module_by_sub.get(subject)
        mod_pct = mod.progress_percent if mod else 0

        # Mastery index solely based on assessment performance & consecutive growth trajectory
        if sorted_sub_items:
            sub_mastery = round(avg_score + (growth_delta * 0.25))
        else:
            sub_mastery = 0

        subjects_progress.append(
            SubjectAssessmentProgressOut(
                subject=subject,
                overall_mastery_percent=min(100, max(0, sub_mastery)),
                assessment_count=len(sorted_sub_items),
                average_score=avg_score,
                growth_delta=growth_delta,
                trend=sub_trend,
                status=sub_status,
                lagging_topics_count=lagging_count,
                assessments=sorted_sub_items,
            )
        )

    # 7. Aggregate Overall Holistic Progress Metrics
    total_assessments_taken = len(growth_items)
    assessments_passed = sum(1 for item in growth_items if item.latest_score >= 60.0)
    assessments_lagging = sum(1 for item in growth_items if item.is_lagging)

    if total_assessments_taken > 0:
        overall_avg_score = round(sum(i.latest_score for i in growth_items) / total_assessments_taken, 1)
        overall_growth_rate = round(sum(i.score_delta for i in growth_items) / total_assessments_taken, 1)
        if overall_avg_score >= 85.0:
            overall_trend = "mastered"
        elif overall_growth_rate >= 4.0:
            overall_trend = "improving"
        elif overall_growth_rate <= -4.0:
            overall_trend = "declining"
        else:
            overall_trend = "stable"

        # Holistic mastery: Assessment performance modulated by consecutive growth trajectory
        holistic_mastery = min(100, max(0, round(overall_avg_score + (overall_growth_rate * 0.25))))
    else:
        overall_avg_score = 0.0
        overall_growth_rate = 0.0
        overall_trend = "stable"
        holistic_mastery = 0

    return StudentDetailedProgressOut(
        student_id=student.id,
        student_unique_number=student.unique_number,
        full_name=student.full_name or f"Student #{student.unique_number}",
        class_number=student.class_number,
        section=student.section,
        school_name=student.school_name,
        branch_name=student.branch_name,
        enrollment_type=student.enrollment_type or "school",
        holistic_mastery_percent=min(100, max(0, holistic_mastery)),
        curriculum_completion_percent=module_progress.overall_percent,
        average_test_score=overall_avg_score,
        consecutive_growth_rate=overall_growth_rate,
        consecutive_trend=overall_trend,
        total_assessments_taken=total_assessments_taken,
        assessments_passed=assessments_passed,
        assessments_lagging=assessments_lagging,
        points=module_progress.points,
        current_streak=module_progress.current_streak,
        longest_streak=module_progress.longest_streak,
        last_activity_at=module_progress.last_activity_at,
        subjects=subjects_progress,
        modules=module_progress.modules,
        diagnostic_gaps=diagnostic_gaps,
        diagnostic_overall_score=diag_overall_score,
        recent_activity=module_progress.recent_activity,
    )


async def get_class_leaderboard(
    students: list[Student],
    class_number: int,
    section: str,
    session: AsyncSession,
    top_n: int = 10,
) -> ClassLeaderboardOut:
    """
    Build a class leaderboard ranked by holistic_mastery_percent.

    Ranking rules
    -------------
    Primary   : holistic_mastery_percent DESC
                (avg_test_score + consecutive_growth_rate × 0.25)
                Directly rewards improvement from previous marks to current.
    Tiebreaker: curriculum_completion_percent DESC
                (lesson-completion %) — active learners win ties.
    Shared rank: Two students at identical (holistic, curriculum) scores get
                 the same rank; the next rank is skipped accordingly.

    Scope
    -----
    Only school-enrolled students (enrollment_type == "school") are ranked.
    Self-enrolled students are silently excluded — they have no class/section.

    top_n
    -----
    Pass top_n=None (or a very large number) for the teacher view that shows
    every student ranked.
    """
    # Filter to school-enrolled students only
    school_students = [s for s in students if (s.enrollment_type or "school") == "school"]

    if not school_students:
        return ClassLeaderboardOut(
            class_number=class_number,
            section=section.upper(),
            total_students=0,
            top_entries=[],
            my_entry=None,
        )

    # Compute holistic progress for every student in the class
    scored: list[tuple[Student, int, int, float, float]] = []
    # tuples: (student, holistic_mastery_percent, curriculum_completion_percent,
    #           avg_test_score, consecutive_growth_rate)
    for student in school_students:
        try:
            detail = await calculate_student_detailed_progress(student, session)
            holistic = detail.holistic_mastery_percent
            curriculum = detail.curriculum_completion_percent
            avg_score = detail.average_test_score
            growth = detail.consecutive_growth_rate
        except Exception:
            # Never let one bad student break the whole leaderboard
            holistic = 0
            curriculum = 0
            avg_score = 0.0
            growth = 0.0
        scored.append((student, holistic, curriculum, avg_score, growth))

    # Sort: holistic DESC, then curriculum DESC (tiebreaker)
    scored.sort(key=lambda t: (t[1], t[2]), reverse=True)

    # Assign ranks — ties share the same rank
    entries: list[LeaderboardEntryOut] = []
    current_rank = 1
    for i, (student, holistic, curriculum, avg_score, growth) in enumerate(scored):
        if i > 0:
            prev_holistic, prev_curriculum = scored[i - 1][1], scored[i - 1][2]
            if holistic != prev_holistic or curriculum != prev_curriculum:
                current_rank = i + 1  # skip ranks for shared positions
        entries.append(
            LeaderboardEntryOut(
                rank=current_rank,
                student_id=student.id,
                unique_number=student.unique_number,
                full_name=student.full_name or f"Student #{student.unique_number}",
                holistic_mastery_percent=holistic,
                curriculum_completion_percent=curriculum,
                avg_test_score=round(avg_score, 1),
                consecutive_growth_rate=round(growth, 1),
            )
        )

    total = len(entries)
    # top_entries: all entries for teacher (top_n=None/large); top N for student/parent
    top_entries = entries[:top_n] if top_n and top_n < total else entries

    return ClassLeaderboardOut(
        class_number=class_number,
        section=section.upper(),
        total_students=total,
        top_entries=top_entries,
        my_entry=None,  # caller sets this after filtering for themselves
    )
