import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    message: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Name cannot be empty.")
        if len(cleaned) > 100:
            raise ValueError("Name must be 100 characters or fewer.")
        return cleaned

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Message cannot be empty.")
        if len(cleaned) > 2000:
            raise ValueError("Message must be 2000 characters or fewer.")
        return cleaned


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    message: str
    created_at: datetime
    status_message: str = "Contact inquiry submitted successfully."
