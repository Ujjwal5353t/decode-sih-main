"""
Deterministic (NO LLM call) cloze-style ("fill in the blank") question
generator for all 12 EVS diagnostic-quiz topics.

Why this exists: Gemini-generated EVS questions kept inventing
`image_asset_key` values that don't exist in the fixed illustration
vocabulary (`src/ai/quiz_asset_vocabulary.py`). This module replaces Gemini
for EVS specifically and makes that failure structurally impossible — every
question built here either sets no image field at all, or sets one by
looking a key up directly out of `ALL_ASSET_KEYS`. No key is ever
constructed or guessed.

Design: hand-authored fact bank -> cloze builder
--------------------------------------------------
For each of the 12 EVS topic codes (cross-checked against
`src/db/curriculum_seed.py`), `_TOPIC_FACT_BANKS` below holds a short list
of atomic, single-fact statements. Each fact is a plain dict:

    {
        "sentence": "... ____ ...",   # the cloze sentence, blank marked "____"
        "blank_term": "...",          # the correct answer, restated in `sentence`
        "category": "...",            # a human label grouping related facts
        "distractors": [a, b, c],     # exactly 3 hand-picked wrong options
        "explanation": "...",         # one-sentence restatement of the fact
        "image_asset_key": "..." | None,   # optional, must be in ALL_ASSET_KEYS
        "asset_options": True | absent,    # see below
    }

Every fact's `sentence`/`blank_term` is a direct paraphrase of one sentence
in the real NCERT-aligned chapter text for that class (Class 3/5 text from
`src/db/ncert_content.py`, Class 4 text from `src/db/seed.py`'s
`seed_ncert_books()` EVS chunk) — no outside knowledge is added. Distractors
are hand-picked per fact specifically so that inserting any one of them into
that fact's sentence produces a statement NOT asserted by the source text —
i.e. no distractor can accidentally also be "true". Because each question is
built from exactly one fact/sentence, this is enforced per-question, not
just per-topic.

`distractors` are used verbatim as the 3 wrong options — this is a
deliberate simplification of the "same category" idea described in the task
brief: rather than deriving distractors from a shared category pool at
generation time (which risks silently picking a term that reads as true
once substituted into a specific sentence), each fact's distractors are
authored by a human alongside the fact itself, and the `category` field is
kept purely for documentation/organization. This is safer and still
"internally consistent" per category.

`image_asset_key` is set on a fact only when its `blank_term` is literally a
member of `ALL_ASSET_KEYS` (e.g. "elephant", "tree", "river", "milk",
"bicycle", "boat", "rain"). `asset_options: True` marks a small number of
facts (currently the EVS4_HABITATS "Nandu is a baby ____" animal fact)
where all 4 built options (correct + 3 distractors) are themselves real
vocabulary items — for those, the builder sets `option_asset_keys` (parallel
to `options`, same order) instead of a single stem `image_asset_key`. Every
`image_asset_key` and every `asset_options` fact is validated against
`ALL_ASSET_KEYS` at import time (see `_validate_fact_banks` at the bottom of
this file) — an invalid key here is a hard ImportError, not a silent bug.

Known coverage gap — EVS4_NUTRITION and EVS4_WATER_CYCLE
----------------------------------------------------------
The seeded Class 4 EVS text (`src/db/seed.py`) covers transport-to-school
(Ch1), animal ears/reproduction (Ch2), and elephant herd life (Ch3) — it
does not cover food groups/nutrition or the water cycle (evaporation,
condensation, precipitation) at all, despite `EVS4_NUTRITION` and
`EVS4_WATER_CYCLE` being real topic codes in the curriculum taxonomy.

- `EVS4_NUTRITION`: the only nutrition-adjacent sentence anywhere in the
  Class 4 text is "Adult elephants eat more than 100 kilograms of leaves
  and twigs in one day" — so this topic gets a deliberately thin, 2-fact
  bank built only from that sentence (diet content, and diet quantity).
  No food-groups content is invented.
- `EVS4_WATER_CYCLE`: there is no sentence in the Class 4 text about
  evaporation, condensation, precipitation, or the water cycle as a
  process at all (only a passing mention of "a wide and deep river" as a
  geographic obstacle, which is not water-cycle content). Per the task
  brief's explicit instruction to handle a genuine gap honestly rather
  than invent facts, `generate_evs_questions` returns an empty list for
  `EVS4_WATER_CYCLE`.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Optional

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS


@dataclass
class GeneratedEvsQuestion:
    """Matches the shape of `src.models.quiz.Question`'s content fields."""

    question_text: str
    options: list[str]
    correct_option_index: int
    explanation: str
    image_emoji: Optional[str] = None
    image_asset_key: Optional[str] = None
    option_emojis: Optional[list[str]] = None
    option_asset_keys: Optional[list[str]] = None


