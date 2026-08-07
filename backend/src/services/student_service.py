from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.school import School
from src.models.student import Student
from src.schemas.auth import (
    StudentClassSetupRequest,
    StudentLoginRequest,
    StudentRegisterRequest,
)
from src.utils.id_utils import generate_student_unique_number


async def register_student(data: StudentRegisterRequest, session: AsyncSession) -> Student:
    # 1 — Check email uniqueness across ALL students
    existing_email = await session.execute(
        select(Student).where(Student.email == str(data.email))
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student account already exists for this email.",
        )

    # 2 — Verify branch_name exists
    school_result = await session.execute(
        select(School).where(School.branch_name == data.branch_name)
    )
    school = school_result.scalar_one_or_none()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No school branch found with name '{data.branch_name}'. "
                   "Please verify the branch name with your school.",
        )

    # 3 — Atomically generate unique student number (SELECT FOR UPDATE on counter)
    unique_number = await generate_student_unique_number(session, school)

    # 4 — Create Student
    student = Student(
        unique_number=unique_number,
        email=str(data.email),
        password_hash=hash_password(data.password),
        state=data.state,
        school_name=data.school_name,
        branch_name=data.branch_name,
    )
    session.add(student)

    return student


async def login_student(data: StudentLoginRequest, session: AsyncSession) -> Student:
    result = await session.execute(
        select(Student).where(
            Student.branch_name == data.branch_name,
            Student.email == str(data.email),
        )
    )
    student = result.scalar_one_or_none()

    if not student or not verify_password(data.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid branch name, email, or password.",
        )

    return student


async def setup_class_section(
    student: Student,
    data: StudentClassSetupRequest,
    session: AsyncSession,
) -> Student:
    student.class_number = data.class_number
    student.section = data.section
    session.add(student)
    return student
