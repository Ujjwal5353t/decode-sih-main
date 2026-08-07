"""
Student dashboard routes (protected — student role required).

GET  /student/me             — student profile (includes unique_number, class, section)
GET  /student/modules        — modules for the student's class (from their school branch)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_student
from src.models.student import Student
from src.schemas.module import ModuleOut
from src.schemas.student import StudentProfile
from src.services import module_service

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

    return await module_service.get_class_modules(
        student.branch_name, student.class_number, session
    )
