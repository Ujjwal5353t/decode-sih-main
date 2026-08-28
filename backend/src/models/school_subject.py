"""
Which subjects a school actually teaches, per class.

The platform's class structure (1–5) and its subject vocabulary already exist —
classes come from the Module/NCERTBook constraint, subjects from the NCERT
master catalogue. What did not exist is the mapping between them for a given
school, which is what this table records.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel



def _utcnow() -> datetime:
    return datetime.utcnow()  # naive UTC — matches TIMESTAMP WITHOUT TIME ZONE


class SchoolClassSubject(SQLModel, table=True):
    """
    One (school, class, subject) row. Scoped to a single school — a school only
    ever reads or writes its own rows.
    """

    __tablename__ = "school_class_subjects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    school_id: uuid.UUID = Field(foreign_key="schools.id", index=True)
    class_number: int = Field(ge=1, le=5, index=True)
    subject: str = Field(max_length=100)
    publisher_name: Optional[str] = Field(default=None, max_length=150)

    created_at: datetime = Field(default_factory=_utcnow)

