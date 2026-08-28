"""
Learning-activity tracking — append-only event log.

Diagnostic results (QuizAttempt / StudentTopicGap in models/quiz.py) already
record what a student *knows*. Nothing recorded what a student actually *did*
inside a learning module. LearningEvent fills exactly that gap.

Design notes
------------
Append-only: rows are only ever INSERTed. Every "current state" question
(progress %, status, current lesson, completion time) is a projection over
this log computed on read — see services/learning_progress_service.py. No
row is ever overwritten, so a late-arriving offline event can never clobber
newer state, and future adaptive-learning work gets the full history for
free rather than a lossy summary.

Module identity: a "module" here is one subject's chapter set for one class
— e.g. Mathematics / Class 3 — whose lessons are the Lesson rows (chapters)
for that pair (see models/lesson.py). module_key is the denormalized
"<subject>|<class_number>" of that pair, mirroring how Question denormalizes
subject/class_number from Topic. It is always derived server-side (from the
lesson for lesson-scoped events, from the authenticated student's class
otherwise) — never taken from the client as given.

Idempotency: client_event_id is generated on the device when the event
happens and travels with it through the offline queue. UNIQUE
(student_id, client_event_id) makes a re-sent event a no-op, so retrying a
failed sync — from the same device or a second one — can never duplicate an
event.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()  # naive UTC — matches TIMESTAMP WITHOUT TIME ZONE


class LearningEventType(str, Enum):
    """
    CLIENT_EMITTED types are recorded by the learner's device as it happens.
    MODULE_STARTED / MODULE_COMPLETED are derived and appended by the server
    at ingest time (see learning_progress_service._append_derived_events) so
    they stay correct even when a device never syncs the moment it inferred
    them, or when the student switches devices mid-module.
    """

    MODULE_OPENED = "MODULE_OPENED"
    MODULE_STARTED = "MODULE_STARTED"
    LESSON_STARTED = "LESSON_STARTED"
    LESSON_COMPLETED = "LESSON_COMPLETED"
    ACTIVITY_COMPLETED = "ACTIVITY_COMPLETED"
    QUIZ_STARTED = "QUIZ_STARTED"
    QUIZ_COMPLETED = "QUIZ_COMPLETED"
    MODULE_COMPLETED = "MODULE_COMPLETED"


CLIENT_EMITTED_EVENT_TYPES = frozenset(
    {
        LearningEventType.MODULE_OPENED,
        LearningEventType.LESSON_STARTED,
        LearningEventType.LESSON_COMPLETED,
        LearningEventType.ACTIVITY_COMPLETED,
        LearningEventType.QUIZ_STARTED,
        LearningEventType.QUIZ_COMPLETED,
    }
)

SERVER_DERIVED_EVENT_TYPES = frozenset(
    {LearningEventType.MODULE_STARTED, LearningEventType.MODULE_COMPLETED}
)


class LearningEvent(SQLModel, table=True):
    """One thing a student did inside a learning module. Never updated."""

    __tablename__ = "learning_events"
    __table_args__ = (
        UniqueConstraint("student_id", "client_event_id", name="uq_learning_event_client_id"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Device-generated idempotency key — survives the offline queue and makes
    # a re-sync a no-op. Server-derived events use a deterministic
    # "srv:<TYPE>:<module_key>" value so they too can only be appended once.
    client_event_id: str = Field(max_length=80, index=True)

    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    event_type: str = Field(max_length=30, index=True)

    # "<subject>|<class_number>" — always computed server-side.
    module_key: str = Field(max_length=160, index=True)
    subject: str = Field(max_length=100)
    class_number: int = Field(ge=1, le=5)

    # Set for lesson-scoped events (LESSON_*, ACTIVITY_*, QUIZ_*); null for
    # module-scoped ones.
    lesson_id: Optional[uuid.UUID] = Field(default=None, foreign_key="lessons.id", index=True)

    # When it happened on the learner's device (may be well before it synced)
    # vs. when the server durably stored it. Progress is ordered by
    # occurred_at; received_at is kept for sync debugging.
    occurred_at: datetime = Field(default_factory=_utcnow, index=True)
    received_at: datetime = Field(default_factory=_utcnow)

    # Best-effort wall-clock time on the activity, when the device could
    # measure it (foreground time on a lesson). Implausible values are
    # dropped at ingest rather than stored — see the service.
    duration_ms: Optional[int] = Field(default=None)

    # Free-form context for this event (slide index, whether a quick-check
    # answer was correct, …). Deliberately unstructured: it is what future
    # adaptive-learning logic will read, and nothing here depends on it.
    detail: Optional[dict] = Field(default=None, sa_column=Column(JSON))
