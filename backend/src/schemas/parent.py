import uuid
from datetime import datetime

from pydantic import BaseModel


class ParentProfile(BaseModel):
    id: uuid.UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChildLinkOut(BaseModel):
    """Represents one child linked to a parent account."""
    id: uuid.UUID
    parent_id: uuid.UUID
    student_unique_number: str
    created_at: datetime

    model_config = {"from_attributes": True}
