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
from src.schemas.parent import ChildLinkOut
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
    Registers a new parent account and automatically links all existing students
    registered under the same phone number or student ID.
    Enforces phone/email uniqueness for parents (only students can share phone numbers).
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
        if data.phone_number and data.phone_number.strip() != clean_phone:
            parent_conditions.append(Parent.phone_number == data.phone_number.strip())

    parent_query = select(Parent).where(or_(*parent_conditions))
    parent_result = await session.execute(parent_query)
    existing_parent = parent_result.scalar_one_or_none()

    if existing_parent:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A parent account with this mobile number or email already exists. Please log in.",
        )

    # 2 — Create new parent
    parent = Parent(
        full_name=data.full_name.strip() if getattr(data, "full_name", None) else None,
        email=clean_email,
        phone_number=clean_phone,
        password_hash=hash_password(data.password),
    )
    session.add(parent)
    await session.flush()

    # 3 — Identify all students to link (explicit student ID + all students sharing this phone/email)
    target_student_numbers: list[str] = []

    if data.student_unique_number and data.student_unique_number.strip():
        student = await _validate_student_number(data.student_unique_number, session)
        target_student_numbers.append(student.unique_number)

    # If phone or email is provided, find ALL existing students registered under this phone/email
    student_conditions = []
    if clean_phone:
        student_conditions.append(Student.phone_number == clean_phone)
        if data.phone_number and data.phone_number.strip() != clean_phone:
            student_conditions.append(Student.phone_number == data.phone_number.strip())
        raw_digits = "".join(ch for ch in clean_phone if ch.isdigit())
        if len(raw_digits) >= 10:
            last10 = raw_digits[-10:]
            student_conditions.append(Student.phone_number.like(f"%{last10}"))
    if clean_email:
        student_conditions.append(func.lower(Student.email) == clean_email)

    if student_conditions:
        students_res = await session.execute(select(Student).where(or_(*student_conditions)))
        for st in students_res.scalars().all():
            if st.unique_number not in target_student_numbers:
                target_student_numbers.append(st.unique_number)

    # 4 — Link all target students to this newly registered guardian
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

    await session.commit()
    await session.refresh(parent)
    return parent, True


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
) -> ChildLinkOut:
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
    await session.commit()
    await session.refresh(link)

    return ChildLinkOut(
        id=link.id,
        parent_id=link.parent_id,
        student_unique_number=link.student_unique_number,
        full_name=student.full_name or f"Student #{student.unique_number}",
        class_number=student.class_number,
        section=student.section,
        school_name=student.school_name,
        branch_name=student.branch_name,
        enrollment_type=student.enrollment_type,
        created_at=link.created_at,
    )


async def get_parent_children(
    parent: Parent, session: AsyncSession
) -> list[ChildLinkOut]:
    """List all children linked to this parent, joined with student details."""
    stmt = (
        select(ParentChildLink, Student)
        .join(Student, ParentChildLink.student_unique_number == Student.unique_number, isouter=True)
        .where(ParentChildLink.parent_id == parent.id)
        .order_by(ParentChildLink.created_at.desc())
    )
    result = await session.execute(stmt)
    rows = result.all()

    children: list[ChildLinkOut] = []
    for link, student in rows:
        children.append(
            ChildLinkOut(
                id=link.id,
                parent_id=link.parent_id,
                student_unique_number=link.student_unique_number,
                full_name=student.full_name if (student and student.full_name) else f"Student #{link.student_unique_number}",
                class_number=student.class_number if student else None,
                section=student.section if student else None,
                school_name=student.school_name if student else None,
                branch_name=student.branch_name if student else None,
                enrollment_type=student.enrollment_type if student else "school",
                created_at=link.created_at,
            )
        )
    return children
