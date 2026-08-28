"""
Parent dashboard routes (protected — parent role required).

GET  /parent/me              — parent profile
GET  /parent/children        — list all linked children (unique numbers)
POST /parent/children/add    — link an additional child to this parent account
GET  /parent/children/{student_unique_number}/profile      — get a specific child's profile
GET  /parent/children/{student_unique_number}/quiz-result  — child's latest diagnostic result
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_parent
from src.models.parent import Parent
from src.schemas.auth import AddChildRequest
from src.schemas.parent import ChildLinkOut, ParentProfile
from src.schemas.quiz import GapReportOut
from src.schemas.student import StudentProfile
from src.services import parent_service, quiz_service

router = APIRouter(prefix="/parent", tags=["Parent Dashboard"])


@router.get("/me", response_model=ParentProfile, summary="Get parent profile")
async def get_parent_profile(parent: Parent = Depends(get_current_parent)):
    return ParentProfile.model_validate(parent)


@router.get(
    "/children",
    response_model=list[ChildLinkOut],
    summary="List all children linked to this parent account",
)
async def get_children(
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    return await parent_service.get_parent_children(parent, session)


@router.post(
    "/children/add",
    response_model=ChildLinkOut,
    status_code=status.HTTP_201_CREATED,
    summary="Link an additional child to this parent account",
)
async def add_child(
    data: AddChildRequest,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    return await parent_service.add_child_to_parent(parent, data, session)


@router.get(
    "/children/{student_unique_number}/profile",
    response_model=StudentProfile,
    summary="Get a specific child's profile (parent must be linked to this student)",
)
async def get_child_profile(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    return StudentProfile.model_validate(student)


@router.get(
    "/children/{student_unique_number}/quiz-result",
    response_model=GapReportOut,
    summary="Get a specific child's latest diagnostic quiz result (parent must be linked)",
)
async def get_child_quiz_result(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    attempt = await quiz_service.get_latest_completed_attempt(student.id, session)
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This student has not completed their diagnostic assessment yet.",
        )
    report = await quiz_service.compute_gap_report(attempt, session)
    return GapReportOut(**report)
