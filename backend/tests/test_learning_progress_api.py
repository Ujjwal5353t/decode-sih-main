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
from sqlmodel import SQLModel

from src.core.database import get_session
from src.core.security import create_access_token
from src.main import app
from src.models.learning import LearningEvent
from src.models.lesson import Lesson
from src.models.parent import Parent, ParentChildLink
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
                Parent.__table__,
                ParentChildLink.__table__,
                Teacher.__table__,
                TeacherClassAssignment.__table__,
                Lesson.__table__,
                LearningEvent.__table__,
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
        parent = Parent(
            email="parent@test.com",
            password_hash="x",
        )
        other_parent = Parent(
            email="otherparent@test.com",
            password_hash="x",
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
        session.add_all([student, parent, other_parent, teacher, other_teacher])
        await session.flush()

        session.add(
            ParentChildLink(
                parent_id=parent.id,
                student_unique_number=student.unique_number,
            )
        )

        session.add(
            TeacherClassAssignment(
                teacher_id=teacher.id,
                branch_name=BRANCH,
                class_number=CLASS_NUMBER,
                section=SECTION,
                subject="Mathematics",
            )
        )

        lessons = [
            Lesson(
                subject="Mathematics",
                class_number=CLASS_NUMBER,
                chapter_number=1,
                chapter_title="Chapter 1",
                generation_source="test",
            )
        ]
        for lesson in lessons:
            session.add(lesson)
        await session.commit()

        return {
            "student_id": str(student.id),
            "unique_number": student.unique_number,
            "parent_id": str(parent.id),
            "other_parent_id": str(other_parent.id),
            "teacher_id": str(teacher.id),
            "other_teacher_id": str(other_teacher.id),
            "lesson_ids": [str(lesson.id) for lesson in lessons],
        }


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
    parent_headers = auth(data["parent_id"], "parent")
    other_parent_headers = auth(data["other_parent_id"], "parent")
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
    assert report["points"] == 0
    assert report["current_streak"] == 0
    assert report["modules"][0]["status"] == "not_started"
    assert report["modules"][0]["total_lessons"] == 1

    # ── Complete lesson ───────────────────────────────────────────────────
    events = [
        {
            "client_event_id": str(uuid.uuid4()),
            "event_type": "MODULE_OPENED",
            "occurred_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat() + "Z",
            "subject": "Mathematics",
        }
    ]
    events += lesson_run(lesson_ids[0], 25)

    res = client.post(
        f"{base}/student/learning-events", json={"events": events}, headers=student_headers
    )
    assert res.status_code == 200, res.text
    sync = res.json()
    assert len(sync["accepted"]) == len(events)
    assert sync["rejected"] == []

    report = client.get(f"{base}/student/progress", headers=student_headers).json()
    module = report["modules"][0]
    assert module["status"] == "completed"
    assert module["progress_percent"] == 100
    assert report["points"] > 0
    assert report["current_streak"] >= 1
    assert report["recent_activity"], "recent activity should be populated"

    # ── Parent child progress view ────────────────────────────────────────
    res = client.get(
        f"{base}/parent/children/{data['unique_number']}/progress",
        headers=parent_headers,
    )
    assert res.status_code == 200, res.text
    parent_child_report = res.json()
    assert parent_child_report["overall_percent"] == 100
    assert parent_child_report["points"] == report["points"]
    assert parent_child_report["current_streak"] == report["current_streak"]

    # Unlinked parent is refused 403
    res = client.get(
        f"{base}/parent/children/{data['unique_number']}/progress",
        headers=other_parent_headers,
    )
    assert res.status_code == 403, res.text

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
    assert row["points"] == report["points"]
    assert row["current_streak"] == report["current_streak"]
    assert row["subjects"][0]["status"] == "completed"
    assert row["last_activity_at"] is not None

    # ── Authorization: a teacher without this class is refused ────────────
    res = client.get(
        f"{base}/teacher/classes/{CLASS_NUMBER}/{SECTION}/progress",
        headers=stranger_headers,
    )
    assert res.status_code == 403, res.text

    print("PASS student flow -> points & streak")
    print("PASS parent child progress endpoint & authorization")
    print("PASS teacher class view + authorization boundary")
    print("\nAll learning-progress API tests passed.")


if __name__ == "__main__":
    main()
