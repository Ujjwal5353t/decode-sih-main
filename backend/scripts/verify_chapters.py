import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import AsyncSessionFactory
from src.services.chunk_service import get_class_chapters


async def main():
    async with AsyncSessionFactory() as session:
        chapters_general = await get_class_chapters(
            session=session,
            branch_name="LPS Karkarduma Branch",
            class_number=4,
            subject="General",
        )
        print(f"\n[VERIFY] Class 4 'General' Subject Chapters Found ({len(chapters_general)}):")
        for ch in chapters_general:
            print(f"  - Chapter {ch.chapter_number}: {ch.chapter_title} ({ch.module_title} • {ch.subject})")

        chapters_evs = await get_class_chapters(
            session=session,
            branch_name="LPS Karkarduma Branch",
            class_number=4,
            subject="EVS",
        )
        print(f"\n[VERIFY] Class 4 EVS Chapters Found ({len(chapters_evs)}):")
        for ch in chapters_evs:
            print(f"  - Chapter {ch.chapter_number}: {ch.chapter_title} ({ch.module_title})")


if __name__ == "__main__":
    asyncio.run(main())
