"""
Deterministic, offline question generator for all Class 1-5 Mathematics
diagnostic-quiz topics (topic codes matching ``MATH*``).

This replaces the LLM (Gemini) generation path for Mathematics specifically
because Gemini kept inventing ``image_asset_key`` values that don't exist in
the curated illustration vocabulary (e.g. 'balloon', 'ruler'). Every asset
key referenced from this module is looked up directly from
``src.ai.quiz_asset_vocabulary.ALL_ASSET_KEYS`` — nothing is ever invented.

No LLM calls, no network calls, no unbounded randomness: every call to
:func:`generate_math_questions` is seeded deterministically from
``(topic_code, count)`` via a stable hash, so the same inputs always produce
the same output. Within one call, a `random.Random` instance is threaded
through all ``count`` questions so consecutive questions still vary (as any
question bank should), but everything is reproducible.

Distractors are built to look like realistic child errors (wrong operation,
off-by-a-few, dropped carry/borrow, digit transposition, common fraction
misconceptions, etc.) rather than random noise — see the per-topic
generators below and the top-level design notes in the task this file was
written for.
"""

from __future__ import annotations

import hashlib
import math
import random
from dataclasses import dataclass
from typing import Callable, Optional

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS


@dataclass
class GeneratedMathQuestion:
    """Mirrors ``src.models.quiz.Question``'s question-content fields 1:1.

    The caller constructs a ``Question(...)`` row from this dataclass'
    ``__dict__`` plus ``topic_id``/``subject``/``class_number``/
    ``generation_source``/``generation_batch``.
    """

    question_text: str
    options: list[str]
    correct_option_index: int
    explanation: str
    image_emoji: Optional[str] = None
    image_asset_key: Optional[str] = None
    option_emojis: Optional[list[str]] = None
    option_asset_keys: Optional[list[str]] = None


# ─────────────────────────────────────────────────────────────────────────
# Generic helpers shared by every topic generator
# ─────────────────────────────────────────────────────────────────────────


def _stable_rng(topic_code: str, count: int) -> random.Random:
    """A random.Random seeded deterministically from (topic_code, count) so
    repeated calls with the same arguments produce identical output,
    regardless of PYTHONHASHSEED or process."""
    digest = hashlib.sha256(f"{topic_code}:{count}".encode("utf-8")).hexdigest()
    seed = int(digest, 16) % (2**32)
    return random.Random(seed)


def _rotate(items: list, i: int) -> list:
    """Rotates a list by i positions (mod length) so which candidate is
    picked first varies deterministically across the `count` questions
    generated in one call, giving distractor-pattern variety."""
    if not items:
        return items
    k = i % len(items)
    return items[k:] + items[:k]


def _digit_transpose(n: int) -> Optional[int]:
    """A common 2-digit transposition slip (e.g. 42 -> 24). None if not a
    2-digit number or the digits are equal (transposing would be a no-op)."""
    if n < 10 or n > 99:
        return None
    tens, ones = divmod(n, 10)
    if tens == ones:
        return None
    return ones * 10 + tens


