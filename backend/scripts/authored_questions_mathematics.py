"""
One-off script — loads an ORIGINAL, hand-authored (by a Claude agent, no LLM
API call at runtime) diagnostic-quiz question bank for every Mathematics
Topic (src/db/curriculum_seed.py) into the `questions` table. NOT run at
app startup.

Why this exists: the previous Mathematics question bank came from two
sources, neither of which satisfied the product owner's own manual review:
  1. `gemini:*` rows — grounded in a one-paragraph-per-class placeholder
     (src/db/ncert_content.py before scripts/authored_content_mathematics.py
     replaced it), so they drifted from the real Class 1-5 syllabus.
  2. `template:v1` rows (src/ai/math_question_bank.py) — a fully
     deterministic arithmetic-drill generator, added because Gemini kept
     inventing invalid `image_asset_key` values. It never invents a bad key,
     but it also only ever asks "what is a op b" arithmetic — the product
     owner's complaint was these read as "too obvious" and don't cover the
     fuller NCERT Math Magic spirit (shapes, measurement, fractions, money,
     time, place value reasoning, common-misconception distractors), not
     just raw computation.

This script authors 8 original, hand-varied MCQs per Mathematics topic,
directly grounded in the chapter prose scripts/authored_content_mathematics.py
just loaded into document_chunks (same chapter, same facts/examples — see
`chapter_body_for` import below), with realistic child-misconception
distractors (wrong operation, off-by-one, dropped carry/borrow, digit
transposition, "more digits after the decimal point = bigger" traps, etc.),
mirroring the *spirit* of src/ai/math_question_bank.py's distractor design
without reusing any of its literal question text or its deterministic
template-generation approach.

Image fields follow the exact same "asset key preferred, emoji fallback,
never both" contract as scripts/generate_questions.py's GeneratedQuestion —
every image_asset_key/option_asset_keys value here is looked up directly
from src.ai.quiz_asset_vocabulary.ALL_ASSET_KEYS, never invented.

Scope discipline: this script touches ONLY `questions` rows with
subject="Mathematics" (deactivating, never deleting, existing active rows —
see main() below), and does not import or edit src/db/ncert_content.py,
src/db/curriculum_seed.py, or src/ai/math_question_bank.py.

Usage (from backend/):
    uv run python scripts/authored_questions_mathematics.py --dry-run
    uv run python scripts/authored_questions_mathematics.py
"""

import argparse
import asyncio
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import select

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.database import AsyncSessionFactory
from src.models.quiz import Question, Topic


@dataclass
class AuthoredQuestion:
    question_text: str
    options: list[str]
    correct_option_index: int
    explanation: str
    image_emoji: Optional[str] = None
    image_asset_key: Optional[str] = None
    option_emojis: Optional[list[str]] = None
    option_asset_keys: Optional[list[str]] = None


# ─────────────────────────────────────────────────────────────────────────
# Authored question bank — 8 per topic, grouped by topic_code, directly
# grounded in scripts/authored_content_mathematics.py's chapter for that
# topic. Difficulty is intentionally varied within each topic (not all
# "obvious"): later questions in a topic tend to use larger numbers, word
# problems, or ask about a misconception directly rather than just compute.
# ─────────────────────────────────────────────────────────────────────────

