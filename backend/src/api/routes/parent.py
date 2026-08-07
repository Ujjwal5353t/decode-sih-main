"""
Parent dashboard routes (protected — parent role required).

GET  /parent/me              — parent profile
GET  /parent/children        — list all linked children (unique numbers)
POST /parent/children/add    — link an additional child to this parent account
GET  /parent/children/{student_unique_number}/profile  — get a specific child's profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.database import get_session
from src.core.dependencies import get_current_parent
from src.models.parent import Parent, ParentChildLink
from src.models.student import Student
from src.schemas.auth import AddChildRequest
from src.schemas.parent import ChildLinkOut, ParentProfile
from src.schemas.student import StudentProfile
from src.services import parent_service

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
    links = await parent_service.get_parent_children(parent, session)
    return [ChildLinkOut.model_validate(link) for link in links]


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
    link = await parent_service.add_child_to_parent(parent, data, session)
    return ChildLinkOut.model_validate(link)


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
    # Verify this child belongs to this parent
    link_result = await session.execute(
        select(ParentChildLink).where(
            ParentChildLink.parent_id == parent.id,
            ParentChildLink.student_unique_number == student_unique_number,
        )
    )
    if not link_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This student is not linked to your account.",
        )

    student_result = await session.execute(
        select(Student).where(Student.unique_number == student_unique_number)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    return StudentProfile.model_validate(student)