def _ensure_three_int(
    rng: random.Random,
    correct: int,
    candidates: list,
    min_value: int = 0,
    max_value: Optional[int] = None,
) -> list[int]:
    """Picks 3 distinct integer distractors, distinct from `correct` and
    from each other, preferring the pedagogically-motivated `candidates` in
    order, falling back to small perturbations of `correct` if needed."""
    seen = {correct}
    result: list[int] = []
    for c in candidates:
        if c is None or c in seen:
            continue
        if c < min_value or (max_value is not None and c > max_value):
            continue
        result.append(c)
        seen.add(c)
        if len(result) == 3:
            return result

    deltas = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]
    guard = 0
    while len(result) < 3:
        guard += 1
        if guard > 1000:
            raise RuntimeError(
                f"unable to generate 3 distinct distractors for correct={correct} "
                f"within [{min_value}, {max_value}]"
            )
        delta = deltas[guard % len(deltas)] * (1 + guard // len(deltas))
        cand = correct + delta
        if cand in seen or cand < min_value or (max_value is not None and cand > max_value):
            continue
        result.append(cand)
        seen.add(cand)
    return result


def _ensure_three_str(
    rng: random.Random,
    correct: str,
    candidates: list[str],
    fallback_fn: Callable[[random.Random, int], str],
) -> list[str]:
    """String-valued analogue of `_ensure_three_int`, for fraction/decimal
    text distractors that aren't a single numeric scale."""
    seen = {correct}
    result: list[str] = []
    for c in candidates:
        if c in seen:
            continue
        result.append(c)
        seen.add(c)
        if len(result) == 3:
            return result

    guard = 0
    while len(result) < 3:
        if guard > 1000:
            raise RuntimeError(f"unable to generate 3 distinct distractors for correct={correct}")
        c = fallback_fn(rng, guard)
        guard += 1
        if c in seen:
            continue
        result.append(c)
        seen.add(c)
    return result


def _shuffle_options(rng: random.Random, options: list[str], correct_index: int) -> tuple[list[str], int]:
    order = list(range(4))
    rng.shuffle(order)
    new_options = [options[j] for j in order]
    new_correct = order.index(correct_index)
    return new_options, new_correct


def _finalize_numeric(rng: random.Random, correct, distractors: list, fmt: Callable = str) -> tuple[list[str], int]:
    """Builds the final 4-option, shuffled option list + correct index from
    a correct value and exactly 3 distractor values (already distinct)."""
    values = [correct] + list(distractors[:3])
    options = [fmt(v) for v in values]
    return _shuffle_options(rng, options, 0)


def _pluralize(word: str) -> str:
    if word.endswith(("s", "sh", "ch", "x")):
        return word + "es"
    return word + "s"


def _fmt_decimal1(v: int) -> str:
    """v is tenths (e.g. 47 -> '4.7')."""
    x, y = divmod(v, 10)
    return f"{x}.{y}"


def _fmt_decimal2(v: int) -> str:
    """v is hundredths (e.g. 347 -> '3.47')."""
    return f"{v // 100}.{v % 100:02d}"


def _lcm(a: int, b: int) -> int:
    return math.lcm(a, b)


# Countable illustration keys — every entry here is a real key that exists
# directly in ALL_ASSET_KEYS (verified defensively at import time below).
_COUNTABLE_ITEMS = [
    "apple", "banana", "mango", "orange", "watermelon", "strawberry",
    "pineapple", "papaya", "guava", "carrot", "tomato",
    "ball", "book", "pencil", "bag", "chair", "table", "door", "window",
    "clock", "umbrella", "kite", "bicycle", "car", "bus", "boat", "key",
    "elephant", "lion", "tiger", "dog", "cat", "cow", "goat", "sheep",
    "horse", "monkey", "rabbit", "bird", "fish", "frog", "snake", "duck",
    "hen", "pig", "bear", "peacock",
]
assert all(item in ALL_ASSET_KEYS for item in _COUNTABLE_ITEMS), (
    "one or more _COUNTABLE_ITEMS entries is not a real asset key"
)

_SHAPES = ["circle", "square", "triangle", "rectangle"]
assert all(shape in ALL_ASSET_KEYS for shape in _SHAPES), (
    "one or more _SHAPES entries is not a real asset key"
)


# ─────────────────────────────────────────────────────────────────────────
# Class 1
# ─────────────────────────────────────────────────────────────────────────


def _gen_MATH1_COUNTING(rng: random.Random, i: int) -> GeneratedMathQuestion:
    style = ["after", "before", "count"][i % 3]
    if style == "after":
        n = rng.randint(1, 19)
        correct = n + 1
        candidates = _rotate([n, n + 2, n - 1, n + 3], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=30)
        options, idx = _finalize_numeric(rng, correct, distractors)
        explanation = f"The number right after {n} is {n} + 1 = {correct}."
        return GeneratedMathQuestion(f"What number comes right after {n}?", options, idx, explanation)
    elif style == "before":
        n = rng.randint(2, 20)
        correct = n - 1
        candidates = _rotate([n, n - 2, n + 1], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=20)
        options, idx = _finalize_numeric(rng, correct, distractors)
        explanation = f"The number right before {n} is {n} - 1 = {correct}."
        return GeneratedMathQuestion(f"What number comes right before {n}?", options, idx, explanation)
    else:
        item = rng.choice(_COUNTABLE_ITEMS)
        c = rng.randint(1, 20)
        plural = _pluralize(item)
        candidates = _rotate([c + 1, c - 1, c + 2, c - 2, c + 3], i)
        distractors = _ensure_three_int(rng, c, candidates, min_value=1, max_value=20)
        options, idx = _finalize_numeric(rng, c, distractors)
        explanation = f"The tray has {c} {plural}, so the count is {c}."
        return GeneratedMathQuestion(
            f"A tray has {c} {plural} on it. How many {plural} are on the tray?",
            options, idx, explanation, image_asset_key=item,
        )


def _gen_MATH1_COMPARISON(rng: random.Random, i: int) -> GeneratedMathQuestion:
    style = ["greater", "smaller", "symbol"][i % 3]
    a = rng.randint(1, 20)
    b = rng.randint(1, 20)
    while b == a:
        b = rng.randint(1, 20)

    if style in ("greater", "smaller"):
        correct = max(a, b) if style == "greater" else min(a, b)
        other = min(a, b) if style == "greater" else max(a, b)
        word = "greater" if style == "greater" else "smaller"
        candidates = _rotate([other, correct + 1, correct - 1, correct + 2, correct - 2], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=1, max_value=20)
        options, idx = _finalize_numeric(rng, correct, distractors)
        explanation = f"{correct} is {word} than {other}."
        return GeneratedMathQuestion(f"Which number is {word}, {a} or {b}?", options, idx, explanation)
    else:
        correct_symbol = ">" if a > b else "<" if a < b else "="
        symbols = [">", "<", "=", "≠"]
        correct_idx = symbols.index(correct_symbol)
        options, idx = _shuffle_options(rng, symbols, correct_idx)
        explanation = f"{a} {correct_symbol} {b}."
        return GeneratedMathQuestion(f"Fill in the blank: {a} ___ {b}", options, idx, explanation)


def _gen_MATH1_ADD_WITHIN_20(rng: random.Random, i: int) -> GeneratedMathQuestion:
    a = rng.randint(1, 19)
    max_b = 20 - a
    while max_b < 1:
        a = rng.randint(1, 19)
        max_b = 20 - a
    b = rng.randint(1, max_b)
    correct = a + b
    pool = [
        abs(a - b), correct + 1, correct - 1, correct + 2, correct - 2, correct + 3, correct - 3,
        _digit_transpose(correct),
    ]
    candidates = _rotate([c for c in pool if c is not None], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=30)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{a} + {b} = {correct}"
    return GeneratedMathQuestion(f"What is {a} + {b}?", options, idx, explanation)


def _gen_MATH1_SUB_WITHIN_20(rng: random.Random, i: int) -> GeneratedMathQuestion:
    m = rng.randint(1, 20)
    s = rng.randint(0, m)
    correct = m - s
    pool = [
        m + s, correct + 1, correct - 1, correct + 2, correct - 2,
        _digit_transpose(correct) if correct >= 10 else None,
    ]
    candidates = _rotate([c for c in pool if c is not None], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=40)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{m} - {s} = {correct}"
    return GeneratedMathQuestion(f"What is {m} - {s}?", options, idx, explanation)


def _gen_MATH1_SHAPES(rng: random.Random, i: int) -> GeneratedMathQuestion:
    shape = rng.choice(_SHAPES)
    values = _SHAPES[:]
    correct_idx = values.index(shape)
    options = [s.capitalize() for s in values]
    options, idx = _shuffle_options(rng, options, correct_idx)
    explanation = f"The picture shows a {shape}."
    return GeneratedMathQuestion(
        "What shape is shown in the picture?", options, idx, explanation, image_asset_key=shape,
    )


# ─────────────────────────────────────────────────────────────────────────
# Class 2
# ─────────────────────────────────────────────────────────────────────────


def _gen_MATH2_PLACE_VALUE(rng: random.Random, i: int) -> GeneratedMathQuestion:
    n = rng.randint(10, 99)
    tens, ones = divmod(n, 10)
    variant = ["tens_count", "ones_count", "tens_value"][i % 3]
    if variant == "tens_count":
        correct = tens
        candidates = _rotate([ones, tens + 1, tens - 1, tens + 2], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=9)
        question = f"In the number {n}, how many tens are there?"
        explanation = f"{n} has {tens} tens and {ones} ones, so there are {tens} tens."
    elif variant == "ones_count":
        correct = ones
        candidates = _rotate([tens, ones + 1, ones - 1, ones + 2], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=9)
        question = f"In the number {n}, how many ones are there?"
        explanation = f"{n} has {tens} tens and {ones} ones, so there are {ones} ones."
    else:
        correct = tens * 10
        pool = [ones * 10 if ones != tens else None, correct + 10, correct - 10, n]
        candidates = _rotate([c for c in pool if c is not None], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=90)
        question = f"What is the value of the digit in the tens place of {n}?"
        explanation = f"The digit {tens} is in the tens place of {n}, so its value is {tens} × 10 = {correct}."
    options, idx = _finalize_numeric(rng, correct, distractors)
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH2_ADD_CARRYING(rng: random.Random, i: int) -> GeneratedMathQuestion:
    a_ones = rng.randint(1, 9)
    a_tens = rng.randint(1, 8)
    a = a_tens * 10 + a_ones
    b_ones = rng.randint(10 - a_ones, 9)
    b_tens = rng.randint(1, 8)
    b = b_tens * 10 + b_ones
    correct = a + b
    pool = [
        correct - 10, correct + 1, correct - 1, correct + 2, correct - 2, correct + 3, correct - 3,
        abs(a - b), _digit_transpose(correct),
    ]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=999)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{a} + {b} = {correct}"
    return GeneratedMathQuestion(f"What is {a} + {b}?", options, idx, explanation)


