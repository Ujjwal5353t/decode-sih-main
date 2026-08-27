import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChapterOut(BaseModel):
    """Chapter summary for teacher view."""
    chapter_number: int
    chapter_title: str
    subject: str
    class_number: int
    module_id: Optional[uuid.UUID] = None
    module_title: Optional[str] = None
    chunk_count: int
    sample_content: str

    model_config = {"from_attributes": True}


class ChunkOut(BaseModel):
    """Detailed chunk output."""
    id: uuid.UUID
    module_id: Optional[uuid.UUID]
    ncert_book_id: Optional[uuid.UUID]
    branch_name: str
    class_number: int
    subject: str
    chapter_number: int
    chapter_title: str
    chunk_index: int
    content: str
    token_count: int
    char_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ModuleIngestRequest(BaseModel):
    """Payload to trigger or override module ingestion."""
    text: Optional[str] = Field(
        default=None,
        description="Optional custom raw text content to chunk. If omitted, uses OCR or seeded text."
    )
    subject: Optional[str] = Field(
        default=None,
        description="Optional subject name override (e.g. 'EVS', 'Mathematics')."
    )


class RAGChunkSearchRequest(BaseModel):
    """Payload for RAG chunk retrieval during test/quiz generation."""
    class_number: int = Field(ge=1, le=5)
    subject: str = Field(description="Subject name (e.g. 'EVS', 'Mathematics')")
    query: str = Field(min_length=2, description="Search query or topic prompt")
    chapter_numbers: Optional[list[int]] = Field(
        default=None,
        description="Optional list of specific chapter numbers to restrict search to"
    )
    top_k: int = Field(default=5, ge=1, le=20, description="Max number of chunks to return")


class RAGSearchResult(BaseModel):
    """Individual chunk match returned from RAG search."""
    chunk_id: uuid.UUID
    chapter_number: int
    chapter_title: str
    subject: str
    content: str
    score: float
    module_id: Optional[uuid.UUID] = None
