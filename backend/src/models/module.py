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


class OcrStatus(str, Enum):
    PENDING = "pending"             # waiting to start
    PROCESSING = "processing"       # EasyOCR running
    DONE = "done"                   # OCR PDF uploaded to Cloudinary
    FAILED = "failed"               # OCR hit an error (can retry)
    NA = "na"                       # not applicable (PDF uploads / NCERT modules)


class Module(SQLModel, table=True):
    """
    A learning module/book uploaded by a school for a specific class.

    Two Cloudinary assets per image-upload module:
      file_url         → original scanned-images PDF (visual)
      ocr_pdf_url      → clean extracted-text PDF (for RAG / assessment generation)
    """

    __tablename__ = "modules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    branch_name: str = Field(foreign_key="schools.branch_name", index=True, max_length=120)
    class_number: int = Field(ge=1, le=5)
    subject: str = Field(default="General", max_length=100, index=True)
    title: str = Field(max_length=300)
    source_type: SourceType

    # Public URL (Cloudinary CDN or NCERT official URL) — visual/original PDF
    file_url: str

    # Cloudinary public_id — required for overwriting/deleting the visual asset
    cloudinary_public_id: Optional[str] = Field(default=None)

    # If NCERT source, record which NCERT book was used
    ncert_book_id: Optional[uuid.UUID] = Field(default=None, foreign_key="ncert_books.id")

    # ── OCR fields (image_upload modules only) ─────────────────────────────────
    # OCR runs in a background task after the upload returns 201.
    # Poll GET /school/classes/{n}/modules/{id}/ocr to track progress.

    ocr_status: str = Field(
        default=OcrStatus.PENDING,
        max_length=20,
        description="pending | processing | done | failed | na",
    )
    # Cloudinary URL of the clean extracted-text PDF — ready for RAG ingestion
    ocr_pdf_url: Optional[str] = Field(default=None)
    # Cloudinary public_id of the text PDF — needed to delete/replace it
    ocr_pdf_public_id: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
