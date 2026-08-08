"""
Auth routes — registration + login for all four roles.

POST /auth/school/register
POST /auth/school/login
POST /auth/student/register
POST /auth/student/login
POST /auth/student/setup-class   (protected — student only)
POST /auth/parent/register
POST /auth/parent/login
POST /auth/admin/login
POST /auth/token/refresh          (sliding-window explicit refresh)

Token strategy:
  - All tokens are valid for 7 days.
  - Every authenticated response includes X-Access-Token if the token
    is refreshed (< 3.5 days remaining — see core/dependencies.py).
  - Clients can also explicitly call POST /auth/token/refresh with a
    still-valid token to get a fresh 7-day token.
"""

from fastapi import APIRouter, Depends, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_student
from src.core.security import create_access_token, decode_token
from src.models.student import Student
from src.schemas.auth import (
    AdminLoginRequest,
    ParentLoginRequest,
    ParentRegisterRequest,
    SchoolLoginRequest,
    SchoolRegisterRequest,
    StudentClassSetupRequest,
    StudentLoginRequest,
    StudentRegisterRequest,
    TokenRefreshRequest,
)
from src.schemas.common import MessageResponse, TokenResponse
from src.schemas.student import StudentProfile
from src.services import parent_service, school_service, student_service
from src.models.admin import Admin
from sqlmodel import select
from src.core.security import verify_password
from fastapi import HTTPException

from src.models.school import School
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SchoolSearchResult(BaseModel):
    school_name: str
    branch_name: str
    state: str

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
    # FastAPI doesn't easily change status_code at runtime, so we return 200/201
    # by using a JSONResponse when needed
    from fastapi.responses import JSONResponse
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
    result = await session.execute(
        select(Admin).where(Admin.email == str(data.email))
    )
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )

    token = create_access_token(subject=str(admin.id), role="admin")
    return TokenResponse(access_token=token, role="admin")


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