# ═════════════════════════════════════════════════════════════════════════
# Class 3 EVS — source: src/db/ncert_content.py, key ("EVS", 3)
# ═════════════════════════════════════════════════════════════════════════

_EVS3_FAMILY_FACTS: list[dict] = [
    {
        "sentence": "A mother's brother is called a ____ (another word for uncle).",
        "blank_term": "maama",
        "category": "relative_term",
        "distractors": ["neighbour", "teacher", "postman"],
        "explanation": "A mother's brother is called a maama, another word for uncle.",
    },
    {
        "sentence": "A father's mother is called a ____.",
        "blank_term": "grandmother",
        "category": "relative_term",
        "distractors": ["maama", "neighbour", "postman"],
        "explanation": "A father's mother is called a grandmother.",
    },
    {
        "sentence": "Families help each other, share meals, and celebrate ____ together.",
        "blank_term": "festivals",
        "category": "family_activity",
        "distractors": ["exams", "elections", "matches"],
        "explanation": "Families help each other, share meals, and celebrate festivals together.",
    },
    {
        "sentence": "Small families usually have just parents and one or two ____.",
        "blank_term": "children",
        "category": "family_member",
        "distractors": ["grandparents", "uncles", "cousins"],
        "explanation": "A small family usually has just parents and one or two children.",
    },
    {
        "sentence": "Large families can include grandparents, uncles, aunts, and ____ living together or nearby.",
        "blank_term": "cousins",
        "category": "family_member",
        "distractors": ["children", "neighbours", "strangers"],
        "explanation": "A large family can include grandparents, uncles, aunts, and cousins living together or nearby.",
    },
    {
        "sentence": "No two families are exactly ____, and that is normal.",
        "blank_term": "alike",
        "category": "family_fact",
        "distractors": ["rich", "loud", "far"],
        "explanation": "No two families are exactly alike, and that is normal.",
    },
    {
        "sentence": "A family is a group of people who live together and take care of each ____.",
        "blank_term": "other",
        "category": "family_fact",
        "distractors": ["day", "time", "year"],
        "explanation": "A family is a group of people who live together and take care of each other.",
    },
]

_EVS3_BODY_HEALTH_FACTS: list[dict] = [
    {
        "sentence": "We use our ____ to see.",
        "blank_term": "eyes",
        "category": "body_part",
        "distractors": ["ears", "hands", "legs"],
        "explanation": "Eyes are the body part we use to see.",
    },
    {
        "sentence": "We use our ____ to hear.",
        "blank_term": "ears",
        "category": "body_part",
        "distractors": ["eyes", "hands", "legs"],
        "explanation": "Ears are the body part we use to hear.",
    },
    {
        "sentence": "We use our ____ to hold things.",
        "blank_term": "hands",
        "category": "body_part",
        "distractors": ["eyes", "ears", "legs"],
        "explanation": "Hands are the body part we use to hold things.",
    },
    {
        "sentence": "We use our ____ to walk and run.",
        "blank_term": "legs",
        "category": "body_part",
        "distractors": ["eyes", "ears", "hands"],
        "explanation": "Legs are the body part we use to walk and run.",
    },
    {
        "sentence": "To keep the body healthy, we must brush our teeth ____ a day.",
        "blank_term": "twice",
        "category": "hygiene_habit",
        "distractors": ["once", "never", "four times"],
        "explanation": "To keep the body healthy, we must brush our teeth twice a day.",
    },
    {
        "sentence": "We should wash our hands before eating and after using the ____.",
        "blank_term": "toilet",
        "category": "hygiene_habit",
        "distractors": ["garden", "kitchen", "school"],
        "explanation": "We should wash our hands before eating and after using the toilet.",
    },
    {
        "sentence": "Eating a mix of vegetables, fruits, grains, and ____ keeps us strong.",
        "blank_term": "milk",
        "category": "food_item",
        "distractors": ["sweets", "chips", "soda"],
        "explanation": "Eating a mix of vegetables, fruits, grains, and milk keeps us strong.",
        "image_asset_key": "milk",
    },
    {
        "sentence": "Playing outside and sleeping enough hours every night also keeps the body and ____ healthy.",
        "blank_term": "mind",
        "category": "health_fact",
        "distractors": ["hair", "skin", "nails"],
        "explanation": "Playing outside and sleeping enough hours every night keeps the body and mind healthy.",
    },
]

