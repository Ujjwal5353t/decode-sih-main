import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.models.module import SourceType


class ModuleOut(BaseModel):
    id: uuid.UUID
    branch_name: str
    class_number: int
    title: str
    source_type: SourceType
    file_url: str
    ncert_book_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

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
