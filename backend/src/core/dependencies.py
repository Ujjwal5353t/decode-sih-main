"""
FastAPI dependencies for role-based authentication.

Every protected route receives one of these dependencies and gets
the authenticated entity (School, Student, Parent, or Admin) back.

Sliding-window token refresh:
  If the incoming token has less than half its lifetime left, a fresh
  token is injected into the response as the X-Access-Token header.
  The frontend MUST store this new value for subsequent requests.
"""
import uuid

from fastapi import Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.database import get_session
from src.core.security import create_access_token, decode_token, should_refresh_token

bearer_scheme = HTTPBearer()


def _extract_payload(credentials: HTTPAuthorizationCredentials) -> dict:
    try:
        return decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _check_role(payload: dict, expected_role: str) -> None:
    if payload.get("role") != expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access restricted to {expected_role} accounts.",
        )


def _maybe_refresh(payload: dict, response: Response) -> None:
    """Inject a fresh token in the response header when close to expiry."""
    if should_refresh_token(payload):
        extra = {k: v for k, v in payload.items() if k not in ("sub", "role", "exp", "iat")}
        new_token = create_access_token(
            subject=payload["sub"],
            role=payload["role"],
            extra_claims=extra or None,
        )
        response.headers["X-Access-Token"] = new_token


# ── School ─────────────────────────────────────────────────────────────────────

async def get_current_school(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
):
    from src.models.school import School  # local import avoids circular deps

    payload = _extract_payload(credentials)
    _check_role(payload, "school")
    _maybe_refresh(payload, response)

    school_id = uuid.UUID(payload["sub"])
    school = await session.get(School, school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found.")
    return school


# ── Student ────────────────────────────────────────────────────────────────────

async def get_current_student(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
):
    from src.models.student import Student

    payload = _extract_payload(credentials)
    _check_role(payload, "student")
    _maybe_refresh(payload, response)

    student_id = uuid.UUID(payload["sub"])
    student = await session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return student


# ── Parent ─────────────────────────────────────────────────────────────────────

async def get_current_parent(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
):
    from src.models.parent import Parent

    payload = _extract_payload(credentials)
    _check_role(payload, "parent")
    _maybe_refresh(payload, response)

    parent_id = uuid.UUID(payload["sub"])
    parent = await session.get(Parent, parent_id)
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found.")
    return parent


# ── Admin ──────────────────────────────────────────────────────────────────────

async def get_current_admin(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
):
    from src.models.admin import Admin

    payload = _extract_payload(credentials)
    _check_role(payload, "admin")
    _maybe_refresh(payload, response)

    admin_id = uuid.UUID(payload["sub"])
    admin = await session.get(Admin, admin_id)
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found.")
    return admin
