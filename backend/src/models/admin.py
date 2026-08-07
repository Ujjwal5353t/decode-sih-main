import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Admin(SQLModel, table=True):
    """
    No self-registration. Seeded at startup via src/db/seed.py.
    Default credentials: admin003@gmail.com / 123456789
    """

    __tablename__ = "admins"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str
    created_at: datetime = Field(default_factory=_utcnow)
