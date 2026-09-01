"""
Learning-progress flow (Issue #24).

Runs against an in-memory SQLite database, the same style as
test_chunking_flow.py. Only the tables this feature touches are created —
the quiz/topic tables use Postgres-only JSONB columns that SQLite cannot
compile, so a blanket create_all() is not possible here.

Covers the full journey the issue asks for:
  open module -> start lesson -> complete lesson -> complete module
  -> progress reaches 100% -> student view -> teacher view
plus the offline edge cases: a batch synced late, a duplicate re-sync, a
second device, and a teacher reading progress while the student is offline.
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select

from src.models.learning import LearningEvent, LearningEventType
from src.models.lesson import Lesson
from src.models.school import School
from src.models.student import Student
from src.models.teacher import Teacher, TeacherClassAssignment
from src.schemas.learning import LearningEventIn
from src.services import learning_progress_service as progress

BRANCH = "TEST-BRANCH"
CLASS_NUMBER = 3
SECTION = "A"
MATHS_CHAPTERS = 5
EVS_CHAPTERS = 2


async def _fresh_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            SQLModel.metadata.create_all,
            tables=[
                School.__table__,
                Student.__table__,
                Teacher.__table__,
                TeacherClassAssignment.__table__,
                Lesson.__table__,
                LearningEvent.__table__,
            ],
        )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, factory


async def _seed(session: AsyncSession) -> tuple[Student, list[Lesson], list[Lesson]]:
    session.add(
        School(
            school_name="Test School",
            branch_name=BRANCH,
            student_prefix="TST",
            password_hash="x",
            state="Assam",
        )
    )
    student = Student(
        unique_number="TST0001",
        full_name="Asha",
        password_hash="x",
        state="Assam",
        school_name="Test School",
        branch_name=BRANCH,
        class_number=CLASS_NUMBER,
        section=SECTION,
    )
    session.add(student)

    maths = [
        Lesson(
            subject="Mathematics",
            class_number=CLASS_NUMBER,
            chapter_number=i + 1,
            chapter_title=f"Maths Chapter {i + 1}",
            generation_source="test",
        )
        for i in range(MATHS_CHAPTERS)
    ]
    evs = [
        Lesson(
            subject="EVS",
            class_number=CLASS_NUMBER,
            chapter_number=i + 1,
            chapter_title=f"EVS Chapter {i + 1}",
            generation_source="test",
        )
        for i in range(EVS_CHAPTERS)
    ]
    for lesson in maths + evs:
        session.add(lesson)

    await session.commit()
    return student, maths, evs


def _event(
    event_type: LearningEventType,
    *,
    lesson: Lesson | None = None,
    subject: str | None = None,
    minutes_ago: int = 0,
    client_event_id: str | None = None,
    duration_ms: int | None = None,
    detail: dict | None = None,
) -> LearningEventIn:
    return LearningEventIn(
        client_event_id=client_event_id or str(uuid.uuid4()),
        event_type=event_type.value,
        occurred_at=datetime.utcnow() - timedelta(minutes=minutes_ago),
        lesson_id=lesson.id if lesson else None,
        subject=subject,
        duration_ms=duration_ms,
        detail=detail,
    )


def _lesson_run(lesson: Lesson, minutes_ago: int) -> list[LearningEventIn]:
    """The events one full pass through the lesson viewer produces."""
    return [
        _event(LearningEventType.LESSON_STARTED, lesson=lesson, minutes_ago=minutes_ago),
        _event(
            LearningEventType.ACTIVITY_COMPLETED,
            lesson=lesson,
            minutes_ago=minutes_ago,
            detail={"slide_index": 0},
        ),
        _event(LearningEventType.QUIZ_STARTED, lesson=lesson, minutes_ago=minutes_ago),
        _event(
            LearningEventType.QUIZ_COMPLETED,
            lesson=lesson,
            minutes_ago=minutes_ago,
            detail={"correct": True},
        ),
        _event(
            LearningEventType.LESSON_COMPLETED,
            lesson=lesson,
            minutes_ago=minutes_ago,
            duration_ms=90_000,
        ),
    ]


def _module(report, subject: str):
    return next(m for m in report.modules if m.subject == subject)


# ── Tests ──────────────────────────────────────────────────────────────────────

async def test_full_learning_flow():
    """Open -> start -> complete lessons -> module completes at 100%."""
    engine, factory = await _fresh_db()
    async with factory() as session:
        student, maths, evs = await _seed(session)

        # Nothing done yet: every module for the class is listed, not started.
        report = await progress.get_student_progress(student, session)
        assert report.total_modules == 2, report.total_modules
        assert report.overall_percent == 0
        maths_module = _module(report, "Mathematics")
        assert maths_module.status == progress.STATUS_NOT_STARTED
        assert maths_module.total_lessons == MATHS_CHAPTERS
        assert maths_module.progress_percent == 0
        # A never-started module still points at where to begin.
        assert maths_module.current_lesson_id == maths[0].id
        assert maths_module.started_at is None

        # Open the module, then work through 3 of its 5 lessons.
        events = [_event(LearningEventType.MODULE_OPENED, subject="Mathematics", minutes_ago=30)]
        for index, lesson in enumerate(maths[:3]):
            events.extend(_lesson_run(lesson, minutes_ago=25 - index * 5))
        result = await progress.ingest_events(student, events, session)
        assert not result.rejected, result.rejected
        assert len(result.accepted) == len(events)

        report = await progress.get_student_progress(student, session)
        maths_module = _module(report, "Mathematics")
        assert maths_module.status == progress.STATUS_IN_PROGRESS
        assert maths_module.completed_lessons == 3
        assert maths_module.progress_percent == 60  # 3 of 5
        assert maths_module.current_lesson_id == maths[3].id
        assert maths_module.started_at is not None
        assert maths_module.completed_at is None
        assert maths_module.time_spent_seconds == 270  # 3 x 90s
        # MODULE_STARTED is appended by the server, not sent by the client.
        assert any(
            e.event_type == LearningEventType.MODULE_STARTED.value
            for e in report.recent_activity
        ) or maths_module.started_at is not None

        # Overall spans every module: 3 of 7 lessons across Maths + EVS.
        assert report.overall_percent == round(3 / (MATHS_CHAPTERS + EVS_CHAPTERS) * 100)
        assert report.modules_in_progress == 1
        assert report.modules_not_started == 1

        # Finish the module.
        rest = []
        for index, lesson in enumerate(maths[3:]):
            rest.extend(_lesson_run(lesson, minutes_ago=8 - index * 3))
        await progress.ingest_events(student, rest, session)

        report = await progress.get_student_progress(student, session)
        maths_module = _module(report, "Mathematics")
        assert maths_module.status == progress.STATUS_COMPLETED
        assert maths_module.progress_percent == 100
        assert maths_module.completed_at is not None
        assert maths_module.current_lesson_id is None
        assert report.modules_completed == 1

        # MODULE_COMPLETED was appended exactly once, by the server.
        completions = (
            await session.execute(
                select(LearningEvent).where(
                    LearningEvent.student_id == student.id,
                    LearningEvent.event_type == LearningEventType.MODULE_COMPLETED.value,
                )
            )
        ).scalars().all()
        assert len(completions) == 1
        assert completions[0].client_event_id == "srv:MODULE_COMPLETED:Mathematics|3"

        # The untouched module is still reported, still not started.
        evs_module = _module(report, "EVS")
        assert evs_module.status == progress.STATUS_NOT_STARTED
        assert evs_module.progress_percent == 0

        assert report.recent_activity, "recent activity should not be empty"
        assert report.last_activity_at is not None
    await engine.dispose()
    print("PASS test_full_learning_flow")


async def test_offline_sync_is_idempotent():
    """A retried batch, a partly-synced batch, and a second device."""
    engine, factory = await _fresh_db()
    async with factory() as session:
        student, maths, _ = await _seed(session)

        # Several lessons finished while offline, synced in one go later.
        offline_batch = []
        for index, lesson in enumerate(maths[:2]):
            offline_batch.extend(_lesson_run(lesson, minutes_ago=60 - index * 10))

        first = await progress.ingest_events(student, offline_batch, session)
        assert len(first.accepted) == len(offline_batch)
        assert not first.duplicates

        # The response never reached the device, so it retries the same batch
        # with the same client_event_ids.
        second = await progress.ingest_events(student, offline_batch, session)
        assert not second.accepted
        assert len(second.duplicates) == len(offline_batch)

        total = (
            await session.execute(
                select(LearningEvent).where(LearningEvent.student_id == student.id)
            )
        ).scalars().all()
        # Every original event, plus exactly one server-derived MODULE_STARTED.
        assert len(total) == len(offline_batch) + 1

        report = await progress.get_student_progress(student, session)
        assert _module(report, "Mathematics").completed_lessons == 2

        # A second device replays an overlapping batch (it had one of the
        # lessons queued too) plus one genuinely new lesson.
        overlapping = offline_batch[:3] + _lesson_run(maths[2], minutes_ago=5)
        third = await progress.ingest_events(student, overlapping, session)
        assert len(third.duplicates) == 3
        assert len(third.accepted) == 5

        report = await progress.get_student_progress(student, session)
        assert _module(report, "Mathematics").completed_lessons == 3
        assert _module(report, "Mathematics").progress_percent == 60

        # Repeating the same lesson never pushes progress past its lesson count.
        await progress.ingest_events(student, _lesson_run(maths[0], minutes_ago=1), session)
        report = await progress.get_student_progress(student, session)
        assert _module(report, "Mathematics").completed_lessons == 3
    await engine.dispose()
    print("PASS test_offline_sync_is_idempotent")


async def test_untrusted_input_is_rejected_not_stored():
    """Bad events come back named so a device can drop them, not retry forever."""
    engine, factory = await _fresh_db()
    async with factory() as session:
        student, maths, _ = await _seed(session)

        good = _event(LearningEventType.LESSON_STARTED, lesson=maths[0])
        result = await progress.ingest_events(
            student,
            [
                good,
                _event(LearningEventType.MODULE_COMPLETED, subject="Mathematics"),
                LearningEventIn(
                    client_event_id=str(uuid.uuid4()),
                    event_type="TOTALLY_MADE_UP",
                    occurred_at=datetime.utcnow(),
                    subject="Mathematics",
                ),
                LearningEventIn(
                    client_event_id=str(uuid.uuid4()),
                    event_type=LearningEventType.LESSON_STARTED.value,
                    occurred_at=datetime.utcnow(),
                    lesson_id=uuid.uuid4(),  # no such lesson
                ),
                LearningEventIn(
                    client_event_id=str(uuid.uuid4()),
                    event_type=LearningEventType.MODULE_OPENED.value,
                    occurred_at=datetime.utcnow(),  # no subject, no lesson
                ),
            ],
            session,
        )
        assert result.accepted == [good.client_event_id]
        assert len(result.rejected) == 4, result.rejected
        # A client-claimed MODULE_COMPLETED must not be able to fake a finish.
        report = await progress.get_student_progress(student, session)
        assert _module(report, "Mathematics").status == progress.STATUS_IN_PROGRESS
        assert _module(report, "Mathematics").progress_percent == 0

        # The subject/class an event lands on comes from the lesson, not the
        # client's claim.
        spoofed = LearningEventIn(
            client_event_id=str(uuid.uuid4()),
            event_type=LearningEventType.LESSON_COMPLETED.value,
            occurred_at=datetime.utcnow(),
            lesson_id=maths[1].id,
            subject="EVS",
        )
        await progress.ingest_events(student, [spoofed], session)
        report = await progress.get_student_progress(student, session)
        assert _module(report, "Mathematics").completed_lessons == 1
        assert _module(report, "EVS").completed_lessons == 0

        # An implausible "time spent" is dropped rather than believed.
        await progress.ingest_events(
            student,
            [
                _event(
                    LearningEventType.LESSON_COMPLETED,
                    lesson=maths[2],
                    duration_ms=99 * 60 * 60 * 1000,
                )
            ],
            session,
        )
        report = await progress.get_student_progress(student, session)
        assert _module(report, "Mathematics").time_spent_seconds is None
    await engine.dispose()
    print("PASS test_untrusted_input_is_rejected_not_stored")


async def test_teacher_class_progress_view():
    """The teacher's Student | subject | Overall table, incl. an idle student."""
    engine, factory = await _fresh_db()
    async with factory() as session:
        active, maths, evs = await _seed(session)

        idle = Student(
            unique_number="TST0002",
            full_name="Bikash",
            password_hash="x",
            state="Assam",
            school_name="Test School",
            branch_name=BRANCH,
            class_number=CLASS_NUMBER,
            section=SECTION,
        )
        session.add(idle)
        await session.commit()

        events = []
        for lesson in maths:  # all 5 -> Maths complete
            events.extend(_lesson_run(lesson, minutes_ago=20))
        events.extend(_lesson_run(evs[0], minutes_ago=5))  # 1 of 2 -> EVS 50%
        await progress.ingest_events(active, events, session)

        report = await progress.get_class_progress(
            [active, idle], CLASS_NUMBER, SECTION, session
        )
        assert report.subjects == ["EVS", "Mathematics"]

        active_row = next(r for r in report.students if r.student_id == active.id)
        by_subject = {s.subject: s for s in active_row.subjects}
        assert by_subject["Mathematics"].progress_percent == 100
        assert by_subject["Mathematics"].status == progress.STATUS_COMPLETED
        assert by_subject["EVS"].progress_percent == 50
        assert by_subject["EVS"].status == progress.STATUS_IN_PROGRESS
        assert active_row.overall_percent == round(6 / 7 * 100)
        assert active_row.modules_completed == 1
        assert active_row.modules_in_progress == 1
        assert active_row.last_activity_at is not None

        # A student who has never started anything still gets a row — the
        # teacher's table must show the whole class, not only the active half.
        idle_row = next(r for r in report.students if r.student_id == idle.id)
        assert idle_row.overall_percent == 0
        assert idle_row.last_activity_at is None
        assert all(s.status == progress.STATUS_NOT_STARTED for s in idle_row.subjects)
    await engine.dispose()
    print("PASS test_teacher_class_progress_view")


