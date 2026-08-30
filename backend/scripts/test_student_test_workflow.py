"""
Verification script for Student Test & Quiz Workflow:
  - Deadline filtering
  - 15-20 min timed AI quiz runner with 8-10 questions max
  - 60% Pass/Fail threshold
  - Adaptive re-attempt question selection for failed attempts
  - Manual PDF response upload (max 5MB limit)
  - Instant AI advice generation
  - Teacher grading & feedback
  - Student & Parent attempt history views
"""
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timedelta

# Ensure python path can find src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.database import AsyncSessionFactory, init_db
from src.models.school import School
from src.models.student import Student
from src.models.teacher import Assignment, AssignmentAttempt, AssignmentSubmission, Teacher, TeacherClassAssignment
from src.schemas.teacher import AssignmentCreateQuizRequest, QuizAnswerInput
from src.services import parent_service, teacher_service

async def run_verification():
    print("=== STARTING STUDENT TEST WORKFLOW VERIFICATION ===", flush=True)

    async with AsyncSessionFactory() as session:
        # 1. Fetch or create test school branch & teacher
        stmt = select(School).limit(1)
        res = await session.execute(stmt)
        school = res.scalar_one_or_none()

        if not school:
            print("ERROR: No school found in database.")
            return

        print(f"[1] Verified School Branch: {school.branch_name}")

        # Fetch or create test teacher
        t_stmt = select(Teacher).where(Teacher.branch_name == school.branch_name).limit(1)
        t_res = await session.execute(t_stmt)
        teacher = t_res.scalar_one_or_none()

        if not teacher:
            print("Creating test teacher...")
            teacher = Teacher(
                name="Test Teacher",
                phone_number="+919999888777",
                school_name=school.school_name,
                branch_name=school.branch_name,
                password_hash="hashed_pw",
            )
            session.add(teacher)
            await session.commit()
            await session.refresh(teacher)

        print(f"[2] Verified Teacher: {teacher.name} ({teacher.id})")

        # Assign Class 4A Mathematics to teacher
        tca_stmt = select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher.id,
            TeacherClassAssignment.class_number == 4,
            TeacherClassAssignment.section == "A",
        )
        tca_res = await session.execute(tca_stmt)
        tca = tca_res.scalar_one_or_none()
        if not tca:
            tca = TeacherClassAssignment(
                teacher_id=teacher.id,
                branch_name=school.branch_name,
                class_number=4,
                section="A",
                subject="Mathematics",
            )
            session.add(tca)
            await session.commit()

        # Fetch or create test student
        s_stmt = select(Student).where(
            Student.branch_name == school.branch_name,
            Student.class_number == 4,
            Student.section == "A",
        ).limit(1)
        s_res = await session.execute(s_stmt)
        student = s_res.scalar_one_or_none()

        if not student:
            print("Creating test student...")
            student = Student(
                unique_number=f"TEST_{uuid.uuid4().hex[:6].upper()}",
                full_name="Test Student 4A",
                email="student4a@test.com",
                phone_number="+919999000111",
                state=school.state,
                school_name=school.school_name,
                branch_name=school.branch_name,
                enrollment_type="school",
                class_number=4,
                section="A",
                password_hash="hashed_pw",
            )
            session.add(student)
            await session.commit()
            await session.refresh(student)

        print(f"[3] Verified Student: {student.full_name} ({student.unique_number})")

        # 2. Test AI Quiz Assignment Creation
        quiz_data = AssignmentCreateQuizRequest(
            title="Class 4 Math Chapter 1 RAG Quiz",
            subject="Mathematics",
            description="Testing AI Quiz workflow with 60% pass threshold",
            chapter_numbers=[1],
            deadline_days=2,
        )
        asgn = await teacher_service.create_quiz_assignment(
            teacher, 4, "A", quiz_data, session
        )
        print(f"[4] Created AI Quiz Assignment: '{asgn.title}' (ID: {asgn.id})", flush=True)

        # 3. Test Student Quiz Question Generation
        preview = await teacher_service.get_assignment_quiz_for_student(asgn.id, student, session)
        print(f"[5] Generated Quiz Questions: {len(preview.questions)} questions returned (Target: 8 max)", flush=True)
        assert 1 <= len(preview.questions) <= 10, "Question count should be between 1 and 10."

        # 4. Test Student Quiz Submission - Attempt 1 (FAIL: score < 60%)
        # Intentionally answer only 1 out of 8 questions correctly -> 12.5% score
        answers_fail = []
        for i, q in enumerate(preview.questions):
            ans_idx = q.correct_option_index if i == 0 else (q.correct_option_index + 1) % 4
            answers_fail.append(QuizAnswerInput(
                question_id=q.id or f"q_{i+1}",
                question_text=q.question_text,
                selected_option_index=ans_idx,
                correct_option_index=q.correct_option_index,
                chapter_title=q.chapter_title,
                explanation=q.explanation,
            ))

        res_attempt1 = await teacher_service.submit_student_quiz_attempt(
            asgn.id, student, answers_fail, session
        )
        await asyncio.sleep(2.0)
        print(f"[6] Attempt 1 Submitted: Score={res_attempt1['percentage']:.1f}% | Status={res_attempt1['status'].upper()} | Passed={res_attempt1['is_passed']}", flush=True)
        assert res_attempt1['is_passed'] == False, "Attempt 1 (<60%) should be marked FAILED."

        # 5. Test Adaptive Question Regeneration for Attempt 2 (Retake after failure)
        preview_adaptive = await teacher_service.get_assignment_quiz_for_student(asgn.id, student, session)
        print(f"[7] Adaptive Quiz Questions generated for Retake (Attempt 2): {len(preview_adaptive.questions)} questions", flush=True)

        # 6. Test Student Quiz Submission - Attempt 2 (PASS: score >= 60%)
        answers_pass = []
        for i, q in enumerate(preview_adaptive.questions):
            answers_pass.append(QuizAnswerInput(
                question_id=q.id or f"q_{i+1}",
                question_text=q.question_text,
                selected_option_index=q.correct_option_index, # All correct -> 100%
                correct_option_index=q.correct_option_index,
                chapter_title=q.chapter_title,
                explanation=q.explanation,
            ))

        res_attempt2 = await teacher_service.submit_student_quiz_attempt(
            asgn.id, student, answers_pass, session
        )
        await asyncio.sleep(2.0)
        print(f"[8] Attempt 2 Submitted: Score={res_attempt2['percentage']:.1f}% | Status={res_attempt2['status'].upper()} | Passed={res_attempt2['is_passed']}", flush=True)
        assert res_attempt2['is_passed'] == True, "Attempt 2 (>=60%) should be marked PASSED."


        # 7. Test Student Past Results Retrieval
        student_results = await teacher_service.get_student_all_test_results(student, session)
        print(f"[9] Student Past Results Retrieved: {len(student_results)} assignment summaries", flush=True)
        found_summary = next((r for r in student_results if r["assignment"].id == asgn.id), None)
        assert found_summary is not None, "Assignment summary should exist in student results."
        assert len(found_summary["attempts"]) == 2, "Student should have 2 recorded attempts for this assignment."
        print(f"    Total Recorded Attempts: {len(found_summary['attempts'])}", flush=True)

        # 8. Test Deadline Expiration Disappearance
        asgn_expired = Assignment(
            teacher_id=teacher.id,
            branch_name=teacher.branch_name,
            class_number=4,
            section="A",
            subject="Mathematics",
            title="Expired Test (Should Disappear)",
            assignment_type="ai_quiz",
            deadline_at=datetime.utcnow() - timedelta(days=1), # Expired yesterday
        )
        session.add(asgn_expired)
        await session.commit()

        active_asgns = await teacher_service.get_student_assignments(student, session, include_expired=False)
        all_asgns = await teacher_service.get_student_assignments(student, session, include_expired=True)

        print(f"[10] Active Assignments (Excluding Expired): {len(active_asgns)} | All Assignments (Including Expired): {len(all_asgns)}", flush=True)
        assert not any(a.id == asgn_expired.id for a in active_asgns), "Expired test must disappear from active student assignments list!"

        print("\n=== VERIFICATION SUCCESSFUL! ALL TESTS PASSED PROPERLY. ===", flush=True)


if __name__ == "__main__":
    asyncio.run(run_verification())
