import uuid
from datetime import datetime

from pydantic import BaseModel


class SchoolProfile(BaseModel):
    id: uuid.UUID
    school_name: str
    branch_name: str
    student_prefix: str
    email: str
    state: str
    created_at: datetime

    model_config = {"from_attributes": True}
