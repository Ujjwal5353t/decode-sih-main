import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from src.core.database import engine


async def main():
    print("[MIGRATE] Adding chapter_numbers column to assignments table...")
    async with engine.begin() as conn:
        await conn.execute(
            text("ALTER TABLE assignments ADD COLUMN IF NOT EXISTS chapter_numbers TEXT;")
        )
    print("[MIGRATE] Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
