import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from src.core.database import AsyncSessionFactory
from src.models.module import Module
from src.models.school import School
from src.models.teacher import Teacher, TeacherClassAssignment


async def main():
    async with AsyncSessionFactory() as session:
        print("=== 1. Checking Schools & Branches ===")
        s_res = await session.execute(select(School))
        schools = list(s_res.scalars().all())
        for s in schools:
            print(f"  - School: '{s.school_name}' | Branch: '{s.branch_name}' (ID: {s.id})")

        print("\n=== 2. Checking Modules in DB ===")
        m_res = await session.execute(select(Module))
        modules = list(m_res.scalars().all())
        print(f"Total modules count in DB: {len(modules)}")
        for m in modules:
            print(f"  - Module Title: '{m.title}' | Class: {m.class_number} | Branch: '{m.branch_name}' | Subject: '{m.subject}' (ID: {m.id})")

        print("\n=== 3. Checking Teachers & Assigned Classes ===")
        t_res = await session.execute(select(Teacher))
        teachers = list(t_res.scalars().all())
        for t in teachers:
            print(f"  - Teacher Name: '{t.name}' | Phone: {t.phone_number} | Branch: '{t.branch_name}'")
            tca_res = await session.execute(
                select(TeacherClassAssignment).where(TeacherClassAssignment.teacher_id == t.id)
            )
            for a in tca_res.scalars().all():
                print(f"      -> Class {a.class_number}{a.section} • Subject: '{a.subject}'")


if __name__ == "__main__":
    asyncio.run(main())
