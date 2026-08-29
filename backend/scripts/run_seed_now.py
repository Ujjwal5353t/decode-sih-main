import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import AsyncSessionFactory, init_db
from src.db.seed import run_all_seeds


async def main():
    print("[seed_now] Initializing database tables...", flush=True)
    await init_db()
    print("[seed_now] Running seed pipeline...", flush=True)
    async with AsyncSessionFactory() as session:
        await run_all_seeds(session)
    print("[seed_now] Seeding finished successfully!", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
