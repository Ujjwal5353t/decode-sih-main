import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Parent(SQLModel, table=True):
    """
    Parent account model.
    Parents can register with Email OR Mobile Number.
    A single parent account can be linked to MULTIPLE children via
    the ParentChildLink join table — supporting the multi-child dashboard.
    """

    __tablename__ = "parents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    full_name: Optional[str] = Field(default=None, max_length=150)
    email: Optional[str] = Field(default=None, index=True, max_length=255)
    phone_number: Optional[str] = Field(default=None, index=True, max_length=20)
    password_hash: str
    preferred_language: str = Field(default="en", max_length=10)
    created_at: datetime = Field(default_factory=_utcnow)


class ParentChildLink(SQLModel, table=True):
    """
    Many-to-one join table: a parent can track multiple children,
    but each student unique_number can belong to only ONE parent email/phone
    (unique constraint on student_unique_number).
    """

    __tablename__ = "parent_child_links"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    parent_id: uuid.UUID = Field(foreign_key="parents.id", index=True)

    # Globally unique — one student can only be linked to one parent account
    student_unique_number: str = Field(
        foreign_key="students.unique_number",
        unique=True,
        index=True,
        max_length=20,
    )

    created_at: datetime = Field(default_factory=_utcnow)
