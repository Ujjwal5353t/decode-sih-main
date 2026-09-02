import uuid
from typing import Optional

from pydantic import BaseModel

from src.schemas.quiz import QuestionOut


class LearningModuleOut(BaseModel):
    """One gap-driven remediation module — the crux of the exact chapter a
    student's diagnostic quiz traced a gap back to, in one earlier class,
    plus whether a retention quiz is available for it."""

    gap_id: uuid.UUID
    subject: str
    topic_name: str
    topic_description: Optional[str] = None
    # The class the gap actually originates in (may be well below the
    # student's current class) — this is deliberately NOT the student's
    # current-class topic; it's what the diagnostic traced back to.
    origin_class: int
    student_current_class: int
    chapter_title: Optional[str] = None
    crux_points: list[str]
    quiz_available: bool
    quiz_question_count: int
    updated_at: str


class LearningModuleListOut(BaseModel):
    modules: list[LearningModuleOut]


class ModuleQuizStartOut(BaseModel):
    gap_id: uuid.UUID
    questions: list[QuestionOut]


class ModuleQuizAnswerIn(BaseModel):
    question_id: uuid.UUID
    selected_option_index: int


class ModuleQuizSubmitRequest(BaseModel):
    answers: list[ModuleQuizAnswerIn]


class ModuleQuizResultOut(BaseModel):
    gap_id: uuid.UUID
    correct_count: int
    total_count: int
    score_percent: float
    passed: bool
    gap_resolved: bool
    xp_awarded: int
