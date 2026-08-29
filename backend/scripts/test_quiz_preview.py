import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from src.core.database import AsyncSessionFactory
from src.models.teacher import Assignment, Teacher
from src.services import teacher_service


async def main():
    async with AsyncSessionFactory() as session:
        t_res = await session.execute(select(Teacher).where(Teacher.phone_number == "9876543210"))
        teacher = t_res.scalar_one_or_none()
        if not teacher:
            print("[TEST] Teacher not found!")
            return

        asgn_res = await session.execute(select(Assignment).where(Assignment.teacher_id == teacher.id))
        assignments = list(asgn_res.scalars().all())
        print(f"[TEST] Found {len(assignments)} assignments for teacher {teacher.name}")

        for asgn in assignments:
            print(f"\n--- Testing Assignment: {asgn.title} (ID: {asgn.id}, Type: {asgn.assignment_type}) ---")
            try:
                preview = await teacher_service.get_assignment_quiz_preview(
                    assignment_id=asgn.id,
                    teacher=teacher,
                    session=session,
                )
                print(f"[SUCCESS] Preview generated for '{preview.title}': {preview.total_questions} questions!")
                for q in preview.questions:
                    print(f"  Q{q.question_number} ({q.chapter_title}): {q.question_text}")
                    print(f"     Options: {q.options}")
                    print(f"     Ans: {q.correct_answer}")
            except Exception as e:
                import traceback
                print(f"[ERROR] Failed for assignment {asgn.id}: {e}")
                traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
