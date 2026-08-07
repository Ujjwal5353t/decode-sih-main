"""
Parent service.

Business rules enforced here:
  - One parent account per email.
  - One student_unique_number can be linked to AT MOST one parent email.
  - A parent account CAN have multiple children (multi-child dashboard).

Registration flow:
  ┌─ Email already exists?
  │   ├─ student_unique_number already linked to THIS parent → 409 "account already exists"
  │   ├─ student_unique_number already linked to ANOTHER parent → 409 "student already linked"
  │   └─ student_unique_number not yet linked → add child to existing account, return 200
  └─ Email does NOT exist → create parent, link first child, return 201
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.parent import Parent, ParentChildLink
from src.models.student import Student
from src.schemas.auth import AddChildRequest, ParentLoginRequest, ParentRegisterRequest


async def _validate_student_number(
    student_unique_number: str, session: AsyncSession
) -> None:
    """Ensure the student unique number exists in the system."""
    result = await session.execute(
        select(Student).where(Student.unique_number == student_unique_number)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student number '{student_unique_number}' does not exist. "
                   "Please enter a valid student number.",
        )


async def _get_existing_link(
    student_unique_number: str, session: AsyncSession
) -> ParentChildLink | None:
    result = await session.execute(
        select(ParentChildLink).where(
            ParentChildLink.student_unique_number == student_unique_number
        )
    )
    return result.scalar_one_or_none()


async def register_parent(
    data: ParentRegisterRequest, session: AsyncSession
) -> tuple[Parent, bool]:
    """
    Returns (parent, created) where created=True means a new account was made,
    False means an existing account got a new child linked.
    """
    # 1 — Validate student number exists
    await _validate_student_number(data.student_unique_number, session)

    # 2 — Check if this student number is already linked to any parent
    existing_link = await _get_existing_link(data.student_unique_number, session)

    # 3 — Check if parent email exists
    parent_result = await session.execute(
        select(Parent).where(Parent.email == str(data.email))
    )
    existing_parent = parent_result.scalar_one_or_none()

    if existing_link:
        if existing_parent and existing_link.parent_id == existing_parent.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Parents account already exists with this student number.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student '{data.student_unique_number}' is already linked to another parent account.",
        )

    if existing_parent:
        # Parent exists, student not yet linked → add new child
        link = ParentChildLink(
            parent_id=existing_parent.id,
            student_unique_number=data.student_unique_number,
        )
        session.add(link)
        return existing_parent, False

    # New parent + first child
    parent = Parent(
        email=str(data.email),
        password_hash=hash_password(data.password),
    )
    session.add(parent)
    await session.flush()  # get parent.id

    link = ParentChildLink(
        parent_id=parent.id,
        student_unique_number=data.student_unique_number,
    )
    session.add(link)
    return parent, True


async def login_parent(data: ParentLoginRequest, session: AsyncSession) -> Parent:
    result = await session.execute(
        select(Parent).where(Parent.email == str(data.email))
    )
    parent = result.scalar_one_or_none()

    if not parent or not verify_password(data.password, parent.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return parent


async def add_child_to_parent(
    parent: Parent, data: AddChildRequest, session: AsyncSession
) -> ParentChildLink:
    """Add an additional child to an existing parent account."""
    # 1 — Validate student number
    await _validate_student_number(data.student_unique_number, session)

    # 2 — Check if already linked anywhere
    existing_link = await _get_existing_link(data.student_unique_number, session)
    if existing_link:
        if existing_link.parent_id == parent.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This student is already linked to your account.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student '{data.student_unique_number}' is already linked to another parent account.",
        )

    link = ParentChildLink(
        parent_id=parent.id,
        student_unique_number=data.student_unique_number,
    )
    session.add(link)
    return link


async def get_parent_children(
    parent: Parent, session: AsyncSession
) -> list[ParentChildLink]:
    result = await session.execute(
        select(ParentChildLink).where(ParentChildLink.parent_id == parent.id)
    )
    return list(result.scalars().all())
