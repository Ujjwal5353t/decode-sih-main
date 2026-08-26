"""
Parent service.

Business rules enforced here:
  - Parent accounts can be created via Email OR Mobile Number.
  - A parent account CAN have multiple children (multi-child dashboard).
  - When a student registers with the parent's phone, they automatically link.
  - When a parent registers, all children registered with that phone or student ID link.
"""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.parent import Parent, ParentChildLink
from src.models.student import Student
from src.schemas.auth import AddChildRequest, ParentLoginRequest, ParentRegisterRequest
from src.services.otp_service import normalize_phone


async def _validate_student_number(
    student_unique_number: str, session: AsyncSession
) -> Student:
    """Ensure the student unique number exists in the system."""
    clean_num = student_unique_number.strip().upper()
    result = await session.execute(
        select(Student).where(func.upper(Student.unique_number) == clean_num)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student number '{student_unique_number}' does not exist. "
                   "Please enter a valid student number.",
        )
    return student


async def _get_existing_link(
    student_unique_number: str, session: AsyncSession
) -> ParentChildLink | None:
    clean_num = student_unique_number.strip().upper()
    result = await session.execute(
        select(ParentChildLink).where(
            func.upper(ParentChildLink.student_unique_number) == clean_num
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
    clean_email = str(data.email).strip().lower() if data.email else None
    clean_phone = normalize_phone(data.phone_number) if data.phone_number else None

    if not clean_email and not clean_phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either Email or Mobile Number must be provided for parent registration.",
        )

    # 1 — Check if parent account already exists with this email or phone
    parent_conditions = []
    if clean_email:
        parent_conditions.append(func.lower(Parent.email) == clean_email)
    if clean_phone:
        parent_conditions.append(Parent.phone_number == clean_phone)

    parent_query = select(Parent).where(or_(*parent_conditions))
    parent_result = await session.execute(parent_query)
    existing_parent = parent_result.scalar_one_or_none()

    # 2 — Identify student(s) to link
    target_student_numbers: list[str] = []

    if data.student_unique_number and data.student_unique_number.strip():
        student = await _validate_student_number(data.student_unique_number, session)
        target_student_numbers.append(student.unique_number)

    # If phone is provided, find any other students registered under this phone
    if clean_phone:
        students_by_phone_res = await session.execute(
            select(Student).where(
                or_(
                    Student.phone_number == clean_phone,
                    Student.phone_number == data.phone_number.strip(),
                )
            )
        )
        for st in students_by_phone_res.scalars().all():
            if st.unique_number not in target_student_numbers:
                target_student_numbers.append(st.unique_number)

    # 3 — Create or use existing parent
    parent: Parent
    created: bool
    if existing_parent:
        parent = existing_parent
        if data.full_name and not parent.full_name:
            parent.full_name = data.full_name.strip()
            session.add(parent)
        created = False
    else:
        parent = Parent(
            full_name=data.full_name.strip() if getattr(data, "full_name", None) else None,
            email=clean_email,
            phone_number=clean_phone,
            password_hash=hash_password(data.password),
        )
        session.add(parent)
        await session.flush()
        created = True

    # 4 — Link all target students
    for st_num in target_student_numbers:
        link_check = await session.execute(
            select(ParentChildLink).where(
                ParentChildLink.parent_id == parent.id,
                func.upper(ParentChildLink.student_unique_number) == st_num.upper(),
            )
        )
        if not link_check.scalar_one_or_none():
            link = ParentChildLink(
                parent_id=parent.id,
                student_unique_number=st_num,
            )
            session.add(link)

    return parent, created


async def login_parent(data: ParentLoginRequest, session: AsyncSession) -> Parent:
    raw_ident = (data.identifier or data.email or data.phone_number or "").strip()
    if not raw_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide an Email or Mobile Number.",
        )

    clean_ident_lower = raw_ident.lower()
    clean_phone = normalize_phone(raw_ident)

    query = select(Parent).where(
        or_(
            func.lower(Parent.email) == clean_ident_lower,
            Parent.phone_number == clean_phone if clean_phone else False,
            Parent.phone_number == raw_ident,
        )
    )
    result = await session.execute(query)
    parents = result.scalars().all()

    GENERIC_AUTH_ERROR = "Invalid email, mobile number, or password."

    matched_parent: Optional[Parent] = None
    for p in parents:
        if verify_password(data.password, p.password_hash):
            matched_parent = p
            break

    if not matched_parent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        )

    return matched_parent


async def add_child_to_parent(
    parent: Parent, data: AddChildRequest, session: AsyncSession
) -> ParentChildLink:
    """Add an additional child to an existing parent account."""
    # 1 — Validate student number
    student = await _validate_student_number(data.student_unique_number, session)

    # 2 — Check if already linked anywhere
    existing_link = await _get_existing_link(student.unique_number, session)
    if existing_link:
        if existing_link.parent_id == parent.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This student is already linked to your account.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student '{student.unique_number}' is already linked to another parent account.",
        )

    link = ParentChildLink(
        parent_id=parent.id,
        student_unique_number=student.unique_number,
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
