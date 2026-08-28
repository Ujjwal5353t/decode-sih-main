"""
Student dashboard routes (protected — student role required).

GET  /student/me             — student profile (includes unique_number, class, section)
GET  /student/modules        — modules for the student's class (from their school branch)
GET  /student/assignments    — assignments for the student's class+section
POST /student/assignments/{assignment_id}/submit  — mark as submitted
GET  /student/assignments/{assignment_id}/feedback — get teacher feedback
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_student
from src.models.student import Student
from src.schemas.module import ModuleOut
from src.schemas.student import StudentProfile
from src.schemas.teacher import AssignmentOut, FeedbackOut, SubmissionOut
from src.services import module_service, quiz_service, teacher_service

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
    "/assignments",
    response_model=list[AssignmentOut],
    summary="Get assignments for the student's class section",
)
async def get_student_assignments(
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    assignments = await teacher_service.get_student_assignments(student, session)
    return [AssignmentOut.model_validate(a) for a in assignments]


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
