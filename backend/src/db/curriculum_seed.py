"""
Curriculum topic taxonomy — hand-curated, human-reviewable.

Each entry becomes a Topic row. `prerequisite_codes` point to Topic.code
values in the class ONE level below (empty list = floor of that subject's
chain — class 1 for Mathematics/English/Hindi, class 3 for EVS, since no
lower-class EVS content exists in the NCERT catalogue).

This file is the source of truth for topic coverage and cross-class
interlinkage. Correct/extend it here directly — the adaptive quiz engine
and question-generation script both read Topic rows seeded from this list,
so an error here is directly traceable and fixable, not hidden behind an
LLM-authored taxonomy.

Mathematics and EVS topics are concept-based (a distinct fact/skill per
topic). English and Hindi topics are skill-based: the same skill (reading
comprehension, vocabulary, grammar, sentence formation) recurs every class
at escalating difficulty, with the prerequisite being the same skill one
class down.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.quiz import Topic, TopicType

_TOPICS = [
    # ── Mathematics — Class 1 (floor) ───────────────────────────────────────
    {
        "code": "MATH1_COUNTING", "subject": "Mathematics", "class_number": 1,
        "topic_type": TopicType.CONCEPT, "name": "Counting numbers 1-20",
        "description": "Counting, reading, and writing numbers up to 20.",
        "prerequisite_codes": [],
    },
    {
        "code": "MATH1_COMPARISON", "subject": "Mathematics", "class_number": 1,
        "topic_type": TopicType.CONCEPT, "name": "Comparing numbers",
        "description": "Comparing numbers using more than / less than / equal to.",
        "prerequisite_codes": [],
    },
    {
        "code": "MATH1_ADD_WITHIN_20", "subject": "Mathematics", "class_number": 1,
        "topic_type": TopicType.CONCEPT, "name": "Addition within 20",
        "description": "Adding two numbers with a sum up to 20.",
        "prerequisite_codes": [],
    },
    {
        "code": "MATH1_SUB_WITHIN_20", "subject": "Mathematics", "class_number": 1,
        "topic_type": TopicType.CONCEPT, "name": "Subtraction within 20",
        "description": "Subtracting numbers within 20.",
        "prerequisite_codes": [],
    },
    {
        "code": "MATH1_SHAPES", "subject": "Mathematics", "class_number": 1,
        "topic_type": TopicType.CONCEPT, "name": "Basic 2D shapes",
        "description": "Identifying circles, squares, triangles, and rectangles.",
        "prerequisite_codes": [],
    },

    # ── Mathematics — Class 2 ────────────────────────────────────────────────
    {
        "code": "MATH2_PLACE_VALUE", "subject": "Mathematics", "class_number": 2,
        "topic_type": TopicType.CONCEPT, "name": "Place value (tens and ones)",
        "description": "Breaking 2-digit numbers into tens and ones.",
        "prerequisite_codes": ["MATH1_COUNTING"],
    },
    {
        "code": "MATH2_ADD_CARRYING", "subject": "Mathematics", "class_number": 2,
        "topic_type": TopicType.CONCEPT, "name": "Addition with carrying",
        "description": "Adding 2-digit numbers with regrouping/carrying.",
        "prerequisite_codes": ["MATH1_ADD_WITHIN_20"],
    },
    {
        "code": "MATH2_SUB_BORROWING", "subject": "Mathematics", "class_number": 2,
        "topic_type": TopicType.CONCEPT, "name": "Subtraction with borrowing",
        "description": "Subtracting 2-digit numbers with regrouping/borrowing.",
        "prerequisite_codes": ["MATH1_SUB_WITHIN_20"],
    },
    {
        "code": "MATH2_MULT_INTRO", "subject": "Mathematics", "class_number": 2,
        "topic_type": TopicType.CONCEPT, "name": "Multiplication introduction",
        "description": "Multiplication as repeated addition / skip counting.",
        "prerequisite_codes": ["MATH1_ADD_WITHIN_20"],
    },

    # ── Mathematics — Class 3 ────────────────────────────────────────────────
    {
        "code": "MATH3_MULT_TABLES", "subject": "Mathematics", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Multiplication tables (2-10)",
        "description": "Recalling and applying multiplication tables 2 through 10.",
        "prerequisite_codes": ["MATH2_MULT_INTRO"],
    },
    {
        "code": "MATH3_DIVISION", "subject": "Mathematics", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Division as equal grouping",
        "description": "Understanding division as equal sharing/grouping.",
        "prerequisite_codes": ["MATH2_MULT_INTRO"],
    },
    {
        "code": "MATH3_PLACE_VALUE_1000", "subject": "Mathematics", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Place value up to 1000s",
        "description": "Reading, writing, and decomposing 3-digit numbers.",
        "prerequisite_codes": ["MATH2_PLACE_VALUE"],
    },
    {
        "code": "MATH3_FRACTIONS_INTRO", "subject": "Mathematics", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Fractions: halves and quarters",
        "description": "Identifying and representing halves and quarters of a whole.",
        "prerequisite_codes": ["MATH2_PLACE_VALUE"],
    },
    {
        "code": "MATH3_MEASUREMENT", "subject": "Mathematics", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Measurement basics",
        "description": "Measuring length, weight, and capacity using standard units.",
        "prerequisite_codes": ["MATH2_PLACE_VALUE"],
    },

    # ── Mathematics — Class 4 ────────────────────────────────────────────────
    {
        "code": "MATH4_MULTIDIGIT_MULT", "subject": "Mathematics", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Multi-digit multiplication",
        "description": "Multiplying 2-digit and 3-digit numbers.",
        "prerequisite_codes": ["MATH3_MULT_TABLES"],
    },
    {
        "code": "MATH4_LONG_DIVISION", "subject": "Mathematics", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Long division",
        "description": "Dividing multi-digit numbers using the long division method.",
        "prerequisite_codes": ["MATH3_DIVISION"],
    },
    {
        "code": "MATH4_FRACTION_ADD", "subject": "Mathematics", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Fraction addition (same denominator)",
        "description": "Adding and subtracting fractions with the same denominator.",
        "prerequisite_codes": ["MATH3_FRACTIONS_INTRO"],
    },
    {
        "code": "MATH4_PERIMETER_AREA", "subject": "Mathematics", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Perimeter and area (introduction)",
        "description": "Calculating perimeter and area of squares and rectangles.",
        "prerequisite_codes": ["MATH3_MEASUREMENT"],
    },
    {
        "code": "MATH4_DECIMALS_INTRO", "subject": "Mathematics", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Decimals: introduction",
        "description": "Understanding decimal notation and place value.",
        "prerequisite_codes": ["MATH3_PLACE_VALUE_1000"],
    },

    # ── Mathematics — Class 5 ────────────────────────────────────────────────
    {
        "code": "MATH5_FRACTION_OPS", "subject": "Mathematics", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Fraction operations (unlike denominators)",
        "description": "Adding, subtracting, and comparing fractions with unlike denominators.",
        "prerequisite_codes": ["MATH4_FRACTION_ADD"],
    },
    {
        "code": "MATH5_DECIMAL_OPS", "subject": "Mathematics", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Decimal operations",
        "description": "Adding, subtracting, and multiplying decimals.",
        "prerequisite_codes": ["MATH4_DECIMALS_INTRO"],
    },
    {
        "code": "MATH5_PERCENTAGE_INTRO", "subject": "Mathematics", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Percentages: introduction",
        "description": "Understanding percentage as parts per hundred.",
        "prerequisite_codes": ["MATH4_DECIMALS_INTRO"],
    },
    {
        "code": "MATH5_AREA_VOLUME", "subject": "Mathematics", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Area and volume",
        "description": "Calculating area of composite shapes and volume of cubes/cuboids.",
        "prerequisite_codes": ["MATH4_PERIMETER_AREA"],
    },
    {
        "code": "MATH5_LONG_DIVISION_LARGE", "subject": "Mathematics", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Long division with larger numbers",
        "description": "Long division involving larger dividends and 2-digit divisors.",
        "prerequisite_codes": ["MATH4_LONG_DIVISION"],
    },

    # ── EVS — Class 3 (floor) ────────────────────────────────────────────────
    {
        "code": "EVS3_FAMILY", "subject": "EVS", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Family and relationships",
        "description": "Understanding family structures and relationships.",
        "prerequisite_codes": [],
    },
    {
        "code": "EVS3_BODY_HEALTH", "subject": "EVS", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "My body and health",
        "description": "Basic body parts, hygiene, and healthy habits.",
        "prerequisite_codes": [],
    },
    {
        "code": "EVS3_PLANTS", "subject": "EVS", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Plants around us",
        "description": "Types of plants and their parts.",
        "prerequisite_codes": [],
    },
    {
        "code": "EVS3_WATER", "subject": "EVS", "class_number": 3,
        "topic_type": TopicType.CONCEPT, "name": "Water sources and uses",
        "description": "Where water comes from and how it is used.",
        "prerequisite_codes": [],
    },

    # ── EVS — Class 4 ────────────────────────────────────────────────────────
    {
        "code": "EVS4_NUTRITION", "subject": "EVS", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Food and nutrition",
        "description": "Food groups and balanced nutrition.",
        "prerequisite_codes": ["EVS3_BODY_HEALTH"],
    },
    {
        "code": "EVS4_HABITATS", "subject": "EVS", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Habitats and animals",
        "description": "Animal habitats and adaptation.",
        "prerequisite_codes": ["EVS3_PLANTS"],
    },
    {
        "code": "EVS4_WATER_CYCLE", "subject": "EVS", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Water cycle",
        "description": "Evaporation, condensation, and precipitation.",
        "prerequisite_codes": ["EVS3_WATER"],
    },
    {
        "code": "EVS4_TRANSPORT_COMM", "subject": "EVS", "class_number": 4,
        "topic_type": TopicType.CONCEPT, "name": "Transport and communication",
        "description": "Modes of transport and communication, past and present.",
        "prerequisite_codes": ["EVS3_FAMILY"],
    },

    # ── EVS — Class 5 ────────────────────────────────────────────────────────
    {
        "code": "EVS5_BODY_SYSTEMS", "subject": "EVS", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Human body systems",
        "description": "Introduction to digestive, respiratory, and circulatory systems.",
        "prerequisite_codes": ["EVS4_NUTRITION"],
    },
    {
        "code": "EVS5_RESOURCES", "subject": "EVS", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Natural resources and conservation",
        "description": "Renewable/non-renewable resources and conservation practices.",
        "prerequisite_codes": ["EVS4_WATER_CYCLE"],
    },
    {
        "code": "EVS5_DISASTER", "subject": "EVS", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Disaster awareness and safety",
        "description": "Common natural disasters and basic safety measures.",
        "prerequisite_codes": ["EVS4_HABITATS"],
    },
    {
        "code": "EVS5_GOVERNANCE", "subject": "EVS", "class_number": 5,
        "topic_type": TopicType.CONCEPT, "name": "Community and local governance",
        "description": "Basics of local community organization and governance.",
        "prerequisite_codes": ["EVS4_TRANSPORT_COMM"],
    },

    # ── English — Class 1 (floor) ────────────────────────────────────────────
    {
        "code": "EN1_PHONICS", "subject": "English", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "Phonics and letter sounds",
        "description": "Recognizing letters and their sounds.",
        "prerequisite_codes": [],
    },
    {
        "code": "EN1_VOCAB", "subject": "English", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "Basic vocabulary",
        "description": "Everyday words for common objects, people, and actions.",
        "prerequisite_codes": [],
    },
    {
        "code": "EN1_READING", "subject": "English", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "Reading simple sentences",
        "description": "Reading and understanding short, simple sentences.",
        "prerequisite_codes": [],
    },
    {
        "code": "EN1_GRAMMAR", "subject": "English", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "Nouns and simple present tense",
        "description": "Identifying nouns and using the simple present tense.",
        "prerequisite_codes": [],
    },

    # ── English — Class 2 ────────────────────────────────────────────────────
    {
        "code": "EN2_PHONICS", "subject": "English", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "Blending sounds and word reading",
        "description": "Blending letter sounds to read simple words.",
        "prerequisite_codes": ["EN1_PHONICS"],
    },
    {
        "code": "EN2_VOCAB", "subject": "English", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "Vocabulary: everyday and descriptive words",
        "description": "Expanded everyday vocabulary including simple describing words.",
        "prerequisite_codes": ["EN1_VOCAB"],
    },
    {
        "code": "EN2_READING", "subject": "English", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "Reading comprehension: short passages",
        "description": "Answering simple questions about a short passage.",
        "prerequisite_codes": ["EN1_READING"],
    },
    {
        "code": "EN2_GRAMMAR", "subject": "English", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "Pronouns and simple present tense",
        "description": "Using pronouns and the simple present tense correctly.",
        "prerequisite_codes": ["EN1_GRAMMAR"],
    },
    {
        "code": "EN2_SENTENCE", "subject": "English", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "Simple sentence formation",
        "description": "Forming simple, grammatically complete sentences.",
        "prerequisite_codes": ["EN1_READING"],
    },

    # ── English — Class 3 ────────────────────────────────────────────────────
    {
        "code": "EN3_VOCAB", "subject": "English", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "Vocabulary: word meaning",
        "description": "Understanding simple synonyms and word meanings in context.",
        "prerequisite_codes": ["EN2_VOCAB"],
    },
    {
        "code": "EN3_READING", "subject": "English", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "Reading comprehension: short stories",
        "description": "Understanding and answering questions about short stories.",
        "prerequisite_codes": ["EN2_READING"],
    },
    {
        "code": "EN3_GRAMMAR", "subject": "English", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "Pronouns and simple past tense",
        "description": "Using pronouns and the simple past tense correctly.",
        "prerequisite_codes": ["EN2_GRAMMAR"],
    },
    {
        "code": "EN3_SENTENCE", "subject": "English", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "Descriptive sentence formation",
        "description": "Forming sentences that describe people, places, and things.",
        "prerequisite_codes": ["EN2_SENTENCE"],
    },

    # ── English — Class 4 ────────────────────────────────────────────────────
    {
        "code": "EN4_VOCAB", "subject": "English", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "Vocabulary: synonyms and antonyms",
        "description": "Identifying synonyms and antonyms in context.",
        "prerequisite_codes": ["EN3_VOCAB"],
    },
    {
        "code": "EN4_READING", "subject": "English", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "Reading comprehension: longer passages",
        "description": "Understanding and answering questions about longer passages.",
        "prerequisite_codes": ["EN3_READING"],
    },
    {
        "code": "EN4_GRAMMAR", "subject": "English", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "Adjectives and future tense",
        "description": "Using adjectives and the simple future tense correctly.",
        "prerequisite_codes": ["EN3_GRAMMAR"],
    },
    {
        "code": "EN4_SENTENCE", "subject": "English", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "Joining sentences",
        "description": "Joining simple sentences using conjunctions like 'and', 'but'.",
        "prerequisite_codes": ["EN3_SENTENCE"],
    },

    # ── English — Class 5 ────────────────────────────────────────────────────
    {
        "code": "EN5_VOCAB", "subject": "English", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "Vocabulary: context-based meaning",
        "description": "Determining word meaning from context.",
        "prerequisite_codes": ["EN4_VOCAB"],
    },
    {
        "code": "EN5_READING", "subject": "English", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "Reading comprehension: inference-based",
        "description": "Making simple inferences from a passage.",
        "prerequisite_codes": ["EN4_READING"],
    },
    {
        "code": "EN5_GRAMMAR", "subject": "English", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "Conjunctions and mixed tenses",
        "description": "Using conjunctions and correctly mixing tenses.",
        "prerequisite_codes": ["EN4_GRAMMAR"],
    },
    {
        "code": "EN5_SENTENCE", "subject": "English", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "Complex sentence formation",
        "description": "Forming sentences with multiple clauses.",
        "prerequisite_codes": ["EN4_SENTENCE"],
    },

    # ── Hindi — Class 1 (floor) ──────────────────────────────────────────────
    {
        "code": "HI1_PHONICS", "subject": "Hindi", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "वर्ण और ध्वनि पहचान (Letter and sound recognition)",
        "description": "Recognizing Devanagari letters and their sounds.",
        "prerequisite_codes": [],
    },
    {
        "code": "HI1_VOCAB", "subject": "Hindi", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "मूल शब्दावली (Basic vocabulary)",
        "description": "Everyday words for common objects, people, and actions.",
        "prerequisite_codes": [],
    },
    {
        "code": "HI1_READING", "subject": "Hindi", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "सरल वाक्य पठन (Reading simple sentences)",
        "description": "Reading and understanding short, simple sentences.",
        "prerequisite_codes": [],
    },
    {
        "code": "HI1_GRAMMAR", "subject": "Hindi", "class_number": 1,
        "topic_type": TopicType.SKILL, "name": "संज्ञा और वर्तमान काल (Nouns and simple present tense)",
        "description": "Identifying nouns and using the simple present tense.",
        "prerequisite_codes": [],
    },

    # ── Hindi — Class 2 ──────────────────────────────────────────────────────
    {
        "code": "HI2_PHONICS", "subject": "Hindi", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "शब्द पठन अभ्यास (Word reading practice)",
        "description": "Blending letter sounds to read simple words.",
        "prerequisite_codes": ["HI1_PHONICS"],
    },
    {
        "code": "HI2_VOCAB", "subject": "Hindi", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "शब्दावली विस्तार (Vocabulary expansion)",
        "description": "Expanded everyday vocabulary including simple describing words.",
        "prerequisite_codes": ["HI1_VOCAB"],
    },
    {
        "code": "HI2_READING", "subject": "Hindi", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "गद्यांश बोध: छोटे अनुच्छेद (Reading comprehension: short passages)",
        "description": "Answering simple questions about a short passage.",
        "prerequisite_codes": ["HI1_READING"],
    },
    {
        "code": "HI2_GRAMMAR", "subject": "Hindi", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "सर्वनाम और वर्तमान काल (Pronouns and present tense)",
        "description": "Using pronouns and the simple present tense correctly.",
        "prerequisite_codes": ["HI1_GRAMMAR"],
    },
    {
        "code": "HI2_SENTENCE", "subject": "Hindi", "class_number": 2,
        "topic_type": TopicType.SKILL, "name": "सरल वाक्य रचना (Simple sentence formation)",
        "description": "Forming simple, grammatically complete sentences.",
        "prerequisite_codes": ["HI1_READING"],
    },

    # ── Hindi — Class 3 ──────────────────────────────────────────────────────
    {
        "code": "HI3_VOCAB", "subject": "Hindi", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "पर्यायवाची शब्द (Synonyms and word meaning)",
        "description": "Understanding simple synonyms and word meanings in context.",
        "prerequisite_codes": ["HI2_VOCAB"],
    },
    {
        "code": "HI3_READING", "subject": "Hindi", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "गद्यांश बोध: कहानियाँ (Reading comprehension: short stories)",
        "description": "Understanding and answering questions about short stories.",
        "prerequisite_codes": ["HI2_READING"],
    },
    {
        "code": "HI3_GRAMMAR", "subject": "Hindi", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "सर्वनाम और भूतकाल (Pronouns and simple past tense)",
        "description": "Using pronouns and the simple past tense correctly.",
        "prerequisite_codes": ["HI2_GRAMMAR"],
    },
    {
        "code": "HI3_SENTENCE", "subject": "Hindi", "class_number": 3,
        "topic_type": TopicType.SKILL, "name": "वर्णनात्मक वाक्य (Descriptive sentence formation)",
        "description": "Forming sentences that describe people, places, and things.",
        "prerequisite_codes": ["HI2_SENTENCE"],
    },

    # ── Hindi — Class 4 ──────────────────────────────────────────────────────
    {
        "code": "HI4_VOCAB", "subject": "Hindi", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "पर्यायवाची व विलोम शब्द (Synonyms and antonyms)",
        "description": "Identifying synonyms and antonyms in context.",
        "prerequisite_codes": ["HI3_VOCAB"],
    },
    {
        "code": "HI4_READING", "subject": "Hindi", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "गद्यांश बोध: बड़े अनुच्छेद (Reading comprehension: longer passages)",
        "description": "Understanding and answering questions about longer passages.",
        "prerequisite_codes": ["HI3_READING"],
    },
    {
        "code": "HI4_GRAMMAR", "subject": "Hindi", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "विशेषण और भविष्य काल (Adjectives and future tense)",
        "description": "Using adjectives and the simple future tense correctly.",
        "prerequisite_codes": ["HI3_GRAMMAR"],
    },
    {
        "code": "HI4_SENTENCE", "subject": "Hindi", "class_number": 4,
        "topic_type": TopicType.SKILL, "name": "वाक्य जोड़ना (Joining sentences)",
        "description": "Joining simple sentences using conjunctions.",
        "prerequisite_codes": ["HI3_SENTENCE"],
    },

    # ── Hindi — Class 5 ──────────────────────────────────────────────────────
    {
        "code": "HI5_VOCAB", "subject": "Hindi", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "प्रसंग आधारित शब्दार्थ (Context-based word meaning)",
        "description": "Determining word meaning from context.",
        "prerequisite_codes": ["HI4_VOCAB"],
    },
    {
        "code": "HI5_READING", "subject": "Hindi", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "गद्यांश बोध: अनुमान आधारित (Reading comprehension: inference-based)",
        "description": "Making simple inferences from a passage.",
        "prerequisite_codes": ["HI4_READING"],
    },
    {
        "code": "HI5_GRAMMAR", "subject": "Hindi", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "संयोजक और मिश्रित काल (Conjunctions and mixed tenses)",
        "description": "Using conjunctions and correctly mixing tenses.",
        "prerequisite_codes": ["HI4_GRAMMAR"],
    },
    {
        "code": "HI5_SENTENCE", "subject": "Hindi", "class_number": 5,
        "topic_type": TopicType.SKILL, "name": "जटिल वाक्य रचना (Complex sentence formation)",
        "description": "Forming sentences with multiple clauses.",
        "prerequisite_codes": ["HI4_SENTENCE"],
    },
]


def _validate_taxonomy() -> None:
    """Fail loudly at import time if any prerequisite_code doesn't resolve,
    or points to a topic that isn't exactly one class below."""
    by_code = {t["code"]: t for t in _TOPICS}
    seen = set()
    for t in _TOPICS:
        if t["code"] in seen:
            raise ValueError(f"Duplicate topic code: {t['code']}")
        seen.add(t["code"])

    for t in _TOPICS:
        for prereq_code in t["prerequisite_codes"]:
            prereq = by_code.get(prereq_code)
            if prereq is None:
                raise ValueError(
                    f"Topic '{t['code']}' references unknown prerequisite '{prereq_code}'"
                )
            if prereq["subject"] != t["subject"]:
                raise ValueError(
                    f"Topic '{t['code']}' prerequisite '{prereq_code}' is a different subject"
                )
            if prereq["class_number"] != t["class_number"] - 1:
                raise ValueError(
                    f"Topic '{t['code']}' (class {t['class_number']}) prerequisite "
                    f"'{prereq_code}' must be class {t['class_number'] - 1}, "
                    f"got class {prereq['class_number']}"
                )


_validate_taxonomy()


async def seed_topics(session: AsyncSession) -> None:
    result = await session.execute(select(Topic).limit(1))
    if result.scalar_one_or_none():
        return  # Already seeded

    for t in _TOPICS:
        session.add(Topic(**t))

    await session.commit()
    print(f"[seed] {len(_TOPICS)} curriculum topics seeded.")
