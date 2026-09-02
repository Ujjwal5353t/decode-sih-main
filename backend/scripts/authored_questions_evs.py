"""
One-off script — authors an original, hand-written MCQ bank for every EVS
Topic (Class 3-5) and loads it into the `questions` table, replacing the
previous EVS bank (LLM-generated + template:v1) with questions grounded
directly in the new authored chapter content from
`scripts/authored_content_evs.py`.

Every question below is original, self-written content, directly traceable
to a specific paragraph/fact in that chapter content. Distractors are
hand-picked per question so that no distractor, if substituted into the
question, would also be a true statement — the same discipline
`src/ai/evs_fact_bank.py`'s docstring describes for its cloze-question
design.

Usage (from backend/):
    uv run python scripts/authored_questions_evs.py --dry-run
    uv run python scripts/authored_questions_evs.py
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

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.database import AsyncSessionFactory
from src.models.quiz import Question, Topic

# ═════════════════════════════════════════════════════════════════════════
# Question data, grouped by topic_code. Each entry is a dict with keys:
#   question_text, options (4), correct_option_index, explanation,
#   and optionally image_asset_key (exact ALL_ASSET_KEYS member) — never
#   both image_asset_key and image_emoji; not used here for simplicity, all
#   images use the curated asset vocabulary directly.
# ═════════════════════════════════════════════════════════════════════════

QUESTIONS_BY_TOPIC: dict[str, list[dict]] = {

    # ── Class 3 ─────────────────────────────────────────────────────────
    "EVS3_FAMILY": [
        {
            "question_text": "What do we call a mother's brother?",
            "options": ["Neighbour", "Maama", "Teacher", "Postman"],
            "correct_option_index": 1,
            "explanation": "A mother's brother is called a maama, another word for uncle.",
        },
        {
            "question_text": "A family made up of parents and their children living together is called a ____ family.",
            "options": ["joint", "distant", "nuclear", "visiting"],
            "correct_option_index": 2,
            "explanation": "A nuclear family usually has parents and their children living together.",
        },
        {
            "question_text": "Who usually lives together in a joint family, besides parents and children?",
            "options": ["Grandparents, uncles, aunts, and cousins", "Only classmates", "Only neighbours", "Only shopkeepers"],
            "correct_option_index": 0,
            "explanation": "A joint family may include grandparents, uncles, aunts, and cousins living together or close by.",
        },
        {
            "question_text": "Who is your father's mother to you?",
            "options": ["Aunt", "Cousin", "Maama", "Grandmother"],
            "correct_option_index": 3,
            "explanation": "A father's mother or a mother's mother is our grandmother.",
        },
        {
            "question_text": "Drawing a simple ____ helps us see how everyone in a family is connected.",
            "options": ["shopping list", "family tree", "school timetable", "weather chart"],
            "correct_option_index": 1,
            "explanation": "Drawing a simple family tree helps us see how everyone is connected.",
        },
        {
            "question_text": "Why do families celebrate festivals and birthdays together?",
            "options": ["To finish homework faster", "To avoid each other", "To create happy memories that keep them connected", "To save money on food"],
            "correct_option_index": 2,
            "explanation": "Celebrations create memories that are treasured for years and keep family members connected.",
        },
        {
            "question_text": "If a parent must travel far away for work, what can help the family stay close?",
            "options": ["Phone calls, letters, and visits", "Never speaking again", "Moving to a new school every month", "Forgetting about them"],
            "correct_option_index": 0,
            "explanation": "Phone calls, letters, and visits help a family stay close in heart, even when apart in distance.",
        },
        {
            "question_text": "Which of these statements about families is true?",
            "options": ["Every family must have exactly four members", "Only families in villages are real families", "Families can be different sizes, and that is normal", "Joint families are always better than nuclear families"],
            "correct_option_index": 2,
            "explanation": "Not every family looks the same, and that is completely normal.",
        },
        {
            "question_text": "Which of these is a responsibility that family members might share?",
            "options": ["Only playing games all day", "Cooking, earning money, or caring for younger children", "Only sleeping all day", "Ignoring each other's needs"],
            "correct_option_index": 1,
            "explanation": "Some family members cook, some earn money, some care for younger children or elderly grandparents.",
        },
        {
            "question_text": "What does a family usually give the people in it?",
            "options": ["Strict rules and nothing else", "Only money", "Love, food, shelter, and support", "Nothing important"],
            "correct_option_index": 2,
            "explanation": "Families give us love, food, shelter, and support when we need it most.",
        },
    ],

    "EVS3_BODY_HEALTH": [
        {
            "question_text": "Which body part lets us hear sounds?",
            "options": ["Eyes", "Ears", "Hands", "Legs"],
            "correct_option_index": 1,
            "explanation": "Ears let us hear sounds.",
        },
        {
            "question_text": "How many times a day should we brush our teeth, at least?",
            "options": ["Once", "Twice", "Four times", "Never"],
            "correct_option_index": 1,
            "explanation": "We should brush our teeth at least twice a day.",
        },
        {
            "question_text": "When should we wash our hands with soap?",
            "options": ["Only once a week", "Before meals and after using the toilet", "Only after playing outside", "Only before sleeping"],
            "correct_option_index": 1,
            "explanation": "We should wash our hands with soap before every meal and after using the toilet.",
        },
        {
            "question_text": "Which sense organ helps us smell things?",
            "options": ["Tongue", "Skin", "Nose", "Ears"],
            "correct_option_index": 2,
            "explanation": "The nose is the sense organ that helps us smell things.",
        },
        {
            "question_text": "Why should we never look directly at the sun?",
            "options": ["It can harm our eyes", "It makes us hungry", "It makes us sleepy", "It has no effect at all"],
            "correct_option_index": 0,
            "explanation": "Protecting our senses matters — we should never look directly at the sun.",
            "image_asset_key": "sun",
        },
        {
            "question_text": "Eating a mix of vegetables, fruits, grains, and ____ gives our body energy and strength.",
            "options": ["sand", "milk", "plastic", "smoke"],
            "correct_option_index": 1,
            "explanation": "Eating a mix of vegetables, fruits, grains, and milk gives our body the energy it needs to grow.",
            "image_asset_key": "milk",
        },
        {
            "question_text": "What helps our muscles and heart grow strong?",
            "options": ["Sitting still all day", "Playing outdoors and exercising", "Skipping meals", "Staying indoors with no movement"],
            "correct_option_index": 1,
            "explanation": "Playing outdoors, running, and exercising keep our muscles and heart strong.",
        },
        {
            "question_text": "What does enough sleep every night help our body do?",
            "options": ["Nothing at all", "Repair itself and remember what we learned", "Grow taller only", "Stop breathing"],
            "correct_option_index": 1,
            "explanation": "Enough sleep lets our body repair itself and helps our brain remember what we learned.",
        },
        {
            "question_text": "What do vaccinations given by doctors do?",
            "options": ["Make us sick on purpose", "Protect us from several diseases before we catch them", "Replace the need for food", "Make us taller instantly"],
            "correct_option_index": 1,
            "explanation": "Vaccinations protect us from several serious diseases before we even catch them.",
        },
        {
            "question_text": "Which of these is a good daily hygiene habit?",
            "options": ["Wearing the same clothes for a week", "Bathing daily and wearing clean clothes", "Never washing hands", "Avoiding brushing teeth"],
            "correct_option_index": 1,
            "explanation": "We should bathe every day and wear clean clothes to stop germs from spreading.",
        },
    ],

    "EVS3_PLANTS": [
        {
            "question_text": "Which part of a plant holds it in the soil and absorbs water?",
            "options": ["Leaves", "Flowers", "Roots", "Fruits"],
            "correct_option_index": 2,
            "explanation": "Roots hold the plant in the soil and absorb water and nutrients.",
        },
        {
            "question_text": "Which part of the plant makes food using sunlight?",
            "options": ["Roots", "Stem", "Leaves", "Seeds"],
            "correct_option_index": 2,
            "explanation": "Leaves use sunlight, water, and air to make food for the plant.",
            "image_asset_key": "leaf",
        },
        {
            "question_text": "What job does the stem do for a plant?",
            "options": ["It supports the plant and carries water and food", "It makes flowers bloom instantly", "It absorbs sunlight only", "It has no job at all"],
            "correct_option_index": 0,
            "explanation": "The stem supports the plant and carries water and food between the roots and leaves.",
        },
        {
            "question_text": "Which of these is an example of a herb?",
            "options": ["Mango tree", "Banyan tree", "Coriander", "Rose bush"],
            "correct_option_index": 2,
            "explanation": "Herbs are small, soft-stemmed plants like coriander and mint.",
        },
        {
            "question_text": "A plant with one thick, hard, woody stem, like a mango tree, is called a ____.",
            "options": ["shrub", "herb", "tree", "creeper"],
            "correct_option_index": 2,
            "explanation": "Trees are the tallest plants, with one thick, hard, woody stem called a trunk.",
            "image_asset_key": "tree",
        },
        {
            "question_text": "Which of these plants uses other plants or structures to climb as it grows?",
            "options": ["Rose bush", "Money plant", "Mango tree", "Coriander"],
            "correct_option_index": 1,
            "explanation": "Climbers and creepers, like a money plant, use other plants or structures for support as they grow.",
        },
        {
            "question_text": "What grows inside a fruit that can become a new plant?",
            "options": ["Seeds", "Leaves", "Roots", "Bark"],
            "correct_option_index": 0,
            "explanation": "Flowers turn into fruits containing seeds, and a new plant can grow from a seed.",
        },
        {
            "question_text": "What gas do plants release that we need to breathe?",
            "options": ["Carbon dioxide", "Oxygen", "Smoke", "Steam"],
            "correct_option_index": 1,
            "explanation": "Leaves make food using sunlight, water, and air, in a process that also releases the oxygen we breathe.",
        },
        {
            "question_text": "Besides food, what else do plants give us?",
            "options": ["Shade, wood, and medicines", "Only noise", "Only dust", "Nothing useful"],
            "correct_option_index": 0,
            "explanation": "Plants give us shade on a hot day, wood for furniture, and medicines made from leaves, bark, or roots.",
        },
        {
            "question_text": "What does a plant need to grow from a seed?",
            "options": ["Water, air, and sunlight", "Only darkness", "Only sand", "Only cold weather"],
            "correct_option_index": 0,
            "explanation": "A new plant can grow from a seed if it gets enough water, air, and sunlight.",
        },
    ],

    "EVS3_WATER": [
        {
            "question_text": "Which of these is a natural source of water?",
            "options": ["A river", "A television", "A bicycle", "A book"],
            "correct_option_index": 0,
            "explanation": "Rivers are one of the natural sources water comes from.",
            "image_asset_key": "river",
        },
        {
            "question_text": "Why is water from a river or pond usually boiled or filtered before drinking?",
            "options": ["To make it taste sweet", "To remove germs and dirt", "To make it colder", "To make it disappear"],
            "correct_option_index": 1,
            "explanation": "Water from rivers and ponds can carry germs and dirt, so it is boiled or filtered to make it safe.",
        },
        {
            "question_text": "Why can't we drink water straight from the sea?",
            "options": ["It is too cold", "It is salty", "It is too clear", "It has no taste"],
            "correct_option_index": 1,
            "explanation": "Seawater is salty and cannot be used for drinking without special, expensive treatment.",
        },
        {
            "question_text": "Which daily habit helps save water?",
            "options": ["Leaving the tap running while brushing teeth", "Turning off the tap while brushing teeth", "Never fixing leaking pipes", "Wasting water on purpose"],
            "correct_option_index": 1,
            "explanation": "Turning off the tap while brushing our teeth helps save water.",
        },
        {
            "question_text": "What is rainwater harvesting?",
            "options": ["Wasting rainwater on purpose", "Collecting and storing rainwater for later use", "Drinking seawater", "Cutting down trees"],
            "correct_option_index": 1,
            "explanation": "Rainwater harvesting is collecting and storing rainwater during the rainy season for drier months.",
            "image_asset_key": "rain",
        },
        {
            "question_text": "Which of these do people use water for?",
            "options": ["Drinking, cooking, and washing", "Only for decoration", "Only for burning", "Nothing at all"],
            "correct_option_index": 0,
            "explanation": "We use water for drinking, cooking, bathing, washing, and watering crops.",
        },
        {
            "question_text": "Where might underground water be reached from?",
            "options": ["A well or borewell", "A cloud", "A kite", "A rooftop"],
            "correct_option_index": 0,
            "explanation": "Wells and borewells reach underground water.",
        },
        {
            "question_text": "Why should water never be wasted?",
            "options": ["Because many villages and towns do not have enough of it", "Because it costs nothing", "Because there is unlimited water everywhere", "Because it never runs out"],
            "correct_option_index": 0,
            "explanation": "Water should never be wasted, because many villages and towns already do not have enough of it.",
        },
        {
            "question_text": "Which of these is generally safer to drink without extra treatment?",
            "options": ["Pond water straight from the pond", "River water straight from the river", "Water from a treated tap or sealed bottle", "Well water straight from the well"],
            "correct_option_index": 2,
            "explanation": "Water straight from a treated tap or a sealed bottle is generally safer to drink without extra treatment.",
        },
        {
            "question_text": "Besides rivers and rain, which of these is also a natural source of water?",
            "options": ["A lake", "A pencil", "A chair", "A kite"],
            "correct_option_index": 0,
            "explanation": "Lakes and ponds are natural sources of water, along with rivers, rain, and wells.",
        },
    ],

    # ── Class 4 (EVS4_NUTRITION and EVS4_WATER_CYCLE close the documented gap) ──
    "EVS4_NUTRITION": [
        {
            "question_text": "Which of these is an energy-giving food?",
            "options": ["Rice", "Fish", "Spinach", "Orange"],
            "correct_option_index": 0,
            "explanation": "Energy-giving foods like rice, wheat, oil, and sugar power our muscles and keep us active.",
        },
        {
            "question_text": "Which of these is a body-building food?",
            "options": ["Milk", "Mango", "Carrot", "Sugar"],
            "correct_option_index": 0,
            "explanation": "Body-building foods like milk, pulses, eggs, and meat help build and repair muscles and bones.",
            "image_asset_key": "milk",
        },
        {
            "question_text": "Fruits and vegetables are called ____ foods because they help fight illness.",
            "options": ["energy-giving", "body-building", "protective", "junk"],
            "correct_option_index": 2,
            "explanation": "Protective foods, mainly fruits and vegetables, help our body fight off illness and stay strong.",
        },
        {
            "question_text": "What does a balanced diet mean?",
            "options": ["Eating only your favourite food every day", "Eating a little from each food group every day", "Eating only sweets and fried food", "Skipping meals often"],
            "correct_option_index": 1,
            "explanation": "A balanced diet means eating a little from each food group every day.",
        },
        {
            "question_text": "What can happen if a child eats far too little food or food with no variety?",
            "options": ["Nothing happens at all", "Malnutrition, becoming weak or underweight", "The child grows extra strong instantly", "The child never gets hungry again"],
            "correct_option_index": 1,
            "explanation": "Eating far too little food, or food that lacks variety, is called malnutrition and can make a child weak or underweight.",
        },
        {
            "question_text": "Which meal shows a balanced mix of food groups?",
            "options": ["Only sugary snacks all day", "Roti with dal and sabzi", "Only fried chips", "Only cold drinks"],
            "correct_option_index": 1,
            "explanation": "A meal like roti with dal and sabzi includes energy-giving, body-building, and protective foods together.",
        },
        {
            "question_text": "Why should fruits and vegetables be washed before eating?",
            "options": ["To make them taste different", "To remove dirt and germs", "To make them heavier", "To change their colour"],
            "correct_option_index": 1,
            "explanation": "Washing fruits and vegetables before eating helps prevent stomach illness.",
            "image_asset_key": "tomato",
        },
        {
            "question_text": "Meals like rice with sambar in the south and roti with sabzi in the north show that ____.",
            "options": ["only one kind of meal is healthy", "Indian meals across regions can all be balanced", "balanced meals are impossible in India", "only northern food is nutritious"],
            "correct_option_index": 1,
            "explanation": "Whatever the style of cooking, a meal is balanced as long as it includes a mix of food groups.",
        },
        {
            "question_text": "Why do we need food at all?",
            "options": ["Only to feel full", "For energy, growth, and repair of the body", "Only for taste", "It has no real purpose"],
            "correct_option_index": 1,
            "explanation": "Our body needs food for energy, to grow, and to repair itself.",
        },
        {
            "question_text": "Which habit helps keep food safe to eat?",
            "options": ["Leaving cooked food uncovered for insects", "Covering cooked food and drinking clean water with meals", "Never washing vegetables", "Eating food that has been left out for days"],
            "correct_option_index": 1,
            "explanation": "Covering cooked food and drinking clean, safe water with meals helps prevent stomach illness.",
        },
    ],

    "EVS4_HABITATS": [
        {
            "question_text": "What is a habitat?",
            "options": ["A type of food", "The natural home of a plant or animal", "A kind of vehicle", "A festival"],
            "correct_option_index": 1,
            "explanation": "A habitat is the natural home of a plant or animal, giving it food, shelter, and safety.",
        },
        {
            "question_text": "Which body feature helps a camel survive in the desert?",
            "options": ["Gills for breathing underwater", "A hump that stores fat and broad feet", "Thick fur for cold weather", "Webbed feet for swimming"],
            "correct_option_index": 1,
            "explanation": "A camel has a hump that stores fat for energy and broad feet that do not sink into sand.",
        },
        {
            "question_text": "What helps a fish breathe underwater?",
            "options": ["Lungs", "Gills", "A hump", "Fur"],
            "correct_option_index": 1,
            "explanation": "A fish has gills to breathe underwater.",
            "image_asset_key": "fish",
        },
        {
            "question_text": "Which animal is adapted to survive in very cold, icy regions with thick fur and a layer of fat?",
            "options": ["Camel", "Polar bear", "Elephant", "Rabbit"],
            "correct_option_index": 1,
            "explanation": "An animal like a polar bear has thick fur and a layer of fat to trap body heat in freezing cold regions.",
        },
        {
            "question_text": "Animals that give birth to live young, like elephants, dogs, and cows, are called ____.",
            "options": ["oviparous", "viviparous", "aquatic", "migratory"],
            "correct_option_index": 1,
            "explanation": "Animals like elephants, dogs, and cows, whose skin has hair, give birth to live young; these are called viviparous animals.",
        },
        {
            "question_text": "Animals that mostly hatch from eggs, like birds, frogs, and snakes, are called ____.",
            "options": ["viviparous", "oviparous", "carnivorous", "nocturnal"],
            "correct_option_index": 1,
            "explanation": "Animals like birds, frogs, and snakes mostly hatch from eggs laid outside the body; these are called oviparous animals.",
        },
        {
            "question_text": "About how much do adult elephants eat of leaves and twigs in one day?",
            "options": ["More than 100 kilograms", "Less than 1 kilogram", "Exactly 5 kilograms", "They do not eat leaves at all"],
            "correct_option_index": 0,
            "explanation": "An adult elephant eats more than 100 kilograms of leaves and twigs in a single day.",
            "image_asset_key": "elephant",
        },
        {
            "question_text": "Who usually leads an elephant herd?",
            "options": ["The youngest calf", "The oldest and most experienced female", "A male elephant that just joined", "No one leads the herd"],
            "correct_option_index": 1,
            "explanation": "Elephant herds are led by the oldest and most experienced female.",
        },
        {
            "question_text": "What happens to animals when forests are cut down or water bodies are polluted?",
            "options": ["Nothing changes for them", "They lose their habitat and struggle to find food and shelter", "They automatically move to a better habitat", "They no longer need food"],
            "correct_option_index": 1,
            "explanation": "When forests are cut down or water is polluted, animals lose the habitat that keeps them alive.",
        },
        {
            "question_text": "Why are the Bishnoi villagers of Khejadli remembered?",
            "options": ["For building the tallest building in India", "For protecting trees even at great personal cost", "For inventing the bicycle", "For discovering a new river"],
            "correct_option_index": 1,
            "explanation": "The Bishnoi villagers of Khejadli sacrificed their lives to stop trees being cut down, protecting nature.",
        },
    ],

    "EVS4_WATER_CYCLE": [
        {
            "question_text": "What is the process called when the sun's heat turns water into vapour?",
            "options": ["Condensation", "Evaporation", "Precipitation", "Runoff"],
            "correct_option_index": 1,
            "explanation": "Evaporation is the process where the sun's heat turns water into invisible water vapour.",
            "image_asset_key": "sun",
        },
        {
            "question_text": "What happens to water vapour as it rises and cools in the sky?",
            "options": ["It disappears completely", "It condenses into tiny water droplets", "It turns into ice permanently", "It turns into sunlight"],
            "correct_option_index": 1,
            "explanation": "As water vapour rises and cools, it condenses into tiny droplets that form clouds.",
            "image_asset_key": "cloud",
        },
        {
            "question_text": "What do we call water falling back to Earth as rain, snow, or hail?",
            "options": ["Evaporation", "Condensation", "Precipitation", "Pollution"],
            "correct_option_index": 2,
            "explanation": "Precipitation is water falling back to Earth as rain, snow, or hail.",
            "image_asset_key": "rain",
        },
        {
            "question_text": "What is it called when fallen water flows over land into rivers and the ocean?",
            "options": ["Runoff", "Evaporation", "Condensation", "Absorption"],
            "correct_option_index": 0,
            "explanation": "Runoff is when fallen water flows over the land into rivers, lakes, and eventually back to the ocean.",
            "image_asset_key": "river",
        },
        {
            "question_text": "Besides flowing into rivers, where else can fallen water go?",
            "options": ["It disappears forever", "It soaks into the soil and refills groundwater", "It turns into rock", "It stops the water cycle completely"],
            "correct_option_index": 1,
            "explanation": "Some fallen water soaks into the soil, refilling the underground water that feeds wells and springs.",
        },
        {
            "question_text": "Why does the water cycle matter for Indian farmers?",
            "options": ["It has nothing to do with farming", "Monsoon rains from the water cycle help grow crops", "It only affects fishing", "It stops crops from growing"],
            "correct_option_index": 1,
            "explanation": "The water cycle shapes weather and seasons, including the monsoon rains that Indian farmers rely on.",
        },
        {
            "question_text": "What can happen when forests are cut down and land is covered with concrete?",
            "options": ["More water soaks into the ground", "Less water soaks into the ground, causing more flooding", "The water cycle speeds up perfectly", "Rain stops completely"],
            "correct_option_index": 1,
            "explanation": "Less rainwater can soak into covered or deforested ground, which can cause more flooding after heavy rain.",
        },
        {
            "question_text": "Where does the water cycle usually begin when we describe it?",
            "options": ["In a book", "At the ocean or a river, with evaporation", "At school", "Underground only"],
            "correct_option_index": 1,
            "explanation": "It is easiest to understand the water cycle by starting at the ocean or a river, where evaporation begins.",
        },
        {
            "question_text": "What forms when millions of tiny water droplets gather around dust in the sky?",
            "options": ["Rivers", "Clouds", "Wells", "Oceans"],
            "correct_option_index": 1,
            "explanation": "Millions of tiny droplets gather together around specks of dust, forming clouds.",
        },
        {
            "question_text": "Does the water cycle ever stop?",
            "options": ["Yes, once a year", "No, it repeats endlessly between sky, land, and sea", "Yes, only during summer", "No, it happens once and never again"],
            "correct_option_index": 1,
            "explanation": "The water cycle repeats endlessly, with no real beginning or end.",
        },
    ],

    "EVS4_TRANSPORT_COMM": [
        {
            "question_text": "Which of these is an example of water transport?",
            "options": ["A bicycle", "A boat", "A camel cart", "A bus"],
            "correct_option_index": 1,
            "explanation": "Boats, like the vallam used in Kerala's backwaters, are a form of water transport.",
            "image_asset_key": "boat",
        },
        {
            "question_text": "How do children in parts of Ladakh sometimes cross a wide river to reach school?",
            "options": ["By swimming", "Using a trolley attached to a strong rope", "By airplane", "By camel"],
            "correct_option_index": 1,
            "explanation": "In parts of Ladakh, children cross a wide river using a trolley attached to a strong rope.",
        },
        {
            "question_text": "Which mode of transport is fastest for reaching a remote area during an emergency?",
            "options": ["A bullock cart", "Walking", "An airplane or helicopter", "A bicycle"],
            "correct_option_index": 2,
            "explanation": "Air transport, using airplanes and helicopters, is the fastest way to reach a remote area quickly.",
        },
        {
            "question_text": "In the past, how did people mostly send messages over long distances?",
            "options": ["Mobile phones", "Video calls", "Messengers and handwritten letters", "The internet"],
            "correct_option_index": 2,
            "explanation": "In the past, people relied on messengers and handwritten letters carried over long distances.",
        },
        {
            "question_text": "Which of these lets people talk and see each other instantly across long distances today?",
            "options": ["A telegraph", "A video call", "A handwritten letter", "A messenger on foot"],
            "correct_option_index": 1,
            "explanation": "Today, video calls let people communicate almost instantly, even seeing each other in real time.",
        },
        {
            "question_text": "Why is quick communication especially valuable during emergencies?",
            "options": ["It has no real benefit", "Calling for help quickly can save lives", "It only wastes time", "It is not needed at all"],
            "correct_option_index": 1,
            "explanation": "Instant communication is especially valuable during emergencies, when calling for help quickly can save lives.",
        },
        {
            "question_text": "Which vehicle would most likely be used to cross hot desert sand?",
            "options": ["A camel cart", "A ferry", "A ship", "A trolley over a river"],
            "correct_option_index": 0,
            "explanation": "In Rajasthan's desert, children may travel by camel cart across hot sand.",
        },
        {
            "question_text": "What was the telegraph mainly used for?",
            "options": ["Sending short coded messages quickly over wires", "Cooking food", "Growing crops", "Filtering water"],
            "correct_option_index": 0,
            "explanation": "The telegraph could send short coded messages quickly over wires.",
        },
        {
            "question_text": "Which of these best describes communication?",
            "options": ["Moving goods from one place to another", "Sharing news, messages, and information with others", "Growing food for a family", "Building roads and bridges"],
            "correct_option_index": 1,
            "explanation": "Communication means sharing news, messages, and information with others.",
        },
        {
            "question_text": "Why do communities near rivers and backwaters often depend on boats?",
            "options": ["Because boats are decorative only", "Because roads cannot easily reach some places boats can", "Because boats are faster than airplanes", "Because boats never need water"],
            "correct_option_index": 1,
            "explanation": "Where rivers, lakes, backwaters, or the sea connect places, boats carry people where roads cannot easily reach.",
        },
    ],

    # ── Class 5 ─────────────────────────────────────────────────────────
    "EVS5_BODY_SYSTEMS": [
        {
            "question_text": "Which system breaks down the food we eat so the body can use it?",
            "options": ["Respiratory system", "Digestive system", "Circulatory system", "Nervous system"],
            "correct_option_index": 1,
            "explanation": "The digestive system breaks down the food we eat so our body can use it for energy and growth.",
        },
        {
            "question_text": "Where does digestion begin?",
            "options": ["In the stomach", "In the intestines", "In the mouth", "In the lungs"],
            "correct_option_index": 2,
            "explanation": "Digestion begins in the mouth, where teeth chew food and saliva starts breaking it down.",
        },
        {
            "question_text": "Which organs absorb the nutrients our body needs from digested food?",
            "options": ["The lungs", "The small and large intestines", "The heart", "The nose"],
            "correct_option_index": 1,
            "explanation": "The small and large intestines absorb the nutrients our body needs and pass out what is left as waste.",
        },
        {
            "question_text": "What does the respiratory system bring into our body?",
            "options": ["Water", "Oxygen", "Blood", "Food"],
            "correct_option_index": 1,
            "explanation": "The respiratory system brings oxygen into our body every time we breathe.",
        },
        {
            "question_text": "Which organ pumps blood through the body?",
            "options": ["The lungs", "The stomach", "The heart", "The intestines"],
            "correct_option_index": 2,
            "explanation": "The heart is a powerful muscle that beats continuously, pumping blood through the body.",
        },
        {
            "question_text": "What does blood carry to every part of the body?",
            "options": ["Only waste products", "Oxygen and nutrients", "Only air", "Nothing important"],
            "correct_option_index": 1,
            "explanation": "Blood carries oxygen (from the lungs) and nutrients (from digested food) to every part of the body.",
        },
        {
            "question_text": "Why does our breathing rate increase when we run?",
            "options": ["Because our muscles need extra oxygen", "Because the lungs stop working", "Because we no longer need air", "Because running slows down digestion"],
            "correct_option_index": 0,
            "explanation": "Our breathing rate increases automatically when we run, because our muscles need extra oxygen.",
        },
        {
            "question_text": "Which habit helps keep our digestive, respiratory, and circulatory systems healthy?",
            "options": ["Skipping meals often", "Eating a balanced diet and exercising regularly", "Avoiding all exercise", "Breathing polluted smoke often"],
            "correct_option_index": 1,
            "explanation": "Eating a balanced diet, exercising regularly, and avoiding smoke help protect our body systems.",
        },
        {
            "question_text": "What waste gas does the respiratory system remove from the body?",
            "options": ["Oxygen", "Carbon dioxide", "Nitrogen", "Water vapour only"],
            "correct_option_index": 1,
            "explanation": "The respiratory system removes carbon dioxide, a waste gas, every time we breathe.",
        },
        {
            "question_text": "Why do our body systems depend on each other?",
            "options": ["They do not depend on each other at all", "Because blood carries oxygen and nutrients that other systems provide", "Because only one system works at a time", "Because the body only needs one system to survive"],
            "correct_option_index": 1,
            "explanation": "The digestive, respiratory, and circulatory systems depend on each other closely, since blood carries what the other two systems supply.",
        },
    ],

    "EVS5_RESOURCES": [
        {
            "question_text": "Which of these is a renewable resource?",
            "options": ["Coal", "Petroleum", "Sunlight", "Natural gas"],
            "correct_option_index": 2,
            "explanation": "Sunlight is a renewable resource because nature keeps replenishing it.",
            "image_asset_key": "sun",
        },
        {
            "question_text": "Which of these is a non-renewable resource?",
            "options": ["Wind", "Sunlight", "Coal", "Rainwater"],
            "correct_option_index": 2,
            "explanation": "Coal is non-renewable; it took millions of years to form and cannot be quickly replaced.",
        },
        {
            "question_text": "Why are coal and petroleum called non-renewable resources?",
            "options": ["Because they are found everywhere", "Because they took millions of years to form and will run out if overused", "Because they replenish every year", "Because they have no real use"],
            "correct_option_index": 1,
            "explanation": "Non-renewable resources took millions of years to form and cannot be replaced quickly if overused.",
        },
        {
            "question_text": "Can forests be a renewable resource?",
            "options": ["No, never", "Yes, if new trees are planted to replace cut ones", "Only in deserts", "Only if they are never used"],
            "correct_option_index": 1,
            "explanation": "Forests can be renewable if new trees are planted to replace the ones that are cut down.",
        },
        {
            "question_text": "What does conservation mean?",
            "options": ["Using resources wisely so they last for future generations", "Using as much as possible right away", "Never using any resources at all", "Throwing resources away"],
            "correct_option_index": 0,
            "explanation": "Conservation means using resources wisely so that they last for future generations too.",
        },
        {
            "question_text": "Which of these is a good conservation habit?",
            "options": ["Leaving lights and fans on when not needed", "Switching off lights and fans when not needed", "Wasting water on purpose", "Cutting down trees for no reason"],
            "correct_option_index": 1,
            "explanation": "Switching off lights and fans when not needed helps conserve electricity, most of which comes from non-renewable coal.",
        },
        {
            "question_text": "What does the idea of 'reduce-reuse-recycle' encourage?",
            "options": ["Buying and throwing away more things", "Using resources wisely instead of wasting them", "Ignoring waste completely", "Burning all waste"],
            "correct_option_index": 1,
            "explanation": "Following reduce-reuse-recycle for the things we buy and throw away is a conservation habit.",
        },
        {
            "question_text": "Why does using public transport or cycling help conserve resources?",
            "options": ["It uses less fuel than many private vehicles", "It uses unlimited fuel", "It has no effect on resources", "It wastes more petroleum"],
            "correct_option_index": 0,
            "explanation": "Walking, cycling, or using public transport instead of private vehicles helps conserve fuel resources.",
            "image_asset_key": "bicycle",
        },
        {
            "question_text": "Whose responsibility is it to conserve natural resources?",
            "options": ["Only the government's", "Only scientists'", "Individuals, families, and communities together", "No one's responsibility"],
            "correct_option_index": 2,
            "explanation": "The small daily choices made by individuals, families, and communities add up to protect resources.",
        },
        {
            "question_text": "What can happen if non-renewable resources are overused?",
            "options": ["They will refill themselves quickly", "They will eventually run out", "They will turn into renewable resources", "Nothing will change"],
            "correct_option_index": 1,
            "explanation": "If non-renewable resources are overused, they will eventually run out since they cannot be replaced quickly.",
        },
    ],

    "EVS5_DISASTER": [
        {
            "question_text": "What usually causes an earthquake?",
            "options": ["Heavy rainfall", "Sudden movements deep beneath the Earth's surface", "Strong ocean winds", "Long periods without rain"],
            "correct_option_index": 1,
            "explanation": "Earthquakes are caused by sudden movements deep beneath the Earth's surface that make the ground shake.",
        },
        {
            "question_text": "What is the safest action to take during an earthquake if you are indoors?",
            "options": ["Stand near a window", "Run outside immediately without looking", "Drop, take cover under sturdy furniture, and hold on", "Stand in the middle of the room"],
            "correct_option_index": 2,
            "explanation": "During an earthquake, the safest action is to drop, take cover under sturdy furniture, and hold on.",
        },
        {
            "question_text": "What should people do during a flood?",
            "options": ["Walk through moving water", "Move to higher ground as early as possible", "Stay in low-lying areas", "Ignore official warnings"],
            "correct_option_index": 1,
            "explanation": "During a flood, people should move to higher ground as early as possible and avoid moving water.",
        },
        {
            "question_text": "A cyclone is best described as a ____.",
            "options": ["long period without rain", "powerful, spinning windstorm with heavy rain", "sudden ground-shaking event", "slow-moving snowstorm"],
            "correct_option_index": 1,
            "explanation": "A cyclone is a powerful, spinning windstorm with heavy rain that mainly strikes coastal areas.",
        },
        {
            "question_text": "A long period without enough rain is called a ____.",
            "options": ["flood", "drought", "cyclone", "earthquake"],
            "correct_option_index": 1,
            "explanation": "A drought is a long period without enough rain.",
        },
        {
            "question_text": "If your clothing catches fire, what should you do?",
            "options": ["Run as fast as possible", "Stop, drop, and roll", "Jump into water immediately", "Hide in a closet"],
            "correct_option_index": 1,
            "explanation": "Remembering to stop, drop, and roll if clothing catches fire can save precious time.",
        },
        {
            "question_text": "During a fire, why should you use the stairs instead of a lift?",
            "options": ["Lifts are always faster", "Lifts can stop working or trap people during a fire", "Stairs are more fun", "There is no real reason"],
            "correct_option_index": 1,
            "explanation": "Using the stairs instead of a lift is safer during a fire.",
        },
        {
            "question_text": "What should a basic emergency kit at home include?",
            "options": ["A torch, drinking water, and first-aid supplies", "Only sweets and toys", "Only old newspapers", "Nothing is needed"],
            "correct_option_index": 0,
            "explanation": "A basic emergency kit usually includes a torch with extra batteries, safe drinking water, and first-aid supplies.",
        },
        {
            "question_text": "Why do schools practise regular safety drills?",
            "options": ["To waste class time", "To help everyone learn to stay calm and act quickly in a real disaster", "Because it is required for no reason", "To replace lessons permanently"],
            "correct_option_index": 1,
            "explanation": "Schools that practise regular safety drills help everyone learn to stay calm and act quickly.",
        },
        {
            "question_text": "Can human activity make some natural disasters worse?",
            "options": ["No, never", "Yes, for example cutting down forests can worsen flooding", "Only earthquakes are affected by people", "Human activity has no connection to disasters"],
            "correct_option_index": 1,
            "explanation": "Some disasters are made worse by human activity; cutting down forests on hillsides can make flooding more severe.",
        },
    ],

    "EVS5_GOVERNANCE": [
        {
            "question_text": "Who leads a village's Gram Panchayat?",
            "options": ["The Sarpanch", "The Municipal Commissioner", "The Prime Minister", "A shopkeeper"],
            "correct_option_index": 0,
            "explanation": "A Gram Panchayat is led by an elected leader called the Sarpanch.",
        },
        {
            "question_text": "Which local body manages garbage collection and drainage in towns and cities?",
            "options": ["Gram Panchayat", "Gram Sabha", "Municipal Corporation or Municipality", "A private company only"],
            "correct_option_index": 2,
            "explanation": "A Municipal Corporation or Municipality manages garbage collection and drainage in towns and cities.",
        },
        {
            "question_text": "What is a Gram Sabha meeting used for?",
            "options": ["Watching movies", "Discussing local issues and making decisions together", "Selling goods", "Playing sports"],
            "correct_option_index": 1,
            "explanation": "In villages, residents can attend Gram Sabha meetings, where local issues are discussed and decided together.",
        },
        {
            "question_text": "How can citizens choose their local leaders?",
            "options": ["By voting in local elections", "By waiting for leaders to appear", "By ignoring elections", "By asking a neighbour to decide"],
            "correct_option_index": 0,
            "explanation": "People vote in local elections to choose their Sarpanch, ward members, or municipal representatives.",
        },
        {
            "question_text": "What should a citizen do if they notice a broken streetlight?",
            "options": ["Ignore it completely", "Report it to the local governing body", "Fix it with no tools", "Wait for someone else's family to fix it"],
            "correct_option_index": 1,
            "explanation": "Citizens can directly report problems, like a broken streetlight, to their local governing body.",
        },
        {
            "question_text": "Which of these is a responsibility of a Gram Panchayat?",
            "options": ["International trade", "Village roads, drinking water supply, and local schools", "Running a national airline", "Printing currency"],
            "correct_option_index": 1,
            "explanation": "The Gram Panchayat looks after village roads, drinking water supply, local schools, and cleanliness.",
        },
        {
            "question_text": "Why do citizens pay local taxes?",
            "options": ["To fund shared community services", "Taxes serve no purpose", "To avoid using public services", "Because it is optional and unnecessary"],
            "correct_option_index": 0,
            "explanation": "Citizens pay local taxes that fund shared services like roads, water supply, and schools.",
        },
        {
            "question_text": "Which of these is an example of responsible citizenship?",
            "options": ["Littering in public parks", "Keeping public spaces clean and following traffic rules", "Ignoring community rules", "Damaging shared resources"],
            "correct_option_index": 1,
            "explanation": "Being a responsible citizen includes keeping public spaces clean and following traffic and safety rules.",
        },
        {
            "question_text": "What is a community?",
            "options": ["A single family living alone", "A group of people living in the same area, sharing resources and needs", "A type of vehicle", "A kind of festival"],
            "correct_option_index": 1,
            "explanation": "A community is a group of people who live in the same area and share resources, spaces, and everyday needs.",
        },
        {
            "question_text": "What happens when local governance works well and citizens participate actively?",
            "options": ["Nothing changes in the community", "Everyday community life runs smoothly", "Roads and schools stop functioning", "Citizens lose all their rights"],
            "correct_option_index": 1,
            "explanation": "When local governance works well and citizens participate, community life runs smoothly — clean water, good roads, and functioning schools.",
        },
    ],
}


def _validate(topic_code: str, q: dict) -> None:
    """Belt-and-suspenders check, mirroring
    scripts/generate_template_questions.py's _validate_generated."""
    options = q["options"]
    assert len(options) == 4, f"{topic_code}: expected 4 options, got {options!r}"
    assert len(set(options)) == 4, f"{topic_code}: duplicate option values {options!r}"
    assert 0 <= q["correct_option_index"] <= 3, f"{topic_code}: bad correct_option_index"
    image_asset_key = q.get("image_asset_key")
    image_emoji = q.get("image_emoji")
    assert not (image_asset_key and image_emoji), f"{topic_code}: both image_asset_key and image_emoji set"
    if image_asset_key:
        assert image_asset_key in ALL_ASSET_KEYS, f"{topic_code}: unknown image_asset_key {image_asset_key!r}"
    option_asset_keys = q.get("option_asset_keys")
    option_emojis = q.get("option_emojis")
    assert not (option_asset_keys and option_emojis), f"{topic_code}: both option_asset_keys and option_emojis set"
    if option_asset_keys:
        assert len(option_asset_keys) == 4, f"{topic_code}: option_asset_keys must have 4 entries"
        for key in option_asset_keys:
            assert key in ALL_ASSET_KEYS, f"{topic_code}: unknown option_asset_key {key!r}"
    if option_emojis:
        assert len(option_emojis) == 4, f"{topic_code}: option_emojis must have 4 entries"


