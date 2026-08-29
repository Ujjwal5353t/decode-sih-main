from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from src.core.config import settings

# Async engine — asyncpg driver
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    # Disable asyncpg prepared statement cache to avoid
    # InvalidCachedStatementError after schema/column type changes.
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)

# Async session factory
AsyncSessionFactory = sessionmaker(  # type: ignore[call-overload]
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


from sqlalchemy import text

async def init_db() -> None:
    """Create all tables on startup (idempotent) and apply missing column migrations."""
    import src.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

        # Ensure publishers & publisher_subjects tables exist
        await conn.execute(
            text("CREATE TABLE IF NOT EXISTS publishers (id UUID PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE, created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW());")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_publishers_name ON publishers (name);")
        )
        await conn.execute(
            text("CREATE TABLE IF NOT EXISTS publisher_subjects (id UUID PRIMARY KEY, publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE, subject_name VARCHAR(150) NOT NULL, created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW());")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_publisher_subjects_publisher_id ON publisher_subjects (publisher_id);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_publisher_subjects_subject_name ON publisher_subjects (subject_name);")
        )


        # Migration: ensure enrollment_type column exists on students table
        await conn.execute(
            text("ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) DEFAULT 'school';")
        )
        # Migration: expand section column to support 'SELF' for self-enrolled students
        await conn.execute(
            text("ALTER TABLE students ALTER COLUMN section TYPE VARCHAR(10);")
        )
        # Migration: add phone_number and full_name columns
        await conn.execute(
            text("ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);")
        )
        await conn.execute(
            text("ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(150) DEFAULT '';")
        )
        await conn.execute(
            text("ALTER TABLE students ALTER COLUMN email DROP NOT NULL;")
        )
        # Migration: ensure preferred_language column exists on students and parents
        await conn.execute(
            text("ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';")
        )
        await conn.execute(
            text("ALTER TABLE parents ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);")
        )
        await conn.execute(
            text("ALTER TABLE parents ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);")
        )
        await conn.execute(
            text("ALTER TABLE parents ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';")
        )
        await conn.execute(
            text("ALTER TABLE parents ALTER COLUMN email DROP NOT NULL;")
        )
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);")
        )
        await conn.execute(
            text("ALTER TABLE schools ALTER COLUMN email DROP NOT NULL;")
        )
        # Migration: add OCR tracking columns to modules table
        await conn.execute(
            text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(20) DEFAULT 'pending';")
        )
        await conn.execute(
            text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS ocr_pdf_url TEXT;")
        )
        await conn.execute(
            text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS ocr_pdf_public_id TEXT;")
        )
        # Migration: school verification columns.
        # DEFAULT 'verified' so every school account that existed before the
        # verification flow keeps its current access unchanged.
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'verified';")
        )
        await conn.execute(
            text("UPDATE schools SET verification_status = 'verified' WHERE verification_status IS NULL;")
        )
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS udise_code VARCHAR(20);")
        )
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS district VARCHAR(120);")
        )
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS board VARCHAR(60);")
        )
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS management VARCHAR(120);")
        )
        await conn.execute(
            text("ALTER TABLE schools ADD COLUMN IF NOT EXISTS owner_claim_id UUID;")
        )
        # Migration: first-run class/subject setup marker.
        # NULL means "setup still due". School accounts that predate this column
        # are stamped as already configured in the same step that adds it, so
        # existing admins keep landing straight on their dashboard. Guarded by a
        # column-existence check so the backfill can only ever run once.
        await conn.execute(
            text(
                """
                DO $do$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'schools'
                          AND column_name = 'subjects_configured_at'
                    ) THEN
                        ALTER TABLE schools ADD COLUMN subjects_configured_at TIMESTAMP;
                    END IF;
                END
                $do$;
                """
            )
        )
        # Migration: class-wise subjects & publishers for claims & school class subjects
        await conn.execute(
            text("ALTER TABLE school_admin_claims ADD COLUMN IF NOT EXISTS class_subjects_json TEXT;")
        )
        await conn.execute(
            text("ALTER TABLE school_class_subjects ADD COLUMN IF NOT EXISTS publisher_name VARCHAR(150);")
        )

        # Migration: add scoring columns to quiz_attempts (added after the table
        # first shipped without them)
        await conn.execute(
            text("ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS overall_score DOUBLE PRECISION;")
        )
        await conn.execute(
            text("ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS subject_scores JSONB DEFAULT '{}'::jsonb;")
        )
        # Migration: school-module-grounded quiz questions
        await conn.execute(
            text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS subject VARCHAR(100);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id);")
        )
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS branch_name VARCHAR(120);")
        )
        # Migration: image-emoji stand-in for questions that identify
        # something visually (no image-hosting pipeline exists)
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_emoji VARCHAR(8);")
        )
        # Migration: background-generated AI result summary
        await conn.execute(
            text("ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS ai_summary TEXT;")
        )
        await conn.execute(
            text("ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS ai_summary_status VARCHAR(20) DEFAULT 'pending';")
        )
        # Migration: per-option emoji, for image-forward answer choices
        await conn.execute(
            text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_emojis JSONB;")
        )
        # Migration: curated illustration library asset keys (real pictures,
        # pre-seeded offline) — preferred over image_emoji/option_emojis
        # when the question's picture is in the vocabulary.
        # Migration: add subject column to teacher_class_assignments
        await conn.execute(
            text("ALTER TABLE teacher_class_assignments ADD COLUMN IF NOT EXISTS subject VARCHAR(100);")
        )
        await conn.execute(
            text("DELETE FROM teacher_class_assignments WHERE subject IS NULL OR subject = '';")
        )
        # Migration: add subject and chapter_numbers columns to assignments
        await conn.execute(
            text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS subject VARCHAR(100);")
        )
        await conn.execute(
            text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS chapter_numbers TEXT;")
        )
        await conn.execute(
            text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 15;")
        )
        await conn.execute(
            text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pass_percentage DOUBLE PRECISION DEFAULT 60.0;")
        )

        # Migration: add scoring & multi-attempt columns to assignment_submissions
        await conn.execute(
            text("ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS percentage DOUBLE PRECISION;")
        )
        await conn.execute(
            text("ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS is_passed BOOLEAN;")
        )
        await conn.execute(
            text("ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS total_attempts INTEGER DEFAULT 1;")
        )
        await conn.execute(
            text("ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';")
        )
        await conn.execute(
            text("ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS response_pdf_url TEXT;")
        )

        # Migration: ensure assignment_attempts table exists
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS assignment_attempts (
                    id UUID PRIMARY KEY,
                    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                    student_unique_number VARCHAR(20) NOT NULL,
                    attempt_number INTEGER DEFAULT 1,
                    score DOUBLE PRECISION,
                    max_score DOUBLE PRECISION DEFAULT 100.0,
                    percentage DOUBLE PRECISION,
                    is_passed BOOLEAN,
                    status VARCHAR(20) DEFAULT 'submitted',
                    answers_json TEXT,
                    response_pdf_url TEXT,
                    teacher_feedback TEXT,
                    ai_feedback TEXT,
                    ai_feedback_status VARCHAR(20) DEFAULT 'pending',
                    started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                    completed_at TIMESTAMP WITHOUT TIME ZONE
                );
                """
            )
        )



        # Migration: append-only learning-activity event log (see
        # src/models/learning.py). Created here as well as via create_all so
        # deployments that run with AUTO_CREATE_TABLES off still get it, the
        # same way the publishers tables above are handled.
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS learning_events (
                    id UUID PRIMARY KEY,
                    client_event_id VARCHAR(80) NOT NULL,
                    student_id UUID NOT NULL REFERENCES students(id),
                    event_type VARCHAR(30) NOT NULL,
                    module_key VARCHAR(160) NOT NULL,
                    subject VARCHAR(100) NOT NULL,
                    class_number INTEGER NOT NULL,
                    lesson_id UUID REFERENCES lessons(id),
                    occurred_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                    received_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                    duration_ms INTEGER,
                    detail JSON
                );
                """
            )
        )
        # Ensure all columns exist on learning_events if the table pre-dated them
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS client_event_id VARCHAR(80);")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS student_id UUID;")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(30);")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS module_key VARCHAR(160);")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS subject VARCHAR(100);")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS class_number INTEGER;")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS lesson_id UUID;")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS duration_ms INTEGER;")
        )
        await conn.execute(
            text("ALTER TABLE learning_events ADD COLUMN IF NOT EXISTS detail JSON;")
        )

        # The idempotency guarantee the offline sync queue relies on: a
        # re-sent event can never become a second row.
        await conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_learning_event_client_id "
                "ON learning_events (student_id, client_event_id);"
            )
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_learning_events_student_id ON learning_events (student_id);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_learning_events_module_key ON learning_events (module_key);")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_learning_events_occurred_at ON learning_events (occurred_at);")
        )


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
