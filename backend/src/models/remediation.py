"""
Gap-driven remediation modules.

A "module" here is deliberately NOT a stored entity — it is computed on read
from an existing StudentTopicGap row (see src/models/quiz.py), the same
"durable, current-state view of a student's weak topics" the diagnostic quiz
already maintains. This mirrors this codebase's existing convention (see
learning_progress_service.py's docstring) of keeping progress/state derived
rather than duplicated: a module always reflects the gap's live status, and
resolving the gap (via a passed retention quiz here, or a later diagnostic
retake) automatically retires the module — there is no separate "module
completed" flag to fall out of sync.

The one thing that IS worth persisting is the record of a retention-quiz
attempt itself — for history, and so a repeat GET doesn't silently regrade.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class RemediationAttempt(SQLModel, table=True):
    """
    One retention-quiz attempt for one student's gap. `topic_id` is the
    *resolved teaching topic* — the prerequisite topic at the gap's own
    origin class (see remediation_service.resolve_teaching_topic), not the
    gap's top-level topic_id on StudentTopicGap. Scoring the quiz on exactly
    the topic that was taught, rather than the student's current-class topic,
    is what makes "did they retain the crux content just shown to them" a
    meaningful question.
    """

    __tablename__ = "remediation_attempts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    gap_id: uuid.UUID = Field(foreign_key="student_topic_gaps.id", index=True)
    topic_id: uuid.UUID = Field(foreign_key="topics.id", index=True)

    question_ids: list[str] = Field(sa_column=Column(JSONB))
    correct_count: int
    total_count: int
    score_percent: float
    passed: bool

    created_at: datetime = Field(default_factory=_utcnow, index=True)
