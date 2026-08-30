"""
Pydantic schemas for the Teacher domain.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ── Teacher Profile ────────────────────────────────────────────────────────────

class TeacherProfile(BaseModel):
    id: uuid.UUID
    name: str
    phone_number: str
    school_name: str
    branch_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Class Assignment ───────────────────────────────────────────────────────────

class TeacherClassOut(BaseModel):
    id: uuid.UUID
    teacher_id: Optional[uuid.UUID] = None
    class_number: int
    section: str
    subject: Optional[str] = ""   # Nullable in DB (legacy records pre-subject column)
    label: str          # e.g. "4A • Mathematics"
    assigned_at: datetime

    model_config = {"from_attributes": True}


# ── Assignment ─────────────────────────────────────────────────────────────────

class AssignmentOut(BaseModel):
    id: uuid.UUID
    teacher_id: uuid.UUID
    branch_name: str
    class_number: int
    section: str
    subject: Optional[str] = None
    title: str
    description: Optional[str]
    assignment_type: str        # "pdf_upload" | "ai_quiz"
    file_url: Optional[str]
    module_ids: Optional[str]   # JSON string of UUID list
    chapter_numbers: Optional[str] = None # JSON string of chapter number list
    deadline_at: Optional[datetime]
    is_locked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssignmentCreatePdfRequest(BaseModel):
    title: str
    subject: Optional[str] = None
    description: Optional[str] = None
    deadline_days: Optional[int] = None    # None = no deadline

    @field_validator("deadline_days")
    @classmethod
    def positive_days(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("deadline_days must be at least 1.")
        return v


class AssignmentCreateQuizRequest(BaseModel):
    title: str
    subject: Optional[str] = None
    description: Optional[str] = None
    module_ids: Optional[list[str]] = None      # list of Module UUID strings
    chapter_numbers: Optional[list[int]] = None # list of selected chapter numbers (e.g. [1, 2])
    deadline_days: Optional[int] = None


class QuizQuestionPreview(BaseModel):
    id: str = ""
    question_number: int = 1
    chapter_title: str = ""
    question_text: str
    options: list[str]
    correct_option_index: int = 0
    correct_answer: str = ""
    explanation: Optional[str] = None


class AssignmentQuizPreviewOut(BaseModel):
    assignment_id: uuid.UUID
    title: str
    subject: Optional[str] = None
    class_number: int
    section: str
    assignment_type: str
    chapters: list[str]
    total_questions: int
    questions: list[QuizQuestionPreview]

    model_config = {"from_attributes": True}


class AssignmentUpdateRequest(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    deadline_days: Optional[int] = None   # None = clear deadline; -1 = no change


# ── Submission / Progress ──────────────────────────────────────────────────────

class SubmissionOut(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_unique_number: str
    student_name: Optional[str] = None   # joined from students table
    student_email: Optional[str] = None
    score: Optional[float]
    max_score: Optional[float]
    percentage: Optional[float] = None
    is_passed: Optional[bool] = None
    total_attempts: int = 1
    status: str = "pending"
    response_pdf_url: Optional[str] = None
    attempted_at: datetime
    last_attempted_at: datetime

    model_config = {"from_attributes": True}


class QuizAnswerInput(BaseModel):
    question_id: str
    question_text: str
    selected_option_index: int
    correct_option_index: int
    chapter_title: Optional[str] = None
    explanation: Optional[str] = None


class SubmitQuizAttemptRequest(BaseModel):
    answers: list[QuizAnswerInput]


class AssignmentAttemptOut(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    student_id: uuid.UUID
    student_unique_number: str
    attempt_number: int
    score: Optional[float]
    max_score: float
    percentage: Optional[float]
    is_passed: Optional[bool]
    status: str
    answers_json: Optional[str] = None
    response_pdf_url: Optional[str] = None
    teacher_feedback: Optional[str] = None
    ai_feedback: Optional[str] = None
    ai_feedback_status: str = "pending"
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FeedbackOut(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    student_id: uuid.UUID
    teacher_id: uuid.UUID
    feedback_text: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubmitQuizAttemptResult(BaseModel):
    attempt: AssignmentAttemptOut
    score: float
    max_score: float
    percentage: float
    is_passed: bool
    status: str
    ai_feedback: Optional[str] = None
    message: str


class StudentTestResultSummaryOut(BaseModel):
    assignment: AssignmentOut
    submission: Optional[SubmissionOut] = None
    attempts: list[AssignmentAttemptOut] = []
    teacher_feedback: Optional[FeedbackOut] = None


class SetScoreRequest(BaseModel):
    score: float
    max_score: float = 100.0



class FeedbackRequest(BaseModel):
    feedback_text: str

    @field_validator("feedback_text")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Feedback text cannot be empty.")
        return v.strip()


# ── School admin teacher management ────────────────────────────────────────────

class TeacherListItem(BaseModel):
    """Used by school admin to list teachers in their branch."""
    id: uuid.UUID
    name: str
    phone_number: str
    is_active: bool
    assigned_classes: list[TeacherClassOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignClassRequest(BaseModel):
    class_number: int
    section: str
    subject: str

    @field_validator("class_number")
    @classmethod
    def valid_class(cls, v: int) -> int:
        if v not in range(1, 6):
            raise ValueError("class_number must be 1-5.")
        return v

    @field_validator("section")
    @classmethod
    def valid_section(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("A", "B", "C", "D"):
            raise ValueError("Section must be A, B, C, or D.")
        return v

    @field_validator("subject")
    @classmethod
    def valid_subject(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Subject is required. A teacher cannot be assigned without a subject.")
        return v


class DeassignClassRequest(BaseModel):
    class_number: Optional[int] = None
    section: Optional[str] = None
    subject: Optional[str] = None
    assignment_id: Optional[uuid.UUID] = None


class QuizQuestionPreview(BaseModel):
    id: str
    question_number: int
    chapter_title: str
    question_text: str
    options: list[str]
    correct_option_index: int
    correct_answer: str
    explanation: str


class AssignmentQuizPreviewOut(BaseModel):
    assignment_id: uuid.UUID
    title: str
    subject: Optional[str] = None
    class_number: int
    section: str
    assignment_type: str
    chapters: list[str]
    total_questions: int
    questions: list[QuizQuestionPreview]