def _gen_MATH2_SUB_BORROWING(rng: random.Random, i: int) -> GeneratedMathQuestion:
    s_tens = rng.randint(1, 8)
    m_tens = rng.randint(s_tens + 1, 9)
    s_ones = rng.randint(1, 9)
    m_ones = rng.randint(0, s_ones - 1)
    m = m_tens * 10 + m_ones
    s = s_tens * 10 + s_ones
    correct = m - s
    pool = [
        m + s, correct + 1, correct - 1, correct + 2, correct - 2, correct + 10,
        _digit_transpose(correct) if correct >= 10 else None,
    ]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=99)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{m} - {s} = {correct}"
    return GeneratedMathQuestion(f"What is {m} - {s}?", options, idx, explanation)


_MULT_INTRO_ITEMS = ["apples", "pencils", "stars", "balloons", "cups"]


def _gen_MATH2_MULT_INTRO(rng: random.Random, i: int) -> GeneratedMathQuestion:
    a = rng.randint(2, 5)
    b = rng.randint(2, 5)
    correct = a * b
    item = rng.choice(_MULT_INTRO_ITEMS)
    if i % 2 == 0:
        question = f"There are {a} groups of {b} {item} each. How many {item} are there in total?"
    else:
        skip_counts = ", ".join(str(b * k) for k in range(1, a + 1))
        question = f"Skip count by {b}s, {a} times: {skip_counts}. What is the total?"
    pool = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b, correct + 1, correct - 1]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=40)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{a} groups of {b} = {a} × {b} = {correct}"
    return GeneratedMathQuestion(question, options, idx, explanation)


# ─────────────────────────────────────────────────────────────────────────
# Class 3
# ─────────────────────────────────────────────────────────────────────────


