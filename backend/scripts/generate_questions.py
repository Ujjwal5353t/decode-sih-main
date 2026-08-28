"""
One-off script — pre-generates the diagnostic quiz question bank via a free
LLM and stores it in the `questions` table. NOT run at app startup.

Usage (from backend/):
    uv run python scripts/generate_questions.py --dry-run --topics MATH3_MULT_TABLES
    uv run python scripts/generate_questions.py --subject Mathematics --class-number 3
    uv run python scripts/generate_questions.py --all

School-specific mode — grounds questions in a school's own uploaded module
content instead of general NCERT knowledge, so a school's students are quizzed
against what they were actually taught. Only PDF/image-upload modules that
have a `subject` set are eligible (NCERT-sourced modules are skipped — the
generic bank above already covers them); image-upload modules must have
finished OCR first.
    uv run python scripts/generate_questions.py --branch demo-branch --dry-run
    uv run python scripts/generate_questions.py --branch demo-branch --class-number 3

Requires GEMINI_API_KEY set in .env (get one free at https://aistudio.google.com/apikey).
Provider is Google Gemini (see GEMINI_MODEL in config.py) chosen over Groq for
its native structured-output (response_schema) reliability — see the plan
notes in CLAUDE.md-adjacent docs for the full rationale. Swapping providers
means adding another _LLMClient implementation below, not rewriting the script.
"""

import argparse
import asyncio
import re
import sys
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Windows consoles default stdout to cp1252, which can't encode the emoji
# this script prints in --dry-run output — reconfigure to UTF-8 so a run
# doesn't crash partway through on an emoji-bearing question.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import httpx
from pydantic import BaseModel, Field
from pypdf import PdfReader
from sqlmodel import select

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS, asset_vocabulary_prompt_block
from src.core.config import settings
from src.core.database import AsyncSessionFactory
from src.models.module import Module, SourceType
from src.models.quiz import Question, Topic, TopicType
from src.services.chunk_service import search_chunks_for_rag

# Cap on how much of a module's extracted text is sent per prompt — keeps
# the request well within context/token limits while still giving the LLM
# plenty of material to draw questions from.
_MAX_GROUNDING_CHARS = 12_000


# ── LLM output schema (validated defensively even under response_schema) ──────

class GeneratedQuestion(BaseModel):
    question_text: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option_index: int = Field(ge=0, le=3)
    explanation: str = ""
    # Key into the curated illustration library (src/ai/quiz_asset_vocabulary.py)
    # — a real pre-made picture, preferred over image_emoji whenever the
    # question's picture is in that fixed vocabulary. Must be empty if
    # image_emoji is set, and vice versa (never both).
    image_asset_key: str = ""
    # Single emoji standing in for a real image asset, used only when the
    # concept isn't in the curated illustration vocabulary above. A question
    # that asks the student to identify/name something from a picture is
    # unanswerable unless the LLM supplies one of image_asset_key/image_emoji.
    image_emoji: str = ""
    # One asset key per option, same order as `options` — set ONLY when
    # every option is in the curated illustration vocabulary. Mutually
    # exclusive with option_emojis.
    option_asset_keys: list[str] = Field(default_factory=list)
    # One emoji per option, same order as `options` — fallback for when the
    # options are concrete/depictable but not all in the asset vocabulary
    # (e.g. a small count of items like "3 apples"). Empty list for
    # everything else (abstract words, sentences, bare numbers).
    option_emojis: list[str] = Field(default_factory=list)


class GeneratedQuestionBatch(BaseModel):
    questions: list[GeneratedQuestion]


# Safety net for _IMAGE_RULE below — LLMs sometimes reference "the picture"
# despite instructions not to. Catches both English and Hindi (Devanagari)
# phrasing since Hindi-subject prompts are answered in Hindi.
_IMAGE_REFERENCE_RE = re.compile(
    r"\b(picture|image|photo|shown below|shown above)\b|चित्र|तस्वीर|फोटो|दिखाया|दिखाई",
    re.IGNORECASE,
)


