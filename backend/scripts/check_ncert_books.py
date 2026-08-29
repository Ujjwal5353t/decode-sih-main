import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from src.core.database import AsyncSessionFactory
from src.models.ncert import NCERTBook


async def main():
    async with AsyncSessionFactory() as session:
        print("=== Checking NCERT Books in DB ===")
        res = await session.execute(select(NCERTBook))
        books = list(res.scalars().all())
        print(f"Total NCERT books in DB: {len(books)}")
        for b in books:
            print(f"  - Title: '{b.title}' | Class: {b.class_number} | Subject: '{b.subject}' (ID: {b.id})")


if __name__ == "__main__":
    asyncio.run(main())
