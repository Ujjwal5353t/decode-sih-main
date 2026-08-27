from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.school import BranchCounter, School
from src.schemas.auth import SchoolLoginRequest, SchoolRegisterRequest
from src.services.otp_service import normalize_phone


async def register_school(data: SchoolRegisterRequest, session: AsyncSession) -> School:
    clean_email = str(data.email).strip().lower() if data.email else None
    clean_phone = normalize_phone(data.phone_number) if data.phone_number else None

    if not clean_email and not clean_phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either Email or Mobile Number must be provided for school registration.",
        )

    # 1 — Check branch_name uniqueness
    existing_branch = await session.execute(
        select(School).where(func.lower(School.branch_name) == data.branch_name.strip().lower())
    )
    if existing_branch.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="School account already exists for this branch name.",
        )

    # 2 — Check student_prefix uniqueness
    existing_prefix = await session.execute(
        select(School).where(func.upper(School.student_prefix) == data.student_prefix.strip().upper())
    )
    if existing_prefix.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student prefix '{data.student_prefix}' is already in use by another branch.",
        )

    # 3 — Check email uniqueness if email provided
    if clean_email:
        existing_email = await session.execute(
            select(School).where(func.lower(School.email) == clean_email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

    # 4 — Check phone uniqueness if phone provided
    if clean_phone:
        existing_phone = await session.execute(
            select(School).where(
                or_(
                    School.phone_number == clean_phone,
                    School.phone_number == data.phone_number.strip(),
                )
            )
        )
        if existing_phone.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A school branch with this mobile number already exists.",
            )

    # 5 — Create School
    school = School(
        school_name=data.school_name.strip(),
        branch_name=data.branch_name.strip(),
        student_prefix=data.student_prefix.strip().upper(),
        email=clean_email,
        phone_number=clean_phone,
        password_hash=hash_password(data.password),
        state=data.state.strip(),
    )
    session.add(school)
    await session.flush()  # get school.id without committing

    # 5 — Create the branch counter (starts at 0)
    counter = BranchCounter(branch_name=data.branch_name.strip(), last_counter=0)
    session.add(counter)

    return school


async def login_school(data: SchoolLoginRequest, session: AsyncSession) -> School:
    raw_ident = (data.identifier or data.email or data.phone_number or "").strip()
    if not raw_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide an Email or Mobile Number.",
        )

    clean_ident_lower = raw_ident.lower()
    clean_phone = normalize_phone(raw_ident)

    query = select(School).where(
        func.lower(School.branch_name) == data.branch_name.strip().lower(),
        or_(
            func.lower(School.email) == clean_ident_lower,
            School.phone_number == clean_phone if clean_phone else False,
            School.phone_number == raw_ident,
        ),
    )
    result = await session.execute(query)
    schools = result.scalars().all()

    GENERIC_AUTH_ERROR = "Invalid branch name, email/phone, or password."

    matched_school: Optional[School] = None
    for s in schools:
        if verify_password(data.password, s.password_hash):
            matched_school = s
            break

    if not matched_school:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        )

    return matched_school
