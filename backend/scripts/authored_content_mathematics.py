"""
One-off script — loads ORIGINAL, hand-authored (by a Claude agent, no LLM API
call at runtime) NCERT-aligned Mathematics chapter content into the
`document_chunks` table under branch_name="SELF" (the generic, non-school
grounding corpus used by scripts/generate_questions.py's RAG path and
scripts/generate_lessons.py). NOT run at app startup.

Why this exists: `src/db/ncert_content.py` previously held only a single
short placeholder paragraph per (subject, class) — nowhere near enough
material to ground real diagnostic-quiz questions or lesson slides in actual
Class 1-5 Mathematics curriculum content. This script replaces that
Mathematics placeholder with real depth: one chapter per Mathematics Topic
row (see src/db/curriculum_seed.py) with worked examples, word problems, and
key facts, at a reading level appropriate for that class (mirroring
scripts/generate_questions.py's `_reading_level_instruction`).

Honesty note: every chapter below is originally written for this project,
topically/pedagogically aligned with what NCERT's "Math Magic" Class 1-5
textbooks teach (same topics, same progression) — it is NOT a reproduction
of any copyrighted textbook page. Distinct in wording and structure from the
placeholder text it replaces (src/db/ncert_content.py) and from any real
NCERT publication.

Scope discipline: this script touches ONLY document_chunks rows with
subject="Mathematics" (any branch_name="SELF" row for another subject is
left untouched), and does not import or edit src/db/ncert_content.py,
src/db/curriculum_seed.py, or src/ai/math_question_bank.py — those are
shared files other parallel per-subject agents may also be touching.

Usage (from backend/):
    uv run python scripts/authored_content_mathematics.py --dry-run
    uv run python scripts/authored_content_mathematics.py

`CHAPTER_META` and `chapter_body_for` are re-exported for
scripts/authored_questions_mathematics.py and
scripts/authored_lessons_mathematics.py, which need to know the
(class_number, topic_code) -> (chapter_number, chapter_title) mapping this
script establishes, without re-declaring it.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import select, delete

from src.ai.chunking import extract_chapters_and_chunks
from src.core.database import AsyncSessionFactory
from src.models.chunk import DocumentChunk
from src.models.ncert import NCERTBook


# ─────────────────────────────────────────────────────────────────────────
# Authored chapter content
#
# One chapter per Mathematics Topic row (src/db/curriculum_seed.py), in
# topic order, so chapter <-> topic <-> lesson <-> question-bank all line up
# 1:1 for every downstream script. Each tuple is
# (topic_code, chapter_title, body_text). chapter_number is the tuple's
# 1-based position within its class's list.
# ─────────────────────────────────────────────────────────────────────────

CHAPTERS: dict[int, list[tuple[str, str, str]]] = {
    1: [
        (
            "MATH1_COUNTING",
            "Counting to Twenty",
            "We count things one at a time. We say one number for each thing.\n"
            "Numbers go in order: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.\n"
            "After 10 comes 11, 12, 13, and on and on up to 20.\n"
            "Ravi has 6 marbles. He counts them one by one: 1, 2, 3, 4, 5, 6. "
            "He has 6 marbles in all.\n"
            "We can count backward too. From 10 we say 10, 9, 8, 7, 6, 5, 4, 3, 2, 1.\n"
            "Counting backward is fun, like counting down for a rocket to blast off.\n"
            "Numbers can be written with digits. The digit 7 stands for seven "
            "things. The digit 15 stands for fifteen things.\n"
            "15 has two digits, 1 and 5. It means 1 ten and 5 more ones.\n"
            "Meera lines up her toy cars. She counts 12 cars. If she gets 1 more "
            "car, she will have 13 cars, because 13 comes right after 12.\n"
            "We count many things every day. We count spoons at dinner. We count "
            "steps on the stairs. We count friends in a line.\n"
            "Practising counting every day makes it fast and easy.",
        ),
        (
            "MATH1_COMPARISON",
            "Which Group Has More?",
            "When we look at two groups, one group can have more things, fewer "
            "things, or the same number of things.\n"
            "We use special words to compare. 'Greater than' means one number is "
            "bigger. 'Less than' means one number is smaller. 'Equal to' means "
            "both numbers are the same.\n"
            "8 is greater than 5, because 8 comes after 5 when we count.\n"
            "5 is less than 8, because 5 comes before 8 when we count.\n"
            "6 is equal to 6, because they are the same number.\n"
            "One easy way to compare is to line up objects side by side, one "
            "from each group.\n"
            "Priya has 9 pencils. Arjun has 7 pencils. If we line up 7 of "
            "Priya's pencils next to Arjun's 7 pencils, Priya still has 2 "
            "pencils left over. So Priya has more pencils than Arjun.\n"
            "We can also compare using pictures. If a box shows 4 apples and "
            "another box shows 6 apples, the box with 6 apples has more.\n"
            "The symbol '>' means greater than, and the symbol '<' means less "
            "than. 8 > 5 means 8 is greater than 5. 5 < 8 means 5 is less than 8.\n"
            "Comparing numbers helps us decide which team has more players, or "
            "which plate has more grapes.",
        ),
        (
            "MATH1_ADD_WITHIN_20",
            "Joining Groups Together",
            "Addition means joining two groups together to find the total.\n"
            "When we add, we put groups together and count everything.\n"
            "Sam has 4 red balloons and 3 blue balloons. Joining them together, "
            "he has 4 + 3 = 7 balloons in all.\n"
            "We can use our fingers to add small numbers. Hold up 4 fingers, "
            "then hold up 3 more fingers, then count all the fingers up: 7.\n"
            "Sometimes it helps to start with the bigger number and count on. "
            "For 3 + 9, start at 9 and count on 3 more: 10, 11, 12. So 3 + 9 = 12.\n"
            "A number line can also help. Start at 5, then hop forward 6 times: "
            "6, 7, 8, 9, 10, 11. So 5 + 6 = 11.\n"
            "Word problems use addition too. Neha picked 8 flowers in the "
            "morning and 5 more flowers in the evening. How many flowers did "
            "she pick in all? We add 8 + 5 = 13 flowers.\n"
            "We can add numbers in any order and get the same answer. 4 + 3 "
            "gives the same answer as 3 + 4, which is 7.\n"
            "Adding within 20 means the total never goes past 20. Practising "
            "with counters, buttons, or drawings makes addition easier to picture.",
        ),
        (
            "MATH1_SUB_WITHIN_20",
            "Taking Some Away",
            "Subtraction means taking some things away from a group to find "
            "what is left.\n"
            "When we subtract, we start with a group and remove some of it.\n"
            "Kabir has 9 balloons. 2 balloons fly away. How many balloons are "
            "left? We subtract 9 - 2 = 7 balloons.\n"
            "We can count backward to subtract. For 12 - 4, start at 12 and "
            "count back 4 times: 11, 10, 9, 8. So 12 - 4 = 8.\n"
            "A number line helps too. Start at 15, then hop backward 6 times to "
            "land on 9. So 15 - 6 = 9.\n"
            "Subtraction is the opposite of addition. If 6 + 5 = 11, then "
            "11 - 5 = 6, and 11 - 6 = 5.\n"
            "Word problems use subtraction too. Anaya had 14 stickers. She gave "
            "6 stickers to her friend. How many stickers does Anaya have now? "
            "We subtract 14 - 6 = 8 stickers.\n"
            "Sometimes nothing is left. If Rohan has 5 sweets and eats all 5, "
            "then 5 - 5 = 0 sweets are left.\n"
            "Practising subtraction with real objects, like counters or "
            "buttons, helps make the idea of 'taking away' easy to see.",
        ),
        (
            "MATH1_SHAPES",
            "Shapes All Around Us",
            "Many things around us are shaped like simple 2D shapes.\n"
            "A circle is round all the way around. It has no corners and no "
            "straight sides. A ball looks round like a circle, and a clock face "
            "is shaped like a circle.\n"
            "A square has 4 sides that are all the same length, and 4 corners. "
            "A window can be shaped like a square.\n"
            "A rectangle has 4 sides and 4 corners too, but only the opposite "
            "sides are equal in length. A book cover is often a rectangle.\n"
            "A triangle has 3 sides and 3 corners. A slice of pizza cut from "
            "the middle can look like a triangle. A tent can look like a "
            "triangle too.\n"
            "We can sort shapes by counting their sides and corners. A circle "
            "has 0 corners. A triangle has 3 corners. A square and a rectangle "
            "each have 4 corners.\n"
            "Shapes can be big or small, and different colours, but they are "
            "still the same shape if their sides and corners match.\n"
            "Looking around the classroom, we can find circles in clocks, "
            "squares in tiles, rectangles in doors, and triangles in flags.\n"
            "Learning to name shapes helps us describe the world we see every day.",
        ),
    ],
    2: [
        (
            "MATH2_PLACE_VALUE",
            "Tens and Ones",
            "Every 2-digit number is made of tens and ones.\n"
            "The number 34 means 3 tens and 4 ones. 3 tens is the same as 30. "
            "So 30 plus 4 makes 34.\n"
            "We can show this with bundles. 3 bundles of ten sticks, plus 4 "
            "loose sticks, make 34 sticks in all.\n"
            "The digit on the left tells us the tens. The digit on the right "
            "tells us the ones.\n"
            "In the number 52, the digit 5 is in the tens place, so it means 5 "
            "tens, or 50. The digit 2 is in the ones place, so it means 2 ones.\n"
            "Understanding tens and ones makes adding and subtracting bigger "
            "numbers much easier, because we can work with tens and ones separately.\n"
            "Deepak has 6 tens and 8 ones. What number does he have? 6 tens is "
            "60, plus 8 ones makes 68.\n"
            "We can also break a number apart. The number 47 breaks apart into "
            "40 and 7, because 47 has 4 tens and 7 ones.\n"
            "Place-value blocks, where a long rod stands for a ten and a small "
            "cube stands for one, help us see tens and ones clearly.\n"
            "Practising with different 2-digit numbers helps us understand how "
            "our number system is built from groups of ten.",
        ),
        (
            "MATH2_ADD_CARRYING",
            "Adding with Carrying",
            "When we add two 2-digit numbers, sometimes the ones add up to 10 "
            "or more.\n"
            "When that happens, we carry 1 ten over to the tens column.\n"
            "Let's add 27 and 15. First we add the ones: 7 plus 5 makes 12. "
            "Since 12 is more than 9, we write down 2 and carry 1 ten.\n"
            "Next we add the tens, including the carried ten: 2 tens plus 1 ten "
            "plus the carried 1 ten makes 4 tens.\n"
            "So 27 plus 15 equals 42.\n"
            "We can check this by counting on: starting at 27 and counting on "
            "15 more lands on 42.\n"
            "Word problems use carrying too. A shop sold 38 pens on Monday and "
            "26 pens on Tuesday. How many pens were sold in all? We add 38 plus 26.\n"
            "Adding the ones: 8 plus 6 makes 14. We write 4 and carry 1 ten.\n"
            "Adding the tens: 3 tens plus 2 tens plus the carried 1 ten makes 6 "
            "tens. So the shop sold 64 pens in all.\n"
            "Practising with small objects, grouped into bundles of ten, makes "
            "carrying much easier to picture and understand.",
        ),
        (
            "MATH2_SUB_BORROWING",
            "Subtracting with Borrowing",
            "Sometimes when we subtract, the ones digit on top is smaller than "
            "the ones digit we are taking away.\n"
            "When that happens, we borrow 1 ten from the tens column and add it "
            "as 10 ones.\n"
            "Let's subtract 15 from 42. Since 2 is smaller than 5, we borrow a "
            "ten from the 4. The 4 tens become 3 tens, and the 2 ones become 12 ones.\n"
            "Now we subtract the ones: 12 minus 5 makes 7.\n"
            "Then we subtract the tens: 3 tens minus 1 ten makes 2 tens.\n"
            "So 42 minus 15 equals 27.\n"
            "We can check subtraction by adding back: 27 plus 15 should give us "
            "42 again, and it does.\n"
            "Word problems use borrowing too. A basket had 53 mangoes. 26 "
            "mangoes were sold. How many mangoes are left? We subtract 53 minus 26.\n"
            "Since 3 is smaller than 6, we borrow a ten. The 5 tens become 4 "
            "tens, and the 3 ones become 13 ones.\n"
            "13 minus 6 makes 7. Then 4 tens minus 2 tens makes 2 tens. So 27 "
            "mangoes are left in the basket.\n"
            "Practising borrowing with bundles of ten sticks makes the idea "
            "easy to picture.",
        ),
        (
            "MATH2_MULT_INTRO",
            "What Is Multiplication?",
            "Multiplication is a quick way to add the same number many times.\n"
            "Suppose we have 3 groups of 4 apples in each group. Adding them "
            "the long way: 4 plus 4 plus 4 makes 12.\n"
            "Multiplication lets us write this faster: 3 times 4 equals 12, "
            "written as 3 x 4 = 12.\n"
            "Skip counting is a great way to discover multiplication. Counting "
            "in jumps of 2: 2, 4, 6, 8, 10. That is 5 jumps of 2, so 5 x 2 = 10.\n"
            "Counting in jumps of 5: 5, 10, 15, 20. That is 4 jumps of 5, so "
            "4 x 5 = 20.\n"
            "Arrays help us see multiplication too. If we arrange 3 rows of 5 "
            "stars each, there are 3 x 5 = 15 stars in all.\n"
            "Word problems use multiplication too. A box has 4 rows of 6 eggs "
            "each. How many eggs are in the box? We multiply 4 x 6 = 24 eggs.\n"
            "Multiplying by 1 keeps the number the same: 7 x 1 = 7. Multiplying "
            "by 0 always gives 0: 7 x 0 = 0.\n"
            "Learning small multiplication facts, like 2s, 5s, and 10s, through "
            "skip counting builds a strong start for bigger tables later.",
        ),
    ],
    3: [
        (
            "MATH3_MULT_TABLES",
            "Learning Multiplication Tables",
            "A multiplication table shows the result of multiplying a number by "
            "1, 2, 3, and so on, up to 10.\n"
            "Knowing tables from 2 through 10 by heart makes many everyday "
            "calculations much faster.\n"
            "The table of 5 always ends in either 0 or 5: 5, 10, 15, 20, 25, "
            "30, and so on.\n"
            "The table of 10 always ends in 0: 10, 20, 30, 40, 50, and so on. "
            "This pattern makes the table of 10 easy to remember.\n"
            "The table of 2 is the same as doubling a number: 2 x 6 means "
            "double 6, which is 12.\n"
            "We can also build a table by adding the same number again and "
            "again. The table of 4 is 4, 8, 12, 16, 20 — each new number is 4 "
            "more than the last.\n"
            "Tables help us solve real problems quickly. If notebooks cost 8 "
            "rupees each, 6 notebooks cost 6 x 8, which is 48 rupees.\n"
            "If one row of a garden has 7 plants, and there are 9 rows, the "
            "garden has 9 x 7 = 63 plants in all.\n"
            "Multiplication is also useful when things come in equal groups, "
            "like eggs in trays, or chairs in rows.\n"
            "Practising tables often, and noticing their patterns, makes "
            "multiplying larger numbers much easier later on.",
        ),
        (
            "MATH3_DIVISION",
            "Sharing Equally",
            "Division means splitting a group of things into equal smaller groups.\n"
            "If 12 sweets are shared equally among 3 friends, we ask: how many "
            "sweets does each friend get?\n"
            "Sharing one by one, each friend gets 4 sweets, because 12 divided "
            "by 3 equals 4.\n"
            "Division is the opposite of multiplication. Since 3 times 4 "
            "equals 12, we also know 12 divided by 3 equals 4, and 12 divided "
            "by 4 equals 3.\n"
            "Division can also mean finding how many equal groups fit inside a "
            "number. How many groups of 5 fit into 20? Counting by 5s — 5, 10, "
            "15, 20 — shows there are 4 groups.\n"
            "Word problems use division too. 18 storybooks are packed equally "
            "into 3 boxes. How many books go in each box? We divide 18 by 3, "
            "which gives 6 books per box.\n"
            "Sometimes things do not divide evenly, and some are left over. If "
            "17 pencils are shared among 5 children, each child gets 3 "
            "pencils, with 2 pencils left over.\n"
            "Knowing multiplication tables well makes division much faster, "
            "since every division fact matches a multiplication fact.\n"
            "Sharing sweets, pencils, or fruit fairly among friends is a "
            "natural, everyday way to practise division.",
        ),
        (
            "MATH3_PLACE_VALUE_1000",
            "Numbers up to a Thousand",
            "A 3-digit number is made of hundreds, tens, and ones.\n"
            "The number 356 means 3 hundreds, 5 tens, and 6 ones. We can write "
            "this as 300 + 50 + 6.\n"
            "The digit farthest to the left tells us the hundreds. The middle "
            "digit tells us the tens. The digit on the right tells us the ones.\n"
            "In the number 748, the digit 7 stands for 7 hundreds, or 700. The "
            "digit 4 stands for 4 tens, or 40. The digit 8 stands for 8 ones.\n"
            "Place-value blocks help us picture these numbers: a big flat "
            "block for a hundred, a long rod for a ten, and a small cube for one.\n"
            "Building 356 needs 3 flat hundred-blocks, 5 rod ten-blocks, and 6 "
            "single cubes.\n"
            "Comparing 3-digit numbers starts with the hundreds digit. 452 is "
            "greater than 398, because 4 hundreds is more than 3 hundreds, "
            "even though 398 has a bigger ones digit.\n"
            "We can also order numbers from smallest to greatest by comparing "
            "their hundreds, then tens, then ones.\n"
            "Reading and writing 3-digit numbers, and breaking them into "
            "hundreds, tens, and ones, helps us understand how large our "
            "number system can grow.",
        ),
        (
            "MATH3_FRACTIONS_INTRO",
            "Halves and Quarters",
            "A fraction shows a part of a whole that has been cut into equal pieces.\n"
            "If a roti is cut into 2 equal pieces, each piece is called "
            "one-half, and is written as 1/2.\n"
            "If the same roti is cut into 4 equal pieces instead, each piece "
            "is called one-quarter, written as 1/4.\n"
            "The bottom number of a fraction, called the denominator, shows "
            "how many equal parts the whole was cut into.\n"
            "The top number, called the numerator, shows how many of those "
            "parts we are talking about.\n"
            "In the fraction 3/4, the whole was cut into 4 equal parts, and we "
            "are talking about 3 of those parts.\n"
            "Fractions must always be made of equal parts. If a cake is cut "
            "into 2 pieces of very different sizes, neither piece is truly "
            "one-half.\n"
            "Fractions appear often in daily life. Sharing a chapati equally "
            "between 2 people gives each person 1/2 of the chapati.\n"
            "If 8 mangoes are grouped into 4 equal groups, each group has 2 "
            "mangoes, so one group is 1/4 of the 8 mangoes, which is 2 mangoes.\n"
            "Practising with paper folding — folding a strip of paper in half, "
            "then in half again — is a simple way to see halves and quarters "
            "clearly.",
        ),
        (
            "MATH3_MEASUREMENT",
            "Measuring Length, Weight, and Capacity",
            "We measure length using units like centimetres and metres.\n"
            "A ruler measures the length of small things, like a pencil, in "
            "centimetres. Longer things, like the width of a room, are "
            "measured in metres.\n"
            "100 centimetres make 1 metre. So a rope that is 250 centimetres "
            "long is the same as 2 metres and 50 centimetres.\n"
            "We measure weight using units like grams and kilograms. A "
            "weighing scale shows how heavy something is.\n"
            "A small apple might weigh about 150 grams. A bag of rice might "
            "weigh 5 kilograms. 1000 grams make 1 kilogram.\n"
            "We measure capacity — how much liquid something can hold — using "
            "units like millilitres and litres.\n"
            "A small cup might hold 200 millilitres of water. A large bottle "
            "might hold 2 litres. 1000 millilitres make 1 litre.\n"
            "Using the same standard units, like centimetres or kilograms, "
            "lets everyone compare measurements fairly, no matter where they measure.\n"
            "For example, if one table is 90 centimetres tall and another is "
            "105 centimetres tall, we know exactly which table is taller, and "
            "by how much.\n"
            "Estimating first, and then measuring with a ruler, weighing "
            "scale, or measuring jug, helps us check whether our estimate was close.",
        ),
    ],
    4: [
        (
            "MATH4_MULTIDIGIT_MULT",
            "Multiplying Bigger Numbers",
            "Multiplying 2-digit and 3-digit numbers builds on the "
            "multiplication tables we already know.\n"
            "To multiply 23 by 4, we can break 23 into 20 and 3. Then 20 x 4 "
            "= 80, and 3 x 4 = 12. Adding these gives 80 + 12 = 92.\n"
            "This method, called breaking numbers apart by place value, works "
            "for any multiplication problem.\n"
            "To multiply two 2-digit numbers, like 34 x 12, we can break 12 "
            "into 10 and 2. Then 34 x 10 = 340, and 34 x 2 = 68. Adding these "
            "gives 340 + 68 = 408.\n"
            "Word problems often use multiplication with larger numbers. A "
            "school has 18 classrooms, and each classroom has 32 students. How "
            "many students are there in total? We multiply 18 x 32.\n"
            "Breaking 32 into 30 and 2: 18 x 30 = 540, and 18 x 2 = 36. Adding "
            "these gives 540 + 36 = 576 students.\n"
            "Estimating first helps check our answer. Since 18 is close to 20, "
            "and 32 is close to 30, we expect an answer near 20 x 30 = 600, "
            "which is reasonably close to 576.\n"
            "A common mistake is forgetting to add a zero when multiplying by "
            "tens. Multiplying by 30 means multiplying by 3, then adding one zero.\n"
            "Practising breaking numbers apart by place value, and estimating "
            "first, helps multiply larger numbers accurately and confidently.",
        ),
        (
            "MATH4_LONG_DIVISION",
            "Long Division",
            "Long division helps us divide larger numbers by breaking the "
            "problem into smaller, manageable steps.\n"
            "To divide 84 by 4, we ask: how many times does 4 fit into 8? It "
            "fits 2 times, since 2 x 4 = 8, with nothing left over.\n"
            "Next, how many times does 4 fit into 4? It fits exactly 1 time. "
            "So 84 divided by 4 equals 21.\n"
            "For a trickier example, divide 156 by 6. First, 6 fits into 15 "
            "two times, since 2 x 6 = 12, leaving 3 remaining.\n"
            "Bring down the next digit, 6, to make 36. Then 6 fits into 36 "
            "exactly 6 times, since 6 x 6 = 36.\n"
            "So 156 divided by 6 equals 26, with no remainder.\n"
            "Sometimes division leaves a remainder. Dividing 47 by 5: 5 fits "
            "into 47 nine times, since 9 x 5 = 45, leaving a remainder of 2. "
            "So 47 divided by 5 is 9, remainder 2.\n"
            "Word problems use long division too. 245 mangoes are packed "
            "equally into 7 boxes. How many mangoes go in each box? Dividing "
            "245 by 7 gives exactly 35 mangoes per box.\n"
            "Checking a division answer is easy: multiply the quotient by the "
            "divisor, and add any remainder, to see if it matches the "
            "original number.",
        ),
        (
            "MATH4_FRACTION_ADD",
            "Adding and Subtracting Fractions",
            "When two fractions have the same denominator, adding or "
            "subtracting them is straightforward.\n"
            "To add fractions with the same denominator, we add the "
            "numerators and keep the denominator the same.\n"
            "For example, 2/7 plus 3/7 equals 5/7, because we add the "
            "numerators 2 and 3 to get 5, and the denominator 7 stays the same.\n"
            "Subtracting works the same way. 5/8 minus 2/8 equals 3/8, because "
            "we subtract the numerators 5 and 2 to get 3, keeping the "
            "denominator 8.\n"
            "A common mistake is also adding the denominators, which is "
            "wrong. 2/7 plus 3/7 is 5/7, not 5/14.\n"
            "Word problems use fraction addition too. Rahim ate 2/6 of a cake "
            "in the morning and 3/6 of the same cake in the evening. How much "
            "cake did he eat in total? Adding 2/6 plus 3/6 equals 5/6 of the cake.\n"
            "Sometimes the sum of a fraction addition equals the whole. If a "
            "pizza is cut into 8 slices, and someone eats 3/8, then 5/8 more, "
            "they have eaten 3/8 + 5/8 = 8/8, which is the whole pizza.\n"
            "Drawing fraction strips or circles, and shading the parts being "
            "added, helps make fraction addition easy to picture and check.",
        ),
        (
            "MATH4_PERIMETER_AREA",
            "Perimeter and Area",
            "Perimeter is the total distance around the outside edge of a shape.\n"
            "To find the perimeter of a rectangle, we add up the lengths of "
            "all four sides, or use the shortcut: 2 times (length plus width).\n"
            "A rectangle with a length of 8 cm and a width of 5 cm has a "
            "perimeter of 2 x (8 + 5), which is 2 x 13, or 26 cm.\n"
            "For a square, all four sides are equal, so the perimeter is 4 "
            "times the length of one side.\n"
            "A square with a side of 6 cm has a perimeter of 4 x 6, which is 24 cm.\n"
            "Area is the amount of flat surface a shape covers, measured in "
            "square units like square centimetres.\n"
            "The area of a rectangle is found by multiplying its length by "
            "its width.\n"
            "A rectangle with a length of 8 cm and a width of 5 cm has an "
            "area of 8 x 5, which is 40 square centimetres.\n"
            "For a square with a side of 6 cm, the area is 6 x 6, which is 36 "
            "square centimetres.\n"
            "Word problems often ask for both. A garden is 12 metres long and "
            "7 metres wide. Its perimeter is 2 x (12 + 7) = 38 metres, and its "
            "area is 12 x 7 = 84 square metres.\n"
            "A common mistake is confusing perimeter, which uses addition "
            "around the edge, with area, which uses multiplication of length "
            "and width.",
        ),
        (
            "MATH4_DECIMALS_INTRO",
            "Introducing Decimals",
            "A decimal number has a whole-number part and a fractional part, "
            "separated by a decimal point.\n"
            "In the number 4.7, the digit 4 is the whole-number part, and the "
            "digit 7 after the decimal point is called the tenths digit.\n"
            "4.7 means 4 whole ones plus 7 tenths, which is the same as the "
            "mixed number 4 and 7/10.\n"
            "Decimals let us write fractions with a denominator of 10 or 100 "
            "in a shorter way. The fraction 3/10 is written as the decimal 0.3.\n"
            "The fraction 25/100 is written as the decimal 0.25, where the 2 "
            "is the tenths digit and the 5 is the hundredths digit.\n"
            "To compare two decimals, we compare the whole-number parts "
            "first, then the tenths, then the hundredths.\n"
            "6.4 is greater than 6.2, because even though the whole-number "
            "parts are equal, 4 tenths is more than 2 tenths.\n"
            "5.8 is greater than 4.9, because the whole-number part 5 is "
            "greater than 4, even though 9 tenths is more than 8 tenths.\n"
            "Decimals are used often in real life, such as on a price tag "
            "showing 45.50 rupees, or a height chart showing 1.35 metres.\n"
            "Reading, writing, and comparing decimals carefully, digit by "
            "digit, helps avoid the common mistake of thinking a decimal with "
            "more digits after the point is always the bigger number.",
        ),
    ],
    5: [
        (
            "MATH5_FRACTION_OPS",
            "Fractions with Different Denominators",
            "To add or subtract fractions that have different denominators, "
            "we must first find a common denominator that both original "
            "denominators can divide into evenly.\n"
            "For example, to add 1/2 and 1/3, we look for a number that both "
            "2 and 3 divide into evenly. The smallest such number is 6, so 6 "
            "is our common denominator.\n"
            "We convert 1/2 into sixths: since 2 x 3 = 6, we multiply both the "
            "numerator and denominator by 3, giving 3/6.\n"
            "We convert 1/3 into sixths: since 3 x 2 = 6, we multiply both the "
            "numerator and denominator by 2, giving 2/6.\n"
            "Now we can add: 3/6 + 2/6 = 5/6.\n"
            "Subtracting works the same way. To subtract 1/4 from 2/3, the "
            "common denominator is 12: 2/3 becomes 8/12, and 1/4 becomes "
            "3/12, so 8/12 minus 3/12 equals 5/12.\n"
            "Comparing fractions with different denominators also uses this "
            "method. To compare 3/5 and 2/3, convert both to fifteenths: 3/5 "
            "becomes 9/15, and 2/3 becomes 10/15. Since 10/15 is greater than "
            "9/15, 2/3 is greater than 3/5.\n"
            "Word problems often need this skill. A recipe uses 1/2 cup of "
            "sugar and 1/3 cup of honey. How much sweetener is used "
            "altogether? Adding 1/2 + 1/3 gives 3/6 + 2/6 = 5/6 of a cup.\n"
            "Finding the common denominator first, before adding, "
            "subtracting, or comparing, is the key step that makes working "
            "with unlike fractions manageable.",
        ),
        (
            "MATH5_DECIMAL_OPS",
            "Working with Decimals",
            "To add or subtract decimal numbers, we line up the decimal "
            "points and then add or subtract just as we would with whole numbers.\n"
            "For example, to add 4.7 and 2.3, we line up the decimal points: "
            "4.7 plus 2.3 equals 7.0, which we can simply write as 7.\n"
            "To subtract 8.5 minus 3.2, lining up the decimal points gives "
            "8.5 minus 3.2 equals 5.3.\n"
            "Sometimes decimals have a different number of digits after the "
            "point. Adding 6.25 and 1.4, we can think of 1.4 as 1.40, so 6.25 "
            "plus 1.40 equals 7.65.\n"
            "To multiply a decimal by a whole number, we multiply the numbers "
            "as if there were no decimal point at all, then place the decimal "
            "point back into the answer afterward.\n"
            "To multiply 3.2 by 4, first multiply 32 by 4, which is 128. "
            "Since 3.2 has one digit after the decimal point, we place the "
            "decimal point one place from the right in the answer: 12.8.\n"
            "For 2.15 multiplied by 3, first multiply 215 by 3, which is 645. "
            "Since 2.15 has two digits after the decimal point, the answer "
            "becomes 6.45.\n"
            "Word problems use decimals often. A shopkeeper sells 3 notebooks "
            "priced at 15.50 rupees each. The total cost is 3 x 15.50, which "
            "is 46.50 rupees.\n"
            "Estimating first, by rounding decimals to the nearest whole "
            "number, helps check whether a decimal calculation's answer is reasonable.",
        ),
        (
            "MATH5_PERCENTAGE_INTRO",
            "Understanding Percentages",
            "Percent means 'out of a hundred'. The symbol % stands for "
            "percent, so 25% means 25 out of every 100.\n"
            "25% is the same as the fraction 25/100, which simplifies to 1/4, "
            "and the same as the decimal 0.25.\n"
            "To find a percentage of a number, we can convert the percentage "
            "into a fraction, then multiply. To find 50% of 40, we use the "
            "fraction 50/100, or 1/2, and multiply: 1/2 x 40 = 20.\n"
            "To find 25% of 80, we use the fraction 25/100, or 1/4, and "
            "multiply: 1/4 x 80 = 20.\n"
            "To find 10% of a number, we simply divide the number by 10, "
            "since 10% is 10/100, or 1/10. 10% of 250 is 250 divided by 10, "
            "which is 25.\n"
            "Percentages are used often in daily life. If a shirt originally "
            "costs 200 rupees and is on sale with a 20% discount, the "
            "discount amount is 20% of 200, which is 40 rupees, making the "
            "sale price 160 rupees.\n"
            "If 40 out of 100 students in a school like cricket, we say that "
            "40% of students like cricket.\n"
            "If a class has 25 students, and 20% of them wear glasses, then "
            "20% of 25 is 1/5 x 25, which is 5 students who wear glasses.\n"
            "Understanding that percent always means 'out of a hundred' helps "
            "connect percentages to the fractions and decimals we already know.",
        ),
        (
            "MATH5_AREA_VOLUME",
            "Area and Volume",
            "The area of a shape is the amount of flat surface it covers, and "
            "it is measured in square units, like square centimetres or "
            "square metres.\n"
            "Some real shapes are made of more than one rectangle joined "
            "together, called composite or L-shaped figures.\n"
            "To find the area of an L-shaped figure, we split it into two "
            "separate rectangles, find the area of each rectangle, and then "
            "add the two areas together.\n"
            "For example, an L-shaped garden made of a 6m x 4m rectangle and "
            "a 3m x 2m rectangle has a total area of (6 x 4) + (3 x 2), which "
            "is 24 + 6, or 30 square metres.\n"
            "Volume is the amount of space a solid, 3-dimensional object "
            "takes up, and it is measured in cubic units, like cubic centimetres.\n"
            "The volume of a cube is found by multiplying its side length by "
            "itself three times: side x side x side.\n"
            "A cube with a side of 5 cm has a volume of 5 x 5 x 5, which is "
            "125 cubic centimetres.\n"
            "The volume of a cuboid, which has a different length, width, and "
            "height, is found by multiplying length x width x height.\n"
            "A cuboid that is 8 cm long, 4 cm wide, and 3 cm tall has a "
            "volume of 8 x 4 x 3, which is 96 cubic centimetres.\n"
            "A water tank shaped like a cuboid, measuring 2 metres by 1 metre "
            "by 1 metre, holds a volume of 2 x 1 x 1, which is 2 cubic metres.\n"
            "Splitting composite shapes into simpler rectangles, and "
            "remembering that volume always multiplies three dimensions "
            "together, makes these problems easier to solve.",
        ),
        (
            "MATH5_LONG_DIVISION_LARGE",
            "Long Division with Larger Numbers",
            "Long division with a 2-digit divisor works the same way as long "
            "division with a 1-digit divisor, but needs more careful "
            "estimation at each step.\n"
            "To divide 1248 by 24, we first ask how many times 24 fits into "
            "124. Since 24 x 5 = 120, it fits 5 times, leaving a remainder of 4.\n"
            "Bring down the next digit, 8, to make 48. Then ask how many "
            "times 24 fits into 48. Since 24 x 2 = 48 exactly, it fits 2 "
            "times, with no remainder.\n"
            "So 1248 divided by 24 equals 52.\n"
            "Estimating first helps choose the right digit. Since 24 is close "
            "to 25, and 4 x 25 = 100, we can guess that 24 fits into 124 "
            "about 5 times, and then check the guess by multiplying.\n"
            "Sometimes there is a remainder at the end. Dividing 517 by 15: "
            "15 fits into 51 three times, since 3 x 15 = 45, leaving 6. "
            "Bringing down the 7 makes 67, and 15 fits into 67 four times, "
            "since 4 x 15 = 60, leaving a remainder of 7. So 517 divided by "
            "15 is 34, remainder 7.\n"
            "Word problems use large-number division too. A factory packed "
            "3564 toys equally into 36 boxes. Dividing 3564 by 36 gives "
            "exactly 99 toys in each box.\n"
            "Checking a long division answer is done by multiplying the "
            "quotient by the divisor, then adding any remainder, to see if "
            "the result matches the original number being divided.\n"
            "Practising with estimation, and checking every answer by "
            "multiplying back, builds confidence and accuracy in long "
            "division with larger numbers.",
        ),
    ],
}


def chapter_meta() -> dict[tuple[int, str], tuple[int, str]]:
    """Returns {(class_number, topic_code): (chapter_number, chapter_title)} —
    imported by authored_questions_mathematics.py and
    authored_lessons_mathematics.py so they don't re-declare this mapping."""
    meta: dict[tuple[int, str], tuple[int, str]] = {}
    for class_number, chapters in CHAPTERS.items():
        for idx, (topic_code, title, _body) in enumerate(chapters, start=1):
            meta[(class_number, topic_code)] = (idx, title)
    return meta


