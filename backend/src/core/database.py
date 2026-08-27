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
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
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
        await conn.execute(
            text("ALTER TABLE parents ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);")
        )
        await conn.execute(
            text("ALTER TABLE parents ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);")
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
                        UPDATE schools SET subjects_configured_at = NOW();
                    END IF;
                END
                $do$;
                """
            )
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
