"""
Gamification: XP and reward chests.

The point of this file is the abuse cases, not the happy path. Each feature
has a rule that must hold no matter how a client behaves:

  · XP is paid once per lesson / per attempt, however often it is replayed
  · a chest is claimed once, however many times the button is pressed

Runs on in-memory SQLite. Only the tables this feature touches are created —
the quiz tables use Postgres-only JSONB columns that SQLite cannot compile.
"""

import asyncio
import sys
import uuid
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select

from src.models.gamification import (
    ChestClaim,
    GamificationProfile,
    XpTransaction,
)
from src.models.learning import LearningEvent, LearningEventType
from src.models.lesson import Lesson
from src.models.school import School
from src.models.student import Student
from src.services import gamification_service as gs

BRANCH = "GAMI-BRANCH"
CLASS_NUMBER = 3


async def _fresh_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            SQLModel.metadata.create_all,
            tables=[
                School.__table__,
                Student.__table__,
                Lesson.__table__,
                LearningEvent.__table__,
                GamificationProfile.__table__,
                XpTransaction.__table__,
                ChestClaim.__table__,
            ],
        )
    return engine, async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _seed(session: AsyncSession, lesson_count: int = 12):
    session.add(
        School(
            school_name="Gami School",
            branch_name=BRANCH,
            student_prefix="GAM",
            password_hash="x",
            state="Assam",
        )
    )
    student = Student(
        unique_number="GAM0001",
        full_name="Riya",
        password_hash="x",
        state="Assam",
        school_name="Gami School",
        branch_name=BRANCH,
        class_number=CLASS_NUMBER,
        section="A",
    )
    session.add(student)
    lessons = [
        Lesson(
            subject="Mathematics",
            class_number=CLASS_NUMBER,
            chapter_number=i + 1,
            chapter_title=f"Chapter {i + 1}",
            generation_source="test",
        )
        for i in range(lesson_count)
    ]
    for lesson in lessons:
        session.add(lesson)
    await session.commit()
    return student, lessons


async def _complete(session: AsyncSession, student, lesson, when: datetime):
    """Record a real LESSON_COMPLETED event, the way ingest would."""
    session.add(
        LearningEvent(
            client_event_id=str(uuid.uuid4()),
            student_id=student.id,
            event_type=LearningEventType.LESSON_COMPLETED.value,
            module_key="Mathematics|3",
            subject="Mathematics",
            class_number=CLASS_NUMBER,
            lesson_id=lesson.id,
            occurred_at=when,
        )
    )
    await session.flush()


# ── XP ────────────────────────────────────────────────────────────────────────

async def test_xp_is_never_paid_twice_for_the_same_source():
    engine, factory = await _fresh_db()
    async with factory() as session:
        student, lessons = await _seed(session)

        # Same three lessons delivered twice, as an offline queue would.
        ids = [lessons[0].id, lessons[1].id, lessons[2].id]
        await gs.on_lessons_completed(session, student_id=student.id, lesson_ids=ids)
        await gs.on_lessons_completed(session, student_id=student.id, lesson_ids=ids)

        profile = await gs.get_or_create_profile(student.id, session)
        assert profile.total_xp == 3 * gs.XP_PER_LESSON

        ledger = (
            await session.execute(
                select(XpTransaction).where(XpTransaction.student_id == student.id)
            )
        ).scalars().all()
        assert len(ledger) == 3, "replay must not append duplicate transactions"
        assert profile.total_xp == sum(t.amount for t in ledger), "total must equal the ledger"

        # Quiz XP scales with the score and is also once-per-attempt.
        attempt = uuid.uuid4()
        first = await gs.on_quiz_completed(
            session, student_id=student.id, attempt_id=attempt, overall_score=80.0
        )
        assert first == gs.XP_QUIZ_BASE + round(gs.XP_QUIZ_SCORE_BONUS * 0.8)
        repeat = await gs.on_quiz_completed(
            session, student_id=student.id, attempt_id=attempt, overall_score=80.0
        )
        assert repeat == 0, "re-finalising the same attempt must pay nothing"

        # A weaker attempt earns less than a stronger one.
        weak = await gs.on_quiz_completed(
            session, student_id=student.id, attempt_id=uuid.uuid4(), overall_score=10.0
        )
        assert gs.XP_QUIZ_BASE <= weak < first
    await engine.dispose()
    print("PASS xp: once per source, total matches ledger, scales with score")


