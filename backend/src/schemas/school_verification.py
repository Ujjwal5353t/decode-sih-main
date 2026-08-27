import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


# ── Directory lookup ──────────────────────────────────────────────────────────

class SchoolRecordOut(BaseModel):
    """
    The official record shown on the confirmation card.

    Deliberately excludes the directory's official_email / official_phone:
    those are the evidence the authority check compares against, so exposing
    them would tell a claimant exactly what to enter.
    """

    udise_code: str
    school_name: str
    state: str
    district: str
    management: str
    board: Optional[str] = None

    model_config = {"from_attributes": True}


class DirectorySearchRequest(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None


# ── Email verification ────────────────────────────────────────────────────────

class SendEmailCodeRequest(BaseModel):
    email: EmailStr


class VerifyEmailCodeRequest(BaseModel):
    email: EmailStr
    code: str


class EmailVerificationResponse(BaseModel):
    status: str
    message: str
    email: Optional[str] = None
    verified: Optional[bool] = None


# ── Publishers & Class Subjects ─────────────────────────────────────────────

class PublisherOut(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class PublisherWithSubjectsOut(BaseModel):
    id: uuid.UUID
    name: str
    subjects: list[str]

    model_config = {"from_attributes": True}


class ClassSubjectPublisherItem(BaseModel):
    class_number: int
    publisher_name: str
    subjects: list[str]


# ── Claims ────────────────────────────────────────────────────────────────────

class CreateClaimRequest(BaseModel):
    udise_code: str
    full_name: str
    designation: str
    official_email: EmailStr
    phone_number: str
    password: str
    class_subjects: Optional[list[ClassSubjectPublisherItem]] = None

    @field_validator("full_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Please enter your full name.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class ClaimStatusOut(BaseModel):
    """Progress of one verification request, used to drive the status screen."""

    id: uuid.UUID
    udise_code: str
    school_name: str
    full_name: str
    designation: str
    official_email: str
    phone_number: str

    # The three questions, kept visibly separate.
    school_identity_verified: bool
    phone_verified: bool
    email_verified: bool
    authority_status: str

    route: str
    status: str
    authority_notes: Optional[str] = None
    decision_reason: Optional[str] = None
    evidence_url: Optional[str] = None
    class_subjects: Optional[list[ClassSubjectPublisherItem]] = None
    created_at: datetime

    # Only ever true once the claim is approved AND an account exists.
    admin_access_granted: bool



class ClaimCreatedResponse(BaseModel):
    claim: ClaimStatusOut
    message: str


class ClaimDecisionRequest(BaseModel):
    reason: Optional[str] = None


class OwnerClaimListItem(BaseModel):
    """What the existing verified owner sees in their approvals list."""

    id: uuid.UUID
    full_name: str
    designation: str
    official_email: str
    phone_number: str
    school_name: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ClaimTokenResponse(BaseModel):
    """Issued only after a claim is approved and its account activated."""

    access_token: str
    token_type: str = "bearer"
    role: str = "school"


class SchoolRequestListItem(BaseModel):
    """
    One school-registration request as the Super Admin sees it.

    Carries the school's own directory identity (name/state/district) alongside
    the claimant's self-declared details, so a reviewer can compare the two.
    Directory contact details stay out of this payload for the same reason they
    stay out of SchoolRecordOut.
    """

    id: uuid.UUID

    # School identity — from the official directory record.
    school_name: str
    udise_code: str
    state: Optional[str] = None
    district: Optional[str] = None
    board: Optional[str] = None
    management: Optional[str] = None

    # Claimant identity — self-declared, both channels verified.
    full_name: str
    designation: str
    official_email: str
    phone_number: str
    phone_verified: bool
    email_verified: bool

    # Evidence the reviewer weighs.
    authority_status: str
    authority_notes: Optional[str] = None
    evidence_url: Optional[str] = None

    status: str
    decision_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    class_subjects: Optional[list[ClassSubjectPublisherItem]] = None

    admin_access_granted: bool

