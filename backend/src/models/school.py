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
