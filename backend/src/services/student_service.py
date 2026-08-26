from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.parent import Parent, ParentChildLink
from src.models.school import School
from src.models.student import Student
from src.schemas.auth import (
    StudentClassSetupRequest,
    StudentLoginRequest,
    StudentRegisterRequest,
)
from src.services.otp_service import normalize_phone
from src.utils.id_utils import generate_student_unique_number


async def register_student(data: StudentRegisterRequest, session: AsyncSession) -> Student:
    clean_email = str(data.email).strip().lower() if data.email else None
    clean_phone = normalize_phone(data.phone_number) if data.phone_number else None

    if not clean_email and not clean_phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either Email or Mobile Number must be provided for student registration.",
        )

    # 1 — If email is provided, verify uniqueness across students
    if clean_email:
        existing_email = await session.execute(
            select(Student).where(func.lower(Student.email) == clean_email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student account already exists for this email address.",
            )

    # 2 — Determine enrollment mode and target branch
    enrollment_type = data.enrollment_type.lower() if data.enrollment_type else "school"
    target_branch = "SELF" if enrollment_type == "self" else data.branch_name
    target_school_name = "NCERT Self-Educated" if enrollment_type == "self" else data.school_name
    target_state = "All India" if enrollment_type == "self" else data.state

    # Verify branch_name exists in schools table
    school_result = await session.execute(
        select(School).where(School.branch_name == target_branch)
    )
    school = school_result.scalar_one_or_none()
    if not school:
        if enrollment_type == "self":
            # Auto-create SELF school branch if not seeded yet
            school = School(
                school_name="NCERT Self-Educated",
                branch_name="SELF",
                student_prefix="SELF",
                email="self@vidyasetu.ai",
                password_hash=hash_password("SelfEducated123!"),
                state="All India",
            )
            session.add(school)
            await session.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No school branch found with name '{target_branch}'. "
                       "Please select a valid school branch or choose Self Enrolled mode.",
            )

    # 3 — Atomically generate unique student number (SELECT FOR UPDATE on counter)
    unique_number = await generate_student_unique_number(session, school)

    # 4 — Determine class/section (self-enrolled always gets section="SELF")
    section = "SELF" if enrollment_type == "self" else data.section.strip().upper()

    # 5 — Create Student (Multiple siblings can share the same mobile number)
    student = Student(
        unique_number=unique_number,
        full_name=data.full_name.strip() if getattr(data, "full_name", None) else "Student",
        email=clean_email,
        phone_number=clean_phone,
        password_hash=hash_password(data.password),
        state=target_state,
        school_name=target_school_name,
        branch_name=target_branch,
        enrollment_type=enrollment_type,
        class_number=data.class_number,
        section=section,
    )
    session.add(student)
    await session.flush()

    # 6 — Map child to Parent if a Parent account is already registered with this phone number or email
    if clean_phone or clean_email:
        conditions = []
        if clean_phone:
            conditions.append(Parent.phone_number == clean_phone)
            if data.phone_number and data.phone_number.strip() != clean_phone:
                conditions.append(Parent.phone_number == data.phone_number.strip())
            raw_digits = "".join(ch for ch in clean_phone if ch.isdigit())
            if len(raw_digits) >= 10:
                last10 = raw_digits[-10:]
                conditions.append(Parent.phone_number.like(f"%{last10}"))
        if clean_email:
            conditions.append(func.lower(Parent.email) == clean_email)
        
        if conditions:
            parent_result = await session.execute(select(Parent).where(or_(*conditions)))
            parents = parent_result.scalars().all()

            for parent in parents:
                # Check if link already exists
                link_check = await session.execute(
                    select(ParentChildLink).where(
                        ParentChildLink.parent_id == parent.id,
                        ParentChildLink.student_unique_number == student.unique_number,
                    )
                )
                if not link_check.scalar_one_or_none():
                    new_link = ParentChildLink(
                        parent_id=parent.id,
                        student_unique_number=student.unique_number,
                    )
                    session.add(new_link)
                    print(
                        f"[AutoLink] Successfully mapped child {student.unique_number} "
                        f"to existing parent {parent.id} (Phone: {clean_phone}, Email: {clean_email})",
                        flush=True,
                    )

    return student


async def login_student(data: StudentLoginRequest, session: AsyncSession) -> Student:
    raw_ident = (data.identifier or data.email or data.phone_number or "").strip()
    if not raw_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide an Email, Mobile Number, or Student ID.",
        )

    clean_ident_lower = raw_ident.lower()
    clean_phone = normalize_phone(raw_ident)

    # Query matching students by email, unique_number, or phone_number
    query = select(Student).where(
        or_(
            func.lower(Student.email) == clean_ident_lower,
            func.upper(Student.unique_number) == raw_ident.upper(),
            Student.phone_number == clean_phone if clean_phone else False,
            Student.phone_number == raw_ident,
        )
    )
    result = await session.execute(query)
    students = result.scalars().all()

    GENERIC_AUTH_ERROR = "Invalid credentials or branch name."

    if not students:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        )

    # If multiple students share the phone number, find the one matching the password
    matched_student: Optional[Student] = None
    for s in students:
        if verify_password(data.password, s.password_hash):
            matched_student = s
            break

    if not matched_student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        )

    # Handle branch & enrollment mode validation
    is_self = matched_student.enrollment_type == "self" or matched_student.branch_name == "SELF"

    if not is_self:
        if data.branch_name and data.branch_name.strip():
            if data.branch_name.strip().lower() != matched_student.branch_name.strip().lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=GENERIC_AUTH_ERROR,
                )
        elif data.enrollment_type == "self":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=GENERIC_AUTH_ERROR,
            )

    return matched_student


async def setup_class_section(
    student: Student,
    data: StudentClassSetupRequest,
    session: AsyncSession,
) -> Student:
    student.class_number = data.class_number
    student.section = data.section
    session.add(student)
    return student
