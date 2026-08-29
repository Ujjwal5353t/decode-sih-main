import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import AsyncSessionFactory
from src.services import module_service


async def main():
    async with AsyncSessionFactory() as session:
        print("[TEST] Fetching Class 3 modules for 'LPS Karkarduma Branch'...")
        modules = await module_service.get_class_modules("LPS Karkarduma Branch", 3, session)
        print(f"[SUCCESS] Total Class 3 Modules for 'LPS Karkarduma Branch': {len(modules)}")
        for m in modules:
            print(f"  - Title: '{m.title}' | Subject: '{m.subject}' | Source: {m.source_type}")


if __name__ == "__main__":
    asyncio.run(main())
