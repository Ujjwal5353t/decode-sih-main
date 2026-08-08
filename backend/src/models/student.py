import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Student(SQLModel, table=True):
    """
    One account per email.
    unique_number is auto-generated: <school_prefix><4-digit-counter>
    e.g.  LKD0001, LKD0002 …

    class_number and section are set AFTER registration via a separate
    setup step (so the student can choose class/section on first login).
    """

    __tablename__ = "students"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Auto-generated during registration — e.g. "LKD0001"
    unique_number: str = Field(unique=True, index=True, max_length=20)

    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str
    state: str = Field(max_length=100)
    school_name: str = Field(max_length=200)

    # FK to School.branch_name (not UUID) so queries are human-readable
    branch_name: str = Field(foreign_key="schools.branch_name", index=True, max_length=120)

    # Enrollment mode: "self" (NCERT self-educated) or "school" (school branch enrolled)
    enrollment_type: str = Field(default="school", max_length=20)

    # Set in the post-registration setup step (1–5)
    class_number: Optional[int] = Field(default=None)
    # Set in the post-registration setup step (A/B/C/D or SELF for self-enrolled)
    section: Optional[str] = Field(default=None, max_length=10)

    created_at: datetime = Field(default_factory=_utcnow)