async def _fetch_topics() -> dict[str, Topic]:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(Topic).where(Topic.subject == "EVS"))
        topics = result.scalars().all()
        return {t.code: t for t in topics}


async def _deactivate_existing(dry_run: bool) -> int:
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(Question).where(Question.subject == "EVS", Question.is_active == True)  # noqa: E712
        )
        active = list(result.scalars().all())
        print(f"Found {len(active)} currently active EVS question(s) to deactivate "
              f"(sources: {sorted(set(q.generation_source for q in active))}).")
        if dry_run:
            return len(active)
        for q in active:
            q.is_active = False
            session.add(q)
        await session.commit()
        return len(active)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Author EVS diagnostic quiz question bank.")
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    topics = await _fetch_topics()
    missing = [code for code in QUESTIONS_BY_TOPIC if code not in topics]
    if missing:
        raise SystemExit(f"Topic code(s) not found in DB: {missing}")

    total_defined = sum(len(qs) for qs in QUESTIONS_BY_TOPIC.values())
    print(f"Defined {total_defined} authored question(s) across {len(QUESTIONS_BY_TOPIC)} EVS topic(s).")
    for code, qs in QUESTIONS_BY_TOPIC.items():
        for q in qs:
            _validate(code, q)
    print("All authored questions passed validation.")

    deactivated = await _deactivate_existing(args.dry_run)
    print(f"{'[dry-run] would deactivate' if args.dry_run else 'Deactivated'} {deactivated} question(s).")

    generation_batch = datetime.now(timezone.utc).strftime("%Y%m%d") + "-authored"
    inserted = 0

    async with AsyncSessionFactory() as session:
        for code, qs in QUESTIONS_BY_TOPIC.items():
            topic = topics[code]
            for q in qs:
                if args.dry_run:
                    inserted += 1
                    continue
                session.add(
                    Question(
                        topic_id=topic.id,
                        subject="EVS",
                        class_number=topic.class_number,
                        question_text=q["question_text"],
                        options=q["options"],
                        correct_option_index=q["correct_option_index"],
                        explanation=q.get("explanation"),
                        image_emoji=q.get("image_emoji"),
                        image_asset_key=q.get("image_asset_key"),
                        option_emojis=q.get("option_emojis"),
                        option_asset_keys=q.get("option_asset_keys"),
                        generation_source="authored:claude:v1",
                        generation_batch=generation_batch,
                        module_id=None,
                        branch_name=None,
                        reviewed=False,
                        is_active=True,
                    )
                )
                inserted += 1
            print(f"  [ok] {code}: {len(qs)} question(s) {'would be ' if args.dry_run else ''}inserted")

        if not args.dry_run:
            await session.commit()

    print(f"\nDone. {'[dry-run] ' if args.dry_run else ''}{inserted} question(s) inserted "
          f"(generation_batch={generation_batch}).")


if __name__ == "__main__":
    asyncio.run(main())
