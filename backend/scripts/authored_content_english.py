"""
One-off script — loads original, hand-authored NCERT-("Marigold")-aligned
English chapter content into `document_chunks` (branch_name="SELF"), one
chapter per Class 1-5 English Topic in src/db/curriculum_seed.py. NOT run at
app startup.

Why this exists: the real NCERT PDFs were never ingested, so branch_name=
"SELF" document_chunks for English held only tiny (~300-500 char) placeholder
paragraphs from src/db/ncert_content.py, covering just "Chapter 1" per class.
Quiz questions and lessons RAG-grounded in that content drifted from the real
NCERT syllabus. This script replaces those placeholders with substantially
richer, original prose (paraphrased/self-written, not copied from the
textbook) — one chapter per English Topic, chunked via the same
extract_chapters_and_chunks pipeline scripts/generate_questions.py's RAG path
and scripts/generate_lessons.py already rely on.

Scoped strictly to subject="English" — does not touch any other subject's
rows.

Usage (from backend/):
    uv run python scripts/authored_content_english.py
"""

import asyncio
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlmodel import delete, select

from src.ai.chunking import extract_chapters_and_chunks
from src.core.database import AsyncSessionFactory
from src.models.chunk import DocumentChunk
from src.models.ncert import NCERTBook

# ── Chapter content, keyed by class_number ─────────────────────────────────
# One chapter per English Topic in src/db/curriculum_seed.py, in topic order,
# so every chapter is directly traceable to the skill it grounds:
#   Class 1: PHONICS, VOCAB, READING, GRAMMAR
#   Class 2: PHONICS, VOCAB, READING, GRAMMAR, SENTENCE
#   Class 3: VOCAB, READING, GRAMMAR, SENTENCE
#   Class 4: VOCAB, READING, GRAMMAR, SENTENCE
#   Class 5: VOCAB, READING, GRAMMAR, SENTENCE

