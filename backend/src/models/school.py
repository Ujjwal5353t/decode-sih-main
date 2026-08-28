import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()  # naive UTC — matches TIMESTAMP WITHOUT TIME ZONE


class School(SQLModel, table=True):
    """
    One account per branch.
    branch_name and student_prefix are both globally unique so that
    student IDs (prefix + sequential number) are unambiguous.
    """

    __tablename__ = "schools"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    school_name: str
    branch_name: str = Field(unique=True, index=True, max_length=120)
    student_prefix: str = Field(unique=True, index=True, max_length=10)
    email: Optional[str] = Field(default=None, index=True, max_length=255)
    phone_number: Optional[str] = Field(default=None, index=True, max_length=20)
    password_hash: str
    state: str = Field(max_length=100)

    # ── School verification (see models/school_verification.py) ───────────────
    # Existing rows are migrated with 'verified' so every account created before
    # the verification flow keeps working exactly as it did.
    verification_status: str = Field(default="verified", index=True, max_length=20)
    # Official directory identity, populated when the account is created through
    # the verification flow.
    udise_code: Optional[str] = Field(default=None, index=True, max_length=20)
    district: Optional[str] = Field(default=None, max_length=120)
    board: Optional[str] = Field(default=None, max_length=60)
    management: Optional[str] = Field(default=None, max_length=120)
    # The approved claim that owns this school. Exactly one owner per school.
    owner_claim_id: Optional[uuid.UUID] = Field(default=None, index=True)

    # Set once the admin has chosen which subjects each class is taught (see
    # models/school_subject.py). Null means the first-run setup is still due.
    subjects_configured_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=_utcnow)


class BranchCounter(SQLModel, table=True):
    """
    Atomic sequential counter per branch for student unique ID generation.
    branch_name is the PK and FK — one row per school branch.
    """

    __tablename__ = "branch_counters"

    branch_name: str = Field(
        primary_key=True,
        foreign_key="schools.branch_name",
        max_length=120,
    )
    last_counter: int = Field(default=0)
