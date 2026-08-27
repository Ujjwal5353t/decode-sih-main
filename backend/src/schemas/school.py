import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SchoolProfile(BaseModel):
    id: uuid.UUID
    school_name: str
    branch_name: str
    student_prefix: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    state: str
    created_at: datetime

    model_config = {"from_attributes": True}
