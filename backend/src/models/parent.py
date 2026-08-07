import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Parent(SQLModel, table=True):
    """
    One account per email.
    A single parent account can be linked to MULTIPLE children via
    the ParentChildLink join table — supporting the multi-child dashboard.
    """

    __tablename__ = "parents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str
    created_at: datetime = Field(default_factory=_utcnow)


class ParentChildLink(SQLModel, table=True):
    """
    Many-to-one join table: a parent can track multiple children,
    but each student unique_number can belong to only ONE parent email
    (unique constraint on student_unique_number).

    This design satisfies:
      - Future: parent switches between child dashboards via child_id
      - Business rule: one student → one parent account only
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