_EVS3_PLANTS_FACTS: list[dict] = [
    {
        "sentence": "____ hold the plant in the soil and take in water.",
        "blank_term": "Roots",
        "category": "plant_part",
        "distractors": ["Leaves", "Flowers", "Fruits"],
        "explanation": "Roots hold the plant in the soil and take in water.",
    },
    {
        "sentence": "A plant usually has roots, a stem, ____, and sometimes flowers and fruits.",
        "blank_term": "leaves",
        "category": "plant_part",
        "distractors": ["shoes", "wheels", "doors"],
        "explanation": "A plant usually has roots, a stem, leaves, and sometimes flowers and fruits.",
    },
    {
        "sentence": "Herbs are short and soft-stemmed, like ____.",
        "blank_term": "coriander",
        "category": "plant_example",
        "distractors": ["mango", "rose", "banyan"],
        "explanation": "Herbs are short and soft-stemmed, like coriander.",
    },
    {
        "sentence": "Shrubs are medium-sized with many woody stems, like a ____ bush.",
        "blank_term": "rose",
        "category": "plant_example",
        "distractors": ["mango", "coriander", "banyan"],
        "explanation": "Shrubs are medium-sized with many woody stems, like a rose bush.",
    },
    {
        "sentence": "Trees are tall with one thick, hard, woody stem, like a ____ tree.",
        "blank_term": "mango",
        "category": "plant_example",
        "distractors": ["rose", "coriander", "grass"],
        "explanation": "Trees are tall with one thick, hard, woody stem, like a mango tree.",
        "image_asset_key": "mango",
    },
    {
        "sentence": "Plants can be as small as grass or as tall as a ____ tree.",
        "blank_term": "banyan",
        "category": "plant_example",
        "distractors": ["mango", "rose", "coriander"],
        "explanation": "Plants can be as small as grass or as tall as a banyan tree.",
    },
    {
        "sentence": "Plants give us food, shade, wood, and the ____ we breathe.",
        "blank_term": "oxygen",
        "category": "plant_benefit",
        "distractors": ["water", "soil", "sunlight"],
        "explanation": "Plants give us food, shade, wood, and the oxygen we breathe.",
    },
    {
        "sentence": "A plant sometimes has flowers and ____.",
        "blank_term": "fruits",
        "category": "plant_part",
        "distractors": ["chairs", "cars", "books"],
        "explanation": "A plant sometimes has flowers and fruits.",
    },
]

