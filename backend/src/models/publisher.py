import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Publisher(SQLModel, table=True):
    """
    Publishers whose textbooks are used in schools (e.g. NCERT, Oxford, Cambridge, S. Chand).
    Dynamically grows when a school admin registers with a new publisher.
    """

    __tablename__ = "publishers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=150)
    created_at: datetime = Field(default_factory=_utcnow)


class PublisherSubject(SQLModel, table=True):
    """
    Subjects offered under a specific publisher.
    Dynamically grows when new subjects under a publisher are added during registration or setup.
    """

    __tablename__ = "publisher_subjects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    publisher_id: uuid.UUID = Field(foreign_key="publishers.id", index=True)
    subject_name: str = Field(index=True, max_length=150)
    created_at: datetime = Field(default_factory=_utcnow)