def _drop_broken_image_questions(batch: GeneratedQuestionBatch, topic_code: str) -> GeneratedQuestionBatch:
    """Any question that references an image without a matching image_asset_key
    or image_emoji is unanswerable — a student would be asked to identify
    something that was never shown to them. Drop such questions here rather
    than let them reach the question bank. Also enforces "asset key preferred,
    emoji as fallback, never both" for both the question image and its
    options, since the frontend renders exactly one picture source per slot."""
    kept = []
    for q in batch.questions:
        references_image = bool(_IMAGE_REFERENCE_RE.search(q.question_text))

        if q.image_asset_key and q.image_asset_key not in ALL_ASSET_KEYS:
            print(f"  [fix] {topic_code}: unknown image_asset_key {q.image_asset_key!r} — dropping it")
            q.image_asset_key = ""
        if q.image_asset_key:
            q.image_emoji = ""  # asset key wins over a redundant emoji

        has_picture = bool(q.image_asset_key.strip() or q.image_emoji.strip())
        if references_image and not has_picture:
            print(f"  [drop] {topic_code}: question references an image with no asset/emoji: "
                  f"{q.question_text[:80]!r}")
            continue

        # A half-populated option list is worse than none — the UI renders
        # either all-image or all-text option buttons per question, never a
        # mix. Anything other than exactly one key/emoji per option is
        # treated as "no image support for this question's options".
        if q.option_asset_keys:
            valid = len(q.option_asset_keys) == len(q.options) and all(
                k in ALL_ASSET_KEYS for k in q.option_asset_keys
            )
            if not valid:
                print(f"  [fix] {topic_code}: invalid option_asset_keys "
                      f"({q.option_asset_keys!r}) — dropping option_asset_keys for this question")
                q.option_asset_keys = []
        if q.option_asset_keys:
            q.option_emojis = []  # asset keys win over redundant emojis
        elif len(q.option_emojis) != len(q.options):
            if q.option_emojis:
                print(f"  [fix] {topic_code}: option_emojis count ({len(q.option_emojis)}) != "
                      f"options count ({len(q.options)}) — dropping option_emojis for this question")
            q.option_emojis = []

        kept.append(q)
    return GeneratedQuestionBatch(questions=kept)


# ── Prompt design ───────────────────────────────────────────────────────────

def _reading_level_instruction(class_number: int) -> str:
    levels = {
        1: "Use only words a 6-7 year old beginner reader knows. Sentences must be "
           "at most 8-10 words long. No compound sentences.",
        2: "Use simple, everyday vocabulary for a 7-8 year old. Sentences at most "
           "10-12 words long.",
        3: "Use vocabulary appropriate for an 8-9 year old. Sentences at most 15 "
           "words long. Avoid abstract or technical words not in the topic itself.",
        4: "Use vocabulary appropriate for a 9-10 year old. Sentences at most 18 "
           "words long.",
        5: "Use vocabulary appropriate for a 10-11 year old. Sentences at most 20 "
           "words long. Moderate complexity is fine if it stays within the topic.",
    }
    return levels[class_number]


def _skill_kind(topic_code: str) -> str:
    # e.g. "EN2_READING" -> "READING", "HI3_GRAMMAR" -> "GRAMMAR"
    return topic_code.split("_", 1)[1]


_IMAGE_RULE = (
    "This quiz can show a real illustrated picture, but ONLY from a fixed, pre-made illustration "
    "library — you cannot invent a new picture, so any picture you reference must be either an "
    "exact entry from the ASSET VOCABULARY below, or (as a fallback for anything not in that "
    "vocabulary) a single accurate emoji. NEVER write a question that asks the student to "
    "identify, name, or describe something 'in the picture', 'in the image', 'shown below', or "
    "similar unless one of those two applies — otherwise the question is unanswerable.\n\n"
    "ASSET VOCABULARY (a real, hand-illustrated picture exists for each of these — check here "
    "FIRST, and prefer it over an emoji whenever the concrete object/animal/thing the question "
    "needs appears in this list, exact spelling, lowercase):\n"
    f"{asset_vocabulary_prompt_block()}\n\n"
    "If the thing you need is in the vocabulary above, set image_asset_key to that EXACT key and "
    "leave image_emoji as an empty string. If it is NOT in the vocabulary, but the question is "
    "still fundamentally about recognizing a concrete, everyday object, letter-sound, or animal "
    "(e.g. phonics 'which picture starts with this sound'), you MAY ask it, but ONLY if you also "
    "set image_emoji to a single emoji that IS that exact thing (e.g. 🍎 for apple, 🐘 for "
    "elephant) and leave image_asset_key empty — never set both. If you cannot represent the "
    "thing with an asset key or one accurate emoji, rewrite the question so it doesn't depend on "
    "an image at all (e.g. describe the sound or word directly in text instead). For every other "
    "question, leave both image_asset_key and image_emoji as empty strings.\n\n"
)