_EVS3_WATER_FACTS: list[dict] = [
    {
        "sentence": "Water comes from many sources such as rivers, lakes, wells, ponds, rain, and underground ____.",
        "blank_term": "borewells",
        "category": "water_source",
        "distractors": ["schools", "shops", "roads"],
        "explanation": "Water comes from many sources, including rivers, lakes, wells, ponds, rain, and underground borewells.",
    },
    {
        "sentence": "One source of water is a ____ — a natural flowing body of water.",
        "blank_term": "river",
        "category": "water_source",
        "distractors": ["mountain", "cloud", "sun"],
        "explanation": "A river is a natural flowing body of water and one of the sources people get water from.",
        "image_asset_key": "river",
    },
    {
        "sentence": "Another source of water is ____ that falls from clouds.",
        "blank_term": "rain",
        "category": "water_source",
        "distractors": ["snow", "hail", "dew"],
        "explanation": "Rain, which falls from clouds, is one of the sources of water.",
        "image_asset_key": "rain",
    },
    {
        "sentence": "People use water for drinking, cooking, bathing, washing clothes, and watering ____.",
        "blank_term": "crops",
        "category": "water_use",
        "distractors": ["cars", "roads", "houses"],
        "explanation": "People use water for drinking, cooking, bathing, washing clothes, and watering crops.",
    },
    {
        "sentence": "River and well water is usually boiled or ____ before drinking.",
        "blank_term": "filtered",
        "category": "water_safety",
        "distractors": ["coloured", "frozen", "salted"],
        "explanation": "River and well water is usually boiled or filtered before it is safe to drink.",
    },
    {
        "sentence": "Water should never be wasted, because some villages and towns do not have ____ of it.",
        "blank_term": "enough",
        "category": "water_fact",
        "distractors": ["photos", "maps", "boxes"],
        "explanation": "Water should never be wasted, because some villages and towns do not have enough of it.",
    },
    {
        "sentence": "Turning off the tap while brushing teeth is a simple habit that helps save ____.",
        "blank_term": "water",
        "category": "water_fact",
        "distractors": ["time", "soap", "electricity"],
        "explanation": "Turning off the tap while brushing teeth is a simple habit that helps save water.",
    },
]


# ═════════════════════════════════════════════════════════════════════════
# Class 4 EVS — source: src/db/seed.py, seed_ncert_books() EVS chunk
# ═════════════════════════════════════════════════════════════════════════

_EVS4_TRANSPORT_COMM_FACTS: list[dict] = [
    {
        "sentence": "In Assam, children cross bamboo and rope ____ to reach school when it rains heavily.",
        "blank_term": "bridges",
        "category": "transport_mode",
        "distractors": ["boats", "trolleys", "carts"],
        "explanation": "In Assam, children cross bamboo and rope bridges to reach school when it rains heavily.",
    },
    {
        "sentence": "In Ladakh, children use a ____ attached to a strong iron rope to cross a wide, deep river.",
        "blank_term": "trolley",
        "category": "transport_mode",
        "distractors": ["bridge", "boat", "bicycle"],
        "explanation": "In Ladakh, children use a trolley attached to a strong iron rope to cross a wide, deep river.",
    },
    {
        "sentence": "Children in Ladakh cross a wide and deep ____ using a trolley on an iron rope.",
        "blank_term": "river",
        "category": "water_source",
        "distractors": ["mountain", "lake", "road"],
        "explanation": "Children in Ladakh cross a wide and deep river using a trolley on an iron rope.",
        "image_asset_key": "river",
    },
    {
        "sentence": "In Kerala, children use a Vallam, which is a small wooden ____, to reach school.",
        "blank_term": "boat",
        "category": "transport_mode",
        "distractors": ["bridge", "trolley", "cart"],
        "explanation": "In Kerala, children use a Vallam, a small wooden boat, to reach school.",
        "image_asset_key": "boat",
    },
    {
        "sentence": "In Rajasthan, children ride in ____ carts across sandy terrain.",
        "blank_term": "camel",
        "category": "transport_mode",
        "distractors": ["bullock", "horse", "bicycle"],
        "explanation": "In Rajasthan, children ride in camel carts across sandy terrain.",
    },
]

