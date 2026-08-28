from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from src.models.lesson import Lesson, LessonSlide
from src.schemas.lesson import LessonListItemOut


async def list_lessons(
    session: AsyncSession,
    class_number: int,
    subject: Optional[str] = None,
) -> list[LessonListItemOut]:
    """
    List lessons for a class (optionally scoped to one subject), each with
    its slide count. Kept simple per the plan — a separate grouped-count
    query joined back onto Lesson, rather than a single subquery-heavy join.
    """
    query = select(Lesson).where(Lesson.class_number == class_number)
    if subject and subject.strip():
        query = query.where(Lesson.subject == subject.strip())
    query = query.order_by(Lesson.subject, Lesson.chapter_number)

    result = await session.execute(query)
    lessons = list(result.scalars().all())
    if not lessons:
        return []

    lesson_ids = [lesson.id for lesson in lessons]
    count_query = (
        select(LessonSlide.lesson_id, func.count(LessonSlide.id))
        .where(LessonSlide.lesson_id.in_(lesson_ids))  # type: ignore[attr-defined]
        .group_by(LessonSlide.lesson_id)
    )
    count_result = await session.execute(count_query)
    slide_counts = dict(count_result.all())

    return [
        LessonListItemOut(
            id=lesson.id,
            subject=lesson.subject,
            class_number=lesson.class_number,
            chapter_number=lesson.chapter_number,
            chapter_title=lesson.chapter_title,
            slide_count=slide_counts.get(lesson.id, 0),
        )
        for lesson in lessons
    ]


async def get_lesson_with_slides(
    lesson_id, session: AsyncSession
) -> Optional[tuple[Lesson, list[LessonSlide]]]:
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        return None

    result = await session.execute(
        select(LessonSlide)
        .where(LessonSlide.lesson_id == lesson_id)
        .order_by(LessonSlide.slide_index)
    )
    slides = list(result.scalars().all())
    return lesson, slides
