"""
Diagnostic quiz routes (protected — student role required).

POST /quiz/start                  — start a new attempt, or resume an in-progress one
POST /quiz/{attempt_id}/answer    — submit an answer, get the next question or finish
GET  /quiz/{attempt_id}/result    — gap report for one completed attempt
GET  /quiz/attempts               — this student's attempt history
GET  /quiz/gaps                   — this student's CURRENT open gaps (durable, cross-attempt)
GET  /quiz/status                 — whether the mandatory diagnostic is done (for gating)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.database import get_session
from src.core.dependencies import get_current_student
from src.models.quiz import Question, QuizAttempt, Topic
from src.models.student import Student
from src.schemas.quiz import (
    AnswerRequest,
    AnswerResponse,
    CurrentGapOut,
    GapReportOut,
    QuestionOut,
    QuizAttemptSummaryOut,
    QuizStatusOut,
    StartQuizRequest,
    StartQuizResponse,
)
from src.services import quiz_service

router = APIRouter(prefix="/quiz", tags=["Diagnostic Quiz"])


async def _to_question_out(question: Question, session: AsyncSession) -> QuestionOut:
    topic = await session.get(Topic, question.topic_id)
    return QuestionOut(
        id=question.id,
        subject=question.subject,
        class_number=question.class_number,
        topic_name=topic.name,
        topic_type=topic.topic_type,
        question_text=question.question_text,
        options=question.options,
        image_emoji=question.image_emoji,
        option_emojis=question.option_emojis,
        image_asset_key=question.image_asset_key,
        option_asset_keys=question.option_asset_keys,
    )


async def _get_owned_attempt(
    attempt_id: uuid.UUID, student: Student, session: AsyncSession
) -> QuizAttempt:
    attempt = await session.get(QuizAttempt, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found.")
    if attempt.student_id != student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this attempt.",
        )
    return attempt


@router.post("/start", response_model=StartQuizResponse, summary="Start or resume a diagnostic quiz")
async def start_quiz(
    body: StartQuizRequest,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    if student.class_number is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your class setup first via POST /auth/student/setup-class.",
        )

    attempt, question = await quiz_service.start_or_resume_attempt(
        student.id, student.class_number, body.subjects, student.branch_name, session
    )
    return StartQuizResponse(
        attempt_id=attempt.id,
        question=(await _to_question_out(question, session)) if question else None,
    )


@router.post(
    "/{attempt_id}/answer", response_model=AnswerResponse, summary="Submit an answer"
)
async def answer_quiz(
    attempt_id: uuid.UUID,
    body: AnswerRequest,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    attempt = await _get_owned_attempt(attempt_id, student, session)
    finished, next_question, was_correct = await quiz_service.submit_answer(
        attempt, body.question_id, body.selected_option_index, session
    )
    return AnswerResponse(
        finished=finished,
        next_question=(await _to_question_out(next_question, session)) if next_question else None,
        was_correct=was_correct,
    )


@router.get(
    "/{attempt_id}/result", response_model=GapReportOut, summary="Get the gap report for an attempt"
)
async def get_quiz_result(
    attempt_id: uuid.UUID,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    attempt = await _get_owned_attempt(attempt_id, student, session)
    report = await quiz_service.compute_gap_report(attempt, session)
    return GapReportOut(**report)


@router.get(
    "/attempts", response_model=list[QuizAttemptSummaryOut], summary="List this student's quiz attempts"
)
async def list_quiz_attempts(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(QuizAttempt)
        .where(QuizAttempt.student_id == student.id)
        .order_by(QuizAttempt.started_at.desc())
    )
    attempts = list(result.scalars().all())
    return [QuizAttemptSummaryOut.model_validate(a) for a in attempts]


@router.get(
    "/gaps",
    response_model=list[CurrentGapOut],
    summary="Get this student's current open gaps, across all attempts",
)
async def get_current_gaps(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    gaps = await quiz_service.get_current_gaps(student.id, session)
    return [CurrentGapOut(**g) for g in gaps]


@router.get(
    "/status",
    response_model=QuizStatusOut,
    summary="Check whether this student has completed the mandatory diagnostic",
)
async def get_quiz_status(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    completed_attempt = await quiz_service.get_latest_completed_attempt(student.id, session)
    in_progress_attempt = None
    if completed_attempt is None:
        in_progress_attempt = await quiz_service.get_in_progress_attempt(student.id, session)
    return QuizStatusOut(
        completed=completed_attempt is not None,
        attempt_id=completed_attempt.id if completed_attempt else None,
        in_progress_attempt_id=in_progress_attempt.id if in_progress_attempt else None,
    )
