"""
Canonical vocabulary of curated illustration asset keys available to the
diagnostic quiz question bank.

Mirrors the frontend registry at
frontend/components/quiz/illustrations/registry.tsx key-for-key — the two
lists MUST stay in sync (an asset_key with no matching frontend recipe
silently renders nothing). If you add/rename a key here, add/rename it
there too.

Used by scripts/generate_questions.py to constrain the offline LLM's
picture choice to assets that actually exist as real illustrations,
instead of the free-form image_emoji it falls back to for anything not
covered here.
"""

ASSET_VOCABULARY: dict[str, list[str]] = {
    "Shapes": [
        "circle", "square", "triangle", "rectangle", "oval", "star", "hexagon", "pentagon",
    ],
    "Animals": [
        "elephant", "lion", "tiger", "dog", "cat", "cow", "goat", "sheep", "horse",
        "monkey", "rabbit", "bird", "fish", "frog", "snake", "duck", "hen", "pig",
        "bear", "peacock",
    ],
    "Fruits & Food": [
        "apple", "banana", "mango", "orange", "grapes", "watermelon", "strawberry",
        "pineapple", "papaya", "guava", "carrot", "tomato", "bread", "milk",
    ],
    "Everyday Objects": [
        "ball", "book", "pencil", "bag", "chair", "table", "door", "window",
        "clock", "umbrella", "kite", "bicycle", "car", "bus", "boat", "key",
    ],
    "Nature & Weather": [
        "sun", "moon", "cloud", "rain", "tree", "flower", "leaf", "mountain",
        "river", "night_star",
    ],
    "Home & Misc": [
        "house", "flag", "lamp", "bed", "drum", "bell",
    ],
}

ALL_ASSET_KEYS: frozenset[str] = frozenset(
    key for keys in ASSET_VOCABULARY.values() for key in keys
)


def asset_vocabulary_prompt_block() -> str:
    """Renders the vocabulary as a category: key, key, key... text block for
    embedding directly into the question-generation prompt."""
    return "\n".join(f"{category}: {', '.join(keys)}" for category, keys in ASSET_VOCABULARY.items())