_OPTION_ASSET_RULE = (
    "Separately: for each of the 4 options in every question, decide if ALL FOUR options are "
    "concrete, easy-to-depict things of the same kind (animals, everyday objects, shapes, foods/"
    "fruits, colors, or a small countable group of items, e.g. '3 apples'). If so:\n"
    "  - If ALL FOUR appear in the ASSET VOCABULARY above, set option_asset_keys to a list of "
    "exactly 4 keys from that vocabulary, one per option in the same order, and leave "
    "option_emojis as an empty list.\n"
    "  - Otherwise, if all four are still concrete/depictable but not all in the vocabulary (e.g. "
    "colors, or a count like '3 apples'), set option_emojis instead to a list of exactly 4 emoji, "
    "one per option in the same order (a count option like '3 apples' should repeat the emoji 3 "
    "times, e.g. '🍎🍎🍎'), and leave option_asset_keys empty. Never populate both.\n"
    "Young children answer faster by tapping a picture than by reading text, so use one of these "
    "whenever it's a natural, unforced fit. If even one option is abstract, a bare number without "
    "objects, a sentence, or otherwise not cleanly depictable, leave BOTH option_asset_keys and "
    "option_emojis as empty lists for that question instead of forcing a poor fit.\n\n"
)


def _build_prompt(topic: Topic, grounding_text: Optional[str] = None) -> str:
    reading_level = _reading_level_instruction(topic.class_number)
    language_note = (
        "Write the question_text, options, and explanation entirely in Hindi "
        "(Devanagari script). Do not mix in English words unless unavoidable "
        "(e.g. proper nouns).\n"
        if topic.subject == "Hindi" else ""
    )

    if grounding_text:
        role = (
            "You are a curriculum writer creating a diagnostic quiz strictly grounded "
            "in the source textbook content below"
        )
        grounding_block = (
            f"--- BEGIN SOURCE TEXTBOOK CONTENT (Class {topic.class_number} "
            f"{topic.subject}) ---\n{grounding_text}\n--- END SOURCE TEXTBOOK CONTENT ---\n\n"
            f"Every question MUST be answerable using only the source content above — "
            f"do not introduce facts, numbers, or examples that aren't supported by it. "
            f"If the source text doesn't cover this topic in enough depth for a full "
            f"question, keep the question general and directly tied to what the text "
            f"does say about it rather than inventing specifics.\n\n"
        )
    else:
        role = "You are an NCERT-aligned primary curriculum writer"
        grounding_block = ""

    if topic.topic_type == TopicType.CONCEPT:
        return (
            f"{role} creating a diagnostic "
            f"quiz question bank for Class {topic.class_number} {topic.subject}, "
            f"topic: \"{topic.name}\" ({topic.description}).\n\n"
            f"{grounding_block}"
            f"{language_note}"
            f"{_IMAGE_RULE}"
            f"{_OPTION_ASSET_RULE}"
            f"Reading level: {reading_level}\n\n"
            f"Generate 6 distinct multiple-choice questions testing understanding of "
            f"this exact topic, grounded only in what a Class {topic.class_number} "
            f"NCERT student would have learned. Each question must have exactly 4 "
            f"options with plausible (not silly) distractors, and exactly one correct "
            f"answer. Vary the phrasing and specific numbers/examples across the 6 "
            f"questions so they are not near-duplicates. Include a one-sentence "
            f"explanation of the correct answer for each."
        )

    # Skill-based (English/Hindi)
    kind = _skill_kind(topic.code)
    skill_instructions = {
        "PHONICS": "Test recognition of letter sounds or simple word decoding. "
                   "Options should be single letters, sounds, or very short words.",
        "VOCAB": "Test word meaning: give a target word and ask for its meaning, a "
                 "synonym, or the correct usage in a short sentence.",
        "READING": "Include a short passage (2-4 simple sentences) embedded in "
                   "question_text, followed by a comprehension question about it. "
                   "Each of the 6 questions may use a new short passage or reuse one "
                   "passage with different questions.",
        "GRAMMAR": "Use an applied fill-in-the-blank or choose-the-correct-form "
                  "question (e.g. a sentence with a blank), NOT an abstract "
                  "definition question about grammar terminology.",
        "SENTENCE": "Ask the student to identify the grammatically correct or "
                    "best-formed sentence among 4 options, or to complete a sentence "
                    "correctly.",
    }
    skill_instruction = skill_instructions.get(kind, "Test this language skill directly.")

    return (
        f"{role} creating a diagnostic "
        f"quiz question bank for Class {topic.class_number} {topic.subject}, "
        f"skill: \"{topic.name}\" ({topic.description}).\n\n"
        f"{grounding_block}"
        f"{language_note}"
        f"{_IMAGE_RULE}"
        f"{_OPTION_ASSET_RULE}"
        f"Reading level: {reading_level}\n\n"
        f"{skill_instruction}\n\n"
        f"Generate 6 distinct multiple-choice questions testing this skill at this "
        f"class level. Each question must have exactly 4 options with plausible "
        f"distractors, and exactly one correct answer. A young child must be able to "
        f"understand what is being asked without adult help. Include a one-sentence "
        f"explanation of the correct answer for each."
    )


