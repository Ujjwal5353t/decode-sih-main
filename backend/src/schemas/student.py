import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StudentProfile(BaseModel):
    id: uuid.UUID
    unique_number: str
    full_name: str = ""
    email: Optional[str] = None
    phone_number: Optional[str] = None
    state: str
    school_name: str
    branch_name: str
    enrollment_type: str = "school"
    class_number: Optional[int]
    section: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
