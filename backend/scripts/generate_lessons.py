"""
One-off script — pre-generates structured, animated learning lessons (a
Byju's-style slide-by-slide walkthrough of one NCERT chapter, grounded in the
seeded chunk content) via a free LLM and stores them in the `lessons` /
`lesson_slides` tables. NOT run at app startup.

Usage (from backend/):
    uv run python scripts/generate_lessons.py --dry-run --subject Mathematics --class-number 3
    uv run python scripts/generate_lessons.py --subject Mathematics --class-number 3
    uv run python scripts/generate_lessons.py --all

Grounded exclusively in the NCERT chunk content already seeded under
branch_name="SELF" (src/db/ncert_content.py + seed_ncert_books()) via
src/services/chunk_service.py's get_class_chapters/get_chapter_chunks — the
same grounding source scripts/generate_questions.py's RAG path uses. One
lesson (4-5 concept/example slides + exactly 1 check slide) is generated per
(subject, class_number, chapter) combination found in that seeded content.

Requires GEMINI_API_KEY set in .env (get a free key at
https://aistudio.google.com/apikey). Mirrors scripts/generate_questions.py's
LLM client/prompt-design pattern closely — see that file for the full
rationale on provider choice and the image-asset-vocabulary approach.
"""

import argparse
import asyncio
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Windows consoles default stdout to cp1252, which can't encode the emoji
# this script prints in --dry-run output — reconfigure to UTF-8 so a run
# doesn't crash partway through on an emoji-bearing slide.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from pydantic import BaseModel, Field
from sqlmodel import select

from scripts.generate_questions import (
    GeminiLLMClient,
    _IMAGE_RULE,
    _OPTION_ASSET_RULE,
    _reading_level_instruction,
)
from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.config import settings
from src.core.database import AsyncSessionFactory
from src.models.lesson import Lesson, LessonSlide
from src.services import chunk_service

# Cap on how much of a chapter's chunk text is sent per prompt — same budget
# generate_questions.py uses for module-grounded generation.
_MAX_GROUNDING_CHARS = 12_000


# ── LLM output schema (validated defensively even under response_schema) ──────

class GeneratedSlide(BaseModel):
    slide_type: str  # "concept" | "example"
    text: str
    # Same "asset key preferred, emoji fallback, never both" contract as
    # GeneratedQuestion in scripts/generate_questions.py.
    image_asset_key: str = ""
    image_emoji: str = ""


class GeneratedCheckSlide(BaseModel):
    question_text: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option_index: int = Field(ge=0, le=3)
    explanation: str = ""
    image_asset_key: str = ""
    image_emoji: str = ""
    option_asset_keys: list[str] = Field(default_factory=list)
    option_emojis: list[str] = Field(default_factory=list)


class GeneratedLesson(BaseModel):
    slides: list[GeneratedSlide] = Field(min_length=4, max_length=5)
    check: GeneratedCheckSlide


# Safety net — same picture-reference regex generate_questions.py uses to
# catch a slide/question that talks about "the picture" without one.
_IMAGE_REFERENCE_RE = re.compile(
    r"\b(picture|image|photo|shown below|shown above)\b|चित्र|तस्वीर|फोटो|दिखाया|दिखाई",
    re.IGNORECASE,
)


def _fix_image_fields(
    image_asset_key: str, image_emoji: str, text: str, label: str
) -> tuple[Optional[str], Optional[str], bool]:
    """Validates/repairs one slide's image fields in place, returning
    (asset_key_or_None, emoji_or_None, broken). broken=True means the text
    references a picture that can't actually be shown — caller decides
    whether to drop the slide or (for the check slide) the whole lesson."""
    asset_key = image_asset_key.strip()
    emoji = image_emoji.strip()

    if asset_key and asset_key not in ALL_ASSET_KEYS:
        print(f"  [fix] {label}: unknown image_asset_key {asset_key!r} — dropping it")
        asset_key = ""
    if asset_key:
        emoji = ""  # asset key wins over a redundant emoji

    has_picture = bool(asset_key or emoji)
    references_image = bool(_IMAGE_REFERENCE_RE.search(text))
    broken = references_image and not has_picture
    return (asset_key or None, emoji or None, broken)


def _fix_option_images(
    option_asset_keys: list[str], option_emojis: list[str], options: list[str], label: str
) -> tuple[Optional[list[str]], Optional[list[str]]]:
    """Same validation generate_questions.py's _drop_broken_image_questions
    applies to a question's per-option pictures."""
    asset_keys = list(option_asset_keys)
    emojis = list(option_emojis)

    if asset_keys:
        valid = len(asset_keys) == len(options) and all(k in ALL_ASSET_KEYS for k in asset_keys)
        if not valid:
            print(f"  [fix] {label}: invalid option_asset_keys ({asset_keys!r}) — dropping them")
            asset_keys = []
    if asset_keys:
        emojis = []  # asset keys win over redundant emojis
    elif len(emojis) != len(options):
        if emojis:
            print(f"  [fix] {label}: option_emojis count ({len(emojis)}) != "
                  f"options count ({len(options)}) — dropping option_emojis")
        emojis = []

    return (asset_keys or None, emojis or None)