_EVS4_HABITATS_FACTS: list[dict] = [
    {
        "sentence": "Nandu is a three-month-old baby ____.",
        "blank_term": "elephant",
        "category": "animal",
        "distractors": ["tiger", "dog", "rabbit"],
        "explanation": "Nandu is a three-month-old baby elephant.",
        "asset_options": True,
    },
    {
        "sentence": "Animals with visible ears and hair on their skin give birth to live young — this is called ____.",
        "blank_term": "Viviparous",
        "category": "reproduction_type",
        "distractors": ["Oviparous", "Herbivorous", "Carnivorous"],
        "explanation": "Animals with visible ears and hair on their skin give birth to live young; this is called Viviparous.",
    },
    {
        "sentence": "Animals with hidden ear holes covered by feathers or skin lay eggs — this is called ____.",
        "blank_term": "Oviparous",
        "category": "reproduction_type",
        "distractors": ["Viviparous", "Herbivorous", "Carnivorous"],
        "explanation": "Animals with hidden ear holes covered by feathers or skin lay eggs; this is called Oviparous.",
    },
    {
        "sentence": "Elephants live in groups led by the oldest ____ elephant.",
        "blank_term": "female",
        "category": "habitat_fact",
        "distractors": ["male", "baby", "youngest"],
        "explanation": "Elephants live in matriarchal herds led by the oldest female elephant.",
    },
    {
        "sentence": "Elephants live in matriarchal ____ led by the oldest female elephant.",
        "blank_term": "herds",
        "category": "habitat_fact",
        "distractors": ["nests", "hives", "flocks"],
        "explanation": "Elephants live in matriarchal herds led by the oldest female elephant.",
    },
    {
        "sentence": "Baby elephants play in mud and splash water to keep ____.",
        "blank_term": "cool",
        "category": "habitat_fact",
        "distractors": ["warm", "dirty", "dry"],
        "explanation": "Baby elephants play in mud and splash water to keep cool.",
    },
]

_EVS4_NUTRITION_FACTS: list[dict] = [
    # Deliberately thin — see module docstring "Known coverage gap". The
    # only nutrition-adjacent sentence anywhere in the seeded Class 4 EVS
    # text is the elephant-diet sentence in the "A Day with Nandu" chapter.
    {
        "sentence": "Adult elephants eat more than 100 kilograms of leaves and ____ in one day.",
        "blank_term": "twigs",
        "category": "animal_diet",
        "distractors": ["stones", "plastic", "metal"],
        "explanation": "Adult elephants eat more than 100 kilograms of leaves and twigs in one day.",
    },
    {
        "sentence": "Adult elephants eat more than ____ kilograms of leaves and twigs in one day.",
        "blank_term": "100",
        "category": "animal_diet_quantity",
        "distractors": ["10", "1000", "5"],
        "explanation": "Adult elephants eat more than 100 kilograms of leaves and twigs in one day.",
    },
]

# EVS4_WATER_CYCLE: intentionally empty. The seeded Class 4 EVS text has no
# sentence about evaporation, condensation, precipitation, or the water
# cycle as a process — see module docstring "Known coverage gap". Returning
# fabricated facts here would violate the "traceable to source text" rule,
# so generate_evs_questions() returns [] for this topic instead.
_EVS4_WATER_CYCLE_FACTS: list[dict] = []


# ═════════════════════════════════════════════════════════════════════════
# Class 5 EVS — source: src/db/ncert_content.py, key ("EVS", 5)
# ═════════════════════════════════════════════════════════════════════════

_EVS5_BODY_SYSTEMS_FACTS: list[dict] = [
    {
        "sentence": "The digestive system breaks down food, starting in the mouth and ending in the ____.",
        "blank_term": "intestines",
        "category": "body_system_part",
        "distractors": ["lungs", "heart", "windpipe"],
        "explanation": "The digestive system breaks down food, starting in the mouth and ending in the intestines.",
    },
    {
        "sentence": "The digestive system breaks down the food we eat so our body can use it for ____.",
        "blank_term": "energy",
        "category": "body_system_function",
        "distractors": ["sleep", "colour", "sound"],
        "explanation": "The digestive system breaks down the food we eat so our body can use it for energy.",
    },
    {
        "sentence": "The respiratory system uses the nose, windpipe, and ____ to bring in oxygen.",
        "blank_term": "lungs",
        "category": "body_system_part",
        "distractors": ["intestines", "heart", "stomach"],
        "explanation": "The respiratory system uses the nose, windpipe, and lungs to bring in oxygen.",
    },
    {
        "sentence": "Every time we breathe, the respiratory system brings in oxygen and removes ____.",
        "blank_term": "carbon dioxide",
        "category": "body_system_function",
        "distractors": ["water", "blood", "food"],
        "explanation": "Every time we breathe, the respiratory system brings in oxygen and removes carbon dioxide.",
    },
    {
        "sentence": "The circulatory system is powered by the ____, which pumps blood through the body.",
        "blank_term": "heart",
        "category": "body_system_part",
        "distractors": ["lungs", "intestines", "windpipe"],
        "explanation": "The circulatory system is powered by the heart, which pumps blood through the body.",
    },
    {
        "sentence": "Blood vessels carry oxygen and ____ to every part of the body.",
        "blank_term": "nutrients",
        "category": "body_system_function",
        "distractors": ["sunlight", "sand", "smoke"],
        "explanation": "Blood vessels carry oxygen and nutrients to every part of the body.",
    },
    {
        "sentence": "The digestive, respiratory, and circulatory systems work every second, even while we ____.",
        "blank_term": "sleep",
        "category": "body_system_fact",
        "distractors": ["run", "shout", "swim"],
        "explanation": "These body systems work every second, even while we sleep.",
    },
]

