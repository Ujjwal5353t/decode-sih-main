from typing import Optional
from pydantic import BaseModel, field_validator, model_validator


# ── OTP ────────────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 7:
            raise ValueError("Please provide a valid phone number (at least 7 digits).")
        return v


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str

    @field_validator("otp_code")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 4:
            raise ValueError("OTP code must be at least 4 digits.")
        return v


class OTPResponse(BaseModel):
    status: str
    message: str
    phone_number: Optional[str] = None
    verified: Optional[bool] = None


class OTPLoginRequest(BaseModel):
    phone_number: str
    otp_code: str
    role: str  # "student", "teacher", "parent", "school"
    branch_name: Optional[str] = None


# ── School ─────────────────────────────────────────────────────────────────────

class SchoolRegisterRequest(BaseModel):
    school_name: str
    branch_name: str
    student_prefix: str       # manually entered, e.g. "LKD" — must be unique
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: str
    state: str

    @model_validator(mode="after")
    def check_email_or_phone(self) -> "SchoolRegisterRequest":
        if not self.email and not self.phone_number:
            raise ValueError("Either Email or Mobile Number must be provided.")
        return self

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
    email: Optional[str] = None
    phone_number: Optional[str] = None
    identifier: Optional[str] = None  # accepts email or phone_number
    password: str


# ── Student ────────────────────────────────────────────────────────────────────

class StudentRegisterRequest(BaseModel):
    full_name: str = "Student"     # Student's name
    enrollment_type: str = "school"  # "self" or "school"
    school_name: str = "NCERT Self-Educated"
    branch_name: str = "SELF"
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: str
    state: str = "All India"
    class_number: int = 1          # 1–12
    section: str = "SELF"          # A/B/C/D for school-enrolled; "SELF" for self-enrolled

    @model_validator(mode="after")
    def check_email_or_phone(self) -> "StudentRegisterRequest":
        if not self.email and not self.phone_number:
            raise ValueError("Either Email or Mobile Number must be provided.")
        return self

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

    @field_validator("class_number")
    @classmethod
    def valid_class(cls, v: int) -> int:
        if v not in range(1, 13):
            raise ValueError("Class number must be between 1 and 12.")
        return v

    @field_validator("section")
    @classmethod
    def valid_section(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("A", "B", "C", "D", "SELF"):
            raise ValueError("Section must be A, B, C, D, or SELF (for self-enrolled).")
        return v


class StudentLoginRequest(BaseModel):
    branch_name: Optional[str] = None
    enrollment_type: Optional[str] = None   # "self" or "school" — used to validate login mode
    email: Optional[str] = None
    phone_number: Optional[str] = None
    identifier: Optional[str] = None        # accepts email, phone_number, or student unique_number
    password: str


class StudentClassSetupRequest(BaseModel):
    """Kept for backward compatibility; prefer supplying class/section at registration."""
    class_number: int
    section: str              # A / B / C / D

    @field_validator("class_number")
    @classmethod
    def valid_class(cls, v: int) -> int:
        if v not in range(1, 13):
            raise ValueError("Class number must be between 1 and 12.")
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
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: str
    student_unique_number: Optional[str] = None   # e.g. "LKD0001" or optional if linking by phone

    @model_validator(mode="after")
    def check_email_or_phone(self) -> "ParentRegisterRequest":
        if not self.email and not self.phone_number:
            raise ValueError("Either Email or Mobile Number must be provided.")
        return self

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class ParentLoginRequest(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    identifier: Optional[str] = None
    password: str


class AddChildRequest(BaseModel):
    student_unique_number: str   # link an additional child to the same parent account


# ── Admin ──────────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str


# ── Token refresh ──────────────────────────────────────────────────────────────

class TokenRefreshRequest(BaseModel):
    """Optional explicit refresh — frontend can call this to get a new 7-day token."""
    access_token: str


# ── Teacher ────────────────────────────────────────────────────────────────────

class TeacherRegisterRequest(BaseModel):
    name: str
    phone_number: str
    school_name: str
    branch_name: str
    password: str

    @field_validator("phone_number")
    @classmethod
    def valid_phone(cls, v: str) -> str:
        v = v.strip()
        digits = v.replace("+", "").replace("-", "").replace(" ", "")
        if not digits.isdigit() or not (7 <= len(digits) <= 15):
            raise ValueError("Phone number must be 7–15 digits.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class TeacherLoginRequest(BaseModel):
    phone_number: str
    branch_name: str
    password: str
