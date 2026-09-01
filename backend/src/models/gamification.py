"""
Gamification — streaks, XP and reward chests.

Design notes
------------
No new source of truth for *learning* is introduced here. Lesson completions
already live in learning_events (models/learning.py) and assessment results in
quiz_attempts (models/quiz.py); this module only records the derived reward
state on top of them. Counting lessons, for example, is still a query over
LearningEvent — GamificationProfile never stores its own lesson tally that
could drift from reality.

Everything that grants something is idempotent by construction:

  XpTransaction.idempotency_key   UNIQUE per student, so the same lesson or
                                  quiz attempt can never pay out twice no
                                  matter how often the client retries.
  StreakDay(student, local_date)  UNIQUE, so a day counts once however many
                                  lessons are finished in it.
  ChestClaim(student, chest_index) UNIQUE, so a chest cannot be claimed twice.

Those three constraints are the real enforcement. The service layer checks
first for a clean response, but the database is what makes it safe under
concurrent or duplicated requests.
"""

import uuid
from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel, UniqueConstraint


def _utcnow() -> datetime:
    return datetime.utcnow()  # naive UTC — matches the rest of the schema


class XpReason(str, Enum):
    """Why XP was granted. Stored as a string so the ledger stays readable."""

    LESSON_COMPLETED = "LESSON_COMPLETED"
    QUIZ_COMPLETED = "QUIZ_COMPLETED"
    CHEST_CLAIMED = "CHEST_CLAIMED"


class GamificationProfile(SQLModel, table=True):
    """
    One row per student holding only *derived reward state* — never learning
    data. Totals here are maintained by the service and are always
    reconstructible from XpTransaction / StreakDay if they ever need repair.
    """

    __tablename__ = "gamification_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", unique=True, index=True)

    # Running total, kept as the sum of this student's XpTransaction rows.
    total_xp: int = Field(default=0)

    current_streak: int = Field(default=0)
    longest_streak: int = Field(default=0)

    # The student's local calendar date of their last qualifying activity.
    # A date, not a timestamp: the streak question is "which day was it", and
    # storing the answer avoids re-deriving it from a timestamp under a
    # timezone that may since have changed.
    last_active_date: Optional[date] = Field(default=None)

    # IANA zone used to decide which calendar day activity falls in. Persisted
    # rather than taken per-request so a student cannot harvest extra streak
    # days by hopping timezones between calls.
    timezone: str = Field(default="UTC", max_length=64)

    # How many chests have been claimed. Chest N unlocks at
    # (N + 1) * LESSONS_PER_CHEST lifetime lesson completions.
    chests_claimed: int = Field(default=0)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class XpTransaction(SQLModel, table=True):
    """
    Append-only XP ledger. total_xp is the sum of these rows, so every point a
    student holds can be traced to the thing that earned it.
    """

    __tablename__ = "xp_transactions"
    __table_args__ = (
        UniqueConstraint("student_id", "idempotency_key", name="uq_xp_student_key"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)

    amount: int = Field(description="Points granted. Always positive today.")
    reason: str = Field(max_length=30, index=True)

    # What earned it — e.g. ("quiz_attempt", <attempt id>) or ("lesson", <lesson id>).
    source_type: str = Field(max_length=30)
    source_id: Optional[uuid.UUID] = Field(default=None, index=True)

    # The duplicate guard. Derived from the source, e.g. "quiz_attempt:<uuid>",
    # so replaying the same completion is a no-op rather than a second payout.
    idempotency_key: str = Field(max_length=120)

    # Free-form context for auditing (score, difficulty, chest index…).
    detail: Optional[str] = Field(default=None, max_length=300)

    created_at: datetime = Field(default_factory=_utcnow, index=True)


class StreakDay(SQLModel, table=True):
    """
    One row per student per local calendar day on which they did something
    that counts. The unique constraint is what stops a day being counted more
    than once, and the rows are what let the dashboard draw a real week strip
    instead of assuming which days were active.
    """

    __tablename__ = "streak_days"
    __table_args__ = (
        UniqueConstraint("student_id", "local_date", name="uq_streak_student_day"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)

    local_date: date = Field(index=True)

    # What made the day qualify — kept for auditing why a streak advanced.
    first_activity: str = Field(max_length=30)
    created_at: datetime = Field(default_factory=_utcnow)


class ChestClaim(SQLModel, table=True):
    """
    A claimed reward chest. chest_index is 0-based, so index 0 is the chest
    earned at the first LESSONS_PER_CHEST lessons.
    """

    __tablename__ = "chest_claims"
    __table_args__ = (
        UniqueConstraint("student_id", "chest_index", name="uq_chest_student_index"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)

    chest_index: int = Field(ge=0)

    # Lifetime completed-lesson count at the moment of claiming — the evidence
    # the chest was actually earned.
    lessons_at_claim: int = Field(ge=0)

    xp_awarded: int = Field(default=0)
    badge: Optional[str] = Field(default=None, max_length=60)

    claimed_at: datetime = Field(default_factory=_utcnow)
