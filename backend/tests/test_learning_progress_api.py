"""
End-to-end HTTP walk-through of Issue #24, over the real routes.

Only the database is swapped (an in-memory SQLite shared across requests);
authentication, role checks and the teacher's class-assignment check all run
for real, driven by genuine signed tokens. That is the point of this file —
the authorization boundary is the part that must not be mocked.

Journey covered:
  student logs in -> opens a module -> starts a lesson -> completes lessons
  -> module completes -> student dashboard reads 100% -> teacher dashboard
  sees it -> a teacher without the class is refused.

Then the offline repeat: a batch of events recorded while disconnected is
posted after "reconnecting", and posted a second time to prove the retry is
harmless.
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select

from src.core.database import get_session
from src.core.security import create_access_token
from src.main import app
from src.models.gamification import (
    ChestClaim,
    GamificationProfile,
    StreakDay,
    XpTransaction,
)
from src.models.learning import LearningEvent
from src.models.lesson import Lesson
from src.models.school import School
from src.models.student import Student
from src.models.teacher import Teacher, TeacherClassAssignment

BRANCH = "API-TEST-BRANCH"
CLASS_NUMBER = 4
SECTION = "B"

engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
    # One shared connection, so every request in the test sees the same
    # in-memory database.
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionFactory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_session():
    """Mirrors the real dependency's commit/rollback behaviour."""
    async with SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_session] = override_get_session


async def setup_data() -> dict:
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
                # ingest_events awards XP / streak days in the same
                # transaction, so these must exist here too.
                GamificationProfile.__table__,
                XpTransaction.__table__,
                StreakDay.__table__,
                ChestClaim.__table__,
            ],
        )

    async with SessionFactory() as session:
        session.add(
            School(
                school_name="API Test School",
                branch_name=BRANCH,
                student_prefix="API",
                password_hash="x",
                state="Assam",
            )
        )
        student = Student(
            unique_number="API0001",
            full_name="Meera",
            password_hash="x",
            state="Assam",
            school_name="API Test School",
            branch_name=BRANCH,
            class_number=CLASS_NUMBER,
            section=SECTION,
        )
        teacher = Teacher(
            name="Class Teacher",
            phone_number="9000000001",
            school_name="API Test School",
            branch_name=BRANCH,
            password_hash="x",
        )
        other_teacher = Teacher(
            name="Unassigned Teacher",
            phone_number="9000000002",
            school_name="API Test School",
            branch_name=BRANCH,
            password_hash="x",
        )
        session.add_all([student, teacher, other_teacher])
        await session.flush()

        session.add(
            TeacherClassAssignment(
                teacher_id=teacher.id,
                branch_name=BRANCH,
                class_number=CLASS_NUMBER,
                section=SECTION,
                # Required since assignments became subject-scoped.
                subject="Mathematics",
            )
        )

        lessons = [
            Lesson(
                subject="Mathematics",
                class_number=CLASS_NUMBER,
                chapter_number=i + 1,
                chapter_title=f"Chapter {i + 1}",
                generation_source="test",
            )
            for i in range(3)
        ]
        for lesson in lessons:
            session.add(lesson)
        await session.commit()

        return {
            "student_id": str(student.id),
            "teacher_id": str(teacher.id),
            "other_teacher_id": str(other_teacher.id),
            "lesson_ids": [str(lesson.id) for lesson in lessons],
        }


async def _add_lone_student(unique_number: str) -> str:
    """A second, otherwise-untouched student — clean ground for asserting
    what a single first lesson-completion does to a brand-new gamification
    profile, without the main test student's prior activity in the way."""
    async with SessionFactory() as session:
        student = Student(
            unique_number=unique_number,
            full_name="Tz Student",
            password_hash="x",
            state="Assam",
            school_name="API Test School",
            branch_name=BRANCH,
            class_number=CLASS_NUMBER,
            section=SECTION,
        )
        session.add(student)
        await session.commit()
        return str(student.id)


async def _profile_timezone(student_id: str) -> str:
    async with SessionFactory() as session:
        result = await session.execute(
            select(GamificationProfile).where(
                GamificationProfile.student_id == uuid.UUID(student_id)
            )
        )
        return result.scalar_one().timezone


def auth(subject: str, role: str) -> dict:
    return {"Authorization": f"Bearer {create_access_token(subject=subject, role=role)}"}


def lesson_run(lesson_id: str, minutes_ago: int) -> list[dict]:
    stamp = (datetime.utcnow() - timedelta(minutes=minutes_ago)).isoformat() + "Z"
    return [
        {
            "client_event_id": str(uuid.uuid4()),
            "event_type": event_type,
            "occurred_at": stamp,
            "lesson_id": lesson_id,
        }
        for event_type in ("LESSON_STARTED", "ACTIVITY_COMPLETED", "LESSON_COMPLETED")
    ]


