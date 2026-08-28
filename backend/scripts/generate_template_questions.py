"""
One-off script — pre-generates diagnostic quiz questions for Mathematics and
EVS WITHOUT any LLM call, and stores them in the `questions` table alongside
(not replacing) the existing Gemini-generated bank. NOT run at app startup.

Why this exists: Gemini-generated questions for Mathematics/EVS periodically
invented an `image_asset_key` that isn't in the fixed illustration vocabulary
(e.g. 'balloon', 'ruler' — not real keys), since those subjects lean on
concrete-object images more than English/Hindi do. This script removes the
LLM from the loop entirely for these two subjects: every question comes from
a deterministic generator (`src/ai/math_question_bank.py`,
`src/ai/evs_fact_bank.py`) that only ever references an asset key it looked
up directly from the real vocabulary — inventing one is structurally
impossible, not just less likely.

Usage (from backend/):
    uv run python scripts/generate_template_questions.py --dry-run --all
    uv run python scripts/generate_template_questions.py --subject Mathematics --class-number 3
    uv run python scripts/generate_template_questions.py --all

Rows are tagged `generation_source="template:v1"` (never "gemini:...") so
they're honestly distinguishable from the LLM-generated bank in the DB, and
`reviewed=False` — same convention the rest of the bank uses; deterministic
doesn't mean "skip spot-checking before fully trusting it."
"""

import argparse
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import select

from src.ai.evs_fact_bank import generate_evs_questions
from src.ai.math_question_bank import generate_math_questions
from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.database import AsyncSessionFactory
from src.models.quiz import Question, Topic

# How many questions to generate per topic per run.
_QUESTIONS_PER_TOPIC = 6

_GENERATORS = {
    "Mathematics": generate_math_questions,
    "EVS": generate_evs_questions,
}


async def _fetch_topics(subject: str | None, class_number: int | None) -> list[Topic]:
    subjects = [subject] if subject else list(_GENERATORS.keys())
    async with AsyncSessionFactory() as session:
        query = select(Topic).where(Topic.subject.in_(subjects))  # type: ignore[attr-defined]
        if class_number:
            query = query.where(Topic.class_number == class_number)
        result = await session.execute(query.order_by(Topic.subject, Topic.code))
        return list(result.scalars().all())


def _validate_generated(topic_code: str, generated) -> None:
    """Belt-and-suspenders check on top of each generator's own internal
    validation — a bad row must never reach the DB, and must fail loudly
    here rather than silently degrade the quiz experience later."""
    assert len(generated.options) == 4, f"{topic_code}: expected 4 options, got {generated.options!r}"
    assert len(set(generated.options)) == 4, f"{topic_code}: duplicate option values {generated.options!r}"
    assert 0 <= generated.correct_option_index <= 3, f"{topic_code}: bad correct_option_index"
    assert not (generated.image_asset_key and generated.image_emoji), (
        f"{topic_code}: image_asset_key and image_emoji both set"
    )
    assert not (generated.option_asset_keys and generated.option_emojis), (
        f"{topic_code}: option_asset_keys and option_emojis both set"
    )
    if generated.image_asset_key:
        assert generated.image_asset_key in ALL_ASSET_KEYS, (
            f"{topic_code}: unknown image_asset_key {generated.image_asset_key!r}"
        )
    if generated.option_asset_keys:
        assert len(generated.option_asset_keys) == 4, (
            f"{topic_code}: option_asset_keys must have 4 entries"
        )
        for key in generated.option_asset_keys:
            assert key in ALL_ASSET_KEYS, f"{topic_code}: unknown option_asset_key {key!r}"
    if generated.option_emojis:
        assert len(generated.option_emojis) == 4, f"{topic_code}: option_emojis must have 4 entries"


async def _generate_for_topic(
    topic: Topic, generation_batch: str, dry_run: bool
) -> int:
    generator = _GENERATORS.get(topic.subject)
    if generator is None:
        return 0

    generated_list = generator(topic.code, _QUESTIONS_PER_TOPIC)
    if not generated_list:
        print(f"  [skip] {topic.code}: no grounded content available for this topic")
        return 0

    for generated in generated_list:
        _validate_generated(topic.code, generated)

    if dry_run:
        print(f"  [dry-run] {topic.code}: {len(generated_list)} questions generated")
        for g in generated_list[:2]:
            print(f"    Q: {g.question_text}")
            print(f"    Options: {g.options}  Correct: {g.correct_option_index}")
            if g.image_asset_key:
                print(f"    Image asset: {g.image_asset_key}")
            if g.option_asset_keys:
                print(f"    Option assets: {g.option_asset_keys}")
        return len(generated_list)

    inserted = 0
    async with AsyncSessionFactory() as session:
        for g in generated_list:
            session.add(
                Question(
                    topic_id=topic.id,
                    subject=topic.subject,
                    class_number=topic.class_number,
                    question_text=g.question_text,
                    options=g.options,
                    correct_option_index=g.correct_option_index,
                    explanation=g.explanation or None,
                    image_emoji=g.image_emoji,
                    option_emojis=g.option_emojis,
                    image_asset_key=g.image_asset_key,
                    option_asset_keys=g.option_asset_keys,
                    generation_source="template:v1",
                    generation_batch=generation_batch,
                    module_id=None,
                    branch_name=None,
                )
            )
            inserted += 1
        await session.commit()
    print(f"  [ok] {topic.code}: {inserted} questions inserted")
    return inserted


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate diagnostic quiz questions for Mathematics/EVS without any LLM call."
    )
    parser.add_argument("--all", action="store_true", help="Generate for every Mathematics/EVS topic.")
    parser.add_argument("--subject", type=str, default=None, choices=["Mathematics", "EVS"])
    parser.add_argument("--class-number", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    if not (args.all or args.subject or args.class_number):
        parser.error("Specify --all, --subject, and/or --class-number.")

    topics = await _fetch_topics(args.subject, args.class_number)
    if not topics:
        print("No matching Mathematics/EVS topics found. Has the DB been seeded (curriculum_seed)?")
        return

    generation_batch = datetime.now(timezone.utc).strftime("%Y%m%d") + "-template"

    print(f"Generating template questions for {len(topics)} topic(s) "
          f"({'dry run' if args.dry_run else 'writing to DB'})...")
    total = 0
    for topic in topics:
        total += await _generate_for_topic(topic, generation_batch, args.dry_run)

    print(f"\nDone. Topics attempted: {len(topics)}. Questions generated: {total}.")


if __name__ == "__main__":
    asyncio.run(main())
