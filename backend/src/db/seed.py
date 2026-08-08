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

async def seed_self_school(session: AsyncSession) -> None:
    result = await session.execute(
        select(School).where(School.branch_name == "SELF")
    )
    if not result.scalar_one_or_none():
        self_school = School(
            school_name="NCERT Self-Educated",
            branch_name="SELF",
            student_prefix="SELF",
            email="self@inclulearn.ai",
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


async def run_all_seeds(session: AsyncSession) -> None:
    """Entry point — called from main.py lifespan."""
    await seed_admin(session)
    await seed_self_school(session)
    await seed_ncert_books(session)
