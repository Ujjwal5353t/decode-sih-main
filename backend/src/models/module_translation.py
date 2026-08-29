import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class TranslationStatus(str, enum.Enum):
    MACHINE_TRANSLATED = "machine_translated"
    HUMAN_REVIEWED = "human_reviewed"
    AI_REGENERATED = "ai_regenerated"
    OUTDATED = "outdated"


class ModuleTranslation(SQLModel, table=True):
    """
    Module translation cache model for VidyaSetu regional language pipeline.
    Stores cached localized module and curriculum text with status tracking.
    """

    __tablename__ = "module_translations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    module_id: uuid.UUID = Field(index=True, foreign_key="modules.id")
    language_code: str = Field(index=True, max_length=10)
    title: str = Field(max_length=500)
    content: str  # Markdown / structured text
    summary: Optional[str] = Field(default=None)
    translation_provider: str = Field(default="gemini_bhashini", max_length=50)
    translation_version: int = Field(default=1)
    status: TranslationStatus = Field(default=TranslationStatus.MACHINE_TRANSLATED)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