# ── Chest ─────────────────────────────────────────────────────────────────────

async def test_chest_unlocks_on_real_lessons_and_claims_once():
    engine, factory = await _fresh_db()
    async with factory() as session:
        student, lessons = await _seed(session)
        now = datetime(2026, 3, 1, 6, 0)

        # Four completions: still locked.
        for lesson in lessons[:4]:
            await _complete(session, student, lesson, now)
        summary = await gs.get_summary(student.id, session)
        assert summary["lessons_completed"] == 4
        assert summary["chest"]["progress"] == 4
        assert summary["chest"]["unlockable"] is False

        locked = await gs.claim_chest(session, student_id=student.id)
        assert locked["claimed"] is False and locked["reason"] == "locked"

        # Repeating an already-completed lesson must not advance the chest.
        await _complete(session, student, lessons[0], now)
        assert (await gs.get_summary(student.id, session))["lessons_completed"] == 4

        # The genuine fifth unlocks it.
        await _complete(session, student, lessons[4], now)
        summary = await gs.get_summary(student.id, session)
        assert summary["lessons_completed"] == 5
        assert summary["chest"]["unlockable"] is True

        xp_before = (await gs.get_or_create_profile(student.id, session)).total_xp
        claimed = await gs.claim_chest(session, student_id=student.id)
        assert claimed["claimed"] is True
        assert claimed["xp_awarded"] == gs.XP_PER_CHEST
        assert claimed["badge"] == gs.CHEST_BADGES[0]

        # Second press pays nothing. The cycle has already advanced, so the
        # honest answer is "locked" — the next chest needs 10 lifetime lessons.
        again = await gs.claim_chest(session, student_id=student.id)
        assert again["claimed"] is False and again["reason"] == "locked"

        # The "already_claimed" path is the concurrency guard: two requests
        # both pass the eligibility check and one loses the UNIQUE insert.
        # Simulated by rewinding the counter, which is exactly the state a
        # lost race leaves behind.
        profile = await gs.get_or_create_profile(student.id, session)
        profile.chests_claimed = 0
        session.add(profile)
        await session.flush()
        raced = await gs.claim_chest(session, student_id=student.id)
        assert raced["claimed"] is False, "the DB constraint must stop the second payout"
        assert raced["reason"] == "already_claimed"
        profile.chests_claimed = 1
        session.add(profile)
        await session.flush()

        profile = await gs.get_or_create_profile(student.id, session)
        assert profile.total_xp == xp_before + gs.XP_PER_CHEST
        claims = (
            await session.execute(
                select(ChestClaim).where(ChestClaim.student_id == student.id)
            )
        ).scalars().all()
        assert len(claims) == 1

        # The cycle advances: the next chest needs 10 lifetime lessons.
        summary = await gs.get_summary(student.id, session)
        assert summary["chest"]["index"] == 1
        assert summary["chest"]["progress"] == 0
        assert summary["chest"]["unlockable"] is False
        assert summary["badges"] == [gs.CHEST_BADGES[0]]

        for lesson in lessons[5:10]:
            await _complete(session, student, lesson, now)
        second = await gs.claim_chest(session, student_id=student.id)
        assert second["claimed"] is True and second["chest_index"] == 1
    await engine.dispose()
    print("PASS chest: real lessons only, claimed once, cycle advances")


if __name__ == "__main__":
    asyncio.run(test_xp_is_never_paid_twice_for_the_same_source())
    asyncio.run(test_chest_unlocks_on_real_lessons_and_claims_once())
    print("\nAll gamification tests passed.")
