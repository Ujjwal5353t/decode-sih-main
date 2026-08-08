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
    clean_email = str(data.email).strip().lower()
    existing_email = await session.execute(
        select(Student).where(func.lower(Student.email) == clean_email)
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student account already exists for this email.",
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
                email="self@inclulearn.ai",
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

    # 4 — Create Student
    student = Student(
        unique_number=unique_number,
        email=clean_email,
        password_hash=hash_password(data.password),
        state=target_state,
        school_name=target_school_name,
        branch_name=target_branch,
        enrollment_type=enrollment_type,
    )
    session.add(student)

    return student


from sqlalchemy import func

async def login_student(data: StudentLoginRequest, session: AsyncSession) -> Student:
    # 1. Case-insensitive email lookup
    query = select(Student).where(
        func.lower(Student.email) == str(data.email).strip().lower()
    )
    result = await session.execute(query)
    student = result.scalar_one_or_none()

    GENERIC_AUTH_ERROR = "Invalid email, branch name, or password."

    # 2. Check student existence and password
    if not student or not verify_password(data.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        )

    # 3. Handle branch & enrollment mode validation securely
    is_self = student.enrollment_type == "self" or student.branch_name == "SELF"

    if not is_self:
        # Student is school-enrolled
        if data.branch_name and data.branch_name.strip():
            if data.branch_name.strip().lower() != student.branch_name.strip().lower():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=GENERIC_AUTH_ERROR,
                )
        elif data.enrollment_type == "self":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=GENERIC_AUTH_ERROR,
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
