import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from src.core.database import AsyncSessionFactory
from src.models.teacher import Teacher, TeacherClassAssignment


async def main():
    async with AsyncSessionFactory() as session:
        t_res = await session.execute(select(Teacher).where(Teacher.phone_number == "9876543210"))
        teacher = t_res.scalar_one_or_none()
        print(f"[CHECK] Teacher found: {teacher.name if teacher else 'None'} (ID: {teacher.id if teacher else 'None'})")

        if teacher:
            tca_res = await session.execute(
                select(TeacherClassAssignment).where(TeacherClassAssignment.teacher_id == teacher.id)
            )
            assignments = list(tca_res.scalars().all())
            print(f"[CHECK] TeacherClassAssignments count: {len(assignments)}")
            for a in assignments:
                print(f"  - Class {a.class_number}{a.section} • Subject: '{a.subject}' (ID: {a.id})")


if __name__ == "__main__":
    asyncio.run(main())
