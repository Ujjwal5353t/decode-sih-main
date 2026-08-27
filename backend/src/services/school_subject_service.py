"""
Class/subject setup for a school.

Classes are not invented here: the platform supports classes 1–5 everywhere
(Module.class_number, NCERTBook.class_number, GET /school/classes), and this
service reads that same range.

The subject list offered for a class is built from the NCERT master catalogue
already seeded in the database — whatever subjects exist there for that class
are its core subjects. A short list of common primary-school subjects is offered
alongside them so an admin can record what their school actually teaches; it is
only ever a menu, never a selection.
"""

from datetime import datetime
from typing import Iterable, Sequence

from fastapi import HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.ncert import NCERTBook
from src.models.school import School
from src.models.school_subject import SchoolClassSubject

# The class range the rest of the platform is built on.
SUPPORTED_CLASSES = list(range(1, 6))

# Offered in addition to whatever the NCERT catalogue holds for a class, so a
# school can record non-textbook subjects it teaches. Selection is always the
# admin's — nothing here is pre-ticked.
ADDITIONAL_SUBJECTS = [
    "Computer",
    "General Knowledge",
    "Art & Craft",
    "Physical Education",
    "Moral Science",
    "Music",
]


def class_label(class_number: int) -> str:
    return f"Class {class_number}"


async def _ncert_subjects_by_class(session: AsyncSession) -> dict[int, list[str]]:
    """Distinct NCERT subjects per class, in catalogue order."""
    result = await session.execute(
        select(NCERTBook.class_number, NCERTBook.subject)
        .distinct()
        .order_by(NCERTBook.class_number, NCERTBook.subject)
    )
    grouped: dict[int, list[str]] = {}
    for class_number, subject in result.all():
        bucket = grouped.setdefault(class_number, [])
        if subject not in bucket:
            bucket.append(subject)
    return grouped


def _merge(core: Iterable[str], extra: Iterable[str]) -> list[str]:
    """Core subjects first, then the additional menu, without duplicates."""
    seen: list[str] = []
    for subject in list(core) + list(extra):
        if subject not in seen:
            seen.append(subject)
    return seen


async def get_catalog(session: AsyncSession) -> dict[int, list[str]]:
    """The subjects offered for each supported class."""
    ncert = await _ncert_subjects_by_class(session)
    return {
        class_number: _merge(ncert.get(class_number, []), ADDITIONAL_SUBJECTS)
        for class_number in SUPPORTED_CLASSES
    }


async def get_selection(
    school: School, session: AsyncSession
) -> dict[int, list[str]]:
    """What this school has already selected, per class."""
    result = await session.execute(
        select(SchoolClassSubject)
        .where(SchoolClassSubject.school_id == school.id)
        .order_by(SchoolClassSubject.class_number, SchoolClassSubject.subject)
    )
    grouped: dict[int, list[str]] = {}
    for row in result.scalars().all():
        grouped.setdefault(row.class_number, []).append(row.subject)
    return grouped


async def save_selection(
    school: School,
    classes: Sequence[tuple[int, Sequence[str]]],
    session: AsyncSession,
) -> datetime:
    """
    Replace this school's class/subject mapping.

    Every supported class must end up with at least one subject — an incomplete
    setup is refused here as well as in the UI, so the completion marker can
    never be set on a half-finished selection.
    """
    catalog = await get_catalog(session)
    cleaned: dict[int, list[str]] = {}

    for class_number, subjects in classes:
        if class_number not in catalog:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Class {class_number} is not supported.",
            )
        allowed = catalog[class_number]
        picked: list[str] = []
        for subject in subjects:
            name = (subject or "").strip()
            if name not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"'{name}' is not an available subject for {class_label(class_number)}.",
                )
            if name not in picked:
                picked.append(name)
        cleaned[class_number] = picked

    missing = [
        class_label(class_number)
        for class_number in SUPPORTED_CLASSES
        if not cleaned.get(class_number)
    ]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Select at least one subject for " + ", ".join(missing) + ".",
        )

    await session.execute(
        delete(SchoolClassSubject).where(SchoolClassSubject.school_id == school.id)
    )
    for class_number, subjects in cleaned.items():
        for subject in subjects:
            session.add(
                SchoolClassSubject(
                    school_id=school.id,
                    class_number=class_number,
                    subject=subject,
                )
            )

    configured_at = datetime.utcnow()
    school.subjects_configured_at = configured_at
    session.add(school)
    return configured_at


def is_complete(school: School) -> bool:
    return getattr(school, "subjects_configured_at", None) is not None