def _gen_MATH3_MULT_TABLES(rng: random.Random, i: int) -> GeneratedMathQuestion:
    f1 = rng.randint(2, 10)
    f2 = rng.randint(1, 10)
    correct = f1 * f2
    pool = [f1 * (f2 + 1), f1 * (f2 - 1), (f1 + 1) * f2, (f1 - 1) * f2, f1 + f2, correct + 1, correct - 1]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=120)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{f1} × {f2} = {correct}"
    return GeneratedMathQuestion(f"What is {f1} × {f2}?", options, idx, explanation)


def _gen_MATH3_DIVISION(rng: random.Random, i: int) -> GeneratedMathQuestion:
    divisor = rng.randint(2, 10)
    quotient = rng.randint(2, 10)
    dividend = divisor * quotient
    if i % 2 == 0:
        question = f"{dividend} candies are shared equally among {divisor} children. How many candies does each child get?"
    else:
        question = f"How many groups of {divisor} make {dividend}?"
    pool = [divisor, quotient + 1, quotient - 1, quotient + 2, quotient - 2, dividend - divisor]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, quotient, candidates, min_value=0, max_value=50)
    options, idx = _finalize_numeric(rng, quotient, distractors)
    explanation = f"{dividend} ÷ {divisor} = {quotient}"
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH3_PLACE_VALUE_1000(rng: random.Random, i: int) -> GeneratedMathQuestion:
    n = rng.randint(100, 999)
    h, rem = divmod(n, 100)
    t, o = divmod(rem, 10)
    variant = ["hundreds_count", "tens_count", "ones_count", "hundreds_value"][i % 4]
    if variant == "hundreds_count":
        correct = h
        candidates = _rotate([t, o, h + 1, h - 1], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=9)
        question = f"In the number {n}, how many hundreds are there?"
        explanation = f"{n} = {h} hundreds, {t} tens, {o} ones, so there are {h} hundreds."
    elif variant == "tens_count":
        correct = t
        candidates = _rotate([h, o, t + 1, t - 1], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=9)
        question = f"In the number {n}, how many tens are there?"
        explanation = f"{n} = {h} hundreds, {t} tens, {o} ones, so there are {t} tens."
    elif variant == "ones_count":
        correct = o
        candidates = _rotate([h, t, o + 1, o - 1], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=9)
        question = f"In the number {n}, how many ones are there?"
        explanation = f"{n} = {h} hundreds, {t} tens, {o} ones, so there are {o} ones."
    else:
        correct = h * 100
        pool = [t * 100 if t != h else None, correct + 100, correct - 100, n]
        candidates = _rotate([c for c in pool if c is not None], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=900)
        question = f"What is the value of the digit in the hundreds place of {n}?"
        explanation = f"The digit {h} is in the hundreds place of {n}, so its value is {h} × 100 = {correct}."
    options, idx = _finalize_numeric(rng, correct, distractors)
    return GeneratedMathQuestion(question, options, idx, explanation)


_FRACTIONS_INTRO_VALUES = ["1/2", "1/4", "2/4", "3/4"]


def _gen_MATH3_FRACTIONS_INTRO(rng: random.Random, i: int) -> GeneratedMathQuestion:
    if i % 2 == 0:
        correct = rng.choice(_FRACTIONS_INTRO_VALUES)
        num, den = correct.split("/")
        pool = [f for f in _FRACTIONS_INTRO_VALUES if f != correct]
        candidates = _rotate(pool, i)
        fallback = lambda r, g: f"{r.randint(1, 3)}/{r.choice([2, 4])}"
        distractors = _ensure_three_str(rng, correct, candidates, fallback)
        options, idx = _finalize_numeric(rng, correct, distractors, fmt=str)
        explanation = f"{num} out of {den} equal parts is the fraction {correct}."
        return GeneratedMathQuestion(
            f"Which fraction represents {num} out of {den} equal parts?", options, idx, explanation,
        )
    else:
        frac = rng.choice(["1/2", "1/4"])
        if frac == "1/2":
            n = 2 * rng.randint(1, 10)
            correct = n // 2
            question = f"What is 1/2 of {n}?"
            explanation = f"1/2 of {n} = {n} ÷ 2 = {correct}"
            pool = [n, correct + 1, correct - 1, correct + 2]
        else:
            n = 4 * rng.randint(1, 5)
            correct = n // 4
            question = f"What is 1/4 of {n}?"
            explanation = f"1/4 of {n} = {n} ÷ 4 = {correct}"
            pool = [n, n // 2, correct + 1, correct - 1]
        candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
        distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=40)
        options, idx = _finalize_numeric(rng, correct, distractors)
        return GeneratedMathQuestion(question, options, idx, explanation)


_MEASURE_PAIRS = [("cm", "m", 100), ("g", "kg", 1000), ("ml", "l", 1000)]


