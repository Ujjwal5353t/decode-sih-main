"""
One-off script — loads an original, hand-authored structured lesson (4-5
concept/example slides + 1 check slide) for every English chapter authored
in authored_content_english.py, into the `lessons` / `lesson_slides` tables,
WITHOUT any LLM call. NOT run at app startup.

Mirrors scripts/generate_lessons.py's structure (see _build_lesson_prompt)
but is entirely self-written, grounded directly in the chapter prose loaded
by authored_content_english.py — one lesson per (subject="English",
class_number, chapter_number).

Scoped strictly to subject="English" — does not touch any other subject's
rows. Run authored_content_english.py and authored_questions_english.py
before this script.

Usage (from backend/):
    uv run python scripts/authored_lessons_english.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import delete, select

from src.core.database import AsyncSessionFactory
from src.models.lesson import Lesson, LessonSlide

GENERATION_SOURCE = "authored:claude:v1"


def _slide(slide_type: str, text: str) -> dict:
    return {"slide_type": slide_type, "text": text, "image_asset_key": None, "image_emoji": None}


def _check(question_text: str, options: list[str], correct: int, explanation: str) -> dict:
    return {
        "question_text": question_text,
        "options": options,
        "correct_option_index": correct,
        "explanation": explanation,
        "image_asset_key": None,
        "image_emoji": None,
    }


# ── Lesson content, keyed by (class_number, chapter_number) ────────────────
# chapter_title MUST match the "Chapter N: Title" text authored_content_english.py
# stored, for a human-readable match between chunk content and its lesson.

LESSONS: dict[tuple[int, int], dict] = {

    # ── Class 1 ──────────────────────────────────────────────────────────
    (1, 1): {
        "chapter_title": "Chapter 1: Letter Sounds and Rhymes",
        "slides": [
            _slide("concept", "Every letter has its own sound, like c making /k/ in the word cat."),
            _slide("example", "Blend the sounds /h/, /a/, /t/ one after another, and you get the word hat."),
            _slide("concept", "Rhyming words end with the same sound, like cat and hat."),
            _slide("example", "Dog, log, and fog all rhyme, because they end in the '-og' sound."),
            _slide("concept", "Word families like '-an' (can, fan, man, pan) share the same ending, so knowing "
                              "one word helps you read the rest."),
        ],
        "check": _check(
            "Which word rhymes with 'sun'?",
            ["fun", "dog", "hat", "cup"], 0,
            "Fun rhymes with sun, because both end in the same '-un' sound.",
        ),
    },
    (1, 2): {
        "chapter_title": "Chapter 2: Words for Things Around Me",
        "slides": [
            _slide("concept", "A naming word tells us what something is called — a person, animal, or thing."),
            _slide("example", "Mother, dog, and ball are all naming words for different things around us."),
            _slide("concept", "Colour words describe what colour something is, like red, blue, and green."),
            _slide("example", "The sun is yellow, the sky is blue, and a leaf is green."),
            _slide("concept", "Learning naming words for family, animals, colours, and food gives us more words "
                              "to talk about our everyday world."),
        ],
        "check": _check(
            "Which word names an animal?",
            ["cow", "jump", "red", "five"], 0,
            "Cow is a naming word for an animal.",
        ),
    },
    (1, 3): {
        "chapter_title": "Chapter 3: The Little Red Hen",
        "slides": [
            _slide("concept", "The little red hen found some seeds and asked her farm friends for help."),
            _slide("example", "The dog, the cat, and the duck all said 'Not I' when asked to help plant the seeds."),
            _slide("concept", "The little red hen did all the work herself — planting, cutting, and baking."),
            _slide("example", "When the bread was warm and ready, everyone suddenly wanted to help eat it."),
            _slide("concept", "The story teaches us that hard work is rewarded, and it is fair for helpers to "
                              "share in what they helped make."),
        ],
        "check": _check(
            "Who helped the little red hen plant the seeds?",
            ["No one", "The dog", "The cat", "The duck"], 0,
            "The dog, cat, and duck all said 'Not I,' so no one helped her plant the seeds.",
        ),
    },
    (1, 4): {
        "chapter_title": "Chapter 4: Naming Words and Doing Words",
        "slides": [
            _slide("concept", "A noun is a naming word — it names a person, animal, place, or thing."),
            _slide("example", "Boy, dog, and school are all nouns."),
            _slide("concept", "A verb is a doing word — it tells us what someone or something is doing."),
            _slide("example", "'I eat rice.' uses the naming word I and the doing word eat."),
            _slide("concept", "When the naming word is he, she, or it, we usually add -s to the doing word, "
                              "like 'She plays.'"),
        ],
        "check": _check(
            "Fill in the blank: 'The dog ___ loudly.'",
            ["barks", "bark", "barking", "barked"], 0,
            "'The dog' takes an -s verb in the simple present tense: barks.",
        ),
    },

    # ── Class 2 ──────────────────────────────────────────────────────────
    (2, 1): {
        "chapter_title": "Chapter 1: Building Bigger Words",
        "slides": [
            _slide("concept", "By Class 2, we blend more sounds together to read longer words, like stop."),
            _slide("example", "The word frog blends four sounds: /f/, /r/, /o/, /g/."),
            _slide("concept", "Two letters can join to make one new sound, called a digraph, like 'sh' in ship."),
            _slide("example", "Chair starts with the /ch/ digraph sound."),
            _slide("concept", "Long words can be split into smaller parts, called syllables, like rabbit = "
                              "rab + bit."),
        ],
        "check": _check(
            "Which word starts with the /sh/ sound?",
            ["ship", "chin", "this", "sun"], 0,
            "Ship starts with the /sh/ digraph sound.",
        ),
    },
    (2, 2): {
        "chapter_title": "Chapter 2: Describing Words",
        "slides": [
            _slide("concept", "Describing words, called adjectives, tell us more about a naming word."),
            _slide("example", "'The big, brown dog ran quickly.' uses describing words to paint a clear picture."),
            _slide("concept", "Describing words can tell us about size, how something feels, colour, or taste."),
            _slide("example", "Big and small, hot and cold are opposite pairs of describing words."),
            _slide("concept", "Using describing words makes our sentences much more interesting to read."),
        ],
        "check": _check(
            "Which word describes how something tastes?",
            ["sweet", "big", "red", "fast"], 0,
            "Sweet describes a taste.",
        ),
    },
    (2, 3): {
        "chapter_title": "Chapter 3: A Rainy Day",
        "slides": [
            _slide("concept", "Raju loved rainy days, so he put on his raincoat and gumboots to go outside."),
            _slide("example", "He jumped into the biggest puddle he could find, and water splashed everywhere."),
            _slide("concept", "His sister Meera joined him, and together they jumped in puddle after puddle."),
            _slide("example", "Afterwards, their mother called them inside for warm milk and biscuits."),
            _slide("concept", "The story shows how much fun a rainy day can be when you dress for it and share "
                              "it with someone."),
        ],
        "check": _check(
            "What did Raju's mother give them after they played in the rain?",
            ["warm milk and biscuits", "tea and cake", "juice and fruit", "soup and bread"], 0,
            "The passage says their mother gave them warm milk and biscuits.",
        ),
    },
    (2, 4): {
        "chapter_title": "Chapter 4: I, You, He, She, It",
        "slides": [
            _slide("concept", "A pronoun replaces a naming word so we don't repeat it again and again."),
            _slide("example", "'Raju is happy. He is playing.' — he replaces Raju the second time."),
            _slide("concept", "We use he for a boy/man, she for a girl/woman, it for an animal or thing, and "
                              "they for more than one."),
            _slide("example", "'The dog barks loudly.' becomes 'It barks loudly.'"),
            _slide("concept", "Pronouns work with -s verbs too: He plays, she reads, it runs."),
        ],
        "check": _check(
            "Replace the naming word: 'Meera sings a song.' becomes '___ sings a song.'",
            ["She", "He", "It", "They"], 0,
            "Meera is a girl, so we use the pronoun she.",
        ),
    },
    (2, 5): {
        "chapter_title": "Chapter 5: Making Complete Sentences",
        "slides": [
            _slide("concept", "A complete sentence has a naming part and a telling part."),
            _slide("example", "'The dog runs.' — dog is the naming part, runs is the telling part."),
            _slide("concept", "Without both parts, a sentence feels incomplete, like just 'The dog'."),
            _slide("example", "'Mia sings a song.' answers both who it is about and what they do."),
            _slide("concept", "Every complete sentence starts with a capital letter and ends with correct "
                              "punctuation."),
        ],
        "check": _check(
            "Which of these is a complete sentence?",
            ["The cat sleeps.", "Runs fast", "The cat", "Fast cat the"], 0,
            "'The cat sleeps.' has both a naming part and a telling part.",
        ),
    },

    # ── Class 3 ──────────────────────────────────────────────────────────
    (3, 1): {
        "chapter_title": "Chapter 1: Words That Mean Almost the Same",
        "slides": [
            _slide("concept", "Synonyms are different words that mean almost the same thing."),
            _slide("example", "Happy and glad are synonyms — both describe feeling good."),
            _slide("concept", "Knowing synonyms helps us understand new or unfamiliar words in a passage."),
            _slide("example", "Quick and fast both mean moving with speed."),
            _slide("concept", "Using synonyms instead of repeating the same word makes our writing more "
                              "interesting."),
        ],
        "check": _check(
            "Which word is a synonym for 'big'?",
            ["large", "small", "short", "thin"], 0,
            "Large means almost the same as big.",
        ),
    },
    (3, 2): {
        "chapter_title": "Chapter 2: The Clever Crow",
        "slides": [
            _slide("concept", "A thirsty crow found water in a clay pot, but her beak could not reach it."),
            _slide("example", "She noticed pebbles scattered nearby and had a clever idea."),
            _slide("concept", "She dropped pebbles into the pot one by one, and the water slowly rose."),
            _slide("example", "After many pebbles, the water finally rose high enough for her to drink."),
            _slide("concept", "The story teaches that thinking carefully can solve even a difficult problem, "
                              "without needing great strength."),
        ],
        "check": _check(
            "What did the crow use to raise the water level in the pot?",
            ["pebbles", "sticks", "leaves", "sand"], 0,
            "The crow dropped pebbles into the pot to raise the water level.",
        ),
    },
    (3, 3): {
        "chapter_title": "Chapter 3: Talking About Yesterday",
        "slides": [
            _slide("concept", "The simple past tense describes actions that have already happened."),
            _slide("example", "Walk becomes walked — 'She walked to school yesterday.'"),
            _slide("concept", "Some verbs change completely in the past tense instead of adding -ed — these are "
                              "irregular verbs."),
            _slide("example", "Go becomes went, eat becomes ate, and see becomes saw."),
            _slide("concept", "To ask about the past or say no, we use 'did' with the base verb: 'Did she "
                              "play?' not 'Did she played?'"),
        ],
        "check": _check(
            "What is the past tense of 'go'?",
            ["went", "goed", "going", "goes"], 0,
            "'Went' is the irregular past tense of go.",
        ),
    },
    (3, 4): {
        "chapter_title": "Chapter 4: Describing People and Places",
        "slides": [
            _slide("concept", "A descriptive sentence uses detail words to paint a clear picture in the reader's "
                              "mind."),
            _slide("example", "'The tall, green tree stood near the old red house.' gives a vivid picture."),
            _slide("concept", "We can describe a person by their size, clothes, or how they look."),
            _slide("example", "'The small, round, shiny red apple sat on the table.' uses four describing "
                              "words."),
            _slide("concept", "Adding careful detail words helps a reader truly picture what you are "
                              "describing."),
        ],
        "check": _check(
            "Which sentence is more descriptive?",
            ["The tall, green tree stood near the house.", "The tree stood there.",
             "Tree house.", "The tree."], 0,
            "Adding 'tall, green' gives a much clearer picture of the tree than the other options.",
        ),
    },

    # ── Class 4 ──────────────────────────────────────────────────────────
    (4, 1): {
        "chapter_title": "Chapter 1: Opposites and Look-Alikes",
        "slides": [
            _slide("concept", "A synonym has a similar meaning to another word; an antonym has the opposite "
                              "meaning."),
            _slide("example", "Big and huge are synonyms; big and small are antonyms."),
            _slide("concept", "Recognising synonyms helps us understand a passage even when we don't know every "
                              "word."),
            _slide("example", "'The enormous elephant walked slowly.' — enormous means very big."),
            _slide("concept", "Building a bank of synonyms and antonyms makes our own writing richer and less "
                              "repetitive."),
        ],
        "check": _check(
            "What is the antonym (opposite) of 'hot'?",
            ["cold", "warm", "sunny", "dry"], 0,
            "Cold is the opposite of hot.",
        ),
    },
    (4, 2): {
        "chapter_title": "Chapter 2: The Farmer and the Well",
        "slides": [
            _slide("concept", "Farmer Gopal had no well of his own, so he walked far every day to fetch water."),
            _slide("example", "He saved his money for many months and finally bought a well from a trader."),
            _slide("concept", "The trader tried to trick Gopal, saying he had sold the well but not the water "
                              "inside it."),
            _slide("example", "The wise village judge ruled that the trader must remove his water from Gopal's "
                              "well."),
            _slide("concept", "The story shows how clever, fair thinking can solve an unfair trick."),
        ],
        "check": _check(
            "Who did Gopal ask for help with his problem?",
            ["the village judge", "his neighbour", "his family", "the trader's friend"], 0,
            "Gopal went to the wise judge of the village to explain his problem.",
        ),
    },
    (4, 3): {
        "chapter_title": "Chapter 3: Tomorrow's Plans",
        "slides": [
            _slide("concept", "Adjectives are describing words placed before the noun they describe."),
            _slide("example", "'A kind grandmother' and 'a colourful kite' both use adjectives."),
            _slide("concept", "The simple future tense uses 'will' to describe actions that have not happened "
                              "yet."),
            _slide("example", "'I will visit my grandmother tomorrow.'"),
            _slide("concept", "Adjectives and the future tense often combine: 'I will buy a colourful kite "
                              "tomorrow.'"),
        ],
        "check": _check(
            "Fill in the blank: 'She ___ bake a cake this weekend.'",
            ["will", "is", "was", "did"], 0,
            "The simple future tense uses 'will' with the base verb.",
        ),
    },
    (4, 4): {
        "chapter_title": "Chapter 4: Joining Ideas Together",
        "slides": [
            _slide("concept", "Two short sentences can be joined into one using a joining word, called a "
                              "conjunction."),
            _slide("example", "'I like mangoes. I like bananas.' becomes 'I like mangoes and bananas.'"),
            _slide("concept", "But shows contrast, because explains a reason, and or shows a choice."),
            _slide("example", "'I stayed home because I was sick.'"),
            _slide("concept", "Joining sentences this way makes writing flow better and avoids short, choppy "
                              "sentences."),
        ],
        "check": _check(
            "Which conjunction shows a choice between two things?",
            ["or", "and", "because", "but"], 0,
            "'Or' is used to show a choice between two possibilities.",
        ),
    },

    # ── Class 5 ──────────────────────────────────────────────────────────
    (5, 1): {
        "chapter_title": "Chapter 1: Guessing Meaning from Context",
        "slides": [
            _slide("concept", "We can guess an unfamiliar word's meaning using clues in the words around it."),
            _slide("example", "'The parched land had not seen rain for months.' — parched means very dry."),
            _slide("concept", "Context clues can explain a word directly, or give an example that hints at its "
                              "meaning."),
            _slide("example", "'She felt drowsy, her eyes kept closing.' — drowsy means sleepy."),
            _slide("concept", "This skill helps us handle new, unfamiliar words confidently, without needing a "
                              "dictionary every time."),
        ],
        "check": _check(
            "'The famished dog gulped down its food quickly.' What does 'famished' most likely mean?",
            ["very hungry", "very tired", "very happy", "very angry"], 0,
            "Gulping down food quickly suggests famished means very hungry.",
        ),
    },
    (5, 2): {
        "chapter_title": "Chapter 2: Ice-Cream Man",
        "slides": [
            _slide("concept", "An old banyan tree stood at the edge of the village, and Kamla sat beneath it "
                              "every day."),
            _slide("example", "A curious boy noticed the initials 'K + R' carved deep into the tree's trunk."),
            _slide("concept", "Kamla's long pause and her glance at the empty space beside her suggest a "
                              "meaningful, private memory."),
            _slide("example", "She said the tree was once young enough for two people to reach their arms "
                              "around it together."),
            _slide("concept", "A story can let us infer feelings and ideas that are never directly stated in "
                              "words."),
        ],
        "check": _check(
            "What can we infer about the empty space on the bench that Kamla looks at?",
            ["Someone who used to sit there is no longer with her", "She is looking for a new friend",
             "She dislikes sitting on the bench", "She is waiting for the boy"], 0,
            "Looking at an empty space suggests she is remembering someone who is no longer there.",
        ),
    },
    (5, 3): {
        "chapter_title": "Chapter 3: Mixing Past, Present, and Future",
        "slides": [
            _slide("concept", "A single passage can use past, present, and future tense together in one "
                              "sentence."),
            _slide("example", "'She finished her homework, is watching TV now, and will sleep soon.'"),
            _slide("concept", "Conjunctions like and, but, so, and because connect these different time ideas "
                              "smoothly."),
            _slide("example", "'It started raining, so we came back inside.'"),
            _slide("concept", "Asking 'did this already happen, is it happening now, or will it happen later' "
                              "helps us choose the right tense."),
        ],
        "check": _check(
            "Which conjunction shows a result?",
            ["so", "but", "although", "when"], 0,
            "'So' introduces the result of an earlier action.",
        ),
    },
    (5, 4): {
        "chapter_title": "Chapter 4: Sentences with More Than One Idea",
        "slides": [
            _slide("concept", "A complex sentence joins a main idea with an extra clause, using words like "
                              "because, although, when, or if."),
            _slide("example", "'She was late because the bus broke down.'"),
            _slide("concept", "Although shows contrast, when shows timing, and if shows a condition."),
            _slide("example", "'Although it was raining heavily, the match continued.'"),
            _slide("concept", "The clause order can switch, and a comma follows the extra clause when it comes "
                              "first."),
        ],
        "check": _check(
            "Which word introduces a condition in a complex sentence?",
            ["if", "when", "because", "although"], 0,
            "'If' introduces a condition.",
        ),
    },
}


async def main() -> None:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(Lesson.id).where(Lesson.subject == "English"))
        lesson_ids = [row[0] for row in result.all()]
        if lesson_ids:
            await session.execute(delete(LessonSlide).where(LessonSlide.lesson_id.in_(lesson_ids)))
            await session.execute(delete(Lesson).where(Lesson.subject == "English"))
            await session.commit()
        print(f"Deleted {len(lesson_ids)} existing English lesson(s) and their slides.")

    total_slides = 0
    for (class_number, chapter_number), data in sorted(LESSONS.items()):
        chapter_title = data["chapter_title"]
        slides = data["slides"]
        check = data["check"]

        async with AsyncSessionFactory() as session:
            lesson = Lesson(
                subject="English",
                class_number=class_number,
                chapter_number=chapter_number,
                chapter_title=chapter_title,
                generation_source=GENERATION_SOURCE,
            )
            session.add(lesson)
            await session.flush()

            for idx, slide in enumerate(slides):
                session.add(
                    LessonSlide(
                        lesson_id=lesson.id,
                        slide_index=idx,
                        slide_type=slide["slide_type"],
                        text=slide["text"],
                        image_asset_key=slide["image_asset_key"],
                        image_emoji=slide["image_emoji"],
                    )
                )

            session.add(
                LessonSlide(
                    lesson_id=lesson.id,
                    slide_index=len(slides),
                    slide_type="check",
                    text=check["question_text"],
                    image_asset_key=check["image_asset_key"],
                    image_emoji=check["image_emoji"],
                    options=check["options"],
                    correct_option_index=check["correct_option_index"],
                    explanation=check["explanation"],
                )
            )
            await session.commit()

        n_slides = len(slides) + 1
        print(f"  [ok] C{class_number} Ch.{chapter_number} ({chapter_title}): {n_slides} slide(s) inserted")
        total_slides += n_slides

    print(f"\nDone. Lessons inserted: {len(LESSONS)}. Total slides (incl. check): {total_slides}.")


if __name__ == "__main__":
    asyncio.run(main())