QUESTIONS: dict[str, list[AuthoredQuestion]] = {
    # ── Class 1 ─────────────────────────────────────────────────────────
    "MATH1_COUNTING": [
        AuthoredQuestion(
            "What number comes right after 12?", ["13", "11", "10", "14"], 0,
            "The number right after 12 is 12 + 1 = 13.",
        ),
        AuthoredQuestion(
            "What number comes right before 15?", ["16", "14", "13", "17"], 1,
            "The number right before 15 is 15 - 1 = 14.",
        ),
        AuthoredQuestion(
            "A tray has 8 apples on it. How many apples are on the tray?",
            ["7", "8", "9", "6"], 1,
            "Counting the apples one by one gives 8 apples.",
            image_asset_key="apple",
        ),
        AuthoredQuestion(
            "Which number comes next: 5, 6, 7, __?", ["9", "8", "10", "6"], 1,
            "Counting forward after 7 comes 8.",
        ),
        AuthoredQuestion(
            "What is the missing number: 17, 18, __, 20?", ["21", "19", "16", "18"], 1,
            "Counting forward, 18 is followed by 19, then 20.",
        ),
        AuthoredQuestion(
            "Counting backward from 20: 20, 19, 18, __?", ["17", "16", "21", "15"], 0,
            "Counting backward, after 18 comes 17.",
        ),
        AuthoredQuestion(
            "The number 15 is written with how many digits?", ["1", "3", "2", "4"], 2,
            "15 is written with two digits: 1 and 5.",
        ),
        AuthoredQuestion(
            "A basket has 3 mangoes. 4 more mangoes are put in. How many "
            "mangoes are in the basket now?",
            ["6", "8", "7", "5"], 2,
            "Counting all the mangoes together gives 3 + 4 = 7.",
            image_asset_key="mango",
        ),
    ],
    "MATH1_COMPARISON": [
        AuthoredQuestion(
            "Which number is greater, 8 or 5?",
            ["5", "Both are equal", "8", "Cannot tell"], 2,
            "8 is greater than 5, because 8 comes after 5 when counting.",
        ),
        AuthoredQuestion(
            "Which number is smaller, 6 or 9?",
            ["9", "6", "Both are equal", "Cannot tell"], 1,
            "6 is less than 9, because 6 comes before 9 when counting.",
        ),
        AuthoredQuestion(
            "Fill in the blank: 7 ___ 4", ["<", "=", ">", "≠"], 2,
            "7 is greater than 4, so 7 > 4.",
        ),
        AuthoredQuestion(
            "Fill in the blank: 3 ___ 10", [">", "<", "=", "≠"], 1,
            "3 is less than 10, so 3 < 10.",
        ),
        AuthoredQuestion(
            "Priya has 9 pencils. Arjun has 7 pencils. Who has more pencils?",
            ["Arjun", "They have the same number", "Priya", "Cannot tell"], 2,
            "9 is greater than 7, so Priya has more pencils.",
        ),
        AuthoredQuestion(
            "Which symbol makes this true: 12 ___ 12?", [">", "<", "=", "≠"], 2,
            "12 and 12 are the same number, so 12 = 12.",
        ),
        AuthoredQuestion(
            "A red box has 6 balloons. A blue box has 6 balloons. What can "
            "we say?",
            ["The red box has more", "The blue box has more",
             "Both boxes have an equal number", "Cannot tell"], 2,
            "6 is equal to 6, so both boxes have the same number of balloons.",
        ),
        AuthoredQuestion(
            "Which number is the greatest: 14, 9, 17?", ["9", "14", "17", "Cannot tell"], 2,
            "17 is greater than both 14 and 9, so 17 is the greatest.",
        ),
    ],
    "MATH1_ADD_WITHIN_20": [
        AuthoredQuestion("What is 4 + 3?", ["8", "6", "7", "5"], 2, "4 + 3 = 7."),
        AuthoredQuestion(
            "Sam has 4 red balloons and 3 blue balloons. How many balloons "
            "does he have in all?",
            ["6", "8", "7", "5"], 2, "4 + 3 = 7 balloons.",
        ),
        AuthoredQuestion("What is 9 + 5?", ["13", "15", "16", "14"], 3, "9 + 5 = 14."),
        AuthoredQuestion(
            "Neha picked 8 flowers in the morning and 5 more in the "
            "evening. How many flowers did she pick in all?",
            ["12", "14", "13", "11"], 2, "8 + 5 = 13 flowers.",
        ),
        AuthoredQuestion("What is 6 + 6?", ["11", "12", "10", "13"], 1, "6 + 6 = 12."),
        AuthoredQuestion(
            "What is 3 + 9?", ["11", "13", "12", "10"], 2,
            "Starting at 9 and counting on 3 more: 10, 11, 12.",
        ),
        AuthoredQuestion(
            "A shopkeeper has 7 pencils. He gets 8 more pencils. How many "
            "pencils does he have now?",
            ["14", "16", "13", "15"], 3, "7 + 8 = 15 pencils.",
        ),
        AuthoredQuestion("What is 10 + 10?", ["18", "21", "19", "20"], 3, "10 + 10 = 20."),
    ],
    "MATH1_SUB_WITHIN_20": [
        AuthoredQuestion("What is 9 - 2?", ["8", "6", "7", "5"], 2, "9 - 2 = 7."),
        AuthoredQuestion(
            "Kabir has 9 balloons. 2 fly away. How many balloons are left?",
            ["8", "6", "7", "5"], 2, "9 - 2 = 7 balloons left.",
        ),
        AuthoredQuestion("What is 15 - 6?", ["10", "8", "9", "7"], 2, "15 - 6 = 9."),
        AuthoredQuestion(
            "Anaya had 14 stickers. She gave 6 stickers to her friend. How "
            "many stickers does she have now?",
            ["9", "7", "8", "6"], 2, "14 - 6 = 8 stickers.",
        ),
        AuthoredQuestion("What is 20 - 5?", ["14", "16", "15", "13"], 2, "20 - 5 = 15."),
        AuthoredQuestion(
            "What is 12 - 4?", ["9", "7", "8", "6"], 2,
            "Counting back 4 from 12: 11, 10, 9, 8. So 12 - 4 = 8.",
        ),
        AuthoredQuestion(
            "Rohan has 5 sweets. He eats all 5. How many sweets are left?",
            ["1", "5", "0", "2"], 2, "5 - 5 = 0 sweets are left.",
        ),
        AuthoredQuestion("What is 18 - 9?", ["8", "10", "9", "7"], 2, "18 - 9 = 9."),
    ],
    "MATH1_SHAPES": [
        AuthoredQuestion(
            "How many corners does a circle have?", ["4", "1", "0", "3"], 2,
            "A circle is round all the way around and has no corners.",
            image_asset_key="circle",
        ),
        AuthoredQuestion(
            "How many corners does a triangle have?", ["4", "2", "3", "0"], 2,
            "A triangle has 3 sides and 3 corners.",
            image_asset_key="triangle",
        ),
        AuthoredQuestion(
            "How many sides does a square have?", ["3", "5", "4", "6"], 2,
            "A square has 4 equal sides.",
            image_asset_key="square",
        ),
        AuthoredQuestion(
            "Which of these shapes is round with no corners?",
            ["circle", "square", "triangle", "rectangle"], 0,
            "A circle is round with no corners.",
            option_asset_keys=["circle", "square", "triangle", "rectangle"],
        ),
        AuthoredQuestion(
            "A book cover is usually shaped like which figure?",
            ["rectangle", "circle", "triangle", "star"], 0,
            "A book cover is usually shaped like a rectangle.",
            option_asset_keys=["rectangle", "circle", "triangle", "star"],
        ),
        AuthoredQuestion(
            "A slice of pizza cut from the middle looks like which shape?",
            ["triangle", "circle", "square", "rectangle"], 0,
            "A pizza slice cut from the middle looks like a triangle.",
            option_asset_keys=["triangle", "circle", "square", "rectangle"],
        ),
        AuthoredQuestion(
            "Which shape has all 4 sides the same length?",
            ["square", "rectangle", "triangle", "oval"], 0,
            "A square has 4 sides that are all equal in length.",
            option_asset_keys=["square", "rectangle", "triangle", "oval"],
        ),
        AuthoredQuestion(
            "How many corners does a rectangle have?", ["2", "3", "4", "0"], 2,
            "A rectangle has 4 corners, like a square.",
            image_asset_key="rectangle",
        ),
    ],
    # ── Class 2 ─────────────────────────────────────────────────────────
    "MATH2_PLACE_VALUE": [
        AuthoredQuestion(
            "In the number 34, how many tens are there?", ["4", "2", "3", "5"], 2,
            "34 = 3 tens + 4 ones, so there are 3 tens.",
        ),
        AuthoredQuestion(
            "In the number 34, how many ones are there?", ["3", "5", "4", "6"], 2,
            "34 = 3 tens + 4 ones, so there are 4 ones.",
        ),
        AuthoredQuestion(
            "What is the value of the digit 5 in the tens place of 52?",
            ["5", "52", "500", "50"], 3,
            "The 5 in 52 is in the tens place, so its value is 5 x 10 = 50.",
        ),
        AuthoredQuestion(
            "Deepak has 6 tens and 8 ones. What number does he have?",
            ["86", "60", "608", "68"], 3, "6 tens is 60, plus 8 ones makes 68.",
        ),
        AuthoredQuestion(
            "The number 47 breaks apart into 40 and __?", ["4", "70", "47", "7"], 3,
            "47 has 4 tens (40) and 7 ones, so it breaks into 40 and 7.",
        ),
        AuthoredQuestion(
            "How many tens are in the number 90?", ["0", "90", "9", "19"], 2,
            "90 = 9 tens + 0 ones, so there are 9 tens.",
        ),
        AuthoredQuestion(
            "Which number has 7 tens and 3 ones?", ["37", "703", "73", "370"], 2,
            "7 tens is 70, plus 3 ones makes 73.",
        ),
        AuthoredQuestion(
            "In the number 68, which digit is in the ones place?",
            ["6", "86", "68", "8"], 3, "In 68, the digit 8 is in the ones place.",
        ),
    ],
    "MATH2_ADD_CARRYING": [
        AuthoredQuestion(
            "What is 27 + 15?", ["32", "52", "42", "41"], 2,
            "7 + 5 = 12, write 2 and carry 1; 2 + 1 + 1 = 4 tens. 27 + 15 = 42.",
        ),
        AuthoredQuestion(
            "A shop sold 38 pens on Monday and 26 pens on Tuesday. How many "
            "pens were sold in all?",
            ["54", "74", "64", "65"], 2, "38 + 26 = 64 pens.",
        ),
        AuthoredQuestion(
            "What is 45 + 38?", ["73", "83", "93", "82"], 1,
            "5 + 8 = 13, write 3 and carry 1; 4 + 3 + 1 = 8 tens. 45 + 38 = 83.",
        ),
        AuthoredQuestion(
            "What is 19 + 27?", ["36", "46", "45", "47"], 1,
            "9 + 7 = 16, write 6 and carry 1; 1 + 2 + 1 = 4 tens. 19 + 27 = 46.",
        ),
        AuthoredQuestion(
            "What is 56 + 27?", ["73", "83", "82", "93"], 1,
            "6 + 7 = 13, write 3 and carry 1; 5 + 2 + 1 = 8 tens. 56 + 27 = 83.",
        ),
        AuthoredQuestion(
            "A library had 48 story books. It bought 35 more. How many "
            "story books does it have now?",
            ["83", "73", "93", "82"], 0, "48 + 35 = 83 books.",
        ),
        AuthoredQuestion(
            "What is 68 + 19?", ["77", "87", "86", "97"], 1,
            "8 + 9 = 17, write 7 and carry 1; 6 + 1 + 1 = 8 tens. 68 + 19 = 87.",
        ),
        AuthoredQuestion(
            "When adding 24 and 18, what do we do first?",
            ["Add the tens digits", "Add the ones digits",
             "Subtract the ones digits", "Multiply the digits"], 1,
            "We always add the ones digits first, then the tens, carrying if needed.",
        ),
    ],
    "MATH2_SUB_BORROWING": [
        AuthoredQuestion(
            "What is 42 - 15?", ["37", "27", "23", "33"], 1,
            "Borrow a ten: 12 - 5 = 7, then 3 - 1 = 2 tens. 42 - 15 = 27.",
        ),
        AuthoredQuestion(
            "A basket had 53 mangoes. 26 were sold. How many mangoes are left?",
            ["37", "27", "23", "33"], 1, "53 - 26 = 27 mangoes.",
        ),
        AuthoredQuestion(
            "What is 61 - 34?", ["27", "37", "23", "33"], 0,
            "Borrow a ten: 11 - 4 = 7, then 5 - 3 = 2 tens. 61 - 34 = 27.",
        ),
        AuthoredQuestion(
            "What is 80 - 27?", ["63", "53", "57", "43"], 1,
            "Borrow a ten: 10 - 7 = 3, then 7 - 2 = 5 tens. 80 - 27 = 53.",
        ),
        AuthoredQuestion(
            "What is 46 - 19?", ["27", "37", "33", "23"], 0,
            "Borrow a ten: 16 - 9 = 7, then 3 - 1 = 2 tens. 46 - 19 = 27.",
        ),
        AuthoredQuestion(
            "A farmer had 72 eggs. He sold 38 eggs. How many eggs are left?",
            ["44", "34", "24", "54"], 1, "72 - 38 = 34 eggs.",
        ),
        AuthoredQuestion(
            "What is 84 - 37?", ["57", "47", "37", "43"], 1,
            "Borrow a ten: 14 - 7 = 7, then 7 - 3 = 4 tens. 84 - 37 = 47.",
        ),
        AuthoredQuestion(
            "When subtracting 52 - 28, why do we borrow a ten?",
            ["Because 2 is smaller than 8", "Because 5 is smaller than 2",
             "Because 8 is smaller than 2", "Because we always borrow"], 0,
            "We borrow because the ones digit 2 is smaller than the ones "
            "digit 8 we are subtracting.",
        ),
    ],
    "MATH2_MULT_INTRO": [
        AuthoredQuestion(
            "There are 3 groups of 4 apples each. How many apples in total?",
            ["7", "12", "10", "9"], 1, "3 groups of 4 = 3 x 4 = 12.",
            image_asset_key="apple",
        ),
        AuthoredQuestion(
            "Skip count by 2s, 5 times: 2, 4, 6, 8, 10. What is the total?",
            ["8", "12", "10", "14"], 2,
            "Skip counting by 2s five times lands on 10, so 5 x 2 = 10.",
        ),
        AuthoredQuestion("What is 4 x 5?", ["18", "20", "9", "16"], 1, "4 x 5 = 20."),
        AuthoredQuestion(
            "A box has 4 rows of 6 eggs each. How many eggs are in the box?",
            ["10", "20", "24", "28"], 2, "4 x 6 = 24 eggs.",
        ),
        AuthoredQuestion(
            "What is 7 x 1?", ["0", "7", "1", "14"], 1,
            "Multiplying by 1 keeps the number the same: 7 x 1 = 7.",
        ),
        AuthoredQuestion(
            "What is 7 x 0?", ["7", "1", "0", "70"], 2,
            "Multiplying by 0 always gives 0.",
        ),
        AuthoredQuestion(
            "3 x 4 means the same as adding 4 how many times?",
            ["4 times", "2 times", "3 times", "5 times"], 2,
            "3 x 4 means 4 + 4 + 4, adding 4 three times.",
        ),
        AuthoredQuestion(
            "Skip count by 5s, 4 times: 5, 10, 15, 20. What multiplication "
            "fact does this show?",
            ["4 x 5 = 20", "5 x 5 = 20", "4 x 4 = 20", "3 x 5 = 20"], 0,
            "4 jumps of 5 shows 4 x 5 = 20.",
        ),
    ],
    # ── Class 3 ─────────────────────────────────────────────────────────
    "MATH3_MULT_TABLES": [
        AuthoredQuestion("What is 6 x 8?", ["46", "54", "42", "48"], 3, "6 x 8 = 48."),
        AuthoredQuestion(
            "Notebooks cost 8 rupees each. What is the cost of 6 notebooks?",
            ["42", "56", "48", "54"], 2, "6 x 8 = 48 rupees.",
        ),
        AuthoredQuestion(
            "What number does the table of 5 always end in?",
            ["0 or 5", "2 or 7", "1 or 6", "3 or 8"], 0,
            "Every multiple of 5 ends in 0 or 5.",
        ),
        AuthoredQuestion("What is 9 x 7?", ["56", "72", "63", "70"], 2, "9 x 7 = 63."),
        AuthoredQuestion(
            "A garden has 9 rows with 7 plants in each row. How many plants "
            "in all?",
            ["56", "72", "81", "63"], 3, "9 x 7 = 63 plants.",
        ),
        AuthoredQuestion(
            "What is double of 6, using the table of 2?", ["8", "10", "14", "12"], 3,
            "2 x 6 means double 6, which is 12.",
        ),
        AuthoredQuestion("What is 4 x 4?", ["12", "20", "16", "8"], 2, "4 x 4 = 16."),
        AuthoredQuestion(
            "Which number correctly continues the table of 4: 4, 8, 12, __?",
            ["18", "20", "16", "14"], 2,
            "Each number in the table of 4 is 4 more than the last, so "
            "after 12 comes 16.",
        ),
    ],
    "MATH3_DIVISION": [
        AuthoredQuestion(
            "12 sweets are shared equally among 3 friends. How many sweets "
            "does each friend get?",
            ["3", "5", "4", "6"], 2, "12 ÷ 3 = 4 sweets each.",
        ),
        AuthoredQuestion(
            "Since 3 x 4 = 12, what is 12 ÷ 4?", ["4", "2", "3", "6"], 2,
            "Division undoes multiplication: 12 ÷ 4 = 3.",
        ),
        AuthoredQuestion(
            "How many groups of 5 fit into 20?", ["3", "5", "4", "6"], 2,
            "Counting by 5s: 5, 10, 15, 20 — that is 4 groups.",
        ),
        AuthoredQuestion(
            "18 storybooks are packed equally into 3 boxes. How many books "
            "go in each box?",
            ["5", "7", "6", "9"], 2, "18 ÷ 3 = 6 books per box.",
        ),
        AuthoredQuestion(
            "17 pencils are shared equally among 5 children, as evenly as "
            "possible. How many pencils does each child get?",
            ["4", "2", "3", "5"], 2,
            "5 x 3 = 15, so each child gets 3 pencils, with 2 left over.",
        ),
        AuthoredQuestion(
            "What is 24 ÷ 6?", ["3", "5", "4", "6"], 2, "24 ÷ 6 = 4.",
        ),
        AuthoredQuestion(
            "How many pencils are left over when 17 pencils are shared "
            "equally among 5 children?",
            ["0", "1", "2", "3"], 2,
            "5 x 3 = 15, and 17 - 15 = 2 pencils are left over.",
        ),
        AuthoredQuestion(
            "What is 45 ÷ 9?", ["4", "6", "5", "7"], 2,
            "45 ÷ 9 = 5, since 9 x 5 = 45.",
        ),
    ],
    "MATH3_PLACE_VALUE_1000": [
        AuthoredQuestion(
            "In the number 356, how many hundreds are there?", ["5", "6", "3", "0"], 2,
            "356 = 3 hundreds, 5 tens, 6 ones, so there are 3 hundreds.",
        ),
        AuthoredQuestion(
            "In the number 748, what is the value of the digit 7?",
            ["7", "70", "700", "78"], 2,
            "The digit 7 is in the hundreds place, so its value is 700.",
        ),
        AuthoredQuestion(
            "Which number is greater, 452 or 398?",
            ["398", "They are equal", "452", "Cannot tell"], 2,
            "452 has 4 hundreds, more than 398's 3 hundreds, so 452 is greater.",
        ),
        AuthoredQuestion(
            "Write 300 + 50 + 6 as one number.", ["356", "365", "536", "653"], 0,
            "3 hundreds, 5 tens, 6 ones makes 356.",
        ),
        AuthoredQuestion(
            "In the number 629, how many tens are there?", ["6", "9", "2", "0"], 2,
            "629 = 6 hundreds, 2 tens, 9 ones, so there are 2 tens.",
        ),
        AuthoredQuestion(
            "Building the number 245 with place-value blocks needs how "
            "many hundred-blocks?",
            ["4", "5", "2", "24"], 2, "245 has 2 hundreds, so it needs 2 hundred-blocks.",
        ),
        AuthoredQuestion(
            "Order from smallest to greatest: 512, 251, 521.",
            ["251, 512, 521", "512, 251, 521", "521, 512, 251", "251, 521, 512"], 0,
            "Comparing hundreds first (251 has 2, the others have 5), then "
            "tens for 512 vs 521 (1 < 2): 251, 512, 521.",
        ),
        AuthoredQuestion(
            "In the number 903, how many ones are there?", ["9", "0", "3", "93"], 2,
            "903 = 9 hundreds, 0 tens, 3 ones, so there are 3 ones.",
        ),
    ],
    "MATH3_FRACTIONS_INTRO": [
        AuthoredQuestion(
            "A roti is cut into 2 equal pieces. What is each piece called?",
            ["One-quarter", "One-third", "One-half", "One-whole"], 2,
            "Cutting into 2 equal pieces gives halves, 1/2 each.",
        ),
        AuthoredQuestion(
            "A roti is cut into 4 equal pieces. What fraction is each piece?",
            ["1/2", "1/3", "1/5", "1/4"], 3,
            "Cutting into 4 equal pieces gives quarters, 1/4 each.",
        ),
        AuthoredQuestion(
            "In the fraction 3/4, what does the bottom number 4 tell us?",
            ["The whole was cut into 4 equal parts", "We are talking about 4 parts",
             "There are 4 wholes", "None of these"], 0,
            "The denominator, 4, shows how many equal parts the whole was cut into.",
        ),
        AuthoredQuestion(
            "8 mangoes are grouped into 4 equal groups. What fraction of "
            "the mangoes is one group?",
            ["1/2", "1/8", "1/4", "1/3"], 2,
            "4 equal groups means each group is 1/4 of the total.",
        ),
        AuthoredQuestion(
            "If a cake is cut into 2 pieces of very different sizes, is "
            "each piece one-half?",
            ["Yes, always", "No, because the pieces are not equal",
             "Yes, if you eat one piece", "Cannot tell"], 1,
            "A fraction like one-half needs equal-sized pieces; unequal "
            "pieces are not true halves.",
        ),
        AuthoredQuestion(
            "How many quarters make one whole?", ["2", "3", "4", "5"], 2,
            "4 quarters (1/4 + 1/4 + 1/4 + 1/4) make one whole.",
        ),
        AuthoredQuestion(
            "8 mangoes are grouped into 4 equal groups. How many mangoes "
            "are in one group (1/4 of 8)?",
            ["4", "1", "2", "3"], 2, "8 ÷ 4 = 2 mangoes in each group.",
        ),
        AuthoredQuestion(
            "Which fraction represents 1 out of 2 equal parts?",
            ["1/4", "1/3", "1/2", "2/2"], 2, "1 out of 2 equal parts is 1/2.",
        ),
    ],
    "MATH3_MEASUREMENT": [
        AuthoredQuestion(
            "How many centimetres make 1 metre?", ["10", "1000", "500", "100"], 3,
            "100 centimetres make 1 metre.",
        ),
        AuthoredQuestion(
            "How many grams make 1 kilogram?", ["10", "1000", "100", "500"], 1,
            "1000 grams make 1 kilogram.",
        ),
        AuthoredQuestion(
            "How many millilitres make 1 litre?", ["1000", "100", "500", "10"], 0,
            "1000 millilitres make 1 litre.",
        ),
        AuthoredQuestion(
            "A rope is 250 centimetres long. How many metres and "
            "centimetres is that?",
            ["2 metres 5 cm", "25 metres", "2 metres 50 cm", "5 metres 20 cm"], 2,
            "250 cm = 2 metres (200 cm) + 50 cm.",
        ),
        AuthoredQuestion(
            "Which tool is best for measuring the length of a pencil?",
            ["Weighing scale", "Measuring jug", "Clock", "Ruler"], 3,
            "A ruler measures small lengths like a pencil, in centimetres.",
        ),
        AuthoredQuestion(
            "Which unit would you use to weigh a bag of rice?",
            ["Litres", "Kilograms", "Centimetres", "Millilitres"], 1,
            "Weight is measured in grams or kilograms; a bag of rice uses kilograms.",
        ),
        AuthoredQuestion(
            "One table is 90 cm tall and another is 105 cm tall. How much "
            "taller is the second table?",
            ["25 cm", "5 cm", "15 cm", "10 cm"], 2, "105 - 90 = 15 cm taller.",
        ),
        AuthoredQuestion(
            "Which unit would you use to measure how much water a bottle holds?",
            ["Kilograms", "Centimetres", "Litres", "Metres"], 2,
            "Capacity — how much liquid something holds — is "
            "measured in litres or millilitres.",
        ),
    ],
    # ── Class 4 ─────────────────────────────────────────────────────────
    "MATH4_MULTIDIGIT_MULT": [
        AuthoredQuestion(
            "What is 23 x 4?", ["82", "102", "92", "88"], 2,
            "20 x 4 = 80, 3 x 4 = 12, 80 + 12 = 92.",
        ),
        AuthoredQuestion(
            "What is 34 x 12?", ["402", "408", "388", "418"], 1,
            "34 x 10 = 340, 34 x 2 = 68, 340 + 68 = 408.",
        ),
        AuthoredQuestion(
            "A school has 18 classrooms with 32 students each. How many "
            "students in total?",
            ["540", "586", "576", "566"], 2,
            "18 x 30 = 540, 18 x 2 = 36, 540 + 36 = 576.",
        ),
        AuthoredQuestion(
            "What is 45 x 6?", ["250", "260", "280", "270"], 3,
            "40 x 6 = 240, 5 x 6 = 30, 240 + 30 = 270.",
        ),
        AuthoredQuestion(
            "Estimating 18 x 32 by rounding to 20 x 30 gives about how much?",
            ["500", "700", "640", "600"], 3,
            "20 x 30 = 600, a useful estimate close to the exact answer 576.",
        ),
        AuthoredQuestion(
            "What is 27 x 3?", ["71", "81", "91", "61"], 1,
            "20 x 3 = 60, 7 x 3 = 21, 60 + 21 = 81.",
        ),
        AuthoredQuestion(
            "What is 50 x 6?", ["560", "300", "350", "260"], 1,
            "Multiplying by tens: 5 x 6 = 30, then add one zero: 300.",
        ),
        AuthoredQuestion(
            "What is 19 x 5?", ["85", "105", "90", "95"], 3,
            "19 x 5: 20 x 5 = 100, minus 1 x 5 = 5, so 100 - 5 = 95.",
        ),
    ],
    "MATH4_LONG_DIVISION": [
        AuthoredQuestion(
            "What is 84 ÷ 4?", ["22", "20", "21", "19"], 2,
            "4 fits into 8 two times (8), then into 4 once. 84 ÷ 4 = 21.",
        ),
        AuthoredQuestion(
            "What is 156 ÷ 6?", ["24", "28", "26", "25"], 2,
            "6 fits into 15 twice (12, remainder 3); bring down 6 to make "
            "36, and 6 fits into 36 six times. 156 ÷ 6 = 26.",
        ),
        AuthoredQuestion(
            "What is 47 ÷ 5, and what is the remainder?",
            ["8 remainder 7", "9 remainder 2", "10 remainder 0", "9 remainder 3"], 1,
            "5 x 9 = 45, remainder 47 - 45 = 2, so 9 remainder 2.",
        ),
        AuthoredQuestion(
            "245 mangoes are packed equally into 7 boxes. How many mangoes "
            "in each box?",
            ["30", "33", "35", "37"], 2, "245 ÷ 7 = 35 mangoes per box.",
        ),
        AuthoredQuestion(
            "What is 96 ÷ 8?", ["11", "10", "13", "12"], 3,
            "8 x 12 = 96, so 96 ÷ 8 = 12.",
        ),
        AuthoredQuestion(
            "To check that 84 ÷ 4 = 21 is correct, what should we do?",
            ["Add 84 and 4", "Subtract 4 from 84",
             "Multiply 21 by 4 and see if it equals 84", "Divide 21 by 4"], 2,
            "Multiplying the quotient by the divisor should give back the "
            "original number: 21 x 4 = 84.",
        ),
        AuthoredQuestion(
            "What is 132 ÷ 6?", ["21", "24", "23", "22"], 3,
            "6 x 22 = 132, so 132 ÷ 6 = 22.",
        ),
        AuthoredQuestion(
            "What is 63 ÷ 7?", ["8", "10", "9", "7"], 2,
            "7 x 9 = 63, so 63 ÷ 7 = 9.",
        ),
    ],
    "MATH4_FRACTION_ADD": [
        AuthoredQuestion(
            "What is 2/7 + 3/7?", ["5/14", "6/7", "5/7", "1/7"], 2,
            "Add the numerators, keep the denominator: 2 + 3 = 5, so 5/7.",
        ),
        AuthoredQuestion(
            "What is 5/8 - 2/8?", ["3/16", "7/8", "3/8", "2/8"], 2,
            "Subtract numerators, keep the denominator: 5 - 2 = 3, so 3/8.",
        ),
        AuthoredQuestion(
            "Rahim ate 2/6 of a cake in the morning and 3/6 in the "
            "evening. How much did he eat in total?",
            ["6/12", "1/6", "5/12", "5/6"], 3, "2/6 + 3/6 = 5/6.",
        ),
        AuthoredQuestion(
            "What is 1/9 + 4/9?", ["5/9", "5/18", "4/9", "1/9"], 0,
            "1 + 4 = 5, so 5/9.",
        ),
        AuthoredQuestion(
            "A pizza is cut into 8 slices. Someone eats 3/8, then 5/8 "
            "more. What fraction have they eaten in total?",
            ["7/8", "8/16", "1 whole (8/8)", "8/8 plus more"], 2,
            "3/8 + 5/8 = 8/8, which is the whole pizza.",
        ),
        AuthoredQuestion(
            "What is 7/10 - 4/10?", ["11/10", "3/20", "3/10", "4/10"], 2,
            "7 - 4 = 3, so 3/10.",
        ),
        AuthoredQuestion(
            "Which is the correct way to add 2/7 and 3/7?",
            ["Add both numerators and denominators: 5/14",
             "Add the numerators, keep the denominator: 5/7",
             "Multiply the numerators: 6/7",
             "Keep the numerators, add the denominators: 2/14"], 1,
            "With the same denominator, only the numerators are added.",
        ),
        AuthoredQuestion(
            "What is 3/5 + 1/5?", ["4/10", "3/5", "4/5", "1/5"], 2,
            "3 + 1 = 4, so 4/5.",
        ),
    ],
    "MATH4_PERIMETER_AREA": [
        AuthoredQuestion(
            "What is the perimeter of a rectangle with length 8 cm and width 5 cm?",
            ["13 cm", "40 cm", "26 cm", "21 cm"], 2,
            "Perimeter = 2 x (8 + 5) = 2 x 13 = 26 cm.",
        ),
        AuthoredQuestion(
            "What is the area of a rectangle with length 8 cm and width 5 cm?",
            ["26 cm²", "13 cm²", "45 cm²", "40 cm²"], 3,
            "Area = 8 x 5 = 40 cm².",
        ),
        AuthoredQuestion(
            "What is the perimeter of a square with side 6 cm?",
            ["36 cm", "12 cm", "24 cm", "30 cm"], 2, "Perimeter = 4 x 6 = 24 cm.",
        ),
        AuthoredQuestion(
            "What is the area of a square with side 6 cm?",
            ["24 cm²", "12 cm²", "30 cm²", "36 cm²"], 3,
            "Area = 6 x 6 = 36 cm².",
        ),
        AuthoredQuestion(
            "A garden is 12 m long and 7 m wide. What is its perimeter?",
            ["19 m", "84 m", "38 m", "42 m"], 2,
            "Perimeter = 2 x (12 + 7) = 2 x 19 = 38 m.",
        ),
        AuthoredQuestion(
            "A garden is 12 m long and 7 m wide. What is its area?",
            ["38 m²", "19 m²", "91 m²", "84 m²"], 3,
            "Area = 12 x 7 = 84 m².",
        ),
        AuthoredQuestion(
            "Which formula finds the area of a rectangle?",
            ["length + width", "2 x (length + width)", "length x width", "2 x length"], 2,
            "Area is length multiplied by width.",
        ),
        AuthoredQuestion(
            "A student found the perimeter of a 10 cm x 4 cm rectangle by "
            "writing 10 x 4 = 40 cm. What did they do wrong?",
            ["They used the area formula instead of the perimeter formula",
             "They forgot to add the width", "Nothing, this is correct",
             "They multiplied by the wrong number"], 0,
            "Perimeter is 2 x (length + width) = 28 cm; multiplying length "
            "by width gives area, not perimeter — a common mix-up.",
        ),
    ],
    "MATH4_DECIMALS_INTRO": [
        AuthoredQuestion(
            "Which decimal equals 4 ones and 7 tenths?",
            ["7.4", "0.47", "4.07", "4.7"], 3,
            "4 ones and 7 tenths is written as 4.7.",
        ),
        AuthoredQuestion(
            "What is the decimal form of the fraction 3/10?",
            ["3.0", "0.3", "3.10", "0.03"], 1, "3/10 is written as 0.3.",
        ),
        AuthoredQuestion(
            "Which is greater, 6.4 or 6.2?",
            ["6.2", "They are equal", "6.4", "Cannot tell"], 2,
            "6.4 has more tenths than 6.2, so 6.4 is greater.",
        ),
        AuthoredQuestion(
            "Which is greater, 5.8 or 4.9?",
            ["4.9", "They are equal", "Cannot tell", "5.8"], 3,
            "5.8 has a greater whole-number part (5) than 4.9 (4), so 5.8 is greater.",
        ),
        AuthoredQuestion(
            "In the decimal 6.4, what is the digit 4 called?",
            ["The hundreds digit", "The tenths digit", "The ones digit",
             "The hundredths digit"], 1,
            "The digit right after the decimal point is the tenths digit.",
        ),
        AuthoredQuestion(
            "What is the decimal form of the fraction 25/100?",
            ["0.25", "2.5", "25.0", "0.025"], 0, "25/100 is written as 0.25.",
        ),
        AuthoredQuestion(
            "A price tag shows 45.50 rupees. What does the .50 mean?",
            ["50 whole rupees", "5 rupees", "50 paise, or half a rupee",
             "500 paise"], 2,
            "The decimal part .50 means 50 out of 100, or half a rupee (50 paise).",
        ),
        AuthoredQuestion(
            "Which decimal is greater: 3.9 or 3.15?",
            ["3.15", "They are equal", "Cannot tell", "3.9"], 3,
            "Comparing tenths first: 3.9 has 9 tenths, 3.15 has 1 tenth "
            "— so 3.9 is greater, even though 3.15 has more digits.",
        ),
    ],
    # ── Class 5 ─────────────────────────────────────────────────────────
    "MATH5_FRACTION_OPS": [
        AuthoredQuestion(
            "What is 1/2 + 1/3?", ["2/5", "5/6", "2/6", "1/6"], 1,
            "Common denominator 6: 3/6 + 2/6 = 5/6.",
        ),
        AuthoredQuestion(
            "What is 2/3 - 1/4?", ["1/12", "1/1", "5/12", "3/12"], 2,
            "Common denominator 12: 8/12 - 3/12 = 5/12.",
        ),
        AuthoredQuestion(
            "Which is greater, 3/5 or 2/3?",
            ["They are equal", "3/5", "2/3", "Cannot tell"], 2,
            "Common denominator 15: 3/5 = 9/15, 2/3 = 10/15, so 2/3 is greater.",
        ),
        AuthoredQuestion(
            "A recipe uses 1/2 cup sugar and 1/3 cup honey. How much "
            "sweetener in total?",
            ["2/5 cup", "5/6 cup", "1/6 cup", "3/6 cup"], 1,
            "1/2 + 1/3 = 3/6 + 2/6 = 5/6 cup.",
        ),
        AuthoredQuestion(
            "What is 3/4 + 1/8?", ["4/12", "4/8", "7/8", "1/2"], 2,
            "Common denominator 8: 6/8 + 1/8 = 7/8.",
        ),
        AuthoredQuestion(
            "What is 5/6 - 1/3?", ["4/3", "1/2", "4/6", "1/3"], 1,
            "Common denominator 6: 5/6 - 2/6 = 3/6 = 1/2.",
        ),
        AuthoredQuestion(
            "To add 1/4 and 1/6, what is the smallest common denominator?",
            ["10", "24", "12", "6"], 2,
            "The smallest number both 4 and 6 divide into evenly is 12.",
        ),
        AuthoredQuestion(
            "A student added 1/2 + 1/3 by writing 2/5. What mistake did "
            "they make?",
            ["They added numerators and denominators separately without "
             "finding a common denominator",
             "They multiplied instead of adding", "They used the wrong numerators",
             "There is no mistake, 2/5 is correct"], 0,
            "Fractions with different denominators cannot be added by "
            "simply adding numerators and denominators; a common "
            "denominator is needed first.",
        ),
    ],
    "MATH5_DECIMAL_OPS": [
        AuthoredQuestion(
            "What is 4.7 + 2.3?", ["6.10", "7.0", "6.9", "7.10"], 1,
            "Lining up decimal points: 4.7 + 2.3 = 7.0.",
        ),
        AuthoredQuestion(
            "What is 8.5 - 3.2?", ["5.7", "5.3", "4.3", "11.7"], 1, "8.5 - 3.2 = 5.3.",
        ),
        AuthoredQuestion(
            "What is 6.25 + 1.4?", ["6.39", "6.65", "7.65", "6.29"], 2,
            "Think of 1.4 as 1.40: 6.25 + 1.40 = 7.65.",
        ),
        AuthoredQuestion(
            "What is 3.2 x 4?", ["12.8", "1.28", "128", "6.4"], 0,
            "32 x 4 = 128; placing one decimal place gives 12.8.",
        ),
        AuthoredQuestion(
            "What is 2.15 x 3?", ["0.645", "6.45", "64.5", "6.15"], 1,
            "215 x 3 = 645; placing two decimal places gives 6.45.",
        ),
        AuthoredQuestion(
            "A shopkeeper sells 3 notebooks priced at 15.50 rupees each. "
            "What is the total cost?",
            ["45.50", "46.00", "46.50", "18.50"], 2, "3 x 15.50 = 46.50 rupees.",
        ),
        AuthoredQuestion(
            "What is 9.6 - 4.6?", ["4.0", "5.0", "14.2", "5.4"], 1, "9.6 - 4.6 = 5.0.",
        ),
        AuthoredQuestion(
            "Estimating 4.9 + 3.1 by rounding to whole numbers gives about "
            "how much?",
            ["9", "7", "8", "6"], 2,
            "4.9 rounds to 5, 3.1 rounds to 3; 5 + 3 = 8, close to the "
            "exact answer 8.0.",
        ),
    ],
    "MATH5_PERCENTAGE_INTRO": [
        AuthoredQuestion(
            "What does 25% mean?",
            ["25 out of 1000", "25 out of 10", "25 out of 100", "25 whole ones"], 2,
            "Percent means out of a hundred, so 25% means 25 out of 100.",
        ),
        AuthoredQuestion(
            "What is 50% of 40?", ["25", "10", "30", "20"], 3,
            "50% = 1/2, and 1/2 x 40 = 20.",
        ),
        AuthoredQuestion(
            "What is 25% of 80?", ["25", "40", "20", "16"], 2,
            "25% = 1/4, and 1/4 x 80 = 20.",
        ),
        AuthoredQuestion(
            "What is 10% of 250?", ["10", "2.5", "100", "25"], 3,
            "10% = 1/10, and 250 ÷ 10 = 25.",
        ),
        AuthoredQuestion(
            "A shirt costs 200 rupees with a 20% discount. What is the "
            "discount amount?",
            ["20", "180", "40", "160"], 2, "20% of 200 = 40 rupees discount.",
        ),
        AuthoredQuestion(
            "A shirt costs 200 rupees with a 20% discount. What is the sale price?",
            ["40", "160", "180", "240"], 1, "Sale price = 200 - 40 = 160 rupees.",
        ),
        AuthoredQuestion(
            "If 40 out of 100 students like cricket, what percent is that?",
            ["4%", "400%", "14%", "40%"], 3, "40 out of 100 is 40%.",
        ),
        AuthoredQuestion(
            "A class has 25 students, and 20% wear glasses. How many "
            "students wear glasses?",
            ["20", "5", "4", "10"], 1, "20% of 25 = 1/5 x 25 = 5 students.",
        ),
    ],
    "MATH5_AREA_VOLUME": [
        AuthoredQuestion(
            "An L-shaped garden is made of a 6m x 4m rectangle and a 3m x "
            "2m rectangle. What is its total area?",
            ["24 m²", "30 m²", "36 m²", "20 m²"], 1,
            "(6 x 4) + (3 x 2) = 24 + 6 = 30 m².",
        ),
        AuthoredQuestion(
            "What is the volume of a cube with side 5 cm?",
            ["25 cm³", "15 cm³", "100 cm³", "125 cm³"], 3,
            "5 x 5 x 5 = 125 cm³.",
        ),
        AuthoredQuestion(
            "What is the volume of a cuboid 8 cm long, 4 cm wide, and 3 cm tall?",
            ["96 cm³", "15 cm³", "32 cm³", "60 cm³"], 0,
            "8 x 4 x 3 = 96 cm³.",
        ),
        AuthoredQuestion(
            "A water tank is 2 m by 1 m by 1 m. What is its volume?",
            ["4 m³", "2 m³", "6 m³", "3 m³"], 1,
            "2 x 1 x 1 = 2 m³.",
        ),
        AuthoredQuestion(
            "Which units are used to measure volume?",
            ["Square units, like cm²", "Cubic units, like cm³",
             "Litres only", "Metres only"], 1,
            "Volume is measured in cubic units, like cubic centimetres.",
        ),
        AuthoredQuestion(
            "What is the area of an L-shaped figure made of a 5m x 3m "
            "rectangle and a 2m x 2m rectangle?",
            ["15 m²", "19 m²", "10 m²", "21 m²"], 1,
            "(5 x 3) + (2 x 2) = 15 + 4 = 19 m².",
        ),
        AuthoredQuestion(
            "What is the volume of a cube with side 4 cm?",
            ["16 cm³", "12 cm³", "64 cm³", "48 cm³"], 2,
            "4 x 4 x 4 = 64 cm³.",
        ),
        AuthoredQuestion(
            "To find the volume of a cuboid, we multiply which three measurements?",
            ["Length, width, and perimeter", "Length, area, and height",
             "Length, width, and height", "Width and height only"], 2,
            "Volume = length x width x height.",
        ),
    ],
    "MATH5_LONG_DIVISION_LARGE": [
        AuthoredQuestion(
            "What is 1248 ÷ 24?", ["48", "62", "58", "52"], 3,
            "24 fits into 124 five times (120, remainder 4); bring down 8 "
            "to make 48, and 24 fits exactly 2 times. 1248 ÷ 24 = 52.",
        ),
        AuthoredQuestion(
            "What is 517 ÷ 15, and what is the remainder?",
            ["35 remainder 2", "34 remainder 5", "34 remainder 7",
             "33 remainder 12"], 2,
            "15 x 34 = 510, remainder 517 - 510 = 7, so 34 remainder 7.",
        ),
        AuthoredQuestion(
            "A factory packed 3564 toys equally into 36 boxes. How many "
            "toys in each box?",
            ["94", "101", "89", "99"], 3, "3564 ÷ 36 = 99 toys per box.",
        ),
        AuthoredQuestion(
            "What is 2160 ÷ 36?", ["70", "55", "60", "65"], 2,
            "36 x 60 = 2160, so 2160 ÷ 36 = 60.",
        ),
        AuthoredQuestion(
            "To check that 1248 ÷ 24 = 52 is correct, what should we do?",
            ["Add 52 and 24", "Divide 52 by 24",
             "Multiply 52 by 24 and see if it equals 1248", "Subtract 24 from 1248"], 2,
            "Multiplying the quotient by the divisor should give back the "
            "original number: 52 x 24 = 1248.",
        ),
        AuthoredQuestion(
            "What is 4250 ÷ 25?", ["160", "175", "165", "170"], 3,
            "25 x 170 = 4250, so 4250 ÷ 25 = 170.",
        ),
        AuthoredQuestion(
            "Estimating 124 ÷ 24 by rounding 24 to 25, about how many "
            "times does 25 fit into 124?",
            ["6 times", "4 times", "5 times", "3 times"], 2,
            "4 x 25 = 100, and 5 x 25 = 125, which is close to 124, so "
            "about 5 times — matching the actual first digit of the quotient.",
        ),
        AuthoredQuestion(
            "What is 972 ÷ 12?", ["79", "91", "81", "89"], 2,
            "12 x 81 = 972, so 972 ÷ 12 = 81.",
        ),
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Validation — same shape as scripts/generate_template_questions.py's
# _validate_generated, adapted for the AuthoredQuestion dataclass.
# ─────────────────────────────────────────────────────────────────────────

def _validate(topic_code: str, q: AuthoredQuestion) -> None:
    assert len(q.options) == 4, f"{topic_code}: expected 4 options, got {q.options!r}"
    assert len(set(q.options)) == 4, f"{topic_code}: duplicate option values {q.options!r}"
    assert 0 <= q.correct_option_index <= 3, f"{topic_code}: bad correct_option_index"
    assert not (q.image_asset_key and q.image_emoji), (
        f"{topic_code}: image_asset_key and image_emoji both set"
    )
    assert not (q.option_asset_keys and q.option_emojis), (
        f"{topic_code}: option_asset_keys and option_emojis both set"
    )
    if q.image_asset_key:
        assert q.image_asset_key in ALL_ASSET_KEYS, (
            f"{topic_code}: unknown image_asset_key {q.image_asset_key!r}"
        )
    if q.option_asset_keys:
        assert len(q.option_asset_keys) == 4, f"{topic_code}: option_asset_keys must have 4 entries"
        for key in q.option_asset_keys:
            assert key in ALL_ASSET_KEYS, f"{topic_code}: unknown option_asset_key {key!r}"
    if q.option_emojis:
        assert len(q.option_emojis) == 4, f"{topic_code}: option_emojis must have 4 entries"


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load the authored Mathematics diagnostic-quiz question bank."
    )
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    # Validate everything up front, before touching the DB at all.
    total_authored = 0
    for topic_code, qs in QUESTIONS.items():
        assert len(qs) >= 8, f"{topic_code}: only {len(qs)} questions authored, need >= 8"
        for q in qs:
            _validate(topic_code, q)
        total_authored += len(qs)
    print(f"Validated {total_authored} authored questions across {len(QUESTIONS)} topics.")

    async with AsyncSessionFactory() as session:
        topics_res = await session.execute(
            select(Topic).where(Topic.subject == "Mathematics")
        )
        topics_by_code = {t.code: t for t in topics_res.scalars().all()}

        missing = [code for code in QUESTIONS if code not in topics_by_code]
        if missing:
            print(f"[warn] No Topic row found for authored codes: {missing} — skipping them.")
        uncovered = [code for code in topics_by_code if code not in QUESTIONS]
        if uncovered:
            print(f"[warn] Mathematics topics with NO authored questions: {uncovered}")

        if args.dry_run:
            for topic_code, qs in QUESTIONS.items():
                topic = topics_by_code.get(topic_code)
                if not topic:
                    continue
                print(f"\n[dry-run] {topic_code} (Class {topic.class_number}): {len(qs)} questions")
                for q in qs[:2]:
                    print(f"  Q: {q.question_text}")
                    print(f"  Options: {q.options}  Correct: {q.correct_option_index}")
                    if q.image_asset_key:
                        print(f"  Image asset: {q.image_asset_key}")
                    if q.option_asset_keys:
                        print(f"  Option assets: {q.option_asset_keys}")
            return

        # Deactivate (never delete) existing active Mathematics questions so
        # the authored bank dominates what students see, while keeping the
        # deterministic template:v1 bank's rows in the table for audit/
        # possible future reuse — same "deactivate, don't delete" convention
        # scripts/generate_questions.py's --repair-image-refs uses.
        deactivate_res = await session.execute(
            select(Question).where(Question.subject == "Mathematics", Question.is_active == True)  # noqa: E712
        )
        to_deactivate = list(deactivate_res.scalars().all())
        for q in to_deactivate:
            q.is_active = False
            session.add(q)
        await session.commit()
        print(f"[ok] Deactivated {len(to_deactivate)} previously active Mathematics question(s).")

        batch_tag = f"{date.today().isoformat()}-authored"
        inserted = 0
        for topic_code, qs in QUESTIONS.items():
            topic = topics_by_code.get(topic_code)
            if not topic:
                continue
            for q in qs:
                session.add(
                    Question(
                        topic_id=topic.id,
                        subject=topic.subject,
                        class_number=topic.class_number,
                        question_text=q.question_text,
                        options=q.options,
                        correct_option_index=q.correct_option_index,
                        explanation=q.explanation or None,
                        image_emoji=q.image_emoji,
                        image_asset_key=q.image_asset_key,
                        option_emojis=q.option_emojis,
                        option_asset_keys=q.option_asset_keys,
                        generation_source="authored:claude:v1",
                        generation_batch=batch_tag,
                        module_id=None,
                        branch_name=None,
                        reviewed=False,
                        is_active=True,
                    )
                )
                inserted += 1
            print(f"  [ok] {topic_code}: {len(qs)} questions queued")
        await session.commit()
        print(f"\nInserted {inserted} authored Mathematics questions "
              f"(generation_source='authored:claude:v1', batch='{batch_tag}').")


if __name__ == "__main__":
    asyncio.run(main())
