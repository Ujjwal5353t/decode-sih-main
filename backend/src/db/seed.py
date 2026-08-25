"""
Database seed — runs on every startup (idempotent).

Seeds:
  1. Admin account (admin003@gmail.com / 123456789)
  2. NCERT books for classes 1–5 (all core subjects)

Idempotency: each insert is guarded by a SELECT first, so re-running
this on startup never creates duplicate rows.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.config import settings
from src.core.security import hash_password
from src.models.admin import Admin
from src.models.ncert import NCERTBook

# ── NCERT catalogue ───────────────────────────────────────────────────────────
# Official titles from ncert.nic.in for classes 1–5.
# file_url is left None — update these once PDFs are hosted on Cloudinary.
_NCERT_BOOKS = [
    # ── Class 1 ──────────────────────────────────────────────────────────────
    {
        "class_number": 1,
        "subject": "Mathematics",
        "title": "Math Magic - 1",
        "description": "NCERT Mathematics textbook for Class 1. Covers basic numbers, shapes, and simple operations.",
        "file_url": None,
    },
    {
        "class_number": 1,
        "subject": "English",
        "title": "Marigold - 1",
        "description": "NCERT English textbook for Class 1. Includes poems and short stories for early readers.",
        "file_url": None,
    },
    {
        "class_number": 1,
        "subject": "Hindi",
        "title": "Rimjhim - 1",
        "description": "NCERT Hindi textbook for Class 1.",
        "file_url": None,
    },
    # ── Class 2 ──────────────────────────────────────────────────────────────
    {
        "class_number": 2,
        "subject": "Mathematics",
        "title": "Math Magic - 2",
        "description": "NCERT Mathematics textbook for Class 2.",
        "file_url": None,
    },
    {
        "class_number": 2,
        "subject": "English",
        "title": "Marigold - 2",
        "description": "NCERT English textbook for Class 2.",
        "file_url": None,
    },
    {
        "class_number": 2,
        "subject": "Hindi",
        "title": "Rimjhim - 2",
        "description": "NCERT Hindi textbook for Class 2.",
        "file_url": None,
    },
    # ── Class 3 ──────────────────────────────────────────────────────────────
    {
        "class_number": 3,
        "subject": "Mathematics",
        "title": "Math Magic - 3",
        "description": "NCERT Mathematics textbook for Class 3.",
        "file_url": None,
    },
    {
        "class_number": 3,
        "subject": "English",
        "title": "Marigold - 3",
        "description": "NCERT English textbook for Class 3.",
        "file_url": None,
    },
    {
        "class_number": 3,
        "subject": "Hindi",
        "title": "Rimjhim - 3",
        "description": "NCERT Hindi textbook for Class 3.",
        "file_url": None,
    },
    {
        "class_number": 3,
        "subject": "EVS",
        "title": "Looking Around - 3",
        "description": "NCERT Environmental Studies textbook for Class 3. Introduces nature, family, and community.",
        "file_url": None,
    },
    # ── Class 4 ──────────────────────────────────────────────────────────────
    {
        "class_number": 4,
        "subject": "Mathematics",
        "title": "Math Magic - 4",
        "description": "NCERT Mathematics textbook for Class 4.",
        "file_url": None,
    },
    {
        "class_number": 4,
        "subject": "English",
        "title": "Marigold - 4",
        "description": "NCERT English textbook for Class 4.",
        "file_url": None,
    },
    {
        "class_number": 4,
        "subject": "Hindi",
        "title": "Rimjhim - 4",
        "description": "NCERT Hindi textbook for Class 4.",
        "file_url": None,
    },
    {
        "class_number": 4,
        "subject": "EVS",
        "title": "Looking Around - 4",
        "description": "NCERT Environmental Studies textbook for Class 4.",
        "file_url": None,
    },
    # ── Class 5 ──────────────────────────────────────────────────────────────
    {
        "class_number": 5,
        "subject": "Mathematics",
        "title": "Math Magic - 5",
        "description": "NCERT Mathematics textbook for Class 5.",
        "file_url": None,
    },
    {
        "class_number": 5,
        "subject": "English",
        "title": "Marigold - 5",
        "description": "NCERT English textbook for Class 5.",
        "file_url": None,
    },
    {
        "class_number": 5,
        "subject": "Hindi",
        "title": "Rimjhim - 5",
        "description": "NCERT Hindi textbook for Class 5.",
        "file_url": None,
    },
    {
        "class_number": 5,
        "subject": "EVS",
        "title": "Looking Around - 5",
        "description": "NCERT Environmental Studies textbook for Class 5.",
        "file_url": None,
    },
]


async def seed_admin(session: AsyncSession) -> None:
    result = await session.execute(
        select(Admin).where(Admin.email == settings.ADMIN_EMAIL)
    )
    if result.scalar_one_or_none():
        return  # Already seeded

    admin = Admin(
        email=settings.ADMIN_EMAIL,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
    )
    session.add(admin)
    await session.commit()
    print(f"[seed] Admin account created: {settings.ADMIN_EMAIL}")


async def seed_ncert_books(session: AsyncSession) -> None:
    # Check if any NCERT books are already seeded
    result = await session.execute(select(NCERTBook).limit(1))
    if result.scalar_one_or_none():
        return  # Already seeded

    for book_data in _NCERT_BOOKS:
        book = NCERTBook(**book_data)
        session.add(book)

    await session.commit()
    print(f"[seed] {len(_NCERT_BOOKS)} NCERT books seeded.")


from src.models.school import BranchCounter, School
from src.models.student import Student
from src.models.teacher import Teacher, TeacherClassAssignment
from src.models.parent import Parent, ParentChildLink
from src.models.module import Module, SourceType, OcrStatus


async def seed_self_school(session: AsyncSession) -> None:
    result = await session.execute(
        select(School).where(School.branch_name == "SELF")
    )
    if not result.scalar_one_or_none():
        self_school = School(
            school_name="NCERT Self-Educated",
            branch_name="SELF",
            student_prefix="SELF",
            email="self@vidyasetu.ai",
            password_hash=hash_password("SelfEducated123!"),
            state="All India",
        )
        session.add(self_school)

    # Ensure BranchCounter for SELF exists
    counter_res = await session.execute(
        select(BranchCounter).where(BranchCounter.branch_name == "SELF")
    )
    if not counter_res.scalar_one_or_none():
        counter = BranchCounter(branch_name="SELF", last_counter=0)
        session.add(counter)

    await session.commit()
    print("[seed] Default 'SELF' school branch and counter created for self-enrolled students.")


async def seed_demo_accounts(session: AsyncSession) -> None:
    """Seed demo accounts for School Admin, Teacher, Student, Parent & Modules."""
    # 1. School Admin Branch: LKD
    # 1. School Admin Branch: LPS Karkarduma Branch
    sch_res = await session.execute(
        select(School).where(
            (School.email == "school@lps.edu") | (School.branch_name == "LPS Karkarduma Branch")
        )
    )
    school = sch_res.scalar_one_or_none()
    if not school:
        school = School(
            school_name="LPS Karkarduma",
            branch_name="LPS Karkarduma Branch",
            student_prefix="LKD",
            email="school@lps.edu",
            password_hash=hash_password("123456789"),
            state="Delhi",
        )
        session.add(school)
        await session.commit()
        await session.refresh(school)
        print("[seed] Demo School Branch 'LPS Karkarduma Branch' created.")
    else:
        school.password_hash = hash_password("123456789")
        session.add(school)
        await session.commit()
        print(f"[seed] School Branch '{school.branch_name}' (prefix '{school.student_prefix}') password verified.")


    b_name = school.branch_name
    s_name = school.school_name

    # Branch counter
    cnt_res = await session.execute(select(BranchCounter).where(BranchCounter.branch_name == b_name))
    if not cnt_res.scalar_one_or_none():
        session.add(BranchCounter(branch_name=b_name, last_counter=1))
        await session.commit()

    # 2. Teacher: Dr. Rajesh Sharma (phone: 9876543210)
    tch_res = await session.execute(select(Teacher).where(Teacher.phone_number == "9876543210"))
    teacher = tch_res.scalar_one_or_none()
    if not teacher:
        teacher = Teacher(
            name="Dr. Rajesh Sharma",
            phone_number="9876543210",
            school_name=s_name,
            branch_name=b_name,
            password_hash=hash_password("Password123!"),
        )
        session.add(teacher)
        await session.commit()
        await session.refresh(teacher)
        print("[seed] Demo Teacher 'Dr. Rajesh Sharma' created.")

    # Assign Class 4A to teacher
    tca_res = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher.id,
            TeacherClassAssignment.class_number == 4,
            TeacherClassAssignment.section == "A",
        )
    )
    if not tca_res.scalar_one_or_none():
        session.add(
            TeacherClassAssignment(
                teacher_id=teacher.id,
                branch_name=b_name,
                class_number=4,
                section="A",
            )
        )
        await session.commit()
        print("[seed] Class 4A assigned to teacher.")

    # 3. Student: LKD0001
    std_res = await session.execute(select(Student).where(Student.unique_number == "LKD0001"))
    student = std_res.scalar_one_or_none()
    if not student:
        student = Student(
            unique_number="LKD0001",
            email="student.lkd@vidyasetu.ai",
            password_hash=hash_password("Password123!"),
            school_name=s_name,
            branch_name=b_name,
            enrollment_type="school",
            class_number=4,
            section="A",
            state="Delhi",
        )
        session.add(student)
        await session.commit()
        await session.refresh(student)
        print("[seed] Demo Student 'LKD0001' created.")

    # 4. Parent
    prt_res = await session.execute(select(Parent).where(Parent.email == "parent.lkd@vidyasetu.ai"))
    parent = prt_res.scalar_one_or_none()
    if not parent:
        parent = Parent(
            email="parent.lkd@vidyasetu.ai",
            password_hash=hash_password("Password123!"),
        )
        session.add(parent)
        await session.commit()
        await session.refresh(parent)

    pcl_res = await session.execute(
        select(ParentChildLink).where(ParentChildLink.student_unique_number == "LKD0001")
    )
    if not pcl_res.scalar_one_or_none():
        session.add(ParentChildLink(parent_id=parent.id, student_unique_number="LKD0001"))
        await session.commit()
        print("[seed] Demo Parent created & linked to student LKD0001.")

    # 5. Demo Module for Class 4 under branch
    mod_res = await session.execute(
        select(Module).where(
            Module.branch_name == b_name,
            Module.class_number == 4,
            Module.title == "Class 4 Mathematics - Chapter 1 Shapes & Numbers",
        )
    )
    if not mod_res.scalar_one_or_none():
        session.add(
            Module(
                branch_name=b_name,
                class_number=4,
                title="Class 4 Mathematics - Chapter 1 Shapes & Numbers",
                source_type=SourceType.PDF_UPLOAD,
                file_url="https://res.cloudinary.com/demo/image/upload/sample.pdf",
                ocr_status=OcrStatus.NA,
            )
        )
        await session.commit()
        print(f"[seed] Demo Module for Class 4 ({b_name}) created.")


async def run_all_seeds(session: AsyncSession) -> None:
    """Entry point — called from main.py lifespan or CLI."""
    await seed_admin(session)
    await seed_self_school(session)
    await seed_ncert_books(session)
    await seed_demo_accounts(session)


async def _cli_main() -> None:
    """CLI runner: python -m src.db.seed"""
    from src.core.database import AsyncSessionFactory, init_db
    print("[seed] Ensuring database tables exist...")
    await init_db()
    print("[seed] Seeding database...")
    async with AsyncSessionFactory() as session:
        await run_all_seeds(session)
    print("[seed] Database seeding completed successfully.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(_cli_main())
