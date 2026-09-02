"""
One-off script — loads ORIGINAL, hand-authored (by a Claude agent, no LLM
API call at runtime) structured lessons for every Mathematics chapter
authored in scripts/authored_content_mathematics.py, into the `lessons` /
`lesson_slides` tables. NOT run at app startup.

Why this exists: same root cause as scripts/authored_questions_mathematics.py
— the existing Mathematics lessons (see git history / generation_source
"gemini:*:lesson") were grounded in the one-paragraph-per-class placeholder
text that scripts/authored_content_mathematics.py has now replaced with real
chapter depth. This script authors a genuine 4-slide concept/example
walkthrough plus 1 check-MCQ slide for each of the 24 authored Mathematics
chapters, directly grounded in that same chapter's content (see
`chapter_meta`/`chapter_body_for` imported below), matching the intent of
scripts/generate_lessons.py's `_build_lesson_prompt` (short concept slides,
an example slide, then one check question) without any LLM call.

Image fields follow the exact same "asset key preferred, emoji fallback,
never both" contract as scripts/generate_lessons.py — every
image_asset_key/option_asset_keys value here is looked up directly from
src.ai.quiz_asset_vocabulary.ALL_ASSET_KEYS, never invented; a slide about
something outside that vocabulary (e.g. a balloon) uses image_emoji instead.

Scope discipline: this script touches ONLY `lessons`/`lesson_slides` rows
with subject="Mathematics" (deleting only those before reinserting, for
idempotency), and does not import or edit src/db/ncert_content.py,
src/db/curriculum_seed.py, or src/ai/math_question_bank.py.

Usage (from backend/):
    uv run python scripts/authored_lessons_mathematics.py --dry-run
    uv run python scripts/authored_lessons_mathematics.py
"""

import argparse
import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import select, delete

from scripts.authored_content_mathematics import chapter_meta
from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.database import AsyncSessionFactory
from src.models.lesson import Lesson, LessonSlide


@dataclass
class AuthoredSlide:
    slide_type: str  # "concept" | "example"
    text: str
    image_asset_key: Optional[str] = None
    image_emoji: Optional[str] = None


@dataclass
class AuthoredCheck:
    question_text: str
    options: list[str]
    correct_option_index: int
    explanation: str
    image_asset_key: Optional[str] = None
    image_emoji: Optional[str] = None
    option_asset_keys: Optional[list[str]] = None
    option_emojis: Optional[list[str]] = None


@dataclass
class AuthoredLesson:
    slides: list[AuthoredSlide]
    check: AuthoredCheck


# ─────────────────────────────────────────────────────────────────────────
# Authored lessons — one per Mathematics chapter (keyed by the same
# topic_code as scripts/authored_content_mathematics.py's CHAPTERS and
# scripts/authored_questions_mathematics.py's QUESTIONS), 4 concept/example
# slides + 1 check slide each.
# ─────────────────────────────────────────────────────────────────────────