def main() -> None:
    data = asyncio.run(setup_data())
    lesson_ids = data["lesson_ids"]
    student_headers = auth(data["student_id"], "student")
    teacher_headers = auth(data["teacher_id"], "teacher")
    stranger_headers = auth(data["other_teacher_id"], "teacher")

    client = TestClient(app)
    base = "/api/v1"

    # ── The student has done nothing yet ──────────────────────────────────
    res = client.get(f"{base}/student/progress", headers=student_headers)
    assert res.status_code == 200, res.text
    report = res.json()
    assert report["overall_percent"] == 0
    assert report["total_modules"] == 1
    assert report["modules"][0]["status"] == "not_started"
    assert report["modules"][0]["total_lessons"] == 3

    # ── Opens the module, then works through two of three lessons ─────────
    events = [
        {
            "client_event_id": str(uuid.uuid4()),
            "event_type": "MODULE_OPENED",
            "occurred_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat() + "Z",
            "subject": "Mathematics",
        }
    ]
    events += lesson_run(lesson_ids[0], 25)
    events += lesson_run(lesson_ids[1], 20)

    res = client.post(
        f"{base}/student/learning-events", json={"events": events}, headers=student_headers
    )
    assert res.status_code == 200, res.text
    sync = res.json()
    assert len(sync["accepted"]) == len(events)
    assert sync["rejected"] == []

    report = client.get(f"{base}/student/progress", headers=student_headers).json()
    module = report["modules"][0]
    assert module["status"] == "in_progress"
    assert module["progress_percent"] == 67, module  # 2 of 3
    assert module["current_lesson_id"] == lesson_ids[2]
    assert module["started_at"] is not None
    assert report["recent_activity"], "recent activity should be populated"

    # ── Offline: the last lesson is finished with no connection, then the
    #    queue is posted once connectivity returns ─────────────────────────
    offline_batch = lesson_run(lesson_ids[2], 2)
    res = client.post(
        f"{base}/student/learning-events",
        json={"events": offline_batch},
        headers=student_headers,
    )
    assert res.status_code == 200, res.text
    assert len(res.json()["accepted"]) == len(offline_batch)

    report = client.get(f"{base}/student/progress", headers=student_headers).json()
    module = report["modules"][0]
    assert module["status"] == "completed"
    assert module["progress_percent"] == 100, module
    assert module["completed_at"] is not None
    assert report["overall_percent"] == 100
    assert report["modules_completed"] == 1

    # ── The same batch is delivered twice (a retry after a lost response) ──
    res = client.post(
        f"{base}/student/learning-events",
        json={"events": offline_batch},
        headers=student_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["accepted"] == []
    assert len(res.json()["duplicates"]) == len(offline_batch)

    report = client.get(f"{base}/student/progress", headers=student_headers).json()
    assert report["modules"][0]["progress_percent"] == 100
    assert report["modules"][0]["completed_lessons"] == 3

    # ── Teacher dashboard ─────────────────────────────────────────────────
    res = client.get(
        f"{base}/teacher/classes/{CLASS_NUMBER}/{SECTION}/progress", headers=teacher_headers
    )
    assert res.status_code == 200, res.text
    class_progress = res.json()
    assert class_progress["subjects"] == ["Mathematics"]
    row = class_progress["students"][0]
    assert row["unique_number"] == "API0001"
    assert row["overall_percent"] == 100
    assert row["subjects"][0]["status"] == "completed"
    assert row["last_activity_at"] is not None

    # ── Authorization: a teacher without this class is refused, whatever
    #    ids the frontend supplies ──────────────────────────────────────────
    res = client.get(
        f"{base}/teacher/classes/{CLASS_NUMBER}/{SECTION}/progress",
        headers=stranger_headers,
    )
    assert res.status_code == 403, res.text

    res = client.get(f"{base}/teacher/classes/1/A/progress", headers=teacher_headers)
    assert res.status_code == 403, res.text

    # A student token cannot read the teacher view, nor the reverse.
    res = client.get(
        f"{base}/teacher/classes/{CLASS_NUMBER}/{SECTION}/progress", headers=student_headers
    )
    assert res.status_code == 403, res.text
    res = client.get(f"{base}/student/progress", headers=teacher_headers)
    assert res.status_code == 403, res.text
    res = client.get(f"{base}/student/progress")
    assert res.status_code in (401, 403), res.text  # no token at all

    # ── Timezone threading: a lesson completion is often what creates a
    #    student's gamification profile in the first place, so
    #    /student/learning-events must accept the same ?tz= convention
    #    /student/gamification does — otherwise that first-ever profile
    #    silently stamps to UTC instead of the student's real local day. ────
    tz_student_id = asyncio.run(_add_lone_student("API0002"))
    tz_headers = auth(tz_student_id, "student")
    res = client.post(
        f"{base}/student/learning-events?tz=Asia/Kolkata",
        json={"events": lesson_run(lesson_ids[0], 1)},
        headers=tz_headers,
    )
    assert res.status_code == 200, res.text
    assert asyncio.run(_profile_timezone(tz_student_id)) == "Asia/Kolkata"

    print("PASS student flow -> 100%")
    print("PASS offline batch synced after reconnect, retry deduplicated")
    print("PASS teacher class view + authorization boundary")
    print("PASS learning-events ?tz= threads into the gamification profile")
    print("\nAll learning-progress API tests passed.")


if __name__ == "__main__":
    main()
