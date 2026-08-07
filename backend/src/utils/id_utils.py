"""
Atomic student unique-number generation.

Format: <PREFIX><COUNTER>
  PREFIX  — school's student_prefix (e.g. "LKD"), stored in schools.student_prefix
  COUNTER — zero-padded 4-digit integer from branch_counters.last_counter + 1
            e.g. 0001, 0002 … 9999 (supports 9 999 students per branch)

Atomicity: the BranchCounter row is locked with SELECT FOR UPDATE inside a
transaction, so concurrent registrations cannot produce duplicate IDs.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.school import BranchCounter, School


async def generate_student_unique_number(
    session: AsyncSession,
    school: School,
) -> str:
    """
    Atomically increment the branch counter and return the next unique number.
    Must be called inside an open transaction (FastAPI session dependency
    auto-manages the transaction).
    """
    # Lock the counter row for this branch to prevent race conditions
    result = await session.execute(
        text(
            "SELECT last_counter FROM branch_counters "
            "WHERE branch_name = :branch FOR UPDATE"
        ),
        {"branch": school.branch_name},
    )
    row = result.fetchone()

    if row is None:
        raise ValueError(
            f"No branch counter found for branch '{school.branch_name}'. "
            "This should have been created during school registration."
        )

    next_counter = row[0] + 1
    padded = str(next_counter).zfill(4)  # 0001 … 9999

    # Update counter
    await session.execute(
        text(
            "UPDATE branch_counters SET last_counter = :counter "
            "WHERE branch_name = :branch"
        ),
        {"counter": next_counter, "branch": school.branch_name},
    )

    return f"{school.student_prefix}{padded}"
