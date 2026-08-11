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


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