LESSONS: dict[str, AuthoredLesson] = {
    # ── Class 1 ─────────────────────────────────────────────────────────
    "MATH1_COUNTING": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "We count one number for each object: 1, 2, 3, "
                           "and so on, all the way to 20."),
            AuthoredSlide("example", "A tray has 6 apples. Counting them one by one: "
                           "1, 2, 3, 4, 5, 6. There are 6 apples.", image_asset_key="apple"),
            AuthoredSlide("concept", "Numbers can be written with digits. 15 means "
                           "fifteen things — 1 ten and 5 ones."),
            AuthoredSlide("example", "Meera counts 12 toy cars. One more car makes "
                           "13, because 13 comes right after 12.", image_asset_key="car"),
        ],
        check=AuthoredCheck(
            "What number comes right after 14?", ["15", "13", "16", "12"], 0,
            "The number right after 14 is 14 + 1 = 15.",
        ),
    ),
    "MATH1_COMPARISON": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "We compare two groups using the words "
                           "greater than, less than, and equal to."),
            AuthoredSlide("example", "8 is greater than 5, because 8 comes after 5 "
                           "when we count."),
            AuthoredSlide("concept", "The symbol '>' means greater than, and '<' "
                           "means less than."),
            AuthoredSlide("example", "Priya has 9 pencils and Arjun has 7. Since 9 "
                           "is greater than 7, Priya has more.", image_asset_key="pencil"),
        ],
        check=AuthoredCheck(
            "Which symbol makes this true: 6 ___ 9?", ["<", ">", "=", "≠"], 0,
            "6 is less than 9, so 6 < 9.",
        ),
    ),
    "MATH1_ADD_WITHIN_20": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Addition means joining two groups together to "
                           "find the total."),
            AuthoredSlide("example", "Sam has 4 red balloons and 3 blue balloons. "
                           "4 + 3 = 7 balloons in all.", image_emoji="🎈"),
            AuthoredSlide("concept", "We can count on from the bigger number. For "
                           "3 + 9, start at 9 and count on 3 more: 10, 11, 12."),
            AuthoredSlide("example", "Neha picked 8 flowers, then 5 more. 8 + 5 = "
                           "13 flowers in all.", image_asset_key="flower"),
        ],
        check=AuthoredCheck(
            "What is 7 + 6?", ["12", "14", "13", "11"], 2, "7 + 6 = 13.",
        ),
    ),
    "MATH1_SUB_WITHIN_20": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Subtraction means taking some things away "
                           "from a group to find what is left."),
            AuthoredSlide("example", "Kabir has 9 balloons. 2 fly away. 9 - 2 = 7 "
                           "balloons left.", image_emoji="🎈"),
            AuthoredSlide("concept", "Subtraction is the opposite of addition. If "
                           "6 + 5 = 11, then 11 - 5 = 6."),
            AuthoredSlide("example", "Anaya had 14 stickers and gave away 6. "
                           "14 - 6 = 8 stickers left."),
        ],
        check=AuthoredCheck(
            "What is 16 - 7?", ["10", "8", "9", "11"], 2, "16 - 7 = 9.",
        ),
    ),
    "MATH1_SHAPES": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "A circle is round with no corners and no "
                           "straight sides.", image_asset_key="circle"),
            AuthoredSlide("example", "A clock face and a ball both look round, "
                           "like a circle.", image_asset_key="circle"),
            AuthoredSlide("concept", "A triangle has 3 sides and 3 corners, like a "
                           "slice of pizza cut from the middle.", image_asset_key="triangle"),
            AuthoredSlide("example", "A square has 4 equal sides. A rectangle has "
                           "4 sides too, but only opposite sides are equal.",
                           image_asset_key="square"),
        ],
        check=AuthoredCheck(
            "Which shape has 3 corners?", ["triangle", "circle", "square", "rectangle"], 0,
            "A triangle has 3 sides and 3 corners.",
            option_asset_keys=["triangle", "circle", "square", "rectangle"],
        ),
    ),
    # ── Class 2 ─────────────────────────────────────────────────────────
    "MATH2_PLACE_VALUE": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Every 2-digit number is made of tens and "
                           "ones. 34 means 3 tens and 4 ones."),
            AuthoredSlide("example", "3 bundles of ten sticks, plus 4 loose "
                           "sticks, make 34 sticks in all."),
            AuthoredSlide("concept", "The left digit tells the tens. The right "
                           "digit tells the ones."),
            AuthoredSlide("example", "Deepak has 6 tens and 8 ones. 6 tens is 60, "
                           "plus 8 ones makes 68."),
        ],
        check=AuthoredCheck(
            "In the number 52, how many tens are there?", ["2", "5", "50", "25"], 1,
            "52 = 5 tens + 2 ones, so there are 5 tens.",
        ),
    ),
    "MATH2_ADD_CARRYING": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "When the ones add up to 10 or more, we "
                           "carry 1 ten to the tens column."),
            AuthoredSlide("example", "27 + 15: 7 + 5 = 12, write 2 and carry 1. "
                           "Then 2 + 1 + 1 = 4 tens. Total: 42."),
            AuthoredSlide("concept", "We can check addition by counting on from "
                           "the first number."),
            AuthoredSlide("example", "A shop sold 38 pens, then 26 more. "
                           "38 + 26 = 64 pens sold in all."),
        ],
        check=AuthoredCheck(
            "What is 46 + 27?", ["63", "83", "73", "72"], 2,
            "6 + 7 = 13, carry 1; 4 + 2 + 1 = 7 tens. 46 + 27 = 73.",
        ),
    ),
    "MATH2_SUB_BORROWING": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "When the ones digit on top is smaller, we "
                           "borrow 1 ten and add it as 10 ones."),
            AuthoredSlide("example", "42 - 15: borrow a ten, so 12 - 5 = 7, and "
                           "3 - 1 = 2 tens. Total: 27."),
            AuthoredSlide("concept", "We can check subtraction by adding the "
                           "answer back to the number we subtracted."),
            AuthoredSlide("example", "A basket had 53 mangoes, and 26 were sold. "
                           "53 - 26 = 27 mangoes left.", image_asset_key="mango"),
        ],
        check=AuthoredCheck(
            "What is 71 - 34?", ["37", "47", "27", "33"], 0,
            "Borrow a ten: 11 - 4 = 7, 6 - 3 = 3 tens. 71 - 34 = 37.",
        ),
    ),
    "MATH2_MULT_INTRO": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Multiplication is a quick way to add the "
                           "same number many times."),
            AuthoredSlide("example", "3 groups of 4 apples: 4 + 4 + 4 = 12, or "
                           "3 x 4 = 12.", image_asset_key="apple"),
            AuthoredSlide("concept", "Skip counting helps us multiply. Counting "
                           "by 5s: 5, 10, 15, 20."),
            AuthoredSlide("example", "A box has 4 rows of 6 eggs each: 4 x 6 = "
                           "24 eggs in the box."),
        ],
        check=AuthoredCheck(
            "What is 3 x 6?", ["16", "18", "21", "9"], 1, "3 x 6 = 18.",
        ),
    ),
    # ── Class 3 ─────────────────────────────────────────────────────────
    "MATH3_MULT_TABLES": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "A multiplication table shows a number "
                           "multiplied by 1, 2, 3, and on to 10."),
            AuthoredSlide("example", "The table of 5 always ends in 0 or 5: 5, "
                           "10, 15, 20, 25."),
            AuthoredSlide("concept", "The table of 2 is the same as doubling: "
                           "2 x 6 means double 6, which is 12."),
            AuthoredSlide("example", "Notebooks cost 8 rupees each. 6 notebooks "
                           "cost 6 x 8 = 48 rupees."),
        ],
        check=AuthoredCheck(
            "What is 7 x 6?", ["36", "48", "42", "49"], 2, "7 x 6 = 42.",
        ),
    ),
    "MATH3_DIVISION": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Division means splitting a group into "
                           "equal smaller groups."),
            AuthoredSlide("example", "12 sweets shared among 3 friends: each "
                           "friend gets 4 sweets, since 12 ÷ 3 = 4."),
            AuthoredSlide("concept", "Division is the opposite of multiplication. "
                           "Since 3 x 4 = 12, then 12 ÷ 4 = 3."),
            AuthoredSlide("example", "17 pencils shared among 5 children: each "
                           "gets 3, with 2 left over.", image_asset_key="pencil"),
        ],
        check=AuthoredCheck(
            "What is 30 ÷ 5?", ["5", "7", "6", "8"], 2, "30 ÷ 5 = 6.",
        ),
    ),
    "MATH3_PLACE_VALUE_1000": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "A 3-digit number has hundreds, tens, and "
                           "ones. 356 = 3 hundreds, 5 tens, 6 ones."),
            AuthoredSlide("example", "748: the 7 means 700, the 4 means 40, and "
                           "the 8 means 8 ones."),
            AuthoredSlide("concept", "To compare 3-digit numbers, look at the "
                           "hundreds digit first."),
            AuthoredSlide("example", "452 is greater than 398, because 4 "
                           "hundreds is more than 3 hundreds."),
        ],
        check=AuthoredCheck(
            "In the number 583, how many hundreds are there?", ["8", "3", "5", "0"], 2,
            "583 = 5 hundreds, 8 tens, 3 ones, so there are 5 hundreds.",
        ),
    ),
    "MATH3_FRACTIONS_INTRO": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "A fraction shows equal parts of a whole. "
                           "Cutting into 2 equal pieces gives halves."),
            AuthoredSlide("example", "A roti cut into 4 equal pieces: each piece "
                           "is one-quarter, or 1/4."),
            AuthoredSlide("concept", "The bottom number of a fraction shows how "
                           "many equal parts the whole was cut into."),
            AuthoredSlide("example", "8 mangoes grouped into 4 equal groups: "
                           "each group is 1/4 of the mangoes, or 2 mangoes.",
                           image_asset_key="mango"),
        ],
        check=AuthoredCheck(
            "What fraction is formed when a whole is cut into 2 equal pieces?",
            ["1/4", "1/3", "1/2", "2/2"], 2,
            "Cutting into 2 equal pieces gives halves, 1/2 each.",
        ),
    ),
    "MATH3_MEASUREMENT": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "We measure length in centimetres and "
                           "metres. 100 cm make 1 metre."),
            AuthoredSlide("example", "A ruler measures a pencil's length in "
                           "centimetres.", image_asset_key="pencil"),
            AuthoredSlide("concept", "We measure weight in grams and kilograms. "
                           "1000 grams make 1 kilogram."),
            AuthoredSlide("example", "We measure capacity in millilitres and "
                           "litres. 1000 millilitres make 1 litre."),
        ],
        check=AuthoredCheck(
            "How many centimetres make 1 metre?", ["10", "1000", "100", "500"], 2,
            "100 centimetres make 1 metre.",
        ),
    ),
    # ── Class 4 ─────────────────────────────────────────────────────────
    "MATH4_MULTIDIGIT_MULT": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "To multiply bigger numbers, we can break "
                           "one number apart by place value."),
            AuthoredSlide("example", "23 x 4: break 23 into 20 and 3. 20x4=80, "
                           "3x4=12. 80+12=92."),
            AuthoredSlide("concept", "Estimating first, by rounding, helps check "
                           "if our answer is reasonable."),
            AuthoredSlide("example", "A school has 18 classrooms with 32 "
                           "students each: 18 x 32 = 576 students."),
        ],
        check=AuthoredCheck(
            "What is 26 x 4?", ["94", "104", "114", "124"], 1,
            "20 x 4 = 80, 6 x 4 = 24, 80 + 24 = 104.",
        ),
    ),
    "MATH4_LONG_DIVISION": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Long division breaks a big division "
                           "problem into smaller steps."),
            AuthoredSlide("example", "84 ÷ 4: 4 fits into 8 two times, then "
                           "into 4 once. 84 ÷ 4 = 21."),
            AuthoredSlide("concept", "Sometimes there is a remainder left over "
                           "after dividing."),
            AuthoredSlide("example", "47 ÷ 5: 5 x 9 = 45, remainder 2. So 47 ÷ "
                           "5 is 9, remainder 2."),
        ],
        check=AuthoredCheck(
            "What is 96 ÷ 6?", ["14", "16", "15", "18"], 1,
            "6 x 16 = 96, so 96 ÷ 6 = 16.",
        ),
    ),
    "MATH4_FRACTION_ADD": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Fractions with the same denominator are "
                           "added by adding just the numerators."),
            AuthoredSlide("example", "2/7 + 3/7 = 5/7, since 2+3=5 and the "
                           "denominator stays 7."),
            AuthoredSlide("concept", "Subtracting fractions with the same "
                           "denominator works the same way."),
            AuthoredSlide("example", "Rahim ate 2/6 of a cake, then 3/6 more: "
                           "2/6 + 3/6 = 5/6 of the cake."),
        ],
        check=AuthoredCheck(
            "What is 4/9 + 3/9?", ["7/18", "7/9", "1/9", "12/9"], 1,
            "4 + 3 = 7, so 7/9.",
        ),
    ),
    "MATH4_PERIMETER_AREA": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Perimeter is the distance all the way "
                           "around a shape's edge."),
            AuthoredSlide("example", "A rectangle 8 cm by 5 cm has a perimeter "
                           "of 2 x (8+5) = 26 cm."),
            AuthoredSlide("concept", "Area is the flat surface a shape covers, "
                           "found by length times width."),
            AuthoredSlide("example", "That same rectangle has an area of "
                           "8 x 5 = 40 square centimetres."),
        ],
        check=AuthoredCheck(
            "What is the area of a rectangle with length 9 cm and width 4 cm?",
            ["26 cm²", "13 cm²", "36 cm²", "40 cm²"], 2, "Area = 9 x 4 = 36 cm².",
        ),
    ),
    "MATH4_DECIMALS_INTRO": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "A decimal has a whole-number part and a "
                           "fractional part, separated by a point."),
            AuthoredSlide("example", "4.7 means 4 ones and 7 tenths — the digit "
                           "after the point is the tenths digit."),
            AuthoredSlide("concept", "To compare decimals, compare the "
                           "whole-number part first, then the tenths."),
            AuthoredSlide("example", "6.4 is greater than 6.2, because 4 tenths "
                           "is more than 2 tenths."),
        ],
        check=AuthoredCheck(
            "Which decimal equals the fraction 3/10?",
            ["0.3", "3.0", "3.10", "0.03"], 0, "3/10 is written as 0.3.",
        ),
    ),
    # ── Class 5 ─────────────────────────────────────────────────────────
    "MATH5_FRACTION_OPS": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "To add fractions with different "
                           "denominators, first find a common denominator."),
            AuthoredSlide("example", "1/2 + 1/3: common denominator 6. "
                           "3/6 + 2/6 = 5/6."),
            AuthoredSlide("concept", "Comparing unlike fractions also uses a "
                           "common denominator."),
            AuthoredSlide("example", "3/5 vs 2/3: as fifteenths, 9/15 vs 10/15, "
                           "so 2/3 is greater."),
        ],
        check=AuthoredCheck(
            "What is 1/4 + 1/2?", ["2/6", "3/4", "1/6", "2/4"], 1,
            "1/4 + 1/2 = 1/4 + 2/4 = 3/4.",
        ),
    ),
    "MATH5_DECIMAL_OPS": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "To add or subtract decimals, line up the "
                           "decimal points first."),
            AuthoredSlide("example", "4.7 + 2.3 = 7.0, lining up the decimal "
                           "points."),
            AuthoredSlide("concept", "To multiply a decimal, multiply as whole "
                           "numbers, then place the decimal point."),
            AuthoredSlide("example", "3.2 x 4: 32 x 4 = 128, one decimal place "
                           "gives 12.8."),
        ],
        check=AuthoredCheck(
            "What is 5.6 + 2.7?", ["7.3", "8.3", "8.13", "7.13"], 1, "5.6 + 2.7 = 8.3.",
        ),
    ),
    "MATH5_PERCENTAGE_INTRO": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Percent means out of a hundred. 25% is "
                           "the same as 25/100 or 0.25."),
            AuthoredSlide("example", "50% of 40: 1/2 x 40 = 20."),
            AuthoredSlide("concept", "To find 10% of a number, simply divide "
                           "the number by 10."),
            AuthoredSlide("example", "A 20% discount on a 200 rupee shirt is "
                           "40 rupees off, so it costs 160 rupees."),
        ],
        check=AuthoredCheck(
            "What is 10% of 90?", ["19", "9", "90", "9.9"], 1,
            "10% of 90 = 90 ÷ 10 = 9.",
        ),
    ),
    "MATH5_AREA_VOLUME": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Area is flat surface covered; volume is "
                           "the space a solid object fills."),
            AuthoredSlide("example", "An L-shaped garden splits into two "
                           "rectangles; add their areas together."),
            AuthoredSlide("concept", "The volume of a cube is side x side x "
                           "side."),
            AuthoredSlide("example", "A cube with side 5 cm has volume "
                           "5x5x5 = 125 cubic centimetres."),
        ],
        check=AuthoredCheck(
            "What is the volume of a cuboid 6 cm x 3 cm x 2 cm?",
            ["11 cm³", "36 cm³", "18 cm³", "30 cm³"], 1, "6 x 3 x 2 = 36 cm³.",
        ),
    ),
    "MATH5_LONG_DIVISION_LARGE": AuthoredLesson(
        slides=[
            AuthoredSlide("concept", "Dividing by a 2-digit number needs "
                           "careful estimation at each step."),
            AuthoredSlide("example", "1248 ÷ 24: 24 fits into 124 five times "
                           "(120, remainder 4); bring down 8 to make 48, fits "
                           "2 times exactly. Answer: 52."),
            AuthoredSlide("concept", "We check a division answer by "
                           "multiplying the quotient by the divisor."),
            AuthoredSlide("example", "A factory packs 3564 toys into 36 boxes: "
                           "3564 ÷ 36 = 99 toys per box."),
        ],
        check=AuthoredCheck(
            "What is 1350 ÷ 27?", ["45", "55", "50", "40"], 2,
            "27 x 50 = 1350, so 1350 ÷ 27 = 50.",
        ),
    ),
}


