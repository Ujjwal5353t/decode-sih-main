import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.models.module import SourceType


class ModuleOut(BaseModel):
    id: uuid.UUID
    branch_name: str
    class_number: int
    subject: str
    title: str
    source_type: SourceType
    file_url: str
    ncert_book_id: Optional[uuid.UUID]
    subject: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # OCR fields — only meaningful for image_upload modules
    ocr_status: str
    ocr_pdf_url: Optional[str] = None

    model_config = {"from_attributes": True}



class UpdateModuleTitleRequest(BaseModel):
    """For updating just the title of an existing module."""
    title: str


class NCERTModuleAddRequest(BaseModel):
    """Add a pre-loaded NCERT book as a module for the school's class."""
    ncert_book_id: uuid.UUID
    title: Optional[str] = None   # defaults to the book's own title if omitted


class NCERTBookOut(BaseModel):
    id: uuid.UUID
    class_number: int
    subject: str
    title: str
    description: Optional[str]
    file_url: Optional[str]

    model_config = {"from_attributes": True}


class NCERTBookCreateRequest(BaseModel):
    class_number: int
    subject: str
    title: str
    description: Optional[str] = None


class NCERTBookUpdateRequest(BaseModel):
    class_number: Optional[int] = None
    subject: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None