CHAPTER_TEXT: dict[int, str] = {
    1: (
        "Chapter 1: Letter Sounds and Rhymes\n"
        "Every letter has its own sound. The letter c makes the sound /k/, like in "
        "cat. The letter b makes the sound /b/, like in ball. The letter s makes "
        "the sound /s/, like in sun. The letter m makes the sound /m/, like in "
        "mat. When we know the sound of each letter, we can blend the sounds "
        "together to read a whole word.\n\n"
        "The sounds /k/, /a/, /t/ blend together to make the word cat. The sounds "
        "/h/, /a/, /t/ blend together to make the word hat. The sounds /d/, /o/, "
        "/g/ blend together to make the word dog. Blending is like joining sounds "
        "one after another, without stopping, until they turn into a word we "
        "know.\n\n"
        "Rhyming words end with the same sound. Cat and hat rhyme, because both "
        "end in -at. Dog and log rhyme, because both end in -og. Sun and fun "
        "rhyme, because both end in -un. Pig and wig rhyme, because both end in "
        "-ig. Listening for rhymes helps us notice small sound patterns inside "
        "words.\n\n"
        "Short vowel sounds sit in the middle of many simple words. The letter a "
        "sounds like in apple. The letter e sounds like in egg. The letter i "
        "sounds like in ink. The letter o sounds like in octopus. The letter u "
        "sounds like in umbrella. Words like cat, pen, pig, dot, and cup each use "
        "one short vowel sound.\n\n"
        "We can practise blending with word families. The -at family has cat, "
        "hat, mat, and sat. The -an family has can, fan, man, and pan. The -in "
        "family has pin, tin, and win. Once we know one word in a family, the "
        "rest come easily, because only the first letter changes.\n\n"
        "Try this: say the word big out loud. Now change the b to a p. The new "
        "word is pig! Changing just one sound can make a brand new word. This is "
        "how young readers learn many new words quickly, just by knowing their "
        "letter sounds well.\n\n"
        "Chapter 2: Words for Things Around Me\n"
        "A naming word tells us what something is called. Mother, father, "
        "sister, and brother are naming words for people in our family. Dog, "
        "cat, cow, and hen are naming words for animals we see every day. Ball, "
        "book, bag, and cup are naming words for things we use every day.\n\n"
        "Colour words tell us what colour something is. The sun is yellow. The "
        "sky is blue. A leaf is green. A ripe tomato is red. Learning colour "
        "words helps us describe the things around us more clearly, like 'a red "
        "ball' or 'a blue cup'.\n\n"
        "Number words help us count things. One, two, three, four, five, six, "
        "seven, eight, nine, and ten are the first ten counting words. We can "
        "count our fingers, our toys, or the birds sitting on a wire using these "
        "words.\n\n"
        "Body part words name the parts of our body. Head, eyes, nose, ears, "
        "hands, and feet are all body part words. We use our eyes to see, our "
        "ears to hear, our nose to smell, and our hands to hold things.\n\n"
        "Food words name the things we eat. Rice, roti, milk, apple, and banana "
        "are food words. Learning many naming words for family, animals, "
        "colours, numbers, body parts, and food gives us more words to talk "
        "about our everyday world.\n\n"
        "Chapter 3: The Little Red Hen\n"
        "Once there was a little red hen. She lived on a farm with a lazy dog, a "
        "lazy cat, and a lazy duck. One day, the little red hen found some seeds "
        "of wheat.\n\n"
        "'Who will help me plant these seeds?' asked the little red hen. 'Not "
        "I,' said the dog. 'Not I,' said the cat. 'Not I,' said the duck. 'Then "
        "I will do it myself,' said the little red hen. And she did.\n\n"
        "When the wheat grew tall, the little red hen asked, 'Who will help me "
        "cut the wheat?' 'Not I,' said the dog. 'Not I,' said the cat. 'Not I,' "
        "said the duck. 'Then I will do it myself,' said the little red hen. And "
        "she did.\n\n"
        "When the wheat was ground into flour, the little red hen asked, 'Who "
        "will help me bake the bread?' 'Not I,' said the dog. 'Not I,' said the "
        "cat. 'Not I,' said the duck. 'Then I will do it myself,' said the "
        "little red hen. And she did.\n\n"
        "When the bread was warm and ready, the little red hen asked, 'Who will "
        "help me eat the bread?' 'I will!' said the dog. 'I will!' said the "
        "cat. 'I will!' said the duck. 'No,' said the little red hen. 'I "
        "planted the seeds, I cut the wheat, and I baked the bread, all by "
        "myself. Now I will eat it myself too.' And she did.\n\n"
        "Chapter 4: Naming Words and Doing Words\n"
        "A noun is a naming word. It names a person, an animal, a place, or a "
        "thing. Boy, girl, dog, school, and ball are all nouns. Every sentence "
        "usually has at least one naming word in it.\n\n"
        "A verb is a doing word. It tells us what someone or something is "
        "doing. Run, eat, sleep, and play are all verbs. When we talk about "
        "what we do every day, we use simple present tense verbs like these.\n\n"
        "In the simple present tense, we describe things that happen regularly "
        "or are true now. 'I eat rice.' 'I play with my ball.' 'I sleep at "
        "night.' 'The sun shines.' Each of these sentences has a naming word "
        "(I, sun) and a doing word (eat, play, sleep, shines).\n\n"
        "When the naming word is he, she, or it, we usually add -s to the doing "
        "word. 'I play.' becomes 'She plays.' 'I run.' becomes 'He runs.' 'The "
        "dog barks.' has an -s because dog is like he or it.\n\n"
        "Try building your own sentences: pick a naming word like boy, cat, or "
        "bird, and a doing word like walks, jumps, or sings. 'The boy walks.' "
        "'The cat jumps.' 'The bird sings.' Every simple sentence needs both a "
        "naming word and a doing word to make sense."
    ),
    2: (
        "Chapter 1: Building Bigger Words\n"
        "By Class 2, we can blend more letter sounds together to read longer "
        "words. The word stop has four sounds: /s/, /t/, /o/, /p/. Blending all "
        "four sounds together, without pausing, gives us the word stop. The "
        "word frog has four sounds too: /f/, /r/, /o/, /g/.\n\n"
        "Word families help us read many words quickly. The -at family has "
        "cat, mat, sat, and rat. The -og family has dog, log, fog, and jog. "
        "Once we can read one word in a family, we can often read the rest "
        "just by changing the first sound.\n\n"
        "Two letters can also join to make one new sound, called a digraph. "
        "The letters s and h together make the /sh/ sound, like in ship and "
        "shop. The letters c and h together make the /ch/ sound, like in chair "
        "and chin. The letters t and h together make the /th/ sound, like in "
        "this and that.\n\n"
        "Practising digraph words builds reading speed. Ship, shop, shell, and "
        "shoe all start with /sh/. Chair, chin, chalk, and cherry all start "
        "with /ch/. Reading these words again and again helps us recognise the "
        "digraph sound instantly, instead of sounding it out letter by letter "
        "every time.\n\n"
        "Longer words can also be broken into smaller parts, called syllables. "
        "The word rabbit has two parts: rab and bit. The word carpet has two "
        "parts: car and pet. Clapping once for each part while saying a word "
        "helps us hear how many syllables it has.\n\n"
        "Chapter 2: Describing Words\n"
        "Besides naming words, we also use describing words, called "
        "adjectives, to tell more about a noun. Big, small, tall, short, hot, "
        "and cold are all describing words. 'A big elephant' and 'a small ant' "
        "use describing words to compare size.\n\n"
        "Describing words can tell us about size: big, small, tall, short. "
        "They can tell us about how something feels: hot, cold, soft, hard. "
        "They can tell us about colour: red, blue, green, yellow. They can "
        "tell us about how something tastes: sweet, sour, salty.\n\n"
        "Using describing words makes our sentences much more interesting. "
        "Instead of just saying 'The dog ran', we can say 'The big, brown dog "
        "ran quickly.' The words big and brown tell us more about the dog, and "
        "quickly tells us more about how it ran.\n\n"
        "Some common describing words come in opposite pairs: big and small, "
        "hot and cold, fast and slow, happy and sad, clean and dirty. Learning "
        "describing words in pairs like this makes them easier to remember and "
        "use correctly.\n\n"
        "Try this: think of your school bag. Is it big or small? Is it heavy "
        "or light? Is it new or old? Now use two describing words in one "
        "sentence: 'My school bag is big and heavy.' Describing words help "
        "others picture exactly what you mean.\n\n"
        "Chapter 3: A Rainy Day\n"
        "It was a cloudy morning. Dark clouds covered the sky, and soon it "
        "began to rain. Raju looked out of the window and smiled. He loved "
        "rainy days more than any other kind of day.\n\n"
        "Raju put on his yellow raincoat and his red gumboots. He picked up "
        "his umbrella and stepped outside carefully. The rain fell softly on "
        "the leaves, making a gentle patting sound. Puddles formed on the "
        "muddy ground near the gate.\n\n"
        "Raju jumped into the biggest puddle he could find. Water splashed up "
        "around his boots, and he laughed loudly. His little sister Meera "
        "watched from the doorway, giggling at the splashing water.\n\n"
        "'Come and join me!' Raju called out. Meera ran outside too, holding "
        "her own small umbrella. Together, they jumped in puddle after puddle, "
        "laughing every time the water splashed up.\n\n"
        "After some time, their mother called them inside for warm milk and "
        "biscuits. Raju and Meera dried themselves with a towel and sat by the "
        "window, watching the rain fall gently outside, feeling happy and "
        "warm.\n\n"
        "Chapter 4: I, You, He, She, It\n"
        "A pronoun is a word we use in place of a naming word, so we do not "
        "have to repeat the same name again and again. I, you, he, she, it, "
        "we, and they are all pronouns.\n\n"
        "Instead of saying 'Raju is happy. Raju is playing.', we can say 'Raju "
        "is happy. He is playing.' The pronoun he takes the place of Raju the "
        "second time, so the sentence does not sound repetitive.\n\n"
        "We use he for a boy or a man, and she for a girl or a woman. We use "
        "it for an animal or a thing whose gender we do not usually mention, "
        "like a dog, a ball, or a book. We use they for more than one person, "
        "animal, or thing.\n\n"
        "Pronouns work with the simple present tense too. 'He plays.' 'She "
        "reads.' 'It runs.' Notice that plays, reads, and runs all end in -s, "
        "because he, she, and it each take an -s verb in the simple present "
        "tense, just like a single naming word does.\n\n"
        "Try this: replace the naming word with the correct pronoun. 'Meera "
        "sings a song.' becomes 'She sings a song.' 'The dog barks loudly.' "
        "becomes 'It barks loudly.' 'Raju and Meera play outside.' becomes "
        "'They play outside.'\n\n"
        "Chapter 5: Making Complete Sentences\n"
        "A complete sentence has two parts: a naming part, which tells us who "
        "or what the sentence is about, and a telling part, which tells us "
        "what that person or thing does. 'The dog runs.' has dog as the "
        "naming part and runs as the telling part.\n\n"
        "Without both parts, a sentence feels incomplete. 'The dog' by itself "
        "does not tell us what the dog is doing. 'Runs fast' by itself does "
        "not tell us who is running. Only 'The dog runs fast.' gives us the "
        "full idea.\n\n"
        "We can build complete sentences by joining a naming word or pronoun "
        "with a matching action word. 'Mia sings a song.' 'The bird flies "
        "high.' 'We play in the park.' Each sentence answers both 'who or "
        "what' and 'what do they do'.\n\n"
        "A sentence always starts with a capital letter and ends with a full "
        "stop, a question mark, or an exclamation mark. 'The sun is bright.' "
        "ends with a full stop. 'Is the sun bright?' ends with a question "
        "mark. 'What a bright sun!' ends with an exclamation mark.\n\n"
        "Practise building your own complete sentences: pick a naming word, "
        "like cat, teacher, or rain, and add a telling part. 'The cat "
        "sleeps.' 'The teacher smiles.' 'The rain falls.' Checking that every "
        "sentence has both parts helps our writing make full sense."
    ),
    3: (
        "Chapter 1: Words That Mean Almost the Same\n"
        "Some different words can mean almost the same thing. These are "
        "called synonyms. Happy and glad are synonyms, because both describe "
        "feeling good. Big and large are synonyms, because both describe "
        "great size.\n\n"
        "Knowing synonyms helps us understand new words. If we already know "
        "the word happy, and we read the sentence 'The glad child smiled "
        "brightly', we can guess that glad means something close to happy, "
        "because both fit the same feeling in the sentence.\n\n"
        "Here are more synonym pairs: quick and fast both mean moving with "
        "speed. Small and tiny both mean not big. Beautiful and pretty both "
        "mean nice to look at. Begin and start both mean to do the first part "
        "of something.\n\n"
        "Synonyms are not always exactly identical in meaning, but they are "
        "close enough to use in similar sentences. 'She walked quickly to "
        "school.' and 'She walked fast to school.' both describe the same "
        "kind of walking, even though quickly and fast are slightly different "
        "words.\n\n"
        "Using synonyms also helps our writing sound less repetitive. Instead "
        "of writing 'The big dog ran to the big tree', we could write 'The "
        "big dog ran to the large tree', using large instead of repeating "
        "big. This makes our sentences more varied and interesting to "
        "read.\n\n"
        "Chapter 2: The Clever Crow\n"
        "One hot summer day, a thirsty crow flew from tree to tree looking "
        "for water. She had not had a single drop to drink all day, and her "
        "throat felt dry. At last, she saw a clay pot lying under a tree.\n\n"
        "The crow flew down eagerly and looked inside the pot. There was some "
        "water at the bottom, but the pot was tall and narrow, and the water "
        "was too low for her beak to reach. She tried pushing her head deep "
        "into the pot, but it was no use.\n\n"
        "The crow thought for a while. She did not give up. Looking around, "
        "she noticed some small pebbles scattered on the ground near the "
        "tree. Suddenly, she had a clever idea.\n\n"
        "One by one, the crow picked up the pebbles with her beak and dropped "
        "them into the pot. Slowly, the water inside began to rise, because "
        "each pebble took up space at the bottom. The crow kept dropping "
        "pebble after pebble into the pot, without stopping.\n\n"
        "After many pebbles had been dropped in, the water finally rose near "
        "the top of the pot. The crow dipped her beak into the water and "
        "drank until she was no longer thirsty. She had solved her problem "
        "not with strength, but with a clever idea, proving that thinking "
        "carefully can solve even a difficult problem.\n\n"
        "Chapter 3: Talking About Yesterday\n"
        "The simple past tense describes actions that have already happened. "
        "For many action words, we simply add -ed to the end. Walk becomes "
        "walked. Play becomes played. Jump becomes jumped. 'She walked to "
        "school yesterday.' tells us the walking already happened.\n\n"
        "Some action words change completely in the past tense instead of "
        "just adding -ed. Go becomes went. Eat becomes ate. See becomes saw. "
        "Run becomes ran. These are called irregular past tense words, and "
        "they must simply be remembered, since they do not follow the -ed "
        "rule.\n\n"
        "Combined with pronouns, past tense sentences look like this: 'She "
        "played in the park yesterday.' 'They walked to school this "
        "morning.' 'He ate an apple at lunch.' 'We saw a peacock at the "
        "zoo.'\n\n"
        "To ask a question about the past, we usually use 'did' along with "
        "the base form of the action word, not the -ed form. 'Did she play "
        "in the park?' not 'Did she played in the park?' The word did already "
        "shows that we are asking about the past.\n\n"
        "To make a past tense sentence negative, we use 'did not' or "
        "'didn't', again with the base form. 'She did not play in the "
        "park.' 'They didn't walk to school.' Practising both regular -ed "
        "words and irregular past tense words builds confidence in talking "
        "about things that already happened.\n\n"
        "Chapter 4: Painting a Picture With Words\n"
        "A descriptive sentence uses detail words to paint a clear picture in "
        "the reader's mind. Instead of writing 'The tree stood near the "
        "house.', a descriptive sentence might say 'The tall, green tree "
        "stood near the old red house.'\n\n"
        "To describe a person, we can mention their size, their clothes, or "
        "how they look. 'The tall boy wore a blue shirt and a wide smile.' "
        "gives us a much clearer picture than just 'The boy smiled.'\n\n"
        "To describe a place, we can mention its size, its colour, or what is "
        "happening there. 'The busy, noisy market was full of colourful "
        "fruit stalls.' tells us much more than just 'The market was "
        "busy.'\n\n"
        "To describe a thing, we can mention its size, shape, colour, or "
        "texture. 'The small, round, shiny red apple sat on the table.' uses "
        "four describing words — small, round, shiny, and red — to paint a "
        "very clear picture of the apple.\n\n"
        "Try building your own descriptive sentences: start with a simple "
        "sentence, like 'The bird sat on the branch.', and add describing "
        "words to make it richer: 'The tiny, blue bird sat quietly on the "
        "tall, leafy branch.' Adding careful detail words helps a reader "
        "truly picture what you are describing."
    ),
    4: (
        "Chapter 1: Opposites and Look-Alikes\n"
        "A synonym is a word with a similar meaning to another word. Big and "
        "huge are synonyms, because both mean great in size. An antonym is a "
        "word with the opposite meaning to another word. Big and small are "
        "antonyms, because they mean opposite things.\n\n"
        "Recognising synonyms helps us understand a passage even when we do "
        "not know every single word. If we read 'The enormous elephant "
        "walked slowly', and we already know that enormous means very big, "
        "we understand the sentence perfectly, even though enormous is a "
        "less common word than big.\n\n"
        "Recognising antonyms helps us understand contrast in a passage. "
        "'The weather was hot in summer but cold in winter.' uses the "
        "antonym pair hot and cold to show how the weather changes between "
        "two seasons.\n\n"
        "Here are more synonym and antonym pairs. Synonyms: happy and "
        "joyful, quick and swift, quiet and silent. Antonyms: happy and sad, "
        "quick and slow, quiet and noisy. Notice that a word can have both a "
        "synonym and an antonym — happy has joyful as a synonym and sad as "
        "an antonym.\n\n"
        "Building a bank of synonyms and antonyms makes our own writing "
        "richer too. Instead of writing 'happy' every single time, we could "
        "use joyful, glad, or cheerful. This avoids repeating the exact same "
        "word again and again in a piece of writing.\n\n"
        "Chapter 2: The Farmer and the Well\n"
        "A farmer named Gopal lived in a small village. He owned a field, "
        "but no well of his own, so every day he had to walk far to fetch "
        "water for his crops. This made his work slow and tiring.\n\n"
        "One year, a wealthy trader who lived nearby decided to sell his old "
        "well, since he was moving to the city. Gopal saved his money for "
        "many months and finally bought the well from the trader.\n\n"
        "The very next day, Gopal went to draw water from his new well, but "
        "the trader stopped him. 'I sold you the well,' said the trader, "
        "'but I did not sell you the water inside it. You must pay extra if "
        "you want to use the water.'\n\n"
        "Gopal was confused and upset. He did not know what to do, so he "
        "decided to go to the wise judge of the village and explain his "
        "problem. The judge listened carefully to both Gopal and the "
        "trader.\n\n"
        "After thinking for a moment, the judge said, 'If the water belongs "
        "to the trader and not the well, then the trader must remove his "
        "water from Gopal's well at once, since Gopal did not agree to store "
        "the trader's water for free.' The trader realised his trick had "
        "failed, and he quietly allowed Gopal to use the water freely from "
        "then on, ending the dispute fairly.\n\n"
        "Chapter 3: Describing With More Detail, and What Will Happen\n"
        "Adjectives are describing words that give us more detail about a "
        "noun. They are usually placed just before the noun they describe. "
        "'A kind grandmother' uses kind to describe grandmother. 'A "
        "colourful kite' uses colourful to describe kite.\n\n"
        "We can use more than one adjective before a single noun. 'A tall, "
        "kind, gentle grandmother' uses three adjectives — tall, kind, and "
        "gentle — to describe grandmother in more detail than just one "
        "adjective could.\n\n"
        "The simple future tense describes actions that have not happened "
        "yet. We form it using the word 'will' followed by the base action "
        "word. 'I will visit my grandmother tomorrow.' 'She will bake a cake "
        "this weekend.' 'They will travel to Delhi next month.'\n\n"
        "To ask a question in the future tense, we move 'will' before the "
        "naming word. 'Will you visit your grandmother tomorrow?' 'Will she "
        "bake a cake this weekend?' To make a future sentence negative, we "
        "use 'will not' or 'won't'. 'I will not go out today.' 'She won't "
        "finish the work today.'\n\n"
        "Adjectives and the future tense often appear together. 'I will buy "
        "a colourful kite tomorrow.' 'We will visit a beautiful garden this "
        "weekend.' Combining detailed describing words with future tense "
        "sentences lets us paint a clear picture of plans that have not "
        "happened yet.\n\n"
        "Chapter 4: Joining Sentences Together\n"
        "Two short sentences can be joined into one longer sentence using a "
        "joining word, called a conjunction. 'I like mangoes. I like "
        "bananas.' can be joined using and: 'I like mangoes and bananas.'\n\n"
        "The conjunction and joins two similar ideas together. 'Raju plays "
        "cricket. Raju plays football.' becomes 'Raju plays cricket and "
        "football.' The conjunction but joins two contrasting ideas. 'I "
        "wanted to go outside. It was raining.' becomes 'I wanted to go "
        "outside, but it was raining.'\n\n"
        "The conjunction because explains a reason for something. 'I stayed "
        "home. I was sick.' becomes 'I stayed home because I was sick.' "
        "Because always connects a result to its cause, telling us why "
        "something happened.\n\n"
        "The conjunction or shows a choice between two possibilities. 'You "
        "can have tea. You can have juice.' becomes 'You can have tea or "
        "juice.' Choosing the correct conjunction depends on how the two "
        "ideas are related to each other — similar, opposite, cause-and-"
        "effect, or a choice.\n\n"
        "Joining short sentences this way makes writing flow much better and "
        "avoids short, choppy sentences that feel disconnected. Try joining "
        "these: 'The sky was dark. It started to rain.' A good conjunction "
        "here would be and, since both events happened together in the same "
        "order: 'The sky was dark, and it started to rain.'"
    ),
    5: (
        "Chapter 1: Guessing Word Meaning from Context\n"
        "Sometimes we read a word we do not know, but we can still guess its "
        "meaning using the words and sentences around it. This is called "
        "understanding meaning from context. The surrounding sentence often "
        "gives hints, or clues, about what the unfamiliar word means.\n\n"
        "For example, in the sentence 'The parched land had not seen rain "
        "for months, and the cracked soil crumbled underfoot', the word "
        "parched can be guessed to mean very dry, because the sentence talks "
        "about no rain, cracked soil, and crumbling ground.\n\n"
        "Context clues can come in different forms. Sometimes the sentence "
        "explains the word directly, like 'The famished dog, having not "
        "eaten for two days, gulped down its food.' Here, 'having not eaten "
        "for two days' explains that famished means very hungry.\n\n"
        "Sometimes the context gives an example instead of a direct "
        "explanation. 'She felt drowsy after lunch — her eyes kept closing, "
        "and she struggled to stay awake in class.' The details about "
        "closing eyes and struggling to stay awake suggest that drowsy means "
        "sleepy.\n\n"
        "Sometimes the context shows a contrast using a word like 'but' or "
        "'although'. 'Although the joke was hilarious, he did not even "
        "smile.' Since he did not smile despite it being funny, hilarious "
        "likely means very funny. Practising this skill helps readers handle "
        "new, unfamiliar words confidently in any passage, without needing a "
        "dictionary every time.\n\n"
        "Chapter 2: The Old Banyan Tree\n"
        "At the edge of the village stood an old banyan tree, its branches "
        "spreading wide enough to shade the entire village square. Children "
        "gathered beneath it every evening, though none of them remembered "
        "exactly when the tree had first been planted.\n\n"
        "An old woman named Kamla sat under the tree every single day, "
        "resting on a worn wooden bench that seemed to fit her perfectly. "
        "She would watch the children play, sometimes smiling quietly to "
        "herself, but she rarely spoke to anyone who passed by.\n\n"
        "One evening, a new family moved into the village and their young "
        "son wandered curiously toward the tree. He noticed the initials 'K "
        "+ R' carved deep into the trunk, worn smooth by many years of "
        "weather.\n\n"
        "He asked Kamla about the carving. She paused for a long moment "
        "before answering softly, 'That was carved a very long time ago, "
        "when this tree was still young and thin enough for two people to "
        "reach their arms around it together.' Her eyes drifted toward the "
        "empty space beside her on the bench.\n\n"
        "The boy did not fully understand her answer, but something about "
        "the way she touched the initials gently, and the way her gaze "
        "lingered on the empty seat beside her, made him feel that the tree "
        "held a memory far more important to her than she was saying "
        "aloud.\n\n"
        "Chapter 3: Mixing Time - Past, Present, and Future Together\n"
        "A single passage does not always stay in one tense. Often, we "
        "describe something that already happened, something happening "
        "right now, and something that will happen soon, all within the "
        "same few sentences.\n\n"
        "For example: 'She finished her homework an hour ago, is watching "
        "television now, and will go to sleep soon.' This sentence uses "
        "finished (simple past), is watching (present continuous), and will "
        "go (simple future) all together, because each part describes a "
        "different point in time.\n\n"
        "Conjunctions help connect these different time ideas smoothly. And "
        "simply joins two actions together: 'He ate his lunch and started "
        "his homework.' But shows a contrast: 'She wanted to play, but she "
        "had to finish her chores first.'\n\n"
        "So shows a result: 'It started raining, so we came back inside.' "
        "Because explains a reason: 'We came back inside because it started "
        "raining.' Choosing the right conjunction depends on exactly how the "
        "two time-related ideas connect to each other.\n\n"
        "Reading and writing sentences with mixed tenses takes practice, "
        "since it is easy to accidentally switch tense without meaning to. A "
        "helpful check is to ask: did this already happen, is it happening "
        "right now, or will it happen later? Answering that question for "
        "each part of the sentence helps us choose the correct tense every "
        "time.\n\n"
        "Chapter 4: Sentences with More Than One Idea\n"
        "A complex sentence joins one main idea with an extra, connected "
        "idea using a joining word such as because, although, when, or if. "
        "'She was late because the bus broke down.' has a main idea (she was "
        "late) and a reason (the bus broke down), joined by because.\n\n"
        "The word although introduces a surprising contrast. 'Although it "
        "was raining heavily, the match continued.' tells us something "
        "unexpected happened despite the rain. The word when tells us about "
        "timing. 'When the bell rang, all the students ran outside.' tells "
        "us exactly when the students ran.\n\n"
        "The word if introduces a condition. 'If it rains tomorrow, we will "
        "stay indoors.' tells us that staying indoors depends on whether it "
        "rains. Complex sentences let a writer explain reasons, conditions, "
        "contrasts, or timing, instead of stating only separate simple "
        "facts.\n\n"
        "A complex sentence can be written with the extra clause first or "
        "last, and the meaning stays the same. 'Because the bus broke down, "
        "she was late.' means exactly the same as 'She was late because the "
        "bus broke down.' Notice that when the extra clause comes first, we "
        "usually add a comma after it.\n\n"
        "Try building your own complex sentences: combine two simple ideas, "
        "like 'The power went out.' and 'We lit some candles.', using a "
        "joining word: 'Because the power went out, we lit some candles.' "
        "Practising this makes our writing sound more mature and connected, "
        "instead of a string of short, separate sentences."
    ),
}