_EVS5_RESOURCES_FACTS: list[dict] = [
    {
        "sentence": "Natural resources are things from nature that people use, like water, soil, forests, coal, and ____.",
        "blank_term": "sunlight",
        "category": "resource_type",
        "distractors": ["plastic", "glass", "steel"],
        "explanation": "Natural resources are things from nature that people use, like water, soil, forests, coal, and sunlight.",
    },
    {
        "sentence": "____ resources, such as sunlight, wind, and water, can be used again and again.",
        "blank_term": "Renewable",
        "category": "resource_category",
        "distractors": ["Non-renewable", "Man-made", "Imported"],
        "explanation": "Renewable resources, such as sunlight, wind, and water, can be used again and again.",
    },
    {
        "sentence": "____ resources, such as coal and petroleum, take millions of years to form.",
        "blank_term": "Non-renewable",
        "category": "resource_category",
        "distractors": ["Renewable", "Man-made", "Imported"],
        "explanation": "Non-renewable resources, such as coal and petroleum, take millions of years to form.",
    },
    {
        "sentence": "Coal and petroleum will eventually run out if ____.",
        "blank_term": "overused",
        "category": "resource_fact",
        "distractors": ["planted", "recycled", "cleaned"],
        "explanation": "Coal and petroleum will eventually run out if overused.",
    },
    {
        "sentence": "Conservation means using resources ____ — planting trees, saving water, and using solar energy.",
        "blank_term": "wisely",
        "category": "resource_fact",
        "distractors": ["quickly", "secretly", "loudly"],
        "explanation": "Conservation means using resources wisely — planting trees, saving water, and using solar energy.",
    },
    {
        "sentence": "Conservation includes planting ____, saving water, and using solar energy.",
        "blank_term": "trees",
        "category": "resource_action",
        "distractors": ["buildings", "roads", "factories"],
        "explanation": "Conservation includes planting trees, saving water, and using solar energy.",
        "image_asset_key": "tree",
    },
    {
        "sentence": "Conservation practices help resources last for future ____ too.",
        "blank_term": "generations",
        "category": "resource_fact",
        "distractors": ["holidays", "seasons", "festivals"],
        "explanation": "Using resources wisely helps them last for future generations too.",
    },
]

_EVS5_DISASTER_FACTS: list[dict] = [
    {
        "sentence": "A natural disaster is a sudden event caused by nature, such as an earthquake, flood, cyclone, or ____.",
        "blank_term": "fire",
        "category": "disaster_type",
        "distractors": ["party", "festival", "holiday"],
        "explanation": "A natural disaster is a sudden event caused by nature, such as an earthquake, flood, cyclone, or fire.",
    },
    {
        "sentence": "During an earthquake, it is safest to take cover under sturdy ____.",
        "blank_term": "furniture",
        "category": "disaster_safety",
        "distractors": ["windows", "mirrors", "trees"],
        "explanation": "During an earthquake, it is safest to take cover under sturdy furniture.",
    },
    {
        "sentence": "During an earthquake, you should stay away from ____.",
        "blank_term": "windows",
        "category": "disaster_safety",
        "distractors": ["furniture", "doors", "floors"],
        "explanation": "During an earthquake, you should stay away from windows.",
    },
    {
        "sentence": "During a flood, people should move to ____ ground.",
        "blank_term": "higher",
        "category": "disaster_safety",
        "distractors": ["lower", "muddy", "flat"],
        "explanation": "During a flood, people should move to higher ground.",
    },
    {
        "sentence": "During a flood, people should avoid walking through moving ____.",
        "blank_term": "water",
        "category": "disaster_safety",
        "distractors": ["sand", "grass", "stone"],
        "explanation": "During a flood, people should avoid walking through moving water.",
    },
    {
        "sentence": "An emergency kit should have a torch, water, and important ____.",
        "blank_term": "documents",
        "category": "disaster_prep",
        "distractors": ["toys", "snacks", "games"],
        "explanation": "An emergency kit should have a torch, water, and important documents.",
    },
    {
        "sentence": "Knowing your local emergency ____ helps a family stay safe.",
        "blank_term": "numbers",
        "category": "disaster_prep",
        "distractors": ["songs", "colours", "names"],
        "explanation": "Knowing your local emergency numbers helps a family stay safe.",
    },
]

