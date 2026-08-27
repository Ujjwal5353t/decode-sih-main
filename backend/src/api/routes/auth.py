"""
Auth routes — registration, login, and OTP verification for all roles.

POST /auth/otp/send
POST /auth/otp/verify
POST /auth/school/register
POST /auth/school/login
POST /auth/student/register
POST /auth/student/login
POST /auth/student/setup-class   (protected — student only)
POST /auth/parent/register
POST /auth/parent/login
POST /auth/admin/login
POST /auth/token/refresh          (sliding-window explicit refresh)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.database import get_session
from src.core.dependencies import get_current_student
from src.core.security import create_access_token, decode_token, verify_password
from src.models.admin import Admin
from src.models.parent import Parent
from src.models.school import School
from src.models.student import Student
from src.models.teacher import Teacher
from src.schemas.auth import (
    AdminLoginRequest,
    OTPLoginRequest,
    OTPResponse,
    ParentLoginRequest,
    ParentRegisterRequest,
    SchoolLoginRequest,
    SchoolRegisterRequest,
    SendOTPRequest,
    StudentClassSetupRequest,
    StudentLoginRequest,
    StudentRegisterRequest,
    TeacherLoginRequest,
    TeacherRegisterRequest,
    TokenRefreshRequest,
    VerifyOTPRequest,
)
from src.schemas.common import MessageResponse, TokenResponse
from src.schemas.permission import RolePermissionsResponse
from src.schemas.student import StudentProfile
from src.services import parent_service, school_service, student_service, teacher_service
from src.services.otp_service import generate_and_send_otp, normalize_phone, verify_otp_code
from src.services.permission_service import get_permissions_for_role
from sqlalchemy import func, or_

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SchoolSearchResult(BaseModel):
    school_name: str
    branch_name: str
    state: str


# ── OTP Service Endpoints ──────────────────────────────────────────────────────

@router.post(
    "/otp/send",
    response_model=OTPResponse,
    summary="Generate a dummy OTP and print to the server console (Hackathon MVP)",
)
async def send_otp(data: SendOTPRequest):
    otp = generate_and_send_otp(data.phone_number)
    return OTPResponse(
        status="success",
        message=f"OTP sent to {data.phone_number}. Check your backend server console for the code!",
        phone_number=data.phone_number,
    )


@router.post(
    "/otp/verify",
    response_model=OTPResponse,
    summary="Verify dummy OTP code",
)
async def verify_otp(data: VerifyOTPRequest):
    valid = verify_otp_code(data.phone_number, data.otp_code)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please check the backend console.",
        )
    return OTPResponse(
        status="success",
        message="Phone number verified successfully.",
        phone_number=data.phone_number,
        verified=True,
    )


@router.post(
    "/login/otp",
    response_model=TokenResponse,
    summary="Login directly with verified mobile OTP code",
)
async def login_with_otp(
    data: OTPLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    valid = verify_otp_code(data.phone_number, data.otp_code)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please check the backend console.",
        )

    clean_phone = normalize_phone(data.phone_number)
    role = data.role.lower().strip()

    if role == "teacher":
        if not data.branch_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch name is required for teacher login.",
            )
        result = await session.execute(
            select(Teacher).where(
                or_(
                    Teacher.phone_number == clean_phone,
                    Teacher.phone_number == data.phone_number.strip(),
                ),
                func.lower(Teacher.branch_name) == data.branch_name.strip().lower(),
            )
        )
        teacher = result.scalar_one_or_none()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No teacher account found with phone number '{data.phone_number}' in branch '{data.branch_name}'.",
            )
        token = create_access_token(
            subject=str(teacher.id),
            role="teacher",
            extra_claims={"branch": teacher.branch_name},
        )
        return TokenResponse(access_token=token, role="teacher")

    elif role == "student":
        result = await session.execute(
            select(Student).where(
                or_(
                    Student.phone_number == clean_phone,
                    Student.phone_number == data.phone_number.strip(),
                )
            )
        )
        students = result.scalars().all()
        if not students:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No student account found with phone number '{data.phone_number}'.",
            )
        
        # If branch specified, match branch
        matched_student = students[0]
        if data.branch_name and data.branch_name.strip():
            for s in students:
                if s.branch_name.strip().lower() == data.branch_name.strip().lower():
                    matched_student = s
                    break

        token = create_access_token(
            subject=str(matched_student.id),
            role="student",
            extra_claims={"unique_number": matched_student.unique_number, "branch": matched_student.branch_name},
        )
        return TokenResponse(access_token=token, role="student")

    elif role == "parent":
        result = await session.execute(
            select(Parent).where(
                or_(
                    Parent.phone_number == clean_phone,
                    Parent.phone_number == data.phone_number.strip(),
                )
            )
        )
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No parent account found with phone number '{data.phone_number}'.",
            )
        token = create_access_token(subject=str(parent.id), role="parent")
        return TokenResponse(access_token=token, role="parent")

    elif role == "school":
        if not data.branch_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch name is required for school login.",
            )
        result = await session.execute(
            select(School).where(
                or_(
                    School.phone_number == clean_phone,
                    School.phone_number == data.phone_number.strip(),
                ),
                func.lower(School.branch_name) == data.branch_name.strip().lower(),
            )
        )
        school = result.scalar_one_or_none()
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No school branch account found with phone number '{data.phone_number}'.",
            )
        token = create_access_token(
            subject=str(school.id),
            role="school",
            extra_claims={"branch": school.branch_name},
        )
        return TokenResponse(access_token=token, role="school")

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported role '{role}' for OTP login.",
        )


# ── Role Permissions & Feature Schema ──────────────────────────────────────────

@router.get(
    "/permissions",
    response_model=RolePermissionsResponse,
    summary="Get role permissions, actions, and sidebar navigation schema for a specified or authenticated role",
)
async def get_current_role_permissions(
    role: Optional[str] = None,
):
    target_role = role or "student"
    return get_permissions_for_role(target_role)


@router.get(
    "/permissions/{role}",
    response_model=RolePermissionsResponse,
    summary="Get permission capabilities and navigation items for a specific role",
)
async def get_role_permissions(role: str):
    return get_permissions_for_role(role)


# ── School Search ──────────────────────────────────────────────────────────────

@router.get(
    "/schools/search",
    response_model=list[SchoolSearchResult],
    summary="Search registered schools and branches for autocomplete suggestions",
)
async def search_registered_schools(
    query: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(School).where(School.branch_name != "SELF")
    if query:
        stmt = stmt.where(
            (School.school_name.ilike(f"%{query}%")) |  # type: ignore[attr-defined]
            (School.branch_name.ilike(f"%{query}%"))    # type: ignore[attr-defined]
        )
    stmt = stmt.limit(20)
    result = await session.execute(stmt)
    schools = result.scalars().all()
    return [
        SchoolSearchResult(
            school_name=s.school_name,
            branch_name=s.branch_name,
            state=s.state,
        )
        for s in schools
    ]


# ── School ─────────────────────────────────────────────────────────────────────

@router.post(
    "/school/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new school branch account",
)
async def school_register(
    data: SchoolRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    school = await school_service.register_school(data, session)
    token = create_access_token(
        subject=str(school.id),
        role="school",
        extra_claims={"branch": school.branch_name},
    )
    return TokenResponse(access_token=token, role="school")


@router.post(
    "/school/login",
    response_model=TokenResponse,
    summary="Login to a school branch account",
)
async def school_login(
    data: SchoolLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    school = await school_service.login_school(data, session)
    token = create_access_token(
        subject=str(school.id),
        role="school",
        extra_claims={"branch": school.branch_name},
    )
    return TokenResponse(access_token=token, role="school")


# ── Student ────────────────────────────────────────────────────────────────────

@router.post(
    "/student/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
)
async def student_register(
    data: StudentRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    student = await student_service.register_student(data, session)
    token = create_access_token(
        subject=str(student.id),
        role="student",
        extra_claims={"unique_number": student.unique_number, "branch": student.branch_name},
    )
    return TokenResponse(access_token=token, role="student")


@router.post(
    "/student/login",
    response_model=TokenResponse,
    summary="Login to a student account",
)
async def student_login(
    data: StudentLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    student = await student_service.login_student(data, session)
    token = create_access_token(
        subject=str(student.id),
        role="student",
        extra_claims={"unique_number": student.unique_number, "branch": student.branch_name},
    )
    return TokenResponse(access_token=token, role="student")


@router.post(
    "/student/setup-class",
    response_model=StudentProfile,
    summary="Set class and section after first login (student only)",
)
async def student_setup_class(
    data: StudentClassSetupRequest,
    student: Student = Depends(get_current_student),
    session: AsyncSession = Depends(get_session),
):
    updated = await student_service.setup_class_section(student, data, session)
    return StudentProfile.model_validate(updated)


# ── Parent ─────────────────────────────────────────────────────────────────────

@router.post(
    "/parent/register",
    response_model=TokenResponse,
    summary="Register a parent account (or add a child to existing account)",
)
async def parent_register(
    data: ParentRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    parent, created = await parent_service.register_parent(data, session)
    token = create_access_token(subject=str(parent.id), role="parent")
    http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return JSONResponse(
        status_code=http_status,
        content=TokenResponse(access_token=token, role="parent").model_dump(),
    )


@router.post(
    "/parent/login",
    response_model=TokenResponse,
    summary="Login to a parent account",
)
async def parent_login(
    data: ParentLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    parent = await parent_service.login_parent(data, session)
    token = create_access_token(subject=str(parent.id), role="parent")
    return TokenResponse(access_token=token, role="parent")


# ── Admin ──────────────────────────────────────────────────────────────────────

@router.post(
    "/admin/login",
    response_model=TokenResponse,
    summary="Admin login (credentials pre-seeded in database)",
)
async def admin_login(
    data: AdminLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    target = data.email or data.identifier or ""
    result = await session.execute(
        select(Admin).where(Admin.email == str(target).strip())
    )
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )

    token = create_access_token(subject=str(admin.id), role="admin")
    return TokenResponse(access_token=token, role="admin")


# ── Teacher ────────────────────────────────────────────────────────────────────

@router.post(
    "/teacher/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new teacher account",
)
async def teacher_register(
    data: TeacherRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    teacher = await teacher_service.register_teacher(data, session)
    token = create_access_token(
        subject=str(teacher.id),
        role="teacher",
        extra_claims={"branch": teacher.branch_name},
    )
    return TokenResponse(access_token=token, role="teacher")


@router.post(
    "/teacher/login",
    response_model=TokenResponse,
    summary="Login to a teacher account using phone number and branch",
)
async def teacher_login(
    data: TeacherLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    teacher = await teacher_service.login_teacher(data, session)
    token = create_access_token(
        subject=str(teacher.id),
        role="teacher",
        extra_claims={"branch": teacher.branch_name},
    )
    return TokenResponse(access_token=token, role="teacher")


# ── Token refresh ──────────────────────────────────────────────────────────────

@router.post(
    "/token/refresh",
    response_model=TokenResponse,
    summary="Exchange a valid (non-expired) token for a fresh 7-day token",
)
async def refresh_token(data: TokenRefreshRequest):
    try:
        payload = decode_token(data.access_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has already expired. Please log in again.",
        )

    new_token = create_access_token(
        subject=payload["sub"],
        role=payload["role"],
        extra_claims={
            k: v for k, v in payload.items() if k not in ("sub", "role", "exp", "iat")
        } or None,
    )
    return TokenResponse(access_token=new_token, role=payload["role"])