def _gen_MATH3_MEASUREMENT(rng: random.Random, i: int) -> GeneratedMathQuestion:
    small_unit, big_unit, factor = rng.choice(_MEASURE_PAIRS)
    if i % 2 == 0:
        multiple = rng.randint(1, 9)
        small_value = multiple * factor
        correct = multiple
        question = f"{small_value} {small_unit} = how many {big_unit}?"
        pool = [multiple + 1, multiple - 1, small_value, factor, multiple + 2]
        explanation = f"{small_value} {small_unit} ÷ {factor} = {multiple} {big_unit}"
    else:
        multiple = rng.randint(1, 9)
        correct = multiple * factor
        question = f"{multiple} {big_unit} = how many {small_unit}?"
        pool = [multiple, correct + factor, correct - factor, correct + 10, correct - 10]
        explanation = f"{multiple} {big_unit} × {factor} = {correct} {small_unit}"
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=9000)
    options, idx = _finalize_numeric(rng, correct, distractors)
    return GeneratedMathQuestion(question, options, idx, explanation)


# ─────────────────────────────────────────────────────────────────────────
# Class 4
# ─────────────────────────────────────────────────────────────────────────


def _gen_MATH4_MULTIDIGIT_MULT(rng: random.Random, i: int) -> GeneratedMathQuestion:
    if i % 2 == 0:
        b = rng.randint(2, 9)
        max_a = min(99, 499 // b)
        if max_a < 10:
            b = 2
            max_a = min(99, 499 // b)
        a = rng.randint(10, max_a)
    else:
        a = rng.randint(10, 22)
        max_b = min(99, 499 // a)
        if max_b < 10:
            max_b = 10
        b = rng.randint(10, max_b)
    correct = a * b
    pool = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b, correct + 10, correct - 10]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=999)
    options, idx = _finalize_numeric(rng, correct, distractors)
    explanation = f"{a} × {b} = {correct}"
    return GeneratedMathQuestion(f"What is {a} × {b}?", options, idx, explanation)


def _gen_MATH4_LONG_DIVISION(rng: random.Random, i: int) -> GeneratedMathQuestion:
    divisor = rng.randint(2, 9)
    min_q = -(-100 // divisor)
    max_q = 999 // divisor
    quotient = rng.randint(min_q, max_q)
    dividend = divisor * quotient
    pool = [quotient + 1, quotient - 1, quotient + 10, quotient - 10, dividend - divisor, divisor]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, quotient, candidates, min_value=0, max_value=999)
    options, idx = _finalize_numeric(rng, quotient, distractors)
    explanation = f"{dividend} ÷ {divisor} = {quotient}"
    return GeneratedMathQuestion(f"What is {dividend} ÷ {divisor}?", options, idx, explanation)


def _gen_MATH4_FRACTION_ADD(rng: random.Random, i: int) -> GeneratedMathQuestion:
    d = rng.randint(2, 12)
    n1 = rng.randint(1, d - 1)
    n2 = rng.randint(1, d - n1)
    correct_num = n1 + n2
    correct = f"{correct_num}/{d}"
    question = f"What is {n1}/{d} + {n2}/{d}?"
    pool = [
        f"{n1}/{d}", f"{n2}/{d}", f"{correct_num}/{2 * d}", f"{correct_num + 1}/{d}",
        f"{max(correct_num - 1, 0)}/{d}", f"{n1 * n2}/{d}",
    ]
    if d + 1 <= 24:
        pool.append(f"{correct_num}/{d + 1}")
    if d - 1 >= 1:
        pool.append(f"{correct_num}/{d - 1}")
    candidates = _rotate(pool, i)
    fallback = lambda r, g: f"{r.randint(1, 12)}/{r.randint(2, 12)}"
    distractors = _ensure_three_str(rng, correct, candidates, fallback)
    options, idx = _finalize_numeric(rng, correct, distractors, fmt=str)
    explanation = f"{n1}/{d} + {n2}/{d} = {correct_num}/{d}"
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH4_PERIMETER_AREA(rng: random.Random, i: int) -> GeneratedMathQuestion:
    shape = rng.choice(["square", "rectangle"])
    if shape == "square":
        side = rng.randint(2, 20)
        l = w = side
        shape_desc = f"a square with side {side} cm"
    else:
        l = rng.randint(2, 20)
        w = rng.randint(2, 20)
        shape_desc = f"a rectangle with length {l} cm and width {w} cm"
    metric = ["perimeter", "area"][i % 2]
    if metric == "perimeter":
        correct = 2 * (l + w)
        question = f"What is the perimeter of {shape_desc}?"
        pool = [l * w, l + w, 2 * l, 2 * w, correct + 2, correct - 2]
        explanation = f"Perimeter = 2 × ({l} + {w}) = {correct} cm"
    else:
        correct = l * w
        question = f"What is the area of {shape_desc}?"
        pool = [2 * (l + w), l + w, correct + l, correct - l, correct + w, correct - w]
        explanation = f"Area = {l} × {w} = {correct} cm²"
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=2000)
    options, idx = _finalize_numeric(rng, correct, distractors)
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH4_DECIMALS_INTRO(rng: random.Random, i: int) -> GeneratedMathQuestion:
    variant = ["read", "compare", "digit_value"][i % 3]
    if variant == "read":
        v = rng.randint(1, 99)
        x, y = divmod(v, 10)
        correct = _fmt_decimal1(v)
        pool = [f"{y}.{x}", f"{x}.{(y + 1) % 10}", f"{x}.{(y - 1) % 10}", f"{(x + 1) % 10}.{y}"]
        fallback = lambda r, g: f"{r.randint(0, 9)}.{r.randint(0, 9)}"
        candidates = _rotate(pool, i)
        distractors = _ensure_three_str(rng, correct, candidates, fallback)
        options, idx = _finalize_numeric(rng, correct, distractors, fmt=str)
        explanation = f"{x} ones and {y} tenths is written as {correct}."
        return GeneratedMathQuestion(
            f"Which decimal number equals {x} ones and {y} tenths?", options, idx, explanation,
        )
    elif variant == "compare":
        v1 = rng.randint(1, 99)
        v2 = rng.randint(1, 99)
        while v2 == v1:
            v2 = rng.randint(1, 99)
        bigger_v, smaller_v = max(v1, v2), min(v1, v2)
        correct = _fmt_decimal1(bigger_v)
        pool = [
            _fmt_decimal1(smaller_v),
            _fmt_decimal1(min(bigger_v + 1, 99)),
            _fmt_decimal1(max(bigger_v - 1, 0)),
        ]
        fallback = lambda r, g: _fmt_decimal1(r.randint(0, 99))
        candidates = _rotate(pool, i)
        distractors = _ensure_three_str(rng, correct, candidates, fallback)
        options, idx = _finalize_numeric(rng, correct, distractors, fmt=str)
        explanation = f"{_fmt_decimal1(bigger_v)} is greater than {_fmt_decimal1(smaller_v)}."
        return GeneratedMathQuestion(
            f"Which is greater, {_fmt_decimal1(v1)} or {_fmt_decimal1(v2)}?", options, idx, explanation,
        )
    else:
        v = rng.randint(1, 99)
        x, y = divmod(v, 10)
        correct = str(y)
        pool = [str(x), str((y + 1) % 10), str((y - 1) % 10), str((y + 2) % 10)]
        fallback = lambda r, g: str(r.randint(0, 9))
        candidates = _rotate(pool, i)
        distractors = _ensure_three_str(rng, correct, candidates, fallback)
        options, idx = _finalize_numeric(rng, correct, distractors, fmt=str)
        explanation = f"In {x}.{y}, the digit in the tenths place is {y}."
        return GeneratedMathQuestion(
            f"In the number {x}.{y}, what is the digit in the tenths place?", options, idx, explanation,
        )