# ─────────────────────────────────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────────────────────────────────

def _validate_slide(topic_code: str, s: AuthoredSlide) -> None:
    assert s.slide_type in ("concept", "example"), f"{topic_code}: bad slide_type {s.slide_type!r}"
    assert not (s.image_asset_key and s.image_emoji), (
        f"{topic_code}: slide has both image_asset_key and image_emoji"
    )
    if s.image_asset_key:
        assert s.image_asset_key in ALL_ASSET_KEYS, (
            f"{topic_code}: unknown image_asset_key {s.image_asset_key!r}"
        )


def _validate_check(topic_code: str, c: AuthoredCheck) -> None:
    assert len(c.options) == 4, f"{topic_code}: check needs 4 options, got {c.options!r}"
    assert len(set(c.options)) == 4, f"{topic_code}: check has duplicate options {c.options!r}"
    assert 0 <= c.correct_option_index <= 3, f"{topic_code}: bad check correct_option_index"
    assert not (c.image_asset_key and c.image_emoji), (
        f"{topic_code}: check has both image_asset_key and image_emoji"
    )
    assert not (c.option_asset_keys and c.option_emojis), (
        f"{topic_code}: check has both option_asset_keys and option_emojis"
    )
    if c.image_asset_key:
        assert c.image_asset_key in ALL_ASSET_KEYS, (
            f"{topic_code}: unknown check image_asset_key {c.image_asset_key!r}"
        )
    if c.option_asset_keys:
        assert len(c.option_asset_keys) == 4, f"{topic_code}: check option_asset_keys must have 4 entries"
        for key in c.option_asset_keys:
            assert key in ALL_ASSET_KEYS, f"{topic_code}: unknown check option_asset_key {key!r}"


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load authored Mathematics lessons (slides + check MCQ) into lessons/lesson_slides."
    )
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    meta = chapter_meta()  # {(class_number, topic_code): (chapter_number, chapter_title)}

    # Validate everything up front.
    for topic_code, lesson in LESSONS.items():
        assert 4 <= len(lesson.slides) <= 5, (
            f"{topic_code}: expected 4-5 concept/example slides, got {len(lesson.slides)}"
        )
        for s in lesson.slides:
            _validate_slide(topic_code, s)
        _validate_check(topic_code, lesson.check)
    print(f"Validated {len(LESSONS)} authored lessons "
          f"({sum(len(l.slides) + 1 for l in LESSONS.values())} total slides).")

    # Cross-check every authored lesson has a matching chapter from
    # scripts/authored_content_mathematics.py, and vice versa.
    chapter_topic_codes = {code for (_cn, code) in meta}
    missing_chapters = [code for code in LESSONS if code not in chapter_topic_codes]
    if missing_chapters:
        print(f"[warn] Authored lessons with NO matching authored chapter: {missing_chapters}")
    missing_lessons = [code for code in chapter_topic_codes if code not in LESSONS]
    if missing_lessons:
        print(f"[warn] Authored chapters with NO authored lesson: {missing_lessons}")

    if args.dry_run:
        for (class_number, topic_code), (chapter_number, chapter_title) in sorted(meta.items()):
            lesson = LESSONS.get(topic_code)
            if not lesson:
                continue
            print(f"\n[dry-run] Class {class_number} Ch.{chapter_number} "
                  f"'{chapter_title}' ({topic_code}): {len(lesson.slides)} slide(s) + 1 check")
            for s in lesson.slides:
                pic = f" [{s.image_asset_key or s.image_emoji}]" if (s.image_asset_key or s.image_emoji) else ""
                print(f"    ({s.slide_type}){pic} {s.text}")
            print(f"    (check) Q: {lesson.check.question_text}")
            print(f"    Options: {lesson.check.options}  Correct: {lesson.check.correct_option_index}")
        return

    async with AsyncSessionFactory() as session:
        # Idempotency: delete existing Mathematics lessons (and their slides
        # via explicit child delete, since LessonSlide has no ON DELETE
        # CASCADE declared in src/models/lesson.py) before reinserting.
        existing_res = await session.execute(
            select(Lesson.id).where(Lesson.subject == "Mathematics")
        )
        existing_lesson_ids = [row[0] for row in existing_res.all()]
        if existing_lesson_ids:
            await session.execute(
                delete(LessonSlide).where(LessonSlide.lesson_id.in_(existing_lesson_ids))  # type: ignore[attr-defined]
            )
            await session.execute(
                delete(Lesson).where(Lesson.id.in_(existing_lesson_ids))  # type: ignore[attr-defined]
            )
            await session.commit()
            print(f"[ok] Deleted {len(existing_lesson_ids)} existing Mathematics "
                  f"lesson(s) and their slides (idempotent re-run).")

        inserted_lessons = 0
        inserted_slides = 0
        for (class_number, topic_code), (chapter_number, chapter_title) in sorted(meta.items()):
            lesson_data = LESSONS.get(topic_code)
            if not lesson_data:
                continue

            lesson = Lesson(
                subject="Mathematics",
                class_number=class_number,
                chapter_number=chapter_number,
                chapter_title=chapter_title,
                generation_source="authored:claude:v1",
            )
            session.add(lesson)
            await session.flush()

            for idx, s in enumerate(lesson_data.slides):
                session.add(
                    LessonSlide(
                        lesson_id=lesson.id,
                        slide_index=idx,
                        slide_type=s.slide_type,
                        text=s.text,
                        image_asset_key=s.image_asset_key,
                        image_emoji=s.image_emoji,
                    )
                )
                inserted_slides += 1

            c = lesson_data.check
            session.add(
                LessonSlide(
                    lesson_id=lesson.id,
                    slide_index=len(lesson_data.slides),
                    slide_type="check",
                    text=c.question_text,
                    image_asset_key=c.image_asset_key,
                    image_emoji=c.image_emoji,
                    options=c.options,
                    correct_option_index=c.correct_option_index,
                    explanation=c.explanation or None,
                )
            )
            inserted_slides += 1
            inserted_lessons += 1
            print(f"  [ok] Class {class_number} Ch.{chapter_number} '{chapter_title}': "
                  f"{len(lesson_data.slides)} slide(s) + 1 check inserted")

        await session.commit()
        print(f"\nInserted {inserted_lessons} lessons, {inserted_slides} slides total "
              f"(generation_source='authored:claude:v1').")


if __name__ == "__main__":
    asyncio.run(main())
