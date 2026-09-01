"""
Learning-progress API contracts.

The sync request is deliberately forgiving: individual bad events are
reported back as `rejected` rather than failing the whole batch with a 422.
A batch that 422s would sit at the head of an offline device's queue
forever, blocking every good event behind it.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Sync (student → server) ────────────────────────────────────────────────────

class LearningEventIn(BaseModel):
    """One queued event as recorded on the learner's device."""

    # Device-generated idempotency key. Re-sending the same one is a no-op.
    client_event_id: str = Field(max_length=80)
    event_type: str = Field(max_length=30)
    occurred_at: datetime

    # Present for lesson-scoped events. When set, subject/class_number are
    # taken from the lesson itself — the client's values are ignored.
    lesson_id: Optional[uuid.UUID] = None
    subject: Optional[str] = Field(default=None, max_length=100)

    duration_ms: Optional[int] = None
    detail: Optional[dict] = None


class LearningEventSyncRequest(BaseModel):
    events: list[LearningEventIn] = Field(default_factory=list, max_length=200)


class RejectedEventOut(BaseModel):
    client_event_id: str
    reason: str


class LearningEventSyncResponse(BaseModel):
    """
    The client removes accepted + duplicate + rejected ids from its queue.
    Anything not named here stays queued and is retried.
    """

    accepted: list[str] = Field(default_factory=list)
    duplicates: list[str] = Field(default_factory=list)
    rejected: list[RejectedEventOut] = Field(default_factory=list)


# ── Progress (server → student) ────────────────────────────────────────────────

class ModuleProgressOut(BaseModel):
    module_key: str
    subject: str
    class_number: int
    title: str
    status: str  # not_started | in_progress | completed
    total_lessons: int
    completed_lessons: int
    # Sent so an offline client can union its own not-yet-synced completions
    # onto this without double counting.
    completed_lesson_ids: list[uuid.UUID]
    progress_percent: int
    current_lesson_id: Optional[uuid.UUID] = None
    current_lesson_title: Optional[str] = None
    started_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    # Best-effort — only counts activities the device could time.
    time_spent_seconds: Optional[int] = None


class RecentActivityOut(BaseModel):
    event_type: str
    subject: str
    module_key: str
    lesson_id: Optional[uuid.UUID] = None
    lesson_title: Optional[str] = None
    occurred_at: datetime


class StudentProgressOut(BaseModel):
    overall_percent: int
    total_modules: int
    modules_completed: int
    modules_in_progress: int
    modules_not_started: int
    points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_at: Optional[datetime] = None
    modules: list[ModuleProgressOut]
    recent_activity: list[RecentActivityOut]


# ── Progress (server → teacher) ────────────────────────────────────────────────

class StudentSubjectProgressOut(BaseModel):
    subject: str
    progress_percent: int
    status: str


class ClassStudentProgressOut(BaseModel):
    student_id: uuid.UUID
    unique_number: str
    full_name: str
    overall_percent: int
    modules_completed: int
    modules_in_progress: int
    points: int = 0
    current_streak: int = 0
    last_activity_at: Optional[datetime] = None
    subjects: list[StudentSubjectProgressOut]
    # Assessment & Test Metrics
    total_assessments_taken: int = 0
    average_test_score: float = 0.0
    assessments_passed: int = 0
    assessments_lagging: int = 0
    holistic_mastery_percent: int = 0


class ClassProgressOut(BaseModel):
    class_number: int
    section: str
    # Column order for the teacher's table.
    subjects: list[str]
    students: list[ClassStudentProgressOut]


# ── Consecutive Assessment Growth & Detailed Mastery (Server → Parent/Student/Teacher) ──

class AssessmentAttemptTrend(BaseModel):
    attempt_number: int
    score: float
    max_score: float
    percentage: float
    is_passed: bool
    status: str
    completed_at: datetime
    delta_from_previous: Optional[float] = None  # Percentage delta (+/-) from previous attempt


class AssessmentGrowthItem(BaseModel):
    assignment_id: uuid.UUID
    title: str
    subject: str
    assignment_type: str  # "ai_quiz" | "pdf_upload"
    chapter_numbers: list[int] = []
    total_attempts: int
    initial_score: float
    latest_score: float
    best_score: float
    score_delta: float  # Difference between latest and initial attempt (+/- %)
    trend: str          # "improving" | "declining" | "stable" | "mastered"
    status: str         # "mastered" | "progressing" | "needs_attention" | "lagging"
    is_lagging: bool
    latest_attempt_at: datetime
    attempts_history: list[AssessmentAttemptTrend]
    teacher_feedback: Optional[str] = None
    ai_feedback: Optional[str] = None


class SubjectAssessmentProgressOut(BaseModel):
    subject: str
    overall_mastery_percent: int
    assessment_count: int
    average_score: float
    growth_delta: float  # Cumulative percentage delta across consecutive tests
    trend: str           # "improving" | "declining" | "stable" | "mastered"
    status: str          # "mastered" | "progressing" | "needs_attention" | "lagging"
    lagging_topics_count: int
    assessments: list[AssessmentGrowthItem]


class DiagnosticGapSummary(BaseModel):
    subject: str
    topic_code: str
    topic_name: str
    originating_class: int
    student_current_class: int


class StudentDetailedProgressOut(BaseModel):
    student_id: uuid.UUID
    student_unique_number: str
    full_name: str
    class_number: Optional[int] = None
    section: Optional[str] = None
    school_name: Optional[str] = None
    branch_name: Optional[str] = None
    enrollment_type: str = "school"

    # Holistic Mastery & Consecutive Growth Indicators
    holistic_mastery_percent: int       # Blended score: 50% tests + 25% consecutive growth + 25% curriculum
    curriculum_completion_percent: int  # Overall lesson completion %
    average_test_score: float
    consecutive_growth_rate: float      # Overall average score movement (+/- %)
    consecutive_trend: str              # "improving" | "declining" | "stable" | "mastered"

    total_assessments_taken: int
    assessments_passed: int
    assessments_lagging: int

    points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_at: Optional[datetime] = None

    # Detailed subject progression with consecutive assessment performance
    subjects: list[SubjectAssessmentProgressOut]

    # Curriculum Module breakdowns
    modules: list[ModuleProgressOut]

    # Diagnostic topic gaps
    diagnostic_gaps: list[DiagnosticGapSummary] = []
    diagnostic_overall_score: Optional[float] = None

    # Recent activity logs
    recent_activity: list[RecentActivityOut] = []


# ── Gamification (streak / XP / chests) ───────────────────────────────────────

class StreakDayOut(BaseModel):
    date: str
    active: bool


class ChestStateOut(BaseModel):
    index: int
    progress: int
    required: int
    unlockable: bool
    next_badge: str
    xp_reward: int


class GamificationSummaryOut(BaseModel):
    """Everything the dashboard's streak / XP / chest widgets render."""

    total_xp: int
    current_streak: int
    longest_streak: int
    last_active_date: Optional[str] = None
    active_today: bool
    timezone: str
    week: list[StreakDayOut]
    lessons_completed: int
    chest: ChestStateOut
    badges: list[str] = Field(default_factory=list)


class ClaimChestResponse(BaseModel):
    """
    `claimed` is false for both "not yet earned" and "already claimed" — the
    `reason` distinguishes them, so a duplicate click is an ordinary response
    rather than an error.
    """

    claimed: bool
    reason: str
    lessons_completed: int
    lessons_required: int
    chest_index: Optional[int] = None
    xp_awarded: Optional[int] = None
    badge: Optional[str] = None
