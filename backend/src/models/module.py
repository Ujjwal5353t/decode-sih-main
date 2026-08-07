import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class SourceType(str, Enum):
    PDF_UPLOAD = "pdf_upload"       # school uploaded a PDF directly
    IMAGE_UPLOAD = "image_upload"   # school uploaded images → converted to PDF
    NCERT = "ncert"                 # school selected a pre-loaded NCERT book


class Module(SQLModel, table=True):
    """
    A learning module/book uploaded by a school for a specific class.
    Files live in Cloudinary; cloudinary_public_id is stored for deletion.
    """

    __tablename__ = "modules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    branch_name: str = Field(foreign_key="schools.branch_name", index=True, max_length=120)
    class_number: int = Field(ge=1, le=5)
    title: str = Field(max_length=300)
    source_type: SourceType

    # Public URL (Cloudinary CDN or NCERT official URL)
    file_url: str

    # Cloudinary public_id — required for overwriting/deleting the asset
    cloudinary_public_id: Optional[str] = Field(default=None)

    # If NCERT source, record which NCERT book was used
    ncert_book_id: Optional[uuid.UUID] = Field(default=None, foreign_key="ncert_books.id")

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
