import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from src.core.database import engine


async def fix_db_subjects():
    print("[fix_db_subjects] Updating missing/general subjects in DB...")
    async with engine.begin() as conn:
        # Update modules with title hints
        await conn.execute(
            text("UPDATE modules SET subject = 'Mathematics' WHERE (subject IS NULL OR subject = '' OR subject = 'General') AND (title ILIKE '%math%' OR title ILIKE '%shapes%');")
        )
        await conn.execute(
            text("UPDATE modules SET subject = 'EVS' WHERE (subject IS NULL OR subject = '' OR subject = 'General') AND (title ILIKE '%evs%' OR title ILIKE '%looking around%');")
        )
        # Update document_chunks with title hints
        await conn.execute(
            text("UPDATE document_chunks SET subject = 'Mathematics' WHERE (subject IS NULL OR subject = '' OR subject = 'General') AND (chapter_title ILIKE '%math%' OR content ILIKE '%math%' OR chapter_title ILIKE '%shapes%');")
        )
        await conn.execute(
            text("UPDATE document_chunks SET subject = 'EVS' WHERE (subject IS NULL OR subject = '' OR subject = 'General') AND (chapter_title ILIKE '%evs%' OR content ILIKE '%evs%');")
        )
    print("[fix_db_subjects] Database subjects fixed successfully!")


if __name__ == "__main__":
    asyncio.run(fix_db_subjects())
