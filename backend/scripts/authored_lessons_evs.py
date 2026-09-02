"""
One-off script — authors structured, animated learning lessons (4-5
concept/example slides + 1 check MCQ slide) for every EVS chapter written in
`scripts/authored_content_evs.py`, and loads them into `lessons` /
`lesson_slides`. One lesson per (class_number, chapter_number), matching the
chapter breakdown of the authored chapter content 1:1 with each EVS Topic.

Original, self-written content — not copied from any textbook.

Usage (from backend/):
    uv run python scripts/authored_lessons_evs.py --dry-run
    uv run python scripts/authored_lessons_evs.py
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import delete, select

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.database import AsyncSessionFactory
from src.models.lesson import Lesson, LessonSlide

# ═════════════════════════════════════════════════════════════════════════
# Lesson data: one entry per (class_number, chapter_number), matching the
# chapters authored in scripts/authored_content_evs.py.
# ═════════════════════════════════════════════════════════════════════════

LESSONS: list[dict] = [
    # ── Class 3 ─────────────────────────────────────────────────────────
    {
        "class_number": 3, "chapter_number": 1, "chapter_title": "Chapter 1: My Family and Our Relationships",
        "slides": [
            {"slide_type": "concept", "text": "A family is a group of people who live together, share their home, and take care of one another.", "image_emoji": "👪"},
            {"slide_type": "concept", "text": "A nuclear family has parents and children living together. A joint family also includes grandparents, uncles, aunts, and cousins."},
            {"slide_type": "example", "text": "A mother's brother is called a maama. A father's mother or a mother's mother is our grandmother."},
            {"slide_type": "concept", "text": "Family members share responsibilities — cooking, earning money, or caring for younger children or elderly grandparents — so the household runs smoothly."},
            {"slide_type": "example", "text": "Festivals and birthdays bring families together and create happy memories, even for members who live far away."},
        ],
        "check": {
            "question_text": "What do we call a mother's brother?",
            "options": ["Neighbour", "Maama", "Teacher", "Postman"],
            "correct_option_index": 1,
            "explanation": "A mother's brother is called a maama, another word for uncle.",
        },
    },
    {
        "class_number": 3, "chapter_number": 2, "chapter_title": "Chapter 2: Keeping My Body Healthy",
        "slides": [
            {"slide_type": "concept", "text": "Our body has many parts that each do an important job — eyes to see, ears to hear, hands to hold, and legs to walk and run."},
            {"slide_type": "concept", "text": "Good hygiene — bathing daily, brushing our teeth twice a day, and washing hands with soap before meals — keeps germs away."},
            {"slide_type": "example", "text": "Eating a mix of vegetables, fruits, grains, and milk gives our body the energy and strength it needs to grow.", "image_asset_key": "milk"},
            {"slide_type": "concept", "text": "Playing outdoors and getting enough sleep every night keep our muscles, heart, and brain strong."},
            {"slide_type": "example", "text": "Vaccinations given by doctors protect us from serious diseases before we even catch them."},
        ],
        "check": {
            "question_text": "How many times a day should we brush our teeth, at least?",
            "options": ["Once", "Twice", "Four times", "Never"],
            "correct_option_index": 1,
            "explanation": "We should brush our teeth at least twice a day.",
        },
    },
    {
        "class_number": 3, "chapter_number": 3, "chapter_title": "Chapter 3: Plants Around Us",
        "slides": [
            {"slide_type": "concept", "text": "Most plants have four main parts: roots, a stem, leaves, and often flowers or fruits.", "image_asset_key": "leaf"},
            {"slide_type": "concept", "text": "Roots hold the plant in the soil and absorb water. Leaves use sunlight to make food and release the oxygen we breathe."},
            {"slide_type": "example", "text": "Herbs like coriander are small and soft-stemmed. Trees like mango or banyan have one thick, hard, woody trunk.", "image_asset_key": "tree"},
            {"slide_type": "concept", "text": "Climbers and creepers, like a money plant, use other plants or structures for support as they grow."},
            {"slide_type": "example", "text": "Plants give us food, shade, wood, and even medicines made from their leaves, bark, or roots."},
        ],
        "check": {
            "question_text": "Which part of a plant holds it in the soil and absorbs water?",
            "options": ["Leaves", "Flowers", "Roots", "Fruits"],
            "correct_option_index": 2,
            "explanation": "Roots hold the plant in the soil and absorb water and nutrients.",
        },
    },
    {
        "class_number": 3, "chapter_number": 4, "chapter_title": "Chapter 4: Water Sources and Uses",
        "slides": [
            {"slide_type": "concept", "text": "Water comes from many sources: rivers, lakes, rain, wells, and borewells.", "image_asset_key": "river"},
            {"slide_type": "concept", "text": "We use water for drinking, cooking, bathing, washing, and watering crops and gardens."},
            {"slide_type": "example", "text": "River and well water is usually boiled or filtered before drinking, to remove germs and dirt."},
            {"slide_type": "concept", "text": "Seawater is salty and cannot be used for drinking, cooking, or watering plants without special, expensive treatment."},
            {"slide_type": "example", "text": "Turning off the tap while brushing our teeth is a simple daily habit that helps save water.", "image_asset_key": "rain"},
        ],
        "check": {
            "question_text": "Which of these is a natural source of water?",
            "options": ["A river", "A television", "A bicycle", "A book"],
            "correct_option_index": 0,
            "explanation": "Rivers are one of the natural sources water comes from.",
        },
    },

    # ── Class 4 ─────────────────────────────────────────────────────────
    {
        "class_number": 4, "chapter_number": 1, "chapter_title": "Chapter 1: Food and Nutrition",
        "slides": [
            {"slide_type": "concept", "text": "Food gives our body energy for activity, helps it grow, and repairs it when it gets hurt."},
            {"slide_type": "concept", "text": "Energy-giving foods like rice, wheat, oil, and sugar power our muscles. Body-building foods like milk, pulses, and eggs build and repair muscles and bones.", "image_asset_key": "milk"},
            {"slide_type": "example", "text": "Protective foods, mainly fruits and vegetables, are packed with vitamins and minerals that help fight off illness.", "image_asset_key": "tomato"},
            {"slide_type": "concept", "text": "A balanced diet means eating a little from each food group every day, not just our favourite foods."},
            {"slide_type": "example", "text": "Meals look different across India — roti-sabzi, rice-sambar, or khichdi — but all can be balanced if they mix food groups."},
        ],
        "check": {
            "question_text": "What does a balanced diet mean?",
            "options": ["Eating only your favourite food every day", "Eating a little from each food group every day", "Eating only sweets and fried food", "Skipping meals often"],
            "correct_option_index": 1,
            "explanation": "A balanced diet means eating a little from each food group every day.",
        },
    },
    {
        "class_number": 4, "chapter_number": 2, "chapter_title": "Chapter 2: Animal Habitats and Adaptation",
        "slides": [
            {"slide_type": "concept", "text": "A habitat is the natural home of a plant or animal — it gives food, shelter, and safety."},
            {"slide_type": "example", "text": "A camel's hump stores fat for energy, and its broad feet do not sink into loose desert sand."},
            {"slide_type": "example", "text": "A fish has gills to breathe underwater and a smooth, fin-covered body built for swimming.", "image_asset_key": "fish"},
            {"slide_type": "concept", "text": "Animals like elephants, dogs, and cows give birth to live young (viviparous). Animals like birds, frogs, and snakes mostly hatch from eggs (oviparous)."},
            {"slide_type": "example", "text": "An elephant herd is led by its oldest female, and an adult elephant eats more than 100 kilograms of leaves and twigs a day.", "image_asset_key": "elephant"},
        ],
        "check": {
            "question_text": "What is a habitat?",
            "options": ["A type of food", "The natural home of a plant or animal", "A kind of vehicle", "A festival"],
            "correct_option_index": 1,
            "explanation": "A habitat is the natural home of a plant or animal, giving it food, shelter, and safety.",
        },
    },
    {
        "class_number": 4, "chapter_number": 3, "chapter_title": "Chapter 3: The Water Cycle",
        "slides": [
            {"slide_type": "concept", "text": "The sun heats water in oceans, rivers, and lakes, turning some of it into invisible water vapour — this is called evaporation.", "image_asset_key": "sun"},
            {"slide_type": "concept", "text": "As water vapour rises and cools, it condenses into tiny droplets that gather together and form clouds.", "image_asset_key": "cloud"},
            {"slide_type": "example", "text": "When droplets in a cloud grow too heavy, they fall back to Earth as rain, snow, or hail — this is called precipitation.", "image_asset_key": "rain"},
            {"slide_type": "concept", "text": "Fallen water flows into rivers and the ocean, or soaks into the ground to refill wells — then the whole cycle begins again.", "image_asset_key": "river"},
            {"slide_type": "example", "text": "Monsoon rains, part of the water cycle, are crucial for Indian farmers growing their crops every year."},
        ],
        "check": {
            "question_text": "What is the process called when the sun's heat turns water into vapour?",
            "options": ["Condensation", "Evaporation", "Precipitation", "Runoff"],
            "correct_option_index": 1,
            "explanation": "Evaporation is the process where the sun's heat turns water into invisible water vapour.",
        },
    },
    {
        "class_number": 4, "chapter_number": 4, "chapter_title": "Chapter 4: Transport and Communication",
        "slides": [
            {"slide_type": "concept", "text": "Transport moves people and goods by land, water, or air, and it looks different depending on where people live."},
            {"slide_type": "example", "text": "Children in parts of Ladakh cross a wide river using a trolley on a strong rope; children in Rajasthan's desert may travel by camel cart."},
            {"slide_type": "example", "text": "Boats, like the vallam used in Kerala's backwaters, carry people where roads cannot easily reach.", "image_asset_key": "boat"},
            {"slide_type": "concept", "text": "In the past, people sent messages by messenger, letter, or telegraph. Today, phones and video calls connect people almost instantly."},
            {"slide_type": "example", "text": "Fast communication is especially valuable during emergencies, when calling for help quickly can save lives."},
        ],
        "check": {
            "question_text": "Which of these is an example of water transport?",
            "options": ["A bicycle", "A boat", "A camel cart", "A bus"],
            "correct_option_index": 1,
            "explanation": "Boats, like the vallam used in Kerala's backwaters, are a form of water transport.",
        },
    },

    # ── Class 5 ─────────────────────────────────────────────────────────
    {
        "class_number": 5, "chapter_number": 1, "chapter_title": "Chapter 1: Human Body Systems",
        "slides": [
            {"slide_type": "concept", "text": "The digestive system breaks down the food we eat, starting in the mouth and ending in the intestines, so our body can use it for energy."},
            {"slide_type": "concept", "text": "The respiratory system brings in oxygen and removes carbon dioxide every time we breathe, using the nose, windpipe, and lungs."},
            {"slide_type": "example", "text": "The circulatory system, powered by the heart, pumps blood through blood vessels to carry oxygen and nutrients to every part of the body."},
            {"slide_type": "concept", "text": "These systems depend on each other closely — blood carries the oxygen and nutrients that the other two systems supply."},
            {"slide_type": "example", "text": "Eating well, exercising, sleeping enough, and avoiding smoke help keep all three systems healthy."},
        ],
        "check": {
            "question_text": "Which system breaks down the food we eat so the body can use it?",
            "options": ["Respiratory system", "Digestive system", "Circulatory system", "Nervous system"],
            "correct_option_index": 1,
            "explanation": "The digestive system breaks down the food we eat so our body can use it for energy and growth.",
        },
    },
    {
        "class_number": 5, "chapter_number": 2, "chapter_title": "Chapter 2: Natural Resources and Conservation",
        "slides": [
            {"slide_type": "concept", "text": "A natural resource is anything that comes from nature and that people use, like water, soil, forests, minerals, sunlight, and wind.", "image_asset_key": "sun"},
            {"slide_type": "concept", "text": "Renewable resources, like sunlight, wind, water, and responsibly managed forests, can be used again and again without running out."},
            {"slide_type": "example", "text": "Non-renewable resources, like coal, petroleum, and natural gas, took millions of years to form and will eventually run out if overused."},
            {"slide_type": "concept", "text": "Conservation means using resources wisely — saving water and electricity, following reduce-reuse-recycle, and planting trees."},
            {"slide_type": "example", "text": "Using public transport or cycling instead of a private vehicle helps conserve fuel resources.", "image_asset_key": "bicycle"},
        ],
        "check": {
            "question_text": "Which of these is a renewable resource?",
            "options": ["Coal", "Petroleum", "Sunlight", "Natural gas"],
            "correct_option_index": 2,
            "explanation": "Sunlight is a renewable resource because nature keeps replenishing it.",
        },
    },
    {
        "class_number": 5, "chapter_number": 3, "chapter_title": "Chapter 3: Disaster Awareness and Safety",
        "slides": [
            {"slide_type": "concept", "text": "A natural disaster is a sudden event caused by nature — like an earthquake, flood, cyclone, drought, or fire — that can harm people and property."},
            {"slide_type": "example", "text": "During an earthquake, the safest action is to drop to the ground, take cover under sturdy furniture, and hold on."},
            {"slide_type": "example", "text": "During a flood, people should move to higher ground as early as possible and avoid walking through moving water."},
            {"slide_type": "concept", "text": "A basic emergency kit — a torch, safe drinking water, first-aid supplies, and important documents — helps a family stay ready."},
            {"slide_type": "example", "text": "Schools that practise regular safety drills help everyone learn to stay calm and act quickly in a real disaster."},
        ],
        "check": {
            "question_text": "What is the safest action to take during an earthquake if you are indoors?",
            "options": ["Stand near a window", "Run outside immediately without looking", "Drop, take cover under sturdy furniture, and hold on", "Stand in the middle of the room"],
            "correct_option_index": 2,
            "explanation": "During an earthquake, the safest action is to drop, take cover under sturdy furniture, and hold on.",
        },
    },
    {
        "class_number": 5, "chapter_number": 4, "chapter_title": "Chapter 4: Community and Local Governance",
        "slides": [
            {"slide_type": "concept", "text": "A community is a group of people living in the same area, sharing resources, spaces, and everyday needs."},
            {"slide_type": "concept", "text": "In villages, a Gram Panchayat, led by an elected Sarpanch, looks after roads, drinking water supply, local schools, and cleanliness."},
            {"slide_type": "example", "text": "In towns and cities, a Municipal Corporation or Municipality manages garbage collection, drainage, parks, and building permissions."},
            {"slide_type": "concept", "text": "Citizens vote to choose local leaders, attend Gram Sabha meetings, and can report problems like a broken streetlight to their local body."},
            {"slide_type": "example", "text": "Paying local taxes, keeping public spaces clean, and following traffic rules are all part of being a responsible citizen."},
        ],
        "check": {
            "question_text": "Who leads a village's Gram Panchayat?",
            "options": ["The Sarpanch", "The Municipal Commissioner", "The Prime Minister", "A shopkeeper"],
            "correct_option_index": 0,
            "explanation": "A Gram Panchayat is led by an elected leader called the Sarpanch.",
        },
    },
]


def _validate_slide(label: str, slide: dict) -> None:
    asset_key = slide.get("image_asset_key")
    emoji = slide.get("image_emoji")
    assert not (asset_key and emoji), f"{label}: both image_asset_key and image_emoji set"
    if asset_key:
        assert asset_key in ALL_ASSET_KEYS, f"{label}: unknown image_asset_key {asset_key!r}"


def _validate_check(label: str, check: dict) -> None:
    options = check["options"]
    assert len(options) == 4, f"{label}: expected 4 options, got {options!r}"
    assert len(set(options)) == 4, f"{label}: duplicate option values {options!r}"
    assert 0 <= check["correct_option_index"] <= 3, f"{label}: bad correct_option_index"
    _validate_slide(label, check)


async def _delete_existing_evs_lessons(dry_run: bool) -> tuple[int, int]:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(Lesson.id).where(Lesson.subject == "EVS"))
        lesson_ids = [row[0] for row in result.all()]
        if not lesson_ids:
            return (0, 0)

        slide_count_result = await session.execute(
            select(LessonSlide.id).where(LessonSlide.lesson_id.in_(lesson_ids))
        )
        slide_count = len(slide_count_result.all())

        if dry_run:
            return (len(lesson_ids), slide_count)

        # Delete children first — LessonSlide.lesson_id has no ON DELETE
        # CASCADE at the DB level, so this must run before deleting Lesson rows.
        await session.execute(delete(LessonSlide).where(LessonSlide.lesson_id.in_(lesson_ids)))
        await session.execute(delete(Lesson).where(Lesson.subject == "EVS"))
        await session.commit()
        return (len(lesson_ids), slide_count)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Author EVS structured lessons.")
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    for lesson in LESSONS:
        label = f"EVS C{lesson['class_number']} Ch.{lesson['chapter_number']}"
        assert 4 <= len(lesson["slides"]) <= 5, f"{label}: expected 4-5 concept/example slides"
        for slide in lesson["slides"]:
            _validate_slide(label, slide)
        _validate_check(label, lesson["check"])
    print(f"Defined {len(LESSONS)} lesson(s), all passed validation.")

    old_lessons, old_slides = await _delete_existing_evs_lessons(args.dry_run)
    print(f"{'[dry-run] would delete' if args.dry_run else 'Deleted'} "
          f"{old_lessons} existing EVS lesson(s) and {old_slides} slide(s).")

    total_slides = 0
    async with AsyncSessionFactory() as session:
        for lesson_data in LESSONS:
            label = f"EVS C{lesson_data['class_number']} Ch.{lesson_data['chapter_number']}"
            if args.dry_run:
                total_slides += len(lesson_data["slides"]) + 1
                print(f"  [dry-run] {label}: {len(lesson_data['slides'])} slide(s) + 1 check slide")
                continue

            lesson = Lesson(
                subject="EVS",
                class_number=lesson_data["class_number"],
                chapter_number=lesson_data["chapter_number"],
                chapter_title=lesson_data["chapter_title"],
                generation_source="authored:claude:v1",
            )
            session.add(lesson)
            await session.flush()

            for idx, slide in enumerate(lesson_data["slides"]):
                session.add(
                    LessonSlide(
                        lesson_id=lesson.id,
                        slide_index=idx,
                        slide_type=slide["slide_type"],
                        text=slide["text"],
                        image_asset_key=slide.get("image_asset_key"),
                        image_emoji=slide.get("image_emoji"),
                    )
                )

            check = lesson_data["check"]
            session.add(
                LessonSlide(
                    lesson_id=lesson.id,
                    slide_index=len(lesson_data["slides"]),
                    slide_type="check",
                    text=check["question_text"],
                    image_asset_key=check.get("image_asset_key"),
                    image_emoji=check.get("image_emoji"),
                    options=check["options"],
                    correct_option_index=check["correct_option_index"],
                    explanation=check.get("explanation"),
                )
            )
            total_slides += len(lesson_data["slides"]) + 1
            print(f"  [ok] {label}: {len(lesson_data['slides'])} slide(s) + 1 check slide inserted")

        if not args.dry_run:
            await session.commit()

    print(f"\nDone. {'[dry-run] ' if args.dry_run else ''}"
          f"{len(LESSONS)} lesson(s), {total_slides} slide(s) total.")


if __name__ == "__main__":
    asyncio.run(main())