# ── Prompt design ───────────────────────────────────────────────────────────

def _build_lesson_prompt(
    subject: str, class_number: int, chapter_number: int, chapter_title: str, grounding_text: str
) -> str:
    reading_level = _reading_level_instruction(class_number)
    language_note = (
        "Write every slide's text, the check question, its options, and its explanation "
        "entirely in Hindi (Devanagari script). Do not mix in English words unless "
        "unavoidable (e.g. proper nouns).\n"
        if subject == "Hindi" else ""
    )

    grounding_block = (
        f"--- BEGIN SOURCE TEXTBOOK CONTENT (Class {class_number} {subject}, "
        f"Chapter {chapter_number}: \"{chapter_title}\") ---\n{grounding_text}\n"
        f"--- END SOURCE TEXTBOOK CONTENT ---\n\n"
        f"Every slide MUST be grounded in the source content above — do not introduce "
        f"facts, numbers, or examples that aren't supported by it.\n\n"
    )

    return (
        f"You are a kid-friendly NCERT-aligned curriculum writer creating a structured, "
        f"animated lesson — a short slide-by-slide walkthrough, like a Byju's-style "
        f"video but without video, using only text and pre-made illustrations — for "
        f"Class {class_number} {subject}, Chapter {chapter_number}: \"{chapter_title}\".\n\n"
        f"{grounding_block}"
        f"{language_note}"
        f"{_IMAGE_RULE}"
        f"{_OPTION_ASSET_RULE}"
        f"Reading level: {reading_level}\n\n"
        f"Generate 4 to 5 short slides that build up understanding step-by-step of what "
        f"the source chapter content actually teaches. Each slide is either:\n"
        f"  - a \"concept\" slide: explains ONE small idea directly, in 1-3 short "
        f"sentences.\n"
        f"  - an \"example\" slide: gives one concrete, relatable example illustrating "
        f"the concept just introduced.\n"
        f"Each slide should have an image_asset_key OR image_emoji per the picture rule "
        f"above whenever there's a natural fit — most (though not necessarily all) "
        f"slides should have a picture, since a young reader engages far more with an "
        f"illustrated slide than plain text.\n\n"
        f"Then generate exactly one \"check\" slide: a single multiple-choice question "
        f"testing understanding of the material just taught in THIS lesson, with exactly "
        f"4 options with plausible (not silly) distractors, exactly one correct answer, "
        f"and a one-sentence explanation of the correct answer. Follow the same picture "
        f"rules above for the check question's image and its 4 options."
    )


# ── LLM client ──────────────────────────────────────────────────────────────

def _get_llm_client() -> GeminiLLMClient:
    if not settings.GEMINI_API_KEY:
        raise SystemExit(
            "GEMINI_API_KEY is not set. Add it to backend/.env "
            "(get a free key at https://aistudio.google.com/apikey)."
        )
    return GeminiLLMClient(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)


def _generate_lesson(client: GeminiLLMClient, prompt: str) -> GeneratedLesson:
    from google.genai import types

    response = client._client.models.generate_content(
        model=client._model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeneratedLesson,
        ),
    )
    return GeneratedLesson.model_validate_json(response.text)


# ── Generation + insertion ─────────────────────────────────────────────────

async def _fetch_subject_class_pairs(
    subject: Optional[str], class_number: Optional[int]
) -> list[tuple[str, int]]:
    """Every distinct (subject, class_number) pair with seeded NCERT chunk
    content, optionally filtered — avoids hardcoding the subject list here."""
    from src.models.chunk import DocumentChunk

    async with AsyncSessionFactory() as session:
        query = select(DocumentChunk.subject, DocumentChunk.class_number).where(
            DocumentChunk.branch_name == "SELF"
        ).distinct()
        if subject:
            query = query.where(DocumentChunk.subject == subject)
        if class_number:
            query = query.where(DocumentChunk.class_number == class_number)
        result = await session.execute(query)
        return sorted(set(result.all()))


async def _lesson_exists(subject: str, class_number: int, chapter_number: int) -> bool:
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(Lesson.id).where(
                Lesson.subject == subject,
                Lesson.class_number == class_number,
                Lesson.chapter_number == chapter_number,
            )
        )
        return result.first() is not None


