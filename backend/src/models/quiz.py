import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class TopicType(str, Enum):
    CONCEPT = "concept"  # fact/skill-tree based (Mathematics, EVS)
    SKILL = "skill"      # recurring language skill (English, Hindi)


class AttemptStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class GapStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class Topic(SQLModel, table=True):
    """
    A single curriculum topic, tagged to one class/subject.

    prerequisite_codes are app-level pointers to other Topic.code values
    one class below (NOT a DB foreign key — avoids self-referential FK
    insert-ordering issues during idempotent seeding). The taxonomy file
    (src/db/curriculum_seed.py) is the human-reviewable source of truth;
    seeding validates every code resolves to an inserted row.
    """

    __tablename__ = "topics"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=60)
    subject: str = Field(max_length=100, index=True)
    class_number: int = Field(ge=1, le=5, index=True)
    topic_type: TopicType
    name: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=500)

    # Pointers to Topic.code one class below — usually 0 or 1 entry,
    # occasionally more than one true prerequisite (e.g. decimals needs
    # both place-value and fractions). v1's adaptive engine only walks
    # prerequisite_codes[0]; the full list exists so the taxonomy is
    # authored correctly ahead of a smarter engine.
    prerequisite_codes: list[str] = Field(default_factory=list, sa_column=Column(JSONB))

    created_at: datetime = Field(default_factory=_utcnow)


class Question(SQLModel, table=True):
    """
    A single MCQ, pre-generated offline (see scripts/generate_questions.py)
    and tagged to its source topic. subject/class_number are denormalized
    from the topic so every question is directly traceable without a join.
    """

    __tablename__ = "questions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    topic_id: uuid.UUID = Field(foreign_key="topics.id", index=True)
    subject: str = Field(max_length=100, index=True)
    class_number: int = Field(ge=1, le=5, index=True)

    # Set only for questions grounded in a specific school's uploaded module
    # content (see scripts/generate_questions.py --branch). NULL means this
    # question belongs to the generic NCERT-aligned bank shared by every
    # school. branch_name is denormalized from Module.branch_name (same
    # pattern as subject/class_number being denormalized from Topic) so the
    # adaptive engine can filter by branch without a join.
    module_id: Optional[uuid.UUID] = Field(default=None, foreign_key="modules.id", index=True)
    branch_name: Optional[str] = Field(default=None, max_length=120, index=True)

    question_text: str
    options: list[str] = Field(sa_column=Column(JSONB))
    correct_option_index: int
    difficulty: str = Field(default="standard", max_length=20)
    explanation: Optional[str] = Field(default=None)

    # One emoji per entry in `options`, same order, when the option is a
    # concrete thing better shown than read (an animal, an object, a shape,
    # a count) — young children answer faster by picking a picture than by
    # reading four lines of text. Null (not a same-length list of nulls)
    # when the options are plain text/numbers with nothing sensible to
    # depict. See scripts/generate_questions.py for the generation-time rule.
    # none_as_null=True: without it, JSONB stores a Python None as the JSON
    # literal 'null' rather than SQL NULL, which silently breaks any
    # "IS NULL"/"IS NOT NULL" query on this column (ORM reads still decode
    # it back to Python None either way, since JSON null -> None on load).
    option_emojis: Optional[list[str]] = Field(
        default=None, sa_column=Column(JSONB(none_as_null=True))
    )

    # A single emoji standing in for a real image asset — the pre-2026-08
    # fallback for a question whose stem asks the student to identify
    # something visually, back when this app had no image-hosting pipeline.
    # Still populated for concepts outside image_asset_key's curated
    # vocabulary. See scripts/generate_questions.py for the generation-time
    # prompt rule and validation that enforces "asset key preferred, emoji
    # as fallback, never both."
    image_emoji: Optional[str] = Field(default=None, max_length=8)

    # Key into the curated illustration library seeded offline (see
    # src/ai/quiz_asset_vocabulary.py for the fixed vocabulary and
    # frontend/components/quiz/illustrations/registry.tsx for the matching
    # hand-illustrated SVG recipes — the two MUST stay in sync key-for-key).
    # Preferred over image_emoji whenever the question's picture is one of
    # these curated illustrations; null when the concept isn't in the
    # vocabulary and image_emoji is used instead.
    image_asset_key: Optional[str] = Field(default=None, max_length=60)

    # Same idea as option_emojis but pointing at the illustration library —
    # one asset key per entry in `options`, same order. Mutually exclusive
    # with option_emojis per question (never both populated).
    option_asset_keys: Optional[list[str]] = Field(
        default=None, sa_column=Column(JSONB(none_as_null=True))
    )

    # Generation provenance
    generation_source: str = Field(max_length=50)
    generation_batch: str = Field(max_length=50)
    reviewed: bool = Field(default=False)
    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=_utcnow)


