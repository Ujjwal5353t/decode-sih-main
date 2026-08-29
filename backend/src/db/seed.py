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
from src.db.curriculum_seed import seed_topics
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
    if not result.scalar_one_or_none():
        for book_data in _NCERT_BOOKS:
            book = NCERTBook(**book_data)
            session.add(book)

        await session.commit()
        print(f"[seed] {len(_NCERT_BOOKS)} NCERT books seeded.")

    # Seed template chapter chunks for every NCERT book that has hand-authored
    # content in ncert_content.py. Per-book idempotency (not "any SELF chunk
    # exists") so this backfills newly-added books on an existing DB instead
    # of silently no-op'ing forever once the first book was ever chunked.
    from src.db.ncert_content import NCERT_CHAPTER_TEXT
    from src.models.chunk import DocumentChunk
    from src.services.chunk_service import ingest_module_text

    all_books = await session.execute(select(NCERTBook))
    books_by_key = {(b.subject, b.class_number): b for b in all_books.scalars().all()}

    seeded_count = 0
    for (subject, class_number), full_text in NCERT_CHAPTER_TEXT.items():
        book = books_by_key.get((subject, class_number))
        if book is None:
            continue

        chk_res = await session.execute(
            select(DocumentChunk).where(DocumentChunk.ncert_book_id == book.id).limit(1)
        )
        if chk_res.scalar_one_or_none():
            continue  # already chunked

        await ingest_module_text(
            session=session,
            branch_name="SELF",
            class_number=class_number,
            subject=subject,
            text=full_text,
            ncert_book_id=book.id,
            module_title=book.title,
        )
        seeded_count += 1

    if seeded_count:
        print(f"[seed] Seeded template NCERT chunks for {seeded_count} book(s) under SELF.")


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
            phone_number="919810022002",
            password_hash=hash_password("123456789"),
            state="Delhi",
            udise_code="07040100305",
            district="East Delhi",
            board="CBSE",
            management="Private Unaided",
            verification_status="verified",
        )
        session.add(school)
        await session.commit()
        await session.refresh(school)
        print("[seed] Demo School Branch 'LPS Karkarduma Branch' created.")
    else:
        if not school.udise_code:
            school.udise_code = "07040100305"
        if not school.district:
            school.district = "East Delhi"
        if not school.board:
            school.board = "CBSE"
        if not school.management:
            school.management = "Private Unaided"
        if not school.phone_number:
            school.phone_number = "919810022002"
        school.verification_status = "verified"
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

    # Assign Class 4A Mathematics to teacher
    tca_res = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher.id,
            TeacherClassAssignment.class_number == 4,
            TeacherClassAssignment.section == "A",
            TeacherClassAssignment.subject == "Mathematics",
        )
    )
    if not tca_res.scalar_one_or_none():
        session.add(
            TeacherClassAssignment(
                teacher_id=teacher.id,
                branch_name=b_name,
                class_number=4,
                section="A",
                subject="Mathematics",
            )
        )
        await session.commit()
        print("[seed] Class 4A (Mathematics) assigned to teacher.")

    # 3. Student: LKD0001
    std_res = await session.execute(select(Student).where(Student.unique_number == "LKD0001"))
    student = std_res.scalar_one_or_none()
    if not student:
        student = Student(
            unique_number="LKD0001",
            full_name="Aarav Sharma",
            email="student.lkd@vidyasetu.ai",
            phone_number="9876543210",
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
    elif not student.full_name or student.full_name == "Student":
        student.full_name = "Aarav Sharma"
        if not student.phone_number:
            student.phone_number = "9876543210"
        session.add(student)
        await session.commit()

    # 4. Parent
    prt_res = await session.execute(select(Parent).where(Parent.email == "parent.lkd@vidyasetu.ai"))
    parent = prt_res.scalar_one_or_none()
    if not parent:
        parent = Parent(
            full_name="Rajesh Sharma",
            email="parent.lkd@vidyasetu.ai",
            phone_number="9876543210",
            password_hash=hash_password("Password123!"),
        )
        session.add(parent)
        await session.commit()
        await session.refresh(parent)
    elif not parent.full_name:
        parent.full_name = "Rajesh Sharma"
        if not parent.phone_number:
            parent.phone_number = "9876543210"
        session.add(parent)
        await session.commit()

    pcl_res = await session.execute(
        select(ParentChildLink).where(ParentChildLink.student_unique_number == "LKD0001")
    )
    if not pcl_res.scalar_one_or_none():
        session.add(ParentChildLink(parent_id=parent.id, student_unique_number="LKD0001"))
        await session.commit()
        print("[seed] Demo Parent created & linked to student LKD0001.")

    # 5. Demo Modules & Chunks for Class 4 under branch
    mod_res = await session.execute(
        select(Module).where(
            Module.branch_name == b_name,
            Module.class_number == 4,
            Module.title == "Looking Around - Class 4 EVS",
        )
    )
    evs_mod = mod_res.scalar_one_or_none()
    if not evs_mod:
        evs_mod = Module(
            branch_name=b_name,
            class_number=4,
            subject="EVS",
            title="Looking Around - Class 4 EVS",
            source_type=SourceType.PDF_UPLOAD,
            file_url="https://res.cloudinary.com/demo/image/upload/sample.pdf",
            ocr_status=OcrStatus.NA,
        )
        session.add(evs_mod)
        await session.commit()
        await session.refresh(evs_mod)

        from src.services.chunk_service import ingest_module_text
        evs_text = (
            "Chapter 1: Going to School\n"
            "In Assam, children use bamboo and rope bridges to cross river streams and reach school. "
            "In Ladakh, children use a trolley pulled over an iron rope to cross deep valleys to get to school. "
            "In Kerala, a Vallam (wooden boat) carries students across backwaters. "
            "In Rajasthan, children ride camel carts across sandy terrain.\n\n"
            "Chapter 2: Ear to Ear\n"
            "Animals with visible ears and hair on their skin give birth to live babies. "
            "Animals with hidden ear holes covered by feathers or skin lay eggs.\n\n"
            "Chapter 3: A Day with Nandu\n"
            "Elephants live in matriarchal herds led by the oldest female elephant. "
            "Baby elephants play in mud and splash water to keep cool."
        )
        await ingest_module_text(
            session=session,
            branch_name=b_name,
            class_number=4,
            subject="EVS",
            text=evs_text,
            module_id=evs_mod.id,
            module_title=evs_mod.title,
        )
        print(f"[seed] Demo EVS Module & Chunks for Class 4 ({b_name}) created.")


# ── School directory (official records for school verification) ───────────────

SCHOOL_DIRECTORY_SEED = [
    {
        "udise_code": "07040100201",
        "school_name": "ABC Public School",
        "state": "Delhi",
        "district": "South Delhi",
        "management": "Private Unaided",
        "board": "CBSE",
        "official_email": "principal@abcpublicschool.edu.in",
        "official_phone": "+919810011001",
        "head_name": "Rajesh Menon",
    },
    {
        "udise_code": "07040100305",
        "school_name": "LPS Karkarduma",
        "state": "Delhi",
        "district": "East Delhi",
        "management": "Private Unaided",
        "board": "CBSE",
        "official_email": "school@lps.edu",
        "official_phone": "+919810022002",
        "head_name": "Anita Sharma",
    },
    {
        "udise_code": "27260500712",
        "school_name": "Shivaji Vidyalaya",
        "state": "Maharashtra",
        "district": "Pune",
        "management": "Government Aided",
        "board": "State Board",
        "official_email": "head@shivajividyalaya.org",
        "official_phone": "+919820033003",
        "head_name": "Sunil Deshpande",
    },
    {
        "udise_code": "29280600418",
        "school_name": "Green Valley International School",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "management": "Private Unaided",
        "board": "ICSE",
        "official_email": "office@greenvalleyintl.edu.in",
        "official_phone": "+919845044004",
        "head_name": "Meera Iyer",
    },
    {
        "udise_code": "33300700915",
        "school_name": "Government Higher Secondary School Adyar",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "management": "Government",
        "board": "State Board",
        "official_email": "ghss.adyar@tn.gov.in",
        "official_phone": "+919840055005",
        "head_name": "K. Rajalakshmi",
    },
]


async def seed_school_directory(session: AsyncSession) -> None:
    """
    Seed official school records used by the school verification flow.

    This is sample directory data standing in for an official UDISE feed —
    src/services/school_verification_service.py is the integration point where
    a real directory would be plugged in.
    """
    from src.models.school_verification import SchoolDirectory

    created = 0
    for entry in SCHOOL_DIRECTORY_SEED:
        existing = await session.execute(
            select(SchoolDirectory).where(
                SchoolDirectory.udise_code == entry["udise_code"]
            )
        )
        if existing.scalar_one_or_none():
            continue
        session.add(SchoolDirectory(**entry))
        created += 1

PUBLISHER_SEED = [
    {
        "name": "NCERT",
        "subjects": [
            "Mathematics (Math-Magic)",
            "English (Marigold / Mridang)",
            "Hindi (Rimjhim / Sarangi)",
            "Environmental Studies (EVS)",
            "Art & Craft",
            "Urdu (Ibtidai Urdu)",
        ],
    },
    {
        "name": "Oxford University Press",
        "subjects": [
            "English (New Oxford Modern English)",
            "Mathematics (New Countdown)",
            "Environmental Studies (EVS)",
            "Computer Studies (Keyboard)",
            "General Knowledge (GK)",
            "Hindi (Madhur Hindi)",
        ],
    },
    {
        "name": "Cambridge University Press",
        "subjects": [
            "English (Cambridge Express)",
            "Mathematics (Primary Mathematics)",
            "Environmental Studies (EVS)",
            "Computer Science (Click Start)",
            "General Knowledge (Primary GK)",
        ],
    },
    {
        "name": "Pearson",
        "subjects": [
            "English (Longman Active English)",
            "Mathematics (Universal Mathematics)",
            "Environmental Studies (EVS)",
            "Computer Science (Computer Masti)",
            "General Knowledge (GK)",
        ],
    },
    {
        "name": "S. Chand",
        "subjects": [
            "Composite Mathematics",
            "Awareness Environmental Studies (EVS)",
            "English Grammar & Composition",
            "General Knowledge (GK)",
            "Computer Studies (IT Planet)",
            "Moral Science / Value Education",
        ],
    },
    {
        "name": "Ratna Sagar",
        "subjects": [
            "Communicate in English",
            "Number Magic (Mathematics)",
            "Environmental Studies (My Green World)",
            "Super GK (General Knowledge)",
            "Living Values (Moral Science)",
            "Art & Craft",
        ],
    },
    {
        "name": "Cordova Publications",
        "subjects": [
            "Mastering Mathematics",
            "Enjoying Environmental Studies (EVS)",
            "Stepping Stones English",
            "Smart Tech Computer",
            "Gyan Sarovar Hindi",
            "Moral Values & Life Skills",
        ],
    },
    {
        "name": "Madhubun Educational Books",
        "subjects": [
            "Madhup Hindi Pathmala",
            "Vitan Hindi",
            "Gulmohar English",
            "Headstart Mathematics",
            "Green Circle (EVS)",
            "General Knowledge",
        ],
    },
    {
        "name": "MacMillan Education",
        "subjects": [
            "English Ferry",
            "Maths Xpress",
            "Eco-Explorers (EVS)",
            "Hop Skip and Jump",
            "Computer Explorers",
        ],
    },
    {
        "name": "Orient BlackSwan",
        "subjects": [
            "Gul Mohar (English)",
            "Orient Primary Math",
            "Buzzword English",
            "New Tree of Life (EVS)",
            "General Knowledge",
        ],
    },
]



async def seed_publishers(session: AsyncSession) -> None:
    """Seed initial list of standard textbook publishers and their subjects."""
    from src.models.publisher import Publisher, PublisherSubject

    pub_count = 0
    sub_count = 0

    for pub_data in PUBLISHER_SEED:
        pub_name = pub_data["name"]
        res = await session.execute(
            select(Publisher).where(Publisher.name == pub_name)
        )
        pub = res.scalar_one_or_none()
        if not pub:
            pub = Publisher(name=pub_name)
            session.add(pub)
            await session.flush()
            pub_count += 1

        for sub_name in pub_data["subjects"]:
            sub_res = await session.execute(
                select(PublisherSubject).where(
                    PublisherSubject.publisher_id == pub.id,
                    PublisherSubject.subject_name == sub_name,
                )
            )
            if not sub_res.scalars().first():
                session.add(
                    PublisherSubject(
                        publisher_id=pub.id,
                        subject_name=sub_name,
                    )
                )
                sub_count += 1

    if pub_count > 0 or sub_count > 0:
        await session.commit()
        print(f"[seed] Seeded {pub_count} publishers and {sub_count} publisher subjects.")


async def run_all_seeds(session: AsyncSession) -> None:
    """Entry point — called from main.py lifespan or CLI."""
    await seed_admin(session)
    await seed_self_school(session)
    await seed_school_directory(session)
    await seed_publishers(session)
    await seed_ncert_books(session)
    await seed_demo_accounts(session)
    await seed_topics(session)



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
