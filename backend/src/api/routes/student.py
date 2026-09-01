"""
Student dashboard routes (protected — student role required).

GET  /student/me               — student profile (includes unique_number, class, section)
GET  /student/modules          — modules for the student's class (from their school branch)
GET  /student/subject-priority — simple rule-based subject ordering, from diagnostic quiz gaps
GET  /student/assignments      — assignments for the student's class+section
POST /student/assignments/{assignment_id}/submit  — mark as submitted
GET  /student/assignments/{assignment_id}/feedback — get teacher feedback
GET  /student/lessons          — animated lessons for a class/subject (NCERT-grounded)
GET  /student/lessons/{lesson_id} — one lesson with its full slide list
POST /student/learning-events  — sync queued offline learning activity (idempotent)
GET  /student/progress         — per-module learning progress, projected from those events
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_student
from src.models.student import Student
from src.schemas.learning import (
    ClaimChestResponse,
    GamificationSummaryOut,
    LearningEventSyncRequest,
    LearningEventSyncResponse,
    StudentProgressOut,
)
from src.schemas.lesson import LessonListItemOut, LessonOut, LessonSlideOut
from src.schemas.module import ModuleOut
from src.schemas.quiz import SubjectPriorityOut
from src.schemas.student import StudentProfile
from src.schemas.teacher import (
    AssignmentAttemptOut,
    AssignmentOut,
    AssignmentQuizPreviewOut,
    FeedbackOut,
    StudentTestResultSummaryOut,
    SubmitQuizAttemptRequest,
    SubmitQuizAttemptResult,
    SubmissionOut,
)
from src.services import (
    gamification_service,
    learning_progress_service,
    lesson_service,
    module_service,
    quiz_service,
    teacher_service,
)

router = APIRouter(prefix="/student", tags=["Student Dashboard"])


@router.get("/me", response_model=StudentProfile, summary="Get student profile")
async def get_student_profile(student: Student = Depends(get_current_student)):
    return StudentProfile.model_validate(student)


@router.get(
    "/modules",
    response_model=list[ModuleOut],
    summary="Get modules for the student's class (requires class to be set up first)",
)
async def get_student_modules(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    from fastapi import HTTPException, status

    if student.class_number is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your class setup first via POST /auth/student/setup-class.",
        )

    if not await quiz_service.has_completed_diagnostic(student.id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete your diagnostic assessment first via the Gap "
                   "Identification Quiz (POST /quiz/start) before accessing modules.",
        )

    return await module_service.get_class_modules(
        student.branch_name, student.class_number, session
    )


@router.get(
    "/subject-priority",
    response_model=list[SubjectPriorityOut],
    summary="Simple, rule-based subject ordering — which subjects to review first, based on diagnostic quiz gaps",
)
async def get_student_subject_priority(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    from fastapi import HTTPException, status

    if student.class_number is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your class setup first via POST /auth/student/setup-class.",
        )

    if not await quiz_service.has_completed_diagnostic(student.id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete your diagnostic assessment first via the Gap "
                   "Identification Quiz (POST /quiz/start) before accessing modules.",
        )

    return await quiz_service.get_subject_priority(student, session)


@router.get(
    "/assignments",
    response_model=list[AssignmentOut],
    summary="Get active assignments for the student's class section (hides expired tests)",
)
async def get_student_assignments(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    assignments = await teacher_service.get_student_assignments(student, session)
    return [AssignmentOut.model_validate(a) for a in assignments]


@router.get(
    "/assignments/{assignment_id}/quiz",
    response_model=AssignmentQuizPreviewOut,
    summary="Get RAG quiz questions for an AI quiz assignment (8-10 questions max, adaptive on retake)",
)
async def get_assignment_quiz(
    assignment_id: uuid.UUID,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    return await teacher_service.get_assignment_quiz_for_student(assignment_id, student, session)


@router.post(
    "/assignments/{assignment_id}/submit-quiz",
    response_model=SubmitQuizAttemptResult,
    summary="Submit answers for an AI quiz attempt (instant score, 60% pass/fail, AI advice)",
)
async def submit_assignment_quiz(
    assignment_id: uuid.UUID,
    data: SubmitQuizAttemptRequest,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    return await teacher_service.submit_student_quiz_attempt(
        assignment_id, student, data.answers, session
    )


@router.post(
    "/assignments/{assignment_id}/upload-response",
    response_model=SubmissionOut,
    summary="Upload student response PDF (max 5 MB) for a manual PDF assignment",
)
async def upload_assignment_response_pdf(
    assignment_id: uuid.UUID,
    file: UploadFile = File(..., description="Student response PDF file (max 5 MB)"),
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    sub = await teacher_service.upload_student_response_pdf(assignment_id, student, file, session)
    return SubmissionOut(
        id=sub.id,
        student_id=sub.student_id,
        student_unique_number=sub.student_unique_number,
        score=sub.score,
        max_score=sub.max_score,
        percentage=sub.percentage,
        is_passed=sub.is_passed,
        total_attempts=sub.total_attempts,
        status=sub.status,
        response_pdf_url=sub.response_pdf_url,
        attempted_at=sub.attempted_at,
        last_attempted_at=sub.last_attempted_at,
    )


@router.get(
    "/assignments/{assignment_id}/attempts",
    response_model=list[AssignmentAttemptOut],
    summary="Get student's attempt history for a specific assignment",
)
async def get_assignment_attempts(
    assignment_id: uuid.UUID,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    attempts = await teacher_service.get_student_assignment_attempts(assignment_id, student.id, session)
    return [AssignmentAttemptOut.model_validate(att) for att in attempts]


@router.get(
    "/test-results",
    response_model=list[StudentTestResultSummaryOut],
    summary="Get student's complete past test results, attempts, scores, teacher feedback, and AI advice",
)
async def get_student_test_results(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    raw_results = await teacher_service.get_student_all_test_results(student, session)
    out = []
    for item in raw_results:
        sub = item["submission"]
        sub_out = SubmissionOut.model_validate(sub) if sub else None
        fb = item["teacher_feedback"]
        fb_out = FeedbackOut.model_validate(fb) if fb else None

        out.append(StudentTestResultSummaryOut(
            assignment=AssignmentOut.model_validate(item["assignment"]),
            submission=sub_out,
            attempts=[AssignmentAttemptOut.model_validate(a) for a in item["attempts"]],
            teacher_feedback=fb_out,
        ))
    return out


@router.post(
    "/assignments/{assignment_id}/submit",
    response_model=SubmissionOut,
    summary="Mark an assignment as submitted (creates or updates submission record)",
)
async def submit_assignment(
    assignment_id: uuid.UUID,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    sub = await teacher_service.student_submit(assignment_id, student, session)
    return SubmissionOut(
        id=sub.id,
        student_id=sub.student_id,
        student_unique_number=sub.student_unique_number,
        score=sub.score,
        max_score=sub.max_score,
        percentage=sub.percentage,
        is_passed=sub.is_passed,
        total_attempts=sub.total_attempts,
        status=sub.status,
        response_pdf_url=sub.response_pdf_url,
        attempted_at=sub.attempted_at,
        last_attempted_at=sub.last_attempted_at,
    )



@router.get(
    "/assignments/{assignment_id}/feedback",
    response_model=Optional[FeedbackOut],
    summary="Get teacher feedback for this assignment",
)
async def get_assignment_feedback(
    assignment_id: uuid.UUID,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    fb = await teacher_service.get_feedback(assignment_id, student.id, session)
    if not fb:
        return None
    return FeedbackOut.model_validate(fb)


@router.get(
    "/lessons",
    response_model=list[LessonListItemOut],
    summary="Get animated lessons for the student's class (requires class setup + diagnostic first)",
)
async def get_student_lessons(
    subject: Optional[str] = None,
    class_number: Optional[int] = None,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    from fastapi import HTTPException, status

    if student.class_number is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your class setup first via POST /auth/student/setup-class.",
        )

    if not await quiz_service.has_completed_diagnostic(student.id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete your diagnostic assessment first via the Gap "
                   "Identification Quiz (POST /quiz/start) before accessing modules.",
        )

    return await lesson_service.list_lessons(
        session, class_number or student.class_number, subject
    )


@router.get(
    "/lessons/{lesson_id}",
    response_model=LessonOut,
    summary="Get one lesson with its full ordered slide list",
)
async def get_student_lesson(
    lesson_id: uuid.UUID,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    from fastapi import HTTPException, status

    if student.class_number is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your class setup first via POST /auth/student/setup-class.",
        )

    if not await quiz_service.has_completed_diagnostic(student.id, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete your diagnostic assessment first via the Gap "
                   "Identification Quiz (POST /quiz/start) before accessing modules.",
        )

    found = await lesson_service.get_lesson_with_slides(lesson_id, session)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")

    lesson, slides = found
    return LessonOut(
        id=lesson.id,
        subject=lesson.subject,
        class_number=lesson.class_number,
        chapter_number=lesson.chapter_number,
        chapter_title=lesson.chapter_title,
        slides=[LessonSlideOut.model_validate(s) for s in slides],
    )


# ── Learning activity & progress ──────────────────────────────────────────────

@router.post(
    "/learning-events",
    response_model=LearningEventSyncResponse,
    summary="Sync queued learning-activity events (idempotent — safe to retry)",
)
async def sync_learning_events(
    body: LearningEventSyncRequest,
    tz: Optional[str] = None,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    """
    The offline queue's drain endpoint. Events are appended, never updated,
    and de-duplicated on the device-generated client_event_id, so replaying
    a batch after a failed or half-finished sync cannot double-count
    anything.

    Deliberately not gated on class setup or the diagnostic quiz: an event
    that was recorded while offline must still be storable later, whatever
    the student's account state has become in the meantime.

    `tz` is the same IANA zone `/student/gamification` accepts, adopted only
    once (see gamification_service.get_or_create_profile). Threading it
    through here too matters because a lesson completion is what actually
    creates the gamification profile and claims the streak day for that
    calendar date — without it, a device whose first-ever gamification
    contact is a lesson completion (rather than the dashboard's own
    /student/gamification read) would stamp that student's profile to UTC,
    and streak-day boundaries would drift from their real local day.
    """
    return await learning_progress_service.ingest_events(
        student, body.events, session, timezone_name=tz
    )


@router.get(
    "/progress",
    response_model=StudentProgressOut,
    summary="This student's per-module learning progress",
)
async def get_student_learning_progress(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    return await learning_progress_service.get_student_progress(student, session)


# ── Gamification: streak, XP, reward chests ───────────────────────────────────

@router.get(
    "/gamification",
    response_model=GamificationSummaryOut,
    summary="This student's streak, XP total and reward-chest progress",
)
async def get_gamification_summary(
    tz: Optional[str] = None,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    """
    Read-only. Opening the dashboard deliberately does NOT extend the streak —
    only finishing a lesson or completing an assessment does, and those are
    recorded by their own flows.

    `tz` is an IANA zone (e.g. "Asia/Kolkata") used to decide which calendar
    day activity belongs to. It is adopted only the first time, then the
    stored zone wins — otherwise a student could harvest extra streak days by
    switching timezone between calls. An unknown value silently falls back to
    UTC rather than failing the request.
    """
    return await gamification_service.get_summary(student.id, session, timezone_name=tz)


@router.post(
    "/gamification/claim-chest",
    response_model=ClaimChestResponse,
    summary="Claim the next unlocked reward chest (idempotent)",
)
async def claim_reward_chest(
    tz: Optional[str] = None,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    """
    Eligibility is recomputed from the student's real lesson completions on
    every call — the client never states how many lessons it thinks it has.

    A repeat click returns `claimed: false` with reason "already_claimed"
    instead of paying out twice; the UNIQUE constraint on
    (student_id, chest_index) is what guarantees that under concurrency.
    """
    return await gamification_service.claim_chest(
        session, student_id=student.id, timezone_name=tz
    )
