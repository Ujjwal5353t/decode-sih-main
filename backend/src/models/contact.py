import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class ContactInquiry(SQLModel, table=True):
    """
    Stores contact form submissions from the landing page.
    """

    __tablename__ = "contact_inquiries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(index=True, max_length=255)
    message: str = Field(max_length=2000)
    created_at: datetime = Field(default_factory=_utcnow)