# ── LLM client abstraction (Gemini now, swappable later) ──────────────────────

class _LLMClient(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> GeneratedQuestionBatch: ...


class GeminiLLMClient(_LLMClient):
    def __init__(self, api_key: str, model: str):
        from google import genai
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def generate(self, prompt: str) -> GeneratedQuestionBatch:
        from google.genai import types

        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedQuestionBatch,
            ),
        )
        return GeneratedQuestionBatch.model_validate_json(response.text)


def _get_llm_client() -> _LLMClient:
    if not settings.GEMINI_API_KEY:
        raise SystemExit(
            "GEMINI_API_KEY is not set. Add it to backend/.env "
            "(get a free key at https://aistudio.google.com/apikey)."
        )
    return GeminiLLMClient(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)


# ── Generation + insertion ─────────────────────────────────────────────────

async def _fetch_topics(
    subject: str | None, class_number: int | None, codes: list[str] | None
) -> list[Topic]:
    async with AsyncSessionFactory() as session:
        query = select(Topic)
        if codes:
            query = query.where(Topic.code.in_(codes))
        if subject:
            query = query.where(Topic.subject == subject)
        if class_number:
            query = query.where(Topic.class_number == class_number)
        result = await session.execute(query.order_by(Topic.code))
        return list(result.scalars().all())


async def _fetch_branch_modules(branch_name: str, class_number: int | None) -> list[Module]:
    async with AsyncSessionFactory() as session:
        query = select(Module).where(
            Module.branch_name == branch_name,
            Module.source_type != SourceType.NCERT,  # already covered by the generic bank
            Module.subject.is_not(None),
        )
        if class_number:
            query = query.where(Module.class_number == class_number)
        result = await session.execute(query.order_by(Module.class_number, Module.title))
        return list(result.scalars().all())


_OCR_PAGE_CHROME_RES = (
    re.compile(r"^Image \d+ of \d+$"),
    re.compile(r"^Page \d+\s*/\s*\d+$"),
)


async def _extract_module_text(module: Module) -> str:
    """Download this module's content PDF and extract plain text from it.

    PDF_UPLOAD modules use file_url directly. IMAGE_UPLOAD modules use
    ocr_pdf_url (the clean OCR'd text PDF) — empty if OCR hasn't finished
    yet, which the caller treats as "not ready" rather than an error.

    For OCR'd PDFs, page 0 is a synthetic cover page (src/ai/ocr_service.py
    _build_text_pdf_sync: title, branch, word-counts) and every content page
    repeats a "{title} | Class N | {branch}" header and "Image X of Y" /
    "Page X / Y" chrome — none of that is real textbook content, so it's
    stripped to avoid grounding questions in document metadata instead of
    what the school actually uploaded.
    """
    source_url = (
        module.file_url if module.source_type == SourceType.PDF_UPLOAD else module.ocr_pdf_url
    )
    if not source_url:
        return ""

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        response = await http_client.get(source_url)
        response.raise_for_status()
        pdf_bytes = response.content

    reader = PdfReader(BytesIO(pdf_bytes))
    pages = reader.pages
    if module.source_type == SourceType.IMAGE_UPLOAD:
        pages = pages[1:]  # drop the synthetic cover page

    header_line = f"{module.title}  |  Class {module.class_number}  |  {module.branch_name}"
    lines = []
    for page in pages:
        for raw_line in (page.extract_text() or "").splitlines():
            line = raw_line.strip()
            if not line or line == header_line:
                continue
            if any(rx.match(line) for rx in _OCR_PAGE_CHROME_RES):
                continue
            lines.append(line)

    return "\n".join(lines).strip()[:_MAX_GROUNDING_CHARS]


