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
    if not result.scalar_one_or_none():
        for book_data in _NCERT_BOOKS:
            book = NCERTBook(**book_data)
            session.add(book)

        await session.commit()
        print(f"[seed] {len(_NCERT_BOOKS)} NCERT books seeded.")

    # Seed template chapter chunks for NCERT Class 4 EVS & Math
    from src.models.chunk import DocumentChunk
    from src.services.chunk_service import ingest_module_text

    chk_res = await session.execute(select(DocumentChunk).where(DocumentChunk.branch_name == "SELF").limit(1))
    if not chk_res.scalar_one_or_none():
        # Fetch Class 4 EVS NCERT Book
        evs_res = await session.execute(
            select(NCERTBook).where(NCERTBook.class_number == 4, NCERTBook.subject == "EVS")
        )
        evs_book = evs_res.scalar_one_or_none()

        if evs_book:
            evs_full_text = (
                "Chapter 1: Going to School\n"
                "Children use different ways to reach school in different parts of India. "
                "In Assam, children cross bamboo and rope bridges to reach school when it rains heavily. "
                "In Ladakh, children use a trolley attached to a strong iron rope over a wide and deep river to cross over. "
                "In Kerala, children use a Vallam (a small wooden boat) to reach school. "
                "In Rajasthan desert, children ride in camel carts over hot sand. "
                "In plains, children ride bullock carts or bicycles through green fields.\n\n"
                "Chapter 2: Ear to Ear\n"
                "Different animals have different types of ears. Animals like elephants, rabbits, dogs, and tigers have ears that can be seen. "
                "Birds, frogs, lizards, and snakes have ears, but they are tiny holes covered with feathers or skin. "
                "Animals whose ears can be seen and have hair on their skin give birth to young ones (Viviparous). "
                "Animals whose ears cannot be seen and do not have hair on their skin lay eggs (Oviparous).\n\n"
                "Chapter 3: A Day with Nandu\n"
                "Nandu is a three-month-old baby elephant. Elephants live in herds. "
                "An elephant herd has mainly females and baby elephants. The oldest female elephant is the leader of the herd. "
                "Adult elephants eat more than 100 kilograms of leaves and twigs in one day. "
                "Elephants sleep for only 2 to 4 hours a day. They love to play in mud and water to keep their skin cool.\n\n"
                "Chapter 4: The Story of Amrita\n"
                "Amrita lived in Khejadli village near Jodhpur in Rajasthan. The village got its name from the many Khejadi trees that grew there. "
                "The people of Khejadli were called Bishnois. They cared deeply for plants and animals, saying 'Agar ped hain to hum hain'. "
                "When the King sent soldiers to cut trees to build his palace, Amrita and her three daughters hugged the trees to protect them. "
                "Over 300 villagers sacrificed their lives protecting the Khejadi trees."
            )
            await ingest_module_text(
                session=session,
                branch_name="SELF",
                class_number=4,
                subject="EVS",
                text=evs_full_text,
                ncert_book_id=evs_book.id,
                module_title=evs_book.title,
            )
            print("[seed] Seeded 4 chapters of Class 4 EVS NCERT chunks under SELF.")

        # Fetch Class 4 Math NCERT Book
        math_res = await session.execute(
            select(NCERTBook).where(NCERTBook.class_number == 4, NCERTBook.subject == "Mathematics")
        )
        math_book = math_res.scalar_one_or_none()

        if math_book:
            math_full_text = (
                "Chapter 1: Building with Bricks\n"
                "Bricks have 6 faces, 12 edges, and 8 corners. Masons in Murshidabad built beautiful brick floor patterns for Jagriti School. "
                "Arches and brick patterns can be seen in old bridges and kilns. "
                "A brick kiln bakes thousands of raw clay bricks. One brick usually measures 20 cm by 10 cm by 10 cm.\n\n"
                "Chapter 2: Long and Short\n"
                "Distance is measured in millimeters, centimeters, meters, and kilometers. 100 centimeters equals 1 meter, and 1000 meters equals 1 kilometer. "
                "Marathon races are about 40 kilometers long. Height is measured using a measuring tape. "
                "Comparing heights of classmates helps understand difference in length.\n\n"
                "Chapter 3: A Trip to Bhopal\n"
                "Class 4 students went on a school trip to Bhopal. Each mini bus held 35 children. "
                "They crossed the Narmada bridge which is 756.8 meters long. "
                "At Bhimbetka, they saw 10,000-year-old cave paintings of wild bulls, rhinos, and deer drawn on cave walls."
            )
            await ingest_module_text(
                session=session,
                branch_name="SELF",
                class_number=4,
                subject="Mathematics",
                text=math_full_text,
                ncert_book_id=math_book.id,
                module_title=math_book.title,
            )
            print("[seed] Seeded 3 chapters of Class 4 Math NCERT chunks under SELF.")


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

    if created:
        await session.commit()
    print(f"[seed] School directory ready ({created} new official record(s)).")


async def run_all_seeds(session: AsyncSession) -> None:
    """Entry point — called from main.py lifespan or CLI."""
    await seed_admin(session)
    await seed_self_school(session)
    await seed_school_directory(session)
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
