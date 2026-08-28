import uuid
from typing import Optional

from pydantic import BaseModel


class LessonListItemOut(BaseModel):
    id: uuid.UUID
    subject: str
    class_number: int
    chapter_number: int
    chapter_title: str
    slide_count: int

    model_config = {"from_attributes": True}


class LessonSlideOut(BaseModel):
    id: uuid.UUID
    slide_index: int
    slide_type: str
    text: str
    image_asset_key: Optional[str] = None
    image_emoji: Optional[str] = None
    options: Optional[list[str]] = None
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None

    model_config = {"from_attributes": True}


class LessonOut(BaseModel):
    id: uuid.UUID
    subject: str
    class_number: int
    chapter_number: int
    chapter_title: str
    slides: list[LessonSlideOut]

    model_config = {"from_attributes": True}