async def _generate_for_chapter(
    client: GeminiLLMClient,
    subject: str,
    class_number: int,
    chapter_number: int,
    chapter_title: str,
    dry_run: bool,
) -> int:
    label = f"{subject} C{class_number} Ch.{chapter_number} ({chapter_title})"

    if not dry_run and await _lesson_exists(subject, class_number, chapter_number):
        print(f"  [skip] {label}: lesson already exists")
        return 0

    async with AsyncSessionFactory() as session:
        chunks = await chunk_service.get_chapter_chunks(
            session, branch_name="SELF", class_number=class_number,
            chapter_number=chapter_number, subject=subject,
        )
    grounding_text = "\n\n".join(c.content for c in chunks)[:_MAX_GROUNDING_CHARS]
    if not grounding_text.strip():
        print(f"  [skip] {label}: no chunk content found")
        return 0

    prompt = _build_lesson_prompt(subject, class_number, chapter_number, chapter_title, grounding_text)

    try:
        generated = _generate_lesson(client, prompt)
    except Exception as e:  # noqa: BLE001 — one retry, then skip
        print(f"  [retry] {label}: {e}")
        try:
            generated = _generate_lesson(client, prompt)
        except Exception as e2:  # noqa: BLE001
            print(f"  [skip] {label}: generation failed twice ({e2})")
            return 0

    kept_slides: list[tuple[str, str, Optional[str], Optional[str]]] = []
    for slide in generated.slides:
        asset_key, emoji, broken = _fix_image_fields(
            slide.image_asset_key, slide.image_emoji, slide.text, f"{label} slide"
        )
        if broken:
            print(f"  [drop] {label}: slide references an image with no asset/emoji: "
                  f"{slide.text[:80]!r}")
            continue
        slide_type = slide.slide_type if slide.slide_type in ("concept", "example") else "concept"
        kept_slides.append((slide_type, slide.text, asset_key, emoji))

    if not kept_slides:
        print(f"  [skip] {label}: no usable slides left after image-reference cleanup")
        return 0

    check = generated.check
    check_asset_key, check_emoji, check_broken = _fix_image_fields(
        check.image_asset_key, check.image_emoji, check.question_text, f"{label} check"
    )
    if check_broken:
        print(f"  [skip] {label}: check question references an image with no asset/emoji "
              f"— skipping whole lesson: {check.question_text[:80]!r}")
        return 0
    option_asset_keys, option_emojis = _fix_option_images(
        check.option_asset_keys, check.option_emojis, check.options, label
    )

    if dry_run:
        print(f"  [dry-run] {label}: {len(kept_slides)} concept/example slide(s) + 1 check slide")
        for slide_type, text, asset_key, emoji in kept_slides:
            pic = f" [{asset_key or emoji}]" if (asset_key or emoji) else ""
            print(f"    ({slide_type}){pic} {text}")
        print(f"    (check) Q: {check.question_text}")
        print(f"    Options: {check.options}  Correct: {check.correct_option_index}")
        if check_asset_key or check_emoji:
            print(f"    Check image: {check_asset_key or check_emoji}")
        return len(kept_slides) + 1

    async with AsyncSessionFactory() as session:
        lesson = Lesson(
            subject=subject,
            class_number=class_number,
            chapter_number=chapter_number,
            chapter_title=chapter_title,
            generation_source=f"gemini:{settings.GEMINI_MODEL}:lesson",
        )
        session.add(lesson)
        await session.flush()

        for idx, (slide_type, text, asset_key, emoji) in enumerate(kept_slides):
            session.add(
                LessonSlide(
                    lesson_id=lesson.id,
                    slide_index=idx,
                    slide_type=slide_type,
                    text=text,
                    image_asset_key=asset_key,
                    image_emoji=emoji,
                )
            )

        session.add(
            LessonSlide(
                lesson_id=lesson.id,
                slide_index=len(kept_slides),
                slide_type="check",
                text=check.question_text,
                image_asset_key=check_asset_key,
                image_emoji=check_emoji,
                options=check.options,
                correct_option_index=check.correct_option_index,
                explanation=check.explanation or None,
            )
        )
        await session.commit()

    print(f"  [ok] {label}: {len(kept_slides)} slide(s) + 1 check slide inserted")
    return len(kept_slides) + 1


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate animated NCERT-grounded lessons.")
    parser.add_argument("--all", action="store_true", help="Generate for every subject/class/chapter.")
    parser.add_argument("--subject", type=str, default=None)
    parser.add_argument("--class-number", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    if not (args.all or args.subject or args.class_number):
        parser.error("Specify --all, --subject, and/or --class-number.")

    pairs = await _fetch_subject_class_pairs(args.subject, args.class_number)
    if not pairs:
        print("No matching subject/class content found. Has the DB been seeded (seed_ncert_books)?")
        return

    client = _get_llm_client()

    print(f"Generating lessons for {len(pairs)} subject/class combination(s) "
          f"({'dry run' if args.dry_run else 'writing to DB'})...")

    total_chapters = 0
    total_slides = 0
    for subject, class_number in pairs:
        async with AsyncSessionFactory() as session:
            chapters = await chunk_service.get_class_chapters(session, "SELF", class_number, subject)
        if not chapters:
            continue
        print(f"\n{subject} — Class {class_number}: {len(chapters)} chapter(s)")
        for chapter in chapters:
            total_chapters += 1
            total_slides += await _generate_for_chapter(
                client, subject, class_number, chapter.chapter_number,
                chapter.chapter_title, args.dry_run,
            )

    print(f"\nDone. Chapters attempted: {total_chapters}. Slides generated: {total_slides}.")


if __name__ == "__main__":
    asyncio.run(main())