class QuizAttempt(SQLModel, table=True):
    """
    One diagnostic quiz run for a student. engine_state carries the live
    adaptive-engine state (per-subject lane progress, gaps found so far)
    so the start/answer/result API can stay stateless between requests.
    """

    __tablename__ = "quiz_attempts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    status: AttemptStatus = Field(default=AttemptStatus.IN_PROGRESS)
    class_number_at_attempt: int = Field(ge=1, le=5)
    subjects: list[str] = Field(sa_column=Column(JSONB))
    engine_state: dict = Field(default_factory=dict, sa_column=Column(JSONB))

    # Set at finalization by quiz_service._finalize_attempt. Per-subject:
    # {"score": float 0-100, "topics_tested": int, "gaps_found": int,
    #  "average_classes_behind": float}. overall_score is the average of
    # subject scores. Distance-weighted: a topic with a gap earns partial
    # credit proportional to how close the traced-back class is to the
    # student's actual class, rather than a flat pass/fail.
    overall_score: Optional[float] = Field(default=None)
    subject_scores: dict = Field(default_factory=dict, sa_column=Column(JSONB))

    # Parent/teacher/student-facing AI summary, generated in the background
    # after finalization (see src/ai/quiz_summary_service.py) so the student
    # is never blocked waiting for it. "pending" until the background task
    # completes; "ready" once ai_summary is populated; "failed" if generation
    # errored (e.g. no GEMINI_API_KEY configured on this deployment) — result
    # views should treat "failed" the same as "not available" rather than
    # retrying forever.
    ai_summary: Optional[str] = Field(default=None)
    ai_summary_status: str = Field(default="pending", max_length=20)

    started_at: datetime = Field(default_factory=_utcnow)
    completed_at: Optional[datetime] = Field(default=None)


class QuizAnswer(SQLModel, table=True):
    """
    Audit trail of every question answered within an attempt. class_number
    here is the *probed* class (may be below the student's real class once
    the adaptive engine has stepped down a prerequisite chain).
    """

    __tablename__ = "quiz_answers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    attempt_id: uuid.UUID = Field(foreign_key="quiz_attempts.id", index=True)
    question_id: uuid.UUID = Field(foreign_key="questions.id")
    topic_id: uuid.UUID = Field(foreign_key="topics.id", index=True)
    subject: str = Field(max_length=100)
    class_number: int = Field(ge=1, le=5)

    selected_option_index: int
    is_correct: bool
    answered_at: datetime = Field(default_factory=_utcnow)


class StudentTopicGap(SQLModel, table=True):
    """
    Durable, current-state view of a student's weak topics — upserted
    whenever a QuizAttempt completes. This (not any single attempt's
    result) is the read surface future module-customization work should
    query: "what is this student weak in right now."
    """

    __tablename__ = "student_topic_gaps"
    __table_args__ = (UniqueConstraint("student_id", "topic_id", name="uq_student_topic_gap"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    topic_id: uuid.UUID = Field(foreign_key="topics.id", index=True)
    subject: str = Field(max_length=100)
    status: GapStatus = Field(default=GapStatus.OPEN)
    first_identified_class: int = Field(ge=1, le=5)
    last_attempt_id: uuid.UUID = Field(foreign_key="quiz_attempts.id")
    updated_at: datetime = Field(default_factory=_utcnow)
