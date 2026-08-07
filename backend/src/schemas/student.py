import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StudentProfile(BaseModel):
    id: uuid.UUID
    unique_number: str
    email: str
    state: str
    school_name: str
    branch_name: str
    class_number: Optional[int]
    section: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