async def _ground_topic_via_rag(topic: Topic) -> Optional[str]:
    """RAG-grounds the generic (non-branch) generation path in the
    hand-authored NCERT template chunks (src/db/ncert_content.py, seeded
    under branch_name="SELF") instead of leaving it fully ungrounded.
    Returns None if no chunks exist yet for this subject/class — the caller
    falls back to the LLM's own NCERT knowledge, same as before this
    existed, so topics without chunk coverage keep working."""
    async with AsyncSessionFactory() as session:
        results = await search_chunks_for_rag(
            session=session,
            branch_name="SELF",
            class_number=topic.class_number,
            subject=topic.subject,
            query=f"{topic.name} {topic.description}",
            top_k=3,
        )
    if not results:
        return None
    return "\n\n".join(r.content for r in results)[:_MAX_GROUNDING_CHARS]


async def _generate_for_module(
    client: _LLMClient, module: Module, generation_source: str, batch_tag: str, dry_run: bool
) -> int:
    print(f"  Module '{module.title}' (Class {module.class_number} {module.subject})…")
    grounding_text = await _extract_module_text(module)
    if not grounding_text:
        reason = (
            "OCR not finished yet" if module.source_type == SourceType.IMAGE_UPLOAD
            else "no extractable text in PDF"
        )
        print(f"  [skip] '{module.title}': {reason}")
        return 0

    topics = await _fetch_topics(module.subject, module.class_number, None)
    if not topics:
        print(f"  [skip] '{module.title}': no matching topics for "
              f"Class {module.class_number} {module.subject}")
        return 0

    total = 0
    for topic in topics:
        total += await _generate_for_topic(
            client, topic, generation_source, batch_tag, dry_run,
            grounding_text=grounding_text, module_id=module.id, branch_name=module.branch_name,
        )
    return total


async def _generate_for_topic(
    client: _LLMClient,
    topic: Topic,
    generation_source: str,
    batch_tag: str,
    dry_run: bool,
    grounding_text: Optional[str] = None,
    module_id: Optional[uuid.UUID] = None,
    branch_name: Optional[str] = None,
) -> int:
    prompt = _build_prompt(topic, grounding_text=grounding_text)
    try:
        batch = client.generate(prompt)
    except Exception as e:  # noqa: BLE001 — one retry, then skip
        print(f"  [retry] {topic.code}: {e}")
        try:
            batch = client.generate(prompt)
        except Exception as e2:  # noqa: BLE001
            print(f"  [skip] {topic.code}: generation failed twice ({e2})")
            return 0

    batch = _drop_broken_image_questions(batch, topic.code)
    if not batch.questions:
        print(f"  [skip] {topic.code}: nothing left after dropping broken image-reference questions")
        return 0

    if dry_run:
        print(f"  [dry-run] {topic.code}: {len(batch.questions)} questions generated")
        for q in batch.questions[:2]:
            print(f"    Q: {q.question_text}")
            print(f"    Options: {q.options}  Correct: {q.correct_option_index}")
            if q.image_asset_key:
                print(f"    Image asset: {q.image_asset_key}")
            elif q.image_emoji:
                print(f"    Image emoji: {q.image_emoji}")
            if q.option_asset_keys:
                print(f"    Option assets: {q.option_asset_keys}")
            elif q.option_emojis:
                print(f"    Option emojis: {q.option_emojis}")
        return len(batch.questions)

    inserted = 0
    async with AsyncSessionFactory() as session:
        for q in batch.questions:
            session.add(
                Question(
                    topic_id=topic.id,
                    subject=topic.subject,
                    class_number=topic.class_number,
                    question_text=q.question_text,
                    options=q.options,
                    correct_option_index=q.correct_option_index,
                    explanation=q.explanation or None,
                    image_emoji=q.image_emoji.strip() or None,
                    option_emojis=q.option_emojis or None,
                    image_asset_key=q.image_asset_key.strip() or None,
                    option_asset_keys=q.option_asset_keys or None,
                    generation_source=generation_source,
                    generation_batch=batch_tag,
                    module_id=module_id,
                    branch_name=branch_name,
                )
            )
            inserted += 1
        await session.commit()
    print(f"  [ok] {topic.code}: {inserted} questions inserted")
    return inserted