# ─────────────────────────────────────────────────────────────────────────
# Class 5
# ─────────────────────────────────────────────────────────────────────────

_FRACTION_OPS_DENOMS = [2, 3, 4, 5, 6, 8, 10]
_FRACTION_OPS_PAIRS = [
    (d1, d2)
    for d1 in _FRACTION_OPS_DENOMS
    for d2 in _FRACTION_OPS_DENOMS
    if d1 != d2 and _lcm(d1, d2) <= 24
]


def _gen_MATH5_FRACTION_OPS(rng: random.Random, i: int) -> GeneratedMathQuestion:
    d1, d2 = rng.choice(_FRACTION_OPS_PAIRS)
    n1 = rng.randint(1, d1 - 1)
    n2 = rng.randint(1, d2 - 1)
    lcd = _lcm(d1, d2)
    scaled_n1 = n1 * (lcd // d1)
    scaled_n2 = n2 * (lcd // d2)
    op = ["add", "sub", "compare"][i % 3]

    if op == "add":
        correct_num = scaled_n1 + scaled_n2
        correct = f"{correct_num}/{lcd}"
        question = f"What is {n1}/{d1} + {n2}/{d2}?"
        explanation = (
            f"LCD of {d1} and {d2} is {lcd}: {n1}/{d1} + {n2}/{d2} = "
            f"{scaled_n1}/{lcd} + {scaled_n2}/{lcd} = {correct_num}/{lcd}"
        )
        pool = [
            f"{n1 + n2}/{d1 + d2}", f"{n1 + n2}/{d1}", f"{n1 + n2}/{d2}",
            f"{correct_num}/{d1 * d2}", f"{correct_num + 1}/{lcd}", f"{max(correct_num - 1, 0)}/{lcd}",
        ]
    elif op == "sub":
        if scaled_n1 < scaled_n2:
            n1, d1, n2, d2 = n2, d2, n1, d1
            scaled_n1, scaled_n2 = scaled_n2, scaled_n1
        correct_num = scaled_n1 - scaled_n2
        correct = f"{correct_num}/{lcd}"
        question = f"What is {n1}/{d1} - {n2}/{d2}?"
        explanation = (
            f"LCD of {d1} and {d2} is {lcd}: {n1}/{d1} - {n2}/{d2} = "
            f"{scaled_n1}/{lcd} - {scaled_n2}/{lcd} = {correct_num}/{lcd}"
        )
        pool = [
            f"{abs(n1 - n2)}/{abs(d1 - d2)}", f"{scaled_n1 + scaled_n2}/{lcd}",
            f"{correct_num + 1}/{lcd}", f"{max(correct_num - 1, 0)}/{lcd}", f"{correct_num}/{d1}",
        ]
    else:
        if scaled_n1 == scaled_n2:
            n2 = n2 + 1 if n2 + 1 < d2 else n2 - 1
            scaled_n2 = n2 * (lcd // d2)
        bigger_is_1 = scaled_n1 > scaled_n2
        correct = f"{n1}/{d1}" if bigger_is_1 else f"{n2}/{d2}"
        other = f"{n2}/{d2}" if bigger_is_1 else f"{n1}/{d1}"
        question = f"Which is greater, {n1}/{d1} or {n2}/{d2}?"
        explanation = (
            f"{n1}/{d1} = {scaled_n1}/{lcd} and {n2}/{d2} = {scaled_n2}/{lcd}, so {correct} is greater."
        )
        pool = [other, f"{n1}/{d2}", f"{n2}/{d1}", f"{n1 + n2}/{lcd}"]

    candidates = _rotate(pool, i)
    fallback = lambda r, g: f"{r.randint(1, 20)}/{r.choice(_FRACTION_OPS_DENOMS)}"
    distractors = _ensure_three_str(rng, correct, candidates, fallback)
    options, idx = _finalize_numeric(rng, correct, distractors, fmt=str)
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH5_DECIMAL_OPS(rng: random.Random, i: int) -> GeneratedMathQuestion:
    op = ["add", "sub", "mult"][i % 3]
    if op == "add":
        v1 = rng.randint(1, 500)
        v2 = rng.randint(1, min(500, 999 - v1))
        correct = v1 + v2
        question = f"What is {_fmt_decimal2(v1)} + {_fmt_decimal2(v2)}?"
        explanation = f"{_fmt_decimal2(v1)} + {_fmt_decimal2(v2)} = {_fmt_decimal2(correct)}"
        pool = [abs(v1 - v2), correct + 1, correct - 1, correct + 10, correct - 10, correct + 100]
    elif op == "sub":
        v1 = rng.randint(2, 900)
        v2 = rng.randint(1, v1 - 1)
        correct = v1 - v2
        question = f"What is {_fmt_decimal2(v1)} - {_fmt_decimal2(v2)}?"
        explanation = f"{_fmt_decimal2(v1)} - {_fmt_decimal2(v2)} = {_fmt_decimal2(correct)}"
        pool = [v1 + v2, correct + 1, correct - 1, correct + 10, correct - 10]
    else:
        whole = rng.randint(2, 9)
        dec_val = rng.randint(1, 500)
        correct = whole * dec_val
        question = f"What is {whole} × {_fmt_decimal2(dec_val)}?"
        explanation = f"{whole} × {_fmt_decimal2(dec_val)} = {_fmt_decimal2(correct)}"
        pool = [dec_val, correct + dec_val, correct - dec_val, correct + 100, correct - 100]
    candidates = _rotate([c for c in pool if c is not None and c >= 1], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=1, max_value=99999)
    options, idx = _finalize_numeric(rng, correct, distractors, fmt=_fmt_decimal2)
    return GeneratedMathQuestion(question, options, idx, explanation)


_PERCENTAGE_BASE = {10: 10, 20: 5, 25: 4, 50: 2, 75: 4, 100: 1}


def _gen_MATH5_PERCENTAGE_INTRO(rng: random.Random, i: int) -> GeneratedMathQuestion:
    x = rng.choice(list(_PERCENTAGE_BASE.keys()))
    base = _PERCENTAGE_BASE[x]
    k = rng.randint(2, 20)
    y = base * k
    correct = x * y // 100
    question = f"What is {x}% of {y}?"
    explanation = f"{x}% of {y} = ({x}/100) × {y} = {correct}"
    pool = [y - correct, correct + 1, correct - 1, correct + 5, correct - 5, y]
    if x != 100:
        pool.append((y * x) // 10)
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=y * 2 + 10)
    options, idx = _finalize_numeric(rng, correct, distractors)
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH5_AREA_VOLUME(rng: random.Random, i: int) -> GeneratedMathQuestion:
    mode = ["area", "volume"][i % 2]
    if mode == "area":
        l1, w1 = rng.randint(2, 10), rng.randint(2, 10)
        l2, w2 = rng.randint(2, 10), rng.randint(2, 10)
        correct = l1 * w1 + l2 * w2
        question = (
            f"An L-shaped figure is made of two rectangles: one {l1} cm × {w1} cm "
            f"and another {l2} cm × {w2} cm. What is the total area?"
        )
        explanation = f"Area = ({l1}×{w1}) + ({l2}×{w2}) = {l1 * w1} + {l2 * w2} = {correct} cm²"
        pool = [l1 * w1, l2 * w2, (l1 + l2) * (w1 + w2), correct + 2, correct - 2]
        max_val = 500
    else:
        shape = rng.choice(["cube", "cuboid"])
        if shape == "cube":
            side = rng.randint(2, 10)
            l = w = h = side
            desc = f"a cube with side {side} cm"
        else:
            l, w, h = rng.randint(2, 10), rng.randint(2, 10), rng.randint(2, 10)
            desc = f"a cuboid with length {l} cm, width {w} cm, and height {h} cm"
        correct = l * w * h
        question = f"What is the volume of {desc}?"
        explanation = f"Volume = {l} × {w} × {h} = {correct} cm³"
        pool = [l * w, l * w + h, correct + l, correct - l, correct + w * h, correct - w * h]
        max_val = 1000
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, correct, candidates, min_value=0, max_value=max_val)
    options, idx = _finalize_numeric(rng, correct, distractors)
    return GeneratedMathQuestion(question, options, idx, explanation)


def _gen_MATH5_LONG_DIVISION_LARGE(rng: random.Random, i: int) -> GeneratedMathQuestion:
    divisor = rng.randint(10, 99)
    digits = [4, 5][i % 2]
    min_dividend = 10 ** (digits - 1)
    max_dividend = 10**digits - 1
    min_q = -(-min_dividend // divisor)
    max_q = max_dividend // divisor
    if min_q > max_q:
        min_q, max_q = max_q, min_q  # defensive; shouldn't trigger for divisor 10-99
    quotient = rng.randint(min_q, max_q)
    dividend = divisor * quotient
    pool = [
        quotient + 1, quotient - 1, quotient + 10, quotient - 10,
        dividend // (divisor + 1), dividend // (divisor - 1) if divisor > 10 else None,
        dividend - divisor,
    ]
    candidates = _rotate([c for c in pool if c is not None and c >= 0], i)
    distractors = _ensure_three_int(rng, quotient, candidates, min_value=0, max_value=99999)
    options, idx = _finalize_numeric(rng, quotient, distractors)
    explanation = f"{dividend} ÷ {divisor} = {quotient}"
    return GeneratedMathQuestion(f"What is {dividend} ÷ {divisor}?", options, idx, explanation)


# ─────────────────────────────────────────────────────────────────────────
# Dispatch
# ─────────────────────────────────────────────────────────────────────────

_GENERATORS: dict[str, Callable[[random.Random, int], GeneratedMathQuestion]] = {
    "MATH1_COUNTING": _gen_MATH1_COUNTING,
    "MATH1_COMPARISON": _gen_MATH1_COMPARISON,
    "MATH1_ADD_WITHIN_20": _gen_MATH1_ADD_WITHIN_20,
    "MATH1_SUB_WITHIN_20": _gen_MATH1_SUB_WITHIN_20,
    "MATH1_SHAPES": _gen_MATH1_SHAPES,
    "MATH2_PLACE_VALUE": _gen_MATH2_PLACE_VALUE,
    "MATH2_ADD_CARRYING": _gen_MATH2_ADD_CARRYING,
    "MATH2_SUB_BORROWING": _gen_MATH2_SUB_BORROWING,
    "MATH2_MULT_INTRO": _gen_MATH2_MULT_INTRO,
    "MATH3_MULT_TABLES": _gen_MATH3_MULT_TABLES,
    "MATH3_DIVISION": _gen_MATH3_DIVISION,
    "MATH3_PLACE_VALUE_1000": _gen_MATH3_PLACE_VALUE_1000,
    "MATH3_FRACTIONS_INTRO": _gen_MATH3_FRACTIONS_INTRO,
    "MATH3_MEASUREMENT": _gen_MATH3_MEASUREMENT,
    "MATH4_MULTIDIGIT_MULT": _gen_MATH4_MULTIDIGIT_MULT,
    "MATH4_LONG_DIVISION": _gen_MATH4_LONG_DIVISION,
    "MATH4_FRACTION_ADD": _gen_MATH4_FRACTION_ADD,
    "MATH4_PERIMETER_AREA": _gen_MATH4_PERIMETER_AREA,
    "MATH4_DECIMALS_INTRO": _gen_MATH4_DECIMALS_INTRO,
    "MATH5_FRACTION_OPS": _gen_MATH5_FRACTION_OPS,
    "MATH5_DECIMAL_OPS": _gen_MATH5_DECIMAL_OPS,
    "MATH5_PERCENTAGE_INTRO": _gen_MATH5_PERCENTAGE_INTRO,
    "MATH5_AREA_VOLUME": _gen_MATH5_AREA_VOLUME,
    "MATH5_LONG_DIVISION_LARGE": _gen_MATH5_LONG_DIVISION_LARGE,
}


def _validate_question(q: GeneratedMathQuestion) -> None:
    assert len(q.options) == 4, f"expected 4 options, got {len(q.options)}"
    assert len(set(q.options)) == 4, f"options are not all distinct: {q.options}"
    assert 0 <= q.correct_option_index <= 3, f"bad correct_option_index: {q.correct_option_index}"
    assert not (q.image_emoji and q.image_asset_key), "image_emoji and image_asset_key both set"
    assert not (q.option_emojis and q.option_asset_keys), "option_emojis and option_asset_keys both set"
    if q.option_emojis is not None:
        assert len(q.option_emojis) == 4
    if q.option_asset_keys is not None:
        assert len(q.option_asset_keys) == 4
        for key in q.option_asset_keys:
            assert key in ALL_ASSET_KEYS, f"invalid option asset key: {key!r}"
    if q.image_asset_key is not None:
        assert q.image_asset_key in ALL_ASSET_KEYS, f"invalid image asset key: {q.image_asset_key!r}"


def generate_math_questions(topic_code: str, count: int) -> list[GeneratedMathQuestion]:
    """Deterministically generates `count` MCQs for the given MATH* topic
    code. No LLM, no network call — pure offline computation seeded from
    (topic_code, count) so the same call always returns the same questions.

    Raises ValueError for an unknown topic_code or negative count.
    """
    if topic_code not in _GENERATORS:
        raise ValueError(f"Unknown math topic code: {topic_code!r}")
    if count < 0:
        raise ValueError("count must be non-negative")

    rng = _stable_rng(topic_code, count)
    generator = _GENERATORS[topic_code]
    questions: list[GeneratedMathQuestion] = []
    for i in range(count):
        question = generator(rng, i)
        _validate_question(question)
        questions.append(question)
    return questions
