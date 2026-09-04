"""
Tests for Consecutive Assessment Growth, Delta Tracking, and Detailed Parent Progress.
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
from src.models.learning import LearningEvent
from src.models.lesson import Lesson
from src.models.parent import Parent, ParentChildLink
from src.models.school import School
from src.models.student import Student
from src.models.teacher import (
    Assignment,
    AssignmentAttempt,
    AssignmentSubmission,
    Teacher,
    TeacherClassAssignment,
    TeacherFeedback,
)
from src.services import assessment_progress_service

BRANCH = "GROWTH-BRANCH"
CLASS_NUMBER = 4
SECTION = "A"

engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionFactory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_session():
    async with SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


import pytest

app.dependency_overrides[get_session] = override_get_session


_CACHED_TEST_DATA: dict = {}


@pytest.fixture(name="data")
def data_fixture() -> dict:
    global _CACHED_TEST_DATA
    if not _CACHED_TEST_DATA:
        _CACHED_TEST_DATA = asyncio.run(setup_test_data())
    return _CACHED_TEST_DATA


async def setup_test_data() -> dict:
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
                Assignment.__table__,
                AssignmentSubmission.__table__,
                AssignmentAttempt.__table__,
                TeacherFeedback.__table__,
                Lesson.__table__,
                LearningEvent.__table__,
            ],
        )

    async with SessionFactory() as session:
        school = School(
            school_name="Growth Academy",
            branch_name=BRANCH,
            student_prefix="GRW",
            password_hash="x",
            state="Assam",
        )
        session.add(school)

        student = Student(
            unique_number="GRW001",
            full_name="Rahul",
            password_hash="x",
            state="Assam",
            school_name="Growth Academy",
            branch_name=BRANCH,
            class_number=CLASS_NUMBER,
            section=SECTION,
        )
        parent = Parent(
            email="parent_rahul@test.com",
            password_hash="x",
        )
        unlinked_parent = Parent(
            email="stranger@test.com",
            password_hash="x",
        )
        teacher = Teacher(
            name="Mr. Sharma",
            phone_number="9876543210",
            school_name="Growth Academy",
            branch_name=BRANCH,
            password_hash="x",
        )
        session.add_all([student, parent, unlinked_parent, teacher])
        await session.flush()

        session.add(
            ParentChildLink(
                parent_id=parent.id,
                student_unique_number=student.unique_number,
            )
        )

        # Assignment 1: Mathematics - Fractions (Student shows improvement: 40% -> 85%)
        asgn1 = Assignment(
            teacher_id=teacher.id,
            branch_name=BRANCH,
            class_number=CLASS_NUMBER,
            section=SECTION,
            subject="Mathematics",
            title="Fractions & Decimals Quiz",
            assignment_type="ai_quiz",
        )
        # Assignment 2: EVS - Water Conservation (Student is lagging: 50% -> 40%)
        asgn2 = Assignment(
            teacher_id=teacher.id,
            branch_name=BRANCH,
            class_number=CLASS_NUMBER,
            section=SECTION,
            subject="EVS",
            title="Water Cycle Test",
            assignment_type="ai_quiz",
        )
        session.add_all([asgn1, asgn2])
        await session.flush()

        # Attempts for Assignment 1: Initial 40% (Fail), Second 85% (Pass & Mastery)
        t0 = datetime.utcnow() - timedelta(days=3)
        t1 = datetime.utcnow() - timedelta(days=1)
        att1_1 = AssignmentAttempt(
            assignment_id=asgn1.id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            attempt_number=1,
            score=40.0,
            max_score=100.0,
            percentage=40.0,
            is_passed=False,
            status="failed",
            started_at=t0,
            completed_at=t0,
        )
        att1_2 = AssignmentAttempt(
            assignment_id=asgn1.id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            attempt_number=2,
            score=85.0,
            max_score=100.0,
            percentage=85.0,
            is_passed=True,
            status="passed",
            started_at=t1,
            completed_at=t1,
        )
        sub1 = AssignmentSubmission(
            assignment_id=asgn1.id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            score=85.0,
            max_score=100.0,
            percentage=85.0,
            is_passed=True,
            total_attempts=2,
            attempted_at=t0,
            last_attempted_at=t1,
        )

        # Attempts for Assignment 2: Initial 50% -> Second 40% (Declining / Lagging)
        att2_1 = AssignmentAttempt(
            assignment_id=asgn2.id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            attempt_number=1,
            score=50.0,
            max_score=100.0,
            percentage=50.0,
            is_passed=False,
            status="failed",
            started_at=t0,
            completed_at=t0,
        )
        att2_2 = AssignmentAttempt(
            assignment_id=asgn2.id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            attempt_number=2,
            score=40.0,
            max_score=100.0,
            percentage=40.0,
            is_passed=False,
            status="failed",
            started_at=t1,
            completed_at=t1,
        )
        sub2 = AssignmentSubmission(
            assignment_id=asgn2.id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            score=40.0,
            max_score=100.0,
            percentage=40.0,
            is_passed=False,
            total_attempts=2,
            attempted_at=t0,
            last_attempted_at=t1,
        )

        session.add_all([att1_1, att1_2, sub1, att2_1, att2_2, sub2])

        # Add curriculum lessons
        session.add(
            Lesson(
                subject="Mathematics",
                class_number=CLASS_NUMBER,
                chapter_number=1,
                chapter_title="Fractions",
                generation_source="test",
            )
        )
        session.add(
            Lesson(
                subject="EVS",
                class_number=CLASS_NUMBER,
                chapter_number=1,
                chapter_title="Water",
                generation_source="test",
            )
        )

        await session.commit()

        return {
            "student_id": str(student.id),
            "unique_number": student.unique_number,
            "parent_id": str(parent.id),
            "unlinked_parent_id": str(unlinked_parent.id),
        }


def auth(subject: str, role: str) -> dict:
    return {"Authorization": f"Bearer {create_access_token(subject=subject, role=role)}"}


async def test_consecutive_assessment_growth_logic(data: dict):
    async with SessionFactory() as session:
        student = await session.get(Student, uuid.UUID(data["student_id"]))
        assert student is not None

        detailed = await assessment_progress_service.calculate_student_detailed_progress(student, session)

        # 1. Overall stats
        assert detailed.total_assessments_taken == 2
        assert detailed.assessments_passed == 1
        assert detailed.assessments_lagging == 1  # EVS is lagging

        # 2. Fractions (Mathematics) - improved from 40% to 85% (+45%)
        math_subj = next(s for s in detailed.subjects if s.subject == "Mathematics")
        assert len(math_subj.assessments) == 1
        fractions_asgn = math_subj.assessments[0]
        assert fractions_asgn.initial_score == 40.0
        assert fractions_asgn.latest_score == 85.0
        assert fractions_asgn.score_delta == 45.0
        assert fractions_asgn.trend in ("improving", "mastered")
        assert fractions_asgn.is_lagging is False
        assert len(fractions_asgn.attempts_history) == 2
        assert fractions_asgn.attempts_history[1].delta_from_previous == 45.0

        # 3. Water Cycle (EVS) - dropped from 50% to 40% (-10%)
        evs_subj = next(s for s in detailed.subjects if s.subject == "EVS")
        assert len(evs_subj.assessments) == 1
        water_asgn = evs_subj.assessments[0]
        assert water_asgn.initial_score == 50.0
        assert water_asgn.latest_score == 40.0
        assert water_asgn.score_delta == -10.0
        assert water_asgn.trend == "declining"
        assert water_asgn.is_lagging is True
        assert water_asgn.status == "lagging"
        assert len(water_asgn.attempts_history) == 2
        assert water_asgn.attempts_history[1].delta_from_previous == -10.0

        print("PASS test_consecutive_assessment_growth_logic")


def test_parent_detailed_progress_api(data: dict):
    app.dependency_overrides[get_session] = override_get_session
    parent_headers = auth(data["parent_id"], "parent")
    stranger_headers = auth(data["unlinked_parent_id"], "parent")
    student_headers = auth(data["student_id"], "student")

    client = TestClient(app)
    base = "/api/v1"

    # Parent fetches child's detailed progress
    res = client.get(
        f"{base}/parent/children/{data['unique_number']}/detailed-progress",
        headers=parent_headers,
    )
    assert res.status_code == 200, res.text
    payload = res.json()
    assert payload["student_unique_number"] == "GRW001"
    assert payload["total_assessments_taken"] == 2
    assert payload["assessments_passed"] == 1
    assert payload["assessments_lagging"] == 1
    assert len(payload["subjects"]) >= 2
    assert "holistic_mastery_percent" in payload
    assert "consecutive_growth_rate" in payload

    # Unlinked parent is refused 403
    res_forbidden = client.get(
        f"{base}/parent/children/{data['unique_number']}/detailed-progress",
        headers=stranger_headers,
    )
    assert res_forbidden.status_code == 403

    # Student can fetch their own detailed progress
    res_student = client.get(
        f"{base}/student/detailed-progress",
        headers=student_headers,
    )
    assert res_student.status_code == 200, res_student.text
    student_payload = res_student.json()
    assert student_payload["student_unique_number"] == "GRW001"
    assert student_payload["total_assessments_taken"] == 2

    print("PASS test_parent_detailed_progress_api")


if __name__ == "__main__":
    test_data = asyncio.run(setup_test_data())
    asyncio.run(test_consecutive_assessment_growth_logic(test_data))
    test_parent_detailed_progress_api(test_data)
    print("\nAll assessment growth and detailed parent progress tests passed successfully.")