async def _repair_image_refs(dry_run: bool) -> None:
    """One-off cleanup for questions generated before image_emoji/image_asset_key
    existed (or from a generation run whose LLM ignored the image rule):
    deactivate any active question that references an image it can't show, so
    the adaptive engine (_pick_question's is_active filter) stops serving it
    to students. Does not delete rows — just flips is_active, same as any
    other retired question."""
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(Question).where(
                Question.is_active == True,  # noqa: E712
                Question.image_emoji.is_(None),
                Question.image_asset_key.is_(None),
            )
        )
        candidates = list(result.scalars().all())
        broken = [q for q in candidates if _IMAGE_REFERENCE_RE.search(q.question_text)]

        print(f"Found {len(broken)} active question(s) referencing an image with no "
              f"asset key or emoji.")
        for q in broken:
            print(f"  {q.id} [{q.subject} C{q.class_number}]: {q.question_text[:80]!r}")

        if dry_run:
            print("Dry run — no changes made. Re-run without --dry-run to deactivate these.")
            return

        for q in broken:
            q.is_active = False
            session.add(q)
        await session.commit()
        print(f"Deactivated {len(broken)} question(s). Re-run the generator for their topics "
              f"to backfill replacements (now with asset/emoji support).")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate diagnostic quiz questions.")
    parser.add_argument("--all", action="store_true", help="Generate for every topic.")
    parser.add_argument("--subject", type=str, default=None)
    parser.add_argument("--class-number", type=int, default=None)
    parser.add_argument("--topics", type=str, default=None, help="Comma-separated topic codes.")
    parser.add_argument(
        "--branch", type=str, default=None,
        help="Generate from a school branch's own uploaded modules instead of the "
             "generic NCERT-aligned bank (combine with --class-number to scope to one class).",
    )
    parser.add_argument(
        "--repair-image-refs", action="store_true",
        help="Deactivate existing active questions that reference an image but have no "
             "image_emoji (unanswerable) — a one-off cleanup for banks generated before "
             "image_emoji support existed. Combine with --dry-run to preview.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    if args.repair_image_refs:
        await _repair_image_refs(args.dry_run)
        return

    if args.branch:
        await _run_branch_mode(args)
        return

    if not (args.all or args.subject or args.class_number or args.topics):
        parser.error("Specify --all, --subject, --class-number, --topics, --branch, or --repair-image-refs.")

    codes = args.topics.split(",") if args.topics else None
    topics = await _fetch_topics(args.subject, args.class_number, codes)
    if not topics:
        print("No matching topics found. Has the DB been seeded (curriculum_seed)?")
        return

    client = _get_llm_client()
    batch_tag = datetime.now(timezone.utc).strftime("%Y%m%d")

    print(f"Generating questions for {len(topics)} topic(s) "
          f"({'dry run' if args.dry_run else 'writing to DB'})...")
    total = 0
    attempted = 0
    for topic in topics:
        attempted += 1
        grounding_text = await _ground_topic_via_rag(topic)
        generation_source = (
            f"gemini:{settings.GEMINI_MODEL}:rag-grounded" if grounding_text
            else f"gemini:{settings.GEMINI_MODEL}"
        )
        total += await _generate_for_topic(
            client, topic, generation_source, batch_tag, args.dry_run,
            grounding_text=grounding_text,
        )

    print(f"\nDone. Topics attempted: {attempted}. Questions generated: {total}.")
    if not args.dry_run:
        print("New rows are stamped reviewed=False — spot-check before relying on them.")


async def _run_branch_mode(args: argparse.Namespace) -> None:
    modules = await _fetch_branch_modules(args.branch, args.class_number)
    if not modules:
        print(
            f"No eligible modules found for branch '{args.branch}'"
            + (f", class {args.class_number}" if args.class_number else "")
            + ". Modules must be PDF/image uploads (not NCERT-sourced) with a "
              "subject set, and image uploads must have finished OCR."
        )
        return

    client = _get_llm_client()
    generation_source = f"gemini:{settings.GEMINI_MODEL}:module-grounded"
    batch_tag = datetime.now(timezone.utc).strftime("%Y%m%d")

    print(f"Generating module-grounded questions for {len(modules)} module(s) in "
          f"branch '{args.branch}' ({'dry run' if args.dry_run else 'writing to DB'})...")
    total = 0
    for module in modules:
        total += await _generate_for_module(
            client, module, generation_source, batch_tag, args.dry_run
        )

    print(f"\nDone. Modules attempted: {len(modules)}. Questions generated: {total}.")
    if not args.dry_run:
        print("New rows are stamped reviewed=False — spot-check before relying on them.")


if __name__ == "__main__":
    asyncio.run(main())
