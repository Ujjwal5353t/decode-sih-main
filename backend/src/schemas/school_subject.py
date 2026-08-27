"""Schemas for the School Admin first-run class/subject setup."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ClassSubjectOptions(BaseModel):
    """One class as the setup screen renders it."""

    class_number: int
    class_label: str
    subject_count: int
    subjects: list[str]          # everything offered for this class
    selected: list[str]          # what the school has chosen so far


class SubjectSetupOut(BaseModel):
    completed: bool
    configured_at: Optional[datetime] = None
    classes: list[ClassSubjectOptions]


class ClassSubjectSelection(BaseModel):
    class_number: int = Field(ge=1, le=5)
    subjects: list[str]


class SubjectSetupRequest(BaseModel):
    classes: list[ClassSubjectSelection]
