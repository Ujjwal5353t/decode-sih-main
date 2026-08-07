from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.school import BranchCounter, School
from src.schemas.auth import SchoolLoginRequest, SchoolRegisterRequest


async def register_school(data: SchoolRegisterRequest, session: AsyncSession) -> School:
    # 1 — Check branch_name uniqueness
    existing_branch = await session.execute(
        select(School).where(School.branch_name == data.branch_name)
    )
    if existing_branch.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="School account already exists for this branch name.",
        )

    # 2 — Check student_prefix uniqueness
    existing_prefix = await session.execute(
        select(School).where(School.student_prefix == data.student_prefix)
    )
    if existing_prefix.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student prefix '{data.student_prefix}' is already in use by another branch.",
        )

    # 3 — Check email uniqueness
    existing_email = await session.execute(
        select(School).where(School.email == data.email)
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 4 — Create School
    school = School(
        school_name=data.school_name,
        branch_name=data.branch_name,
        student_prefix=data.student_prefix,
        email=str(data.email),
        password_hash=hash_password(data.password),
        state=data.state,
    )
    session.add(school)
    await session.flush()  # get school.id without committing

    # 5 — Create the branch counter (starts at 0)
    counter = BranchCounter(branch_name=data.branch_name, last_counter=0)
    session.add(counter)

    return school


async def login_school(data: SchoolLoginRequest, session: AsyncSession) -> School:
    result = await session.execute(
        select(School).where(
            School.branch_name == data.branch_name,
            School.email == str(data.email),
        )
    )
    school = result.scalar_one_or_none()

    if not school or not verify_password(data.password, school.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid branch name, email, or password.",
        )

    return school