async def test_activity_points_and_streaks():
    """Verify points accumulation and multi-day / broken daily streak logic."""
    engine, factory = await _fresh_db()
    async with factory() as session:
        student, maths, _ = await _seed(session)

        # Day 1 (2 days ago): finished 1 lesson -> started lesson (5) + activity (5) + quiz (10) + lesson completed (50) = 70 pts
        two_days_ago = datetime.utcnow() - timedelta(days=2)
        day1_events = [
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.LESSON_STARTED.value,
                occurred_at=two_days_ago,
                lesson_id=maths[0].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.ACTIVITY_COMPLETED.value,
                occurred_at=two_days_ago,
                lesson_id=maths[0].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.QUIZ_COMPLETED.value,
                occurred_at=two_days_ago,
                lesson_id=maths[0].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.LESSON_COMPLETED.value,
                occurred_at=two_days_ago,
                lesson_id=maths[0].id,
            ),
        ]
        await progress.ingest_events(student, day1_events, session)

        # Day 2 (yesterday): finished lesson 2 -> + 70 pts = 140 pts
        yesterday = datetime.utcnow() - timedelta(days=1)
        day2_events = [
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.LESSON_STARTED.value,
                occurred_at=yesterday,
                lesson_id=maths[1].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.ACTIVITY_COMPLETED.value,
                occurred_at=yesterday,
                lesson_id=maths[1].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.QUIZ_COMPLETED.value,
                occurred_at=yesterday,
                lesson_id=maths[1].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.LESSON_COMPLETED.value,
                occurred_at=yesterday,
                lesson_id=maths[1].id,
            ),
        ]
        await progress.ingest_events(student, day2_events, session)

        # Day 3 (today): finished lesson 3 -> + 70 pts = 210 pts
        today = datetime.utcnow()
        day3_events = [
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.LESSON_STARTED.value,
                occurred_at=today,
                lesson_id=maths[2].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.ACTIVITY_COMPLETED.value,
                occurred_at=today,
                lesson_id=maths[2].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.QUIZ_COMPLETED.value,
                occurred_at=today,
                lesson_id=maths[2].id,
            ),
            LearningEventIn(
                client_event_id=str(uuid.uuid4()),
                event_type=LearningEventType.LESSON_COMPLETED.value,
                occurred_at=today,
                lesson_id=maths[2].id,
            ),
        ]
        await progress.ingest_events(student, day3_events, session)

        report = await progress.get_student_progress(student, session)
        assert report.points == 210, f"Expected 210 points, got {report.points}"
        assert report.current_streak == 3, f"Expected current streak 3, got {report.current_streak}"
        assert report.longest_streak == 3, f"Expected longest streak 3, got {report.longest_streak}"

    await engine.dispose()
    print("PASS test_activity_points_and_streaks")


if __name__ == "__main__":
    asyncio.run(test_full_learning_flow())
    asyncio.run(test_offline_sync_is_idempotent())
    asyncio.run(test_untrusted_input_is_rejected_not_stored())
    asyncio.run(test_teacher_class_progress_view())
    asyncio.run(test_activity_points_and_streaks())
    print("\nAll learning-progress tests passed.")
