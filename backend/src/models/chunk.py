import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class DocumentChunk(SQLModel, table=True):
    """
    Chapter-wise text chunk stored for RAG and AI assessment/quiz generation.
    Scoping: branch_name, class_number, subject, chapter_number.
    """

    __tablename__ = "document_chunks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign key references
    module_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="modules.id", index=True
    )
    ncert_book_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="ncert_books.id", index=True
    )

    # Multi-tenant and curriculum metadata (indexed for high-performance lookup)
    branch_name: str = Field(foreign_key="schools.branch_name", index=True, max_length=120)
    class_number: int = Field(ge=1, le=5, index=True)
    subject: str = Field(max_length=100, index=True)

    # Chapter breakdown
    chapter_number: int = Field(default=1, index=True)
    chapter_title: str = Field(max_length=300)

    # Chunk details
    chunk_index: int = Field(description="Sequential index of the chunk within the chapter or document")
    content: str = Field(description="The actual text content of the chunk (~800 characters)")
    token_count: int = Field(default=0, description="Estimated token count (~150-200 words)")
    char_count: int = Field(default=0)
    start_char: int = Field(default=0, description="Start character offset in full chapter text")
    end_char: int = Field(default=0, description="End character offset in full chapter text")

    # Vector embedding and additional metadata
    metadata_json: Optional[str] = Field(default=None, description="JSON encoded additional metadata (page_numbers, headings, etc.)")
    embedding: Optional[str] = Field(default=None, description="JSON string representation of float vector embeddings for vector search")

    created_at: datetime = Field(default_factory=_utcnow)
