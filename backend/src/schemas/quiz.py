import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.models.quiz import AttemptStatus, TopicType


class QuestionOut(BaseModel):
    id: uuid.UUID
    subject: str
    class_number: int
    topic_name: str
    topic_type: TopicType
    question_text: str
    options: list[str]
    image_emoji: Optional[str] = None
    option_emojis: Optional[list[str]] = None
    image_asset_key: Optional[str] = None
    option_asset_keys: Optional[list[str]] = None


class StartQuizRequest(BaseModel):
    subjects: Optional[list[str]] = None


class StartQuizResponse(BaseModel):
    attempt_id: uuid.UUID
    question: Optional[QuestionOut]


class AnswerRequest(BaseModel):
    question_id: uuid.UUID
    selected_option_index: int


class AnswerResponse(BaseModel):
    finished: bool
    next_question: Optional[QuestionOut]
    was_correct: bool


class GapItemOut(BaseModel):
    subject: str
    topic_code: str
    topic_name: str
    originating_class: int
    student_current_class: int


class SubjectScoreOut(BaseModel):
    score: float
    topics_tested: int
    gaps_found: int
    average_classes_behind: float


class GapReportOut(BaseModel):
    attempt_id: uuid.UUID
    subjects_covered: list[str]
    gaps: list[GapItemOut]
    completed_at: Optional[datetime]
    overall_score: Optional[float]
    subject_scores: dict[str, Optional[SubjectScoreOut]]
    student_class: int
    ai_summary: Optional[str] = None
    ai_summary_status: str = "pending"
    total_questions: int = 0
    correct_count: int = 0
    incorrect_count: int = 0
    xp_awarded: int = 0


class CurrentGapOut(BaseModel):
    subject: str
    topic_code: str
    topic_name: str
    originating_class: int
    updated_at: datetime


class QuizAttemptSummaryOut(BaseModel):
    id: uuid.UUID
    status: AttemptStatus
    subjects: list[str]
    started_at: datetime
    completed_at: Optional[datetime]
    overall_score: Optional[float]

    model_config = {"from_attributes": True}


class QuizStatusOut(BaseModel):
    completed: bool
    attempt_id: Optional[uuid.UUID]
    in_progress_attempt_id: Optional[uuid.UUID]


class SubjectPriorityOut(BaseModel):
    """One subject's position in a student's learning order, now ranked by
    a Bayesian Knowledge Tracing mastery estimate (avg_mastery) with the
    old gap-count rule as a tiebreaker — see LEARNING_PATH.txt for the
    plain-language explanation."""
    subject: str
    priority_rank: int
    gap_count: int
    avg_classes_behind: float
    gap_topics: list[str]
    avg_mastery: float


class StudentQuizSummaryOut(BaseModel):
    """One row of the class teacher's roster view — a student plus their
    latest completed diagnostic, if any."""
    student_unique_number: str
    student_email: str
    completed: bool
    overall_score: Optional[float] = None
    gaps_found: int = 0
    ai_summary: Optional[str] = None
    ai_summary_status: str = "pending"
    completed_at: Optional[datetime] = None
