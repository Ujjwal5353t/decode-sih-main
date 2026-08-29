import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from src.core.database import AsyncSessionFactory
from src.models.teacher import Teacher
from src.schemas.teacher import AssignmentCreateQuizRequest
from src.services import teacher_service


async def main():
    async with AsyncSessionFactory() as session:
        t_res = await session.execute(select(Teacher).where(Teacher.phone_number == "9876543210"))
        teacher = t_res.scalar_one_or_none()
        if not teacher:
            print("[TEST] Teacher not found!")
            return

        req = AssignmentCreateQuizRequest(
            title="Chapter 1 RAG Practice Test",
            subject="Mathematics",
            description="Adaptive quiz grounded in Chapter 1 RAG chunks",
            chapter_numbers=[1],
            deadline_days=6,
        )

        asgn = await teacher_service.create_quiz_assignment(
            teacher=teacher,
            class_number=4,
            section="A",
            data=req,
            session=session,
        )
        print(f"[SUCCESS] Quiz Assignment Created! ID: {asgn.id}, Title: {asgn.title}, Chapter Numbers: {asgn.chapter_numbers}")


if __name__ == "__main__":
    asyncio.run(main())
