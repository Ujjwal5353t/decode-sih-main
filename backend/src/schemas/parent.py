import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ParentProfile(BaseModel):
    id: uuid.UUID
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    preferred_language: str = "en"
    created_at: datetime

    model_config = {"from_attributes": True}


class ChildLinkOut(BaseModel):
    """Represents one child linked to a parent account."""
    id: uuid.UUID
    parent_id: uuid.UUID
    student_unique_number: str
    full_name: str = ""
    class_number: Optional[int] = None
    section: Optional[str] = None
    school_name: Optional[str] = None
    branch_name: Optional[str] = None
    enrollment_type: Optional[str] = "school"
    created_at: datetime

    model_config = {"from_attributes": True}
