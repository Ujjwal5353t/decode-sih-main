from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


# ── School ─────────────────────────────────────────────────────────────────────

class SchoolRegisterRequest(BaseModel):
    school_name: str
    branch_name: str
    student_prefix: str       # manually entered, e.g. "LKD" — must be unique
    email: EmailStr
    password: str
    state: str

    @field_validator("student_prefix")
    @classmethod
    def prefix_uppercase(cls, v: str) -> str:
        v = v.strip().upper()
        if not v.isalpha() or not (2 <= len(v) <= 10):
            raise ValueError("Prefix must be 2–10 uppercase letters only.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class SchoolLoginRequest(BaseModel):
    branch_name: str
    email: EmailStr
    password: str


# ── Student ────────────────────────────────────────────────────────────────────

class StudentRegisterRequest(BaseModel):
    enrollment_type: str = "school"  # "self" or "school"
    school_name: str = "NCERT Self-Educated"
    branch_name: str = "SELF"
    email: EmailStr
    password: str
    state: str = "All India"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class StudentLoginRequest(BaseModel):
    branch_name: Optional[str] = None
    enrollment_type: Optional[str] = None   # "self" or "school" — used to validate login mode
    email: EmailStr
    password: str


class StudentClassSetupRequest(BaseModel):
    class_number: int
    section: str              # A / B / C / D

    @field_validator("class_number")
    @classmethod
    def valid_class(cls, v: int) -> int:
        if v not in range(1, 6):
            raise ValueError("Class number must be between 1 and 5.")
        return v

    @field_validator("section")
    @classmethod
    def valid_section(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("A", "B", "C", "D", "SELF"):
            raise ValueError("Section must be A, B, C, D, or SELF (for self-enrolled).")
        return v


# ── Parent ─────────────────────────────────────────────────────────────────────

class ParentRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    student_unique_number: str   # e.g. "LKD0001" — must exist in students table

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class ParentLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AddChildRequest(BaseModel):
    student_unique_number: str   # link an additional child to the same parent account


# ── Admin ──────────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Token refresh ──────────────────────────────────────────────────────────────

class TokenRefreshRequest(BaseModel):
    """Optional explicit refresh — frontend can call this to get a new 7-day token."""
    access_token: str