_EVS5_GOVERNANCE_FACTS: list[dict] = [
    {
        "sentence": "A community is a group of people living in the same area, like a village or a ____.",
        "blank_term": "town",
        "category": "governance_fact",
        "distractors": ["forest", "ocean", "desert"],
        "explanation": "A community is a group of people living in the same area, like a village or a town.",
    },
    {
        "sentence": "In villages, a ____ looks after roads, water supply, schools, and cleanliness.",
        "blank_term": "Gram Panchayat",
        "category": "governance_body",
        "distractors": ["Municipal Corporation", "Parliament", "Supreme Court"],
        "explanation": "In villages, a Gram Panchayat looks after roads, water supply, schools, and cleanliness.",
    },
    {
        "sentence": "A Gram Panchayat is led by an elected ____.",
        "blank_term": "Sarpanch",
        "category": "governance_role",
        "distractors": ["Mayor", "Governor", "Principal"],
        "explanation": "A Gram Panchayat is led by an elected Sarpanch.",
    },
    {
        "sentence": "In cities, a ____ does similar work to a Gram Panchayat.",
        "blank_term": "Municipal Corporation",
        "category": "governance_body",
        "distractors": ["Gram Panchayat", "Parliament", "Supreme Court"],
        "explanation": "In cities, a Municipal Corporation does similar work to a Gram Panchayat.",
    },
    {
        "sentence": "Citizens can ____ to choose their local leaders.",
        "blank_term": "vote",
        "category": "governance_action",
        "distractors": ["shout", "sleep", "travel"],
        "explanation": "Citizens can vote to choose their local leaders.",
    },
    {
        "sentence": "Citizens can raise problems, like a broken street light or dirty drain, with local ____.",
        "blank_term": "bodies",
        "category": "governance_fact",
        "distractors": ["shops", "schools", "parks"],
        "explanation": "Citizens can raise problems, like a broken street light or dirty drain, with local bodies.",
    },
    {
        "sentence": "Local governance is how a community makes ____ together.",
        "blank_term": "decisions",
        "category": "governance_fact",
        "distractors": ["meals", "songs", "games"],
        "explanation": "Local governance is how a community makes decisions together.",
    },
]


_TOPIC_FACT_BANKS: dict[str, list[dict]] = {
    "EVS3_FAMILY": _EVS3_FAMILY_FACTS,
    "EVS3_BODY_HEALTH": _EVS3_BODY_HEALTH_FACTS,
    "EVS3_PLANTS": _EVS3_PLANTS_FACTS,
    "EVS3_WATER": _EVS3_WATER_FACTS,
    "EVS4_NUTRITION": _EVS4_NUTRITION_FACTS,
    "EVS4_HABITATS": _EVS4_HABITATS_FACTS,
    "EVS4_WATER_CYCLE": _EVS4_WATER_CYCLE_FACTS,
    "EVS4_TRANSPORT_COMM": _EVS4_TRANSPORT_COMM_FACTS,
    "EVS5_BODY_SYSTEMS": _EVS5_BODY_SYSTEMS_FACTS,
    "EVS5_RESOURCES": _EVS5_RESOURCES_FACTS,
    "EVS5_DISASTER": _EVS5_DISASTER_FACTS,
    "EVS5_GOVERNANCE": _EVS5_GOVERNANCE_FACTS,
}


