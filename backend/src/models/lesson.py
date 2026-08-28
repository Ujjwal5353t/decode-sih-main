import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Lesson(SQLModel, table=True):
    """
    One structured, animated learning lesson for a single NCERT chapter —
    pre-generated offline (see scripts/generate_lessons.py) from the chapter's
    seeded chunk content (src/db/ncert_content.py, branch_name="SELF"), the
    same grounding source scripts/generate_questions.py's RAG path uses.

    subject/class_number/chapter_number/chapter_title are denormalized from
    the source DocumentChunk rows so a lesson is directly traceable to its
    NCERT chapter without a join, mirroring how Question denormalizes
    subject/class_number from Topic (see src/models/quiz.py).
    """

    __tablename__ = "lessons"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    subject: str = Field(max_length=100, index=True)
    class_number: int = Field(ge=1, le=5, index=True)
    chapter_number: int
    chapter_title: str = Field(max_length=300)

    # Generation provenance, e.g. "gemini:<model>:lesson" — same pattern as
    # Question.generation_source.
    generation_source: str = Field(max_length=50)

    created_at: datetime = Field(default_factory=_utcnow)


class LessonSlide(SQLModel, table=True):
    """
    One slide within a Lesson, ordered by slide_index. slide_type is
    "concept" | "example" (illustrated explanation slides) or "check" (a
    single end-of-lesson MCQ, shaped like a diagnostic quiz question — see
    Question in src/models/quiz.py for the image/option-image field pattern
    this mirrors).
    """

    __tablename__ = "lesson_slides"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    lesson_id: uuid.UUID = Field(foreign_key="lessons.id", index=True)
    slide_index: int
    slide_type: str = Field(max_length=20)  # "concept" | "example" | "check"
    text: str

    # Picture for this slide — same "asset key preferred, emoji fallback,
    # never both" convention as Question.image_asset_key/image_emoji.
    image_asset_key: Optional[str] = Field(default=None, max_length=60)
    image_emoji: Optional[str] = Field(default=None, max_length=8)

    # Populated only for slide_type == "check" — one MCQ, same shape as
    # Question.options/correct_option_index/explanation.
    options: Optional[list[str]] = Field(
        default=None, sa_column=Column(JSONB(none_as_null=True))
    )
    correct_option_index: Optional[int] = Field(default=None)
    explanation: Optional[str] = Field(default=None)