def chapter_body_for(class_number: int, topic_code: str) -> str:
    """Returns the raw authored body text (no 'Chapter N:' header) for one
    (class_number, topic_code), for scripts that want the source prose
    directly rather than re-reading it back out of document_chunks."""
    for code, _title, body in CHAPTERS[class_number]:
        if code == topic_code:
            return body
    raise KeyError(f"No authored chapter for class {class_number} topic {topic_code!r}")


def build_full_text(class_number: int) -> str:
    parts = []
    for idx, (_topic_code, title, body) in enumerate(CHAPTERS[class_number], start=1):
        parts.append(f"Chapter {idx}: {title}\n{body}")
    return "\n\n".join(parts)


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load authored Mathematics chapter content into document_chunks (branch_name='SELF')."
    )
    parser.add_argument("--dry-run", action="store_true", help="Print summary, do not write to DB.")
    args = parser.parse_args()

    async with AsyncSessionFactory() as session:
        books_res = await session.execute(
            select(NCERTBook).where(NCERTBook.subject == "Mathematics")
        )
        book_by_class = {b.class_number: b.id for b in books_res.scalars().all()}
        missing_books = [cn for cn in CHAPTERS if cn not in book_by_class]
        if missing_books:
            print(f"[warn] No NCERTBook row found for Mathematics class(es) {missing_books} — "
                  f"chunks for those classes will have ncert_book_id=None.")

        if not args.dry_run:
            deleted = await session.execute(
                delete(DocumentChunk).where(
                    DocumentChunk.subject == "Mathematics",
                    DocumentChunk.branch_name == "SELF",
                )
            )
            await session.commit()
            print(f"[ok] Deleted existing SELF/Mathematics document_chunks rows "
                  f"(idempotent re-run).")

        summary: dict[int, int] = {}
        for class_number in sorted(CHAPTERS):
            full_text = build_full_text(class_number)
            chunks_data = extract_chapters_and_chunks(
                full_text=full_text,
                default_module_title=f"Math Magic - {class_number}",
            )
            if len(chunks_data) < len(CHAPTERS[class_number]):
                print(f"[warn] Class {class_number}: expected >= "
                      f"{len(CHAPTERS[class_number])} chunks (one per chapter minimum), "
                      f"got {len(chunks_data)} — chapter-boundary detection may have "
                      f"merged chapters unexpectedly.")

            ncert_book_id = book_by_class.get(class_number)

            if args.dry_run:
                print(f"\n[dry-run] Class {class_number}: {len(CHAPTERS[class_number])} "
                      f"chapters -> {len(chunks_data)} chunks")
                for c in chunks_data[:3]:
                    print(f"  Ch.{c['chapter_number']} '{c['chapter_title']}' "
                          f"chunk#{c['chunk_index']} ({c['char_count']} chars): "
                          f"{c['content'][:100]!r}...")
            else:
                for c in chunks_data:
                    embedding_json = json.dumps(c["embedding"]) if c.get("embedding") else None
                    session.add(
                        DocumentChunk(
                            module_id=None,
                            ncert_book_id=ncert_book_id,
                            branch_name="SELF",
                            class_number=class_number,
                            subject="Mathematics",
                            chapter_number=c["chapter_number"],
                            chapter_title=c["chapter_title"],
                            chunk_index=c["chunk_index"],
                            content=c["content"],
                            token_count=c["token_count"],
                            char_count=c["char_count"],
                            start_char=c.get("start_char", 0),
                            end_char=c.get("end_char", len(c["content"])),
                            embedding=embedding_json,
                        )
                    )
            summary[class_number] = len(chunks_data)

        if not args.dry_run:
            await session.commit()

    print(f"\n{'[dry-run] Would insert' if args.dry_run else 'Inserted'} chunks per class:")
    total = 0
    for cn in sorted(summary):
        n = summary[cn]
        total += n
        print(f"  Class {cn}: {len(CHAPTERS[cn])} chapters -> {n} chunks")
    print(f"Total: {total} chunks across {sum(len(v) for v in CHAPTERS.values())} chapters.")


if __name__ == "__main__":
    asyncio.run(main())