def _build_question(fact: dict) -> GeneratedEvsQuestion:
    correct = fact["blank_term"]
    distractors = list(fact["distractors"])
    if len(distractors) != 3:
        raise ValueError(f"fact must have exactly 3 distractors: {fact!r}")

    options = [correct, *distractors]
    if len(set(options)) != 4:
        raise ValueError(f"fact options are not all distinct: {fact!r}")

    random.shuffle(options)
    correct_option_index = options.index(correct)

    image_asset_key: Optional[str] = fact.get("image_asset_key")
    option_asset_keys: Optional[list[str]] = None

    if fact.get("asset_options"):
        candidate_keys = [opt.strip().lower().replace(" ", "_") for opt in options]
        if all(key in ALL_ASSET_KEYS for key in candidate_keys):
            option_asset_keys = candidate_keys
            image_asset_key = None  # avoid double-illustrating the same question

    return GeneratedEvsQuestion(
        question_text=fact["sentence"],
        options=options,
        correct_option_index=correct_option_index,
        explanation=fact["explanation"],
        image_emoji=None,
        image_asset_key=image_asset_key,
        option_emojis=None,
        option_asset_keys=option_asset_keys,
    )


def generate_evs_questions(topic_code: str, count: int) -> list[GeneratedEvsQuestion]:
    """
    Deterministically generate up to `count` cloze-style questions for the
    given EVS topic code, grounded in the hand-authored fact bank above.

    No LLM call is ever made. If the topic code is unknown or its fact bank
    is genuinely empty (see EVS4_WATER_CYCLE), returns an empty list rather
    than fabricating content.

    Returns at most `min(count, len(fact_bank))` questions — facts are never
    reused/duplicated to pad out to `count`, since a duplicated fact with
    reshuffled options is not a meaningfully new question.
    """
    facts = _TOPIC_FACT_BANKS.get(topic_code)
    if not facts:
        return []

    n = min(max(count, 0), len(facts))
    chosen = random.sample(facts, n)
    return [_build_question(fact) for fact in chosen]


def _validate_fact_banks() -> None:
    """Import-time self-check: every asset key referenced anywhere in the
    fact banks must be a real member of ALL_ASSET_KEYS, and every fact must
    be well-formed. Raises ImportError-friendly AssertionError on failure
    so a bad edit to the fact bank fails loudly at import, not at runtime
    inside a request."""
    for topic_code, facts in _TOPIC_FACT_BANKS.items():
        for fact in facts:
            assert "sentence" in fact and "____" in fact["sentence"], (
                f"{topic_code}: fact missing a '____' blank marker: {fact!r}"
            )
            assert fact.get("blank_term"), f"{topic_code}: fact missing blank_term: {fact!r}"
            distractors = fact.get("distractors")
            assert isinstance(distractors, list) and len(distractors) == 3, (
                f"{topic_code}: fact must have exactly 3 distractors: {fact!r}"
            )
            options = [fact["blank_term"], *distractors]
            assert len(set(options)) == 4, (
                f"{topic_code}: fact options are not all distinct: {fact!r}"
            )
            assert fact.get("explanation"), f"{topic_code}: fact missing explanation: {fact!r}"

            image_asset_key = fact.get("image_asset_key")
            if image_asset_key is not None:
                assert image_asset_key in ALL_ASSET_KEYS, (
                    f"{topic_code}: image_asset_key {image_asset_key!r} not in "
                    f"ALL_ASSET_KEYS — fact: {fact!r}"
                )

            if fact.get("asset_options"):
                # blank_term + all 3 distractors must all be real vocabulary
                # keys once normalized, or the builder silently falls back
                # to no image for this fact (see _build_question) — but we
                # still assert here so an author's intent is validated.
                candidate_keys = [
                    opt.strip().lower().replace(" ", "_") for opt in options
                ]
                assert all(key in ALL_ASSET_KEYS for key in candidate_keys), (
                    f"{topic_code}: asset_options fact has a non-vocabulary "
                    f"option {candidate_keys!r} — fact: {fact!r}"
                )


_validate_fact_banks()
