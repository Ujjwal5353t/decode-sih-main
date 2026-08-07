import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class NCERTBook(SQLModel, table=True):
    """
    Pre-loaded NCERT textbooks for classes 1–5.
    Seeded at startup via src/db/seed.py.
    Schools can attach any of these to a module (source_type = 'ncert').
    """

    __tablename__ = "ncert_books"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    class_number: int = Field(ge=1, le=5, index=True)
    subject: str = Field(max_length=100, index=True)  # e.g. "Mathematics"
    title: str = Field(max_length=300)                  # e.g. "Math Magic - 1"
    description: Optional[str] = Field(default=None, max_length=500)

    # Official NCERT download URL or Cloudinary URL if we host the PDF
    file_url: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=_utcnow)
