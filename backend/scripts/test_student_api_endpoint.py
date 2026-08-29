import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import AsyncSessionFactory
from src.schemas.auth import StudentRegisterRequest
from src.services import student_service


async def main():
    async with AsyncSessionFactory() as session:
        req = StudentRegisterRequest(
            full_name="pratham jain",
            school_name="LPS Karkarduma",
            branch_name="LPS Karkarduma Branch",
            enrollment_type="school",
            class_number=4,
            section="A",
            phone_number="9876543299",
            password="Password123!",
            state="Delhi",
        )
        print("[TEST] Registering student via student_service...")
        try:
            student = await student_service.register_student(req, session)
            await session.commit()
            print(f"[SUCCESS] Registered: Unique={student.unique_number}, Name={student.full_name}, Phone={student.phone_number}")
        except Exception as e:
            import traceback
            print(f"[ERROR] Exception: {e}")
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