async def _fetch_english_book_ids() -> dict[int, uuid.UUID]:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(NCERTBook).where(NCERTBook.subject == "English"))
        return {b.class_number: b.id for b in result.scalars().all()}


async def main() -> None:
    book_ids = await _fetch_english_book_ids()
    print(f"Found NCERTBook rows for English classes: {sorted(book_ids.keys())}")

    async with AsyncSessionFactory() as session:
        result = await session.execute(
            delete(DocumentChunk).where(
                DocumentChunk.branch_name == "SELF",
                DocumentChunk.subject == "English",
            )
        )
        await session.commit()
        print(f"Deleted {result.rowcount} existing English SELF document_chunk row(s).")

    total_chunks = 0
    for class_number in sorted(CHAPTER_TEXT.keys()):
        full_text = CHAPTER_TEXT[class_number]
        chunks = extract_chapters_and_chunks(
            full_text, default_module_title=f"English Class {class_number}"
        )
        book_id = book_ids.get(class_number)

        async with AsyncSessionFactory() as session:
            for c in chunks:
                session.add(
                    DocumentChunk(
                        branch_name="SELF",
                        class_number=class_number,
                        subject="English",
                        chapter_number=c["chapter_number"],
                        chapter_title=c["chapter_title"],
                        chunk_index=c["chunk_index"],
                        content=c["content"],
                        token_count=c["token_count"],
                        char_count=c["char_count"],
                        start_char=c["start_char"],
                        end_char=c["end_char"],
                        embedding=json.dumps(c["embedding"]),
                        ncert_book_id=book_id,
                        module_id=None,
                    )
                )
            await session.commit()

        chapters = sorted(set(c["chapter_number"] for c in chunks))
        print(f"Class {class_number}: {len(chunks)} chunk(s) across {len(chapters)} "
              f"chapter(s) {chapters} (ncert_book_id={book_id})")
        total_chunks += len(chunks)

    print(f"\nDone. Total document_chunk rows inserted: {total_chunks}.")


if __name__ == "__main__":
    asyncio.run(main())
