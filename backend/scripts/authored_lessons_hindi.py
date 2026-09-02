"""
One-off script — authors original, offline (no LLM call) structured lessons
for every Hindi chapter authored in authored_content_hindi.py and loads them
into the `lessons` / `lesson_slides` tables. NOT run at app startup.

Why this exists: same rationale as authored_questions_hindi.py — the
Gemini-generated Hindi lessons were grounded in placeholder chunk content
that didn't match the real NCERT syllabus, and Gemini's free-tier quota is
too tight for reliable bulk regeneration. This script authors real lessons
directly — one per chapter from authored_content_hindi.py, 4 concept/example
slides + exactly 1 check slide (MCQ) — and inserts them with
generation_source="authored:claude:v1".

Scope: touches ONLY lessons/lesson_slides rows where subject="Hindi".
Existing Hindi Lesson rows (and their LessonSlide children, deleted first to
satisfy the FK) are deleted before the new set is inserted, per the original
task instructions — idempotent, scoped only to subject="Hindi".

Usage (from backend/):
    uv run python scripts/authored_lessons_hindi.py --dry-run
    uv run python scripts/authored_lessons_hindi.py
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

from sqlmodel import delete, select

from src.ai.quiz_asset_vocabulary import ALL_ASSET_KEYS
from src.core.database import AsyncSessionFactory
from src.models.lesson import Lesson, LessonSlide

SUBJECT = "Hindi"
GENERATION_SOURCE = "authored:claude:v1"


@dataclass
class ASlide:
    slide_type: str  # "concept" | "example"
    text: str
    image_asset_key: Optional[str] = None


@dataclass
class ACheck:
    question_text: str
    options: list[str]
    correct_option_index: int
    explanation: str
    image_asset_key: Optional[str] = None


@dataclass
class ALesson:
    class_number: int
    chapter_number: int
    chapter_title: str
    slides: list[ASlide]
    check: ACheck


def cs(text: str, image_asset_key: Optional[str] = None) -> ASlide:
    return ASlide(slide_type="concept", text=text, image_asset_key=image_asset_key)


def ex(text: str, image_asset_key: Optional[str] = None) -> ASlide:
    return ASlide(slide_type="example", text=text, image_asset_key=image_asset_key)


# ── Authored lessons, one per chapter authored in authored_content_hindi.py ─

LESSONS: list[ALesson] = [
    ALesson(
        class_number=1, chapter_number=1, chapter_title="Chapter 1: वर्णमाला की सैर",
        slides=[
            cs("हिंदी वर्णमाला में स्वर और व्यंजन होते हैं। हर वर्ण की अपनी एक ध्वनि होती है।"),
            ex("'क' से 'कमल' बनता है और 'म' से 'मछली' बनता है — हर वर्ण किसी न किसी शब्द की शुरुआत करता है।", "fish"),
            cs("स्वरों को अकेले बोला जा सकता है, जैसे अ, आ, इ, ई, उ — लेकिन व्यंजन को बोलने के लिए किसी स्वर की मदद चाहिए।"),
            ex("'ब' और 'अ' मिलकर 'ब' की सही ध्वनि बनती है, जैसे 'बकरी' शब्द में।", "goat"),
        ],
        check=ACheck(
            "'ह' अक्षर से कौन-सा शब्द शुरू होता है?",
            ["हाथी", "बकरी", "मछली", "बंदर"], 0,
            "'हाथी' शब्द 'ह' अक्षर से शुरू होता है।", image_asset_key="elephant",
        ),
    ),
    ALesson(
        class_number=1, chapter_number=2, chapter_title="Chapter 2: घर और आस-पास की चीज़ें",
        slides=[
            cs("हमारे चारों ओर बहुत सी चीज़ों के नाम होते हैं — घर में माँ, पिता, भाई-बहन होते हैं।"),
            ex("स्कूल में शिक्षक, कुर्सी, मेज़, किताब, और बस्ता होते हैं।", "book"),
            cs("जानवरों के भी नाम होते हैं, जैसे कुत्ता, बिल्ली, गाय, और चिड़िया।", ),
            ex("रंगों के नाम भी ज़रूरी शब्दावली हैं — लाल, पीला, नीला, हरा, और सफ़ेद।", "dog"),
        ],
        check=ACheck(
            "यह चित्र किस जानवर का है?",
            ["गाय", "बकरी", "भेड़", "घोड़ा"], 0,
            "चित्र में गाय दिखाई गई है।", image_asset_key="cow",
        ),
    ),
    ALesson(
        class_number=1, chapter_number=3, chapter_title="Chapter 3: गुड़िया और गेंद",
        slides=[
            cs("यह मीरा की गुड़िया है। यह लाल है। मीरा को गुड़िया पसंद है।"),
            ex("यह रोहन की गेंद है। गेंद गोल है। रोहन गेंद से खेलता है।", "ball"),
            cs("मीरा और रोहन बगीचे में साथ खेलते हैं। बगीचे में एक पेड़ है।", "tree"),
            ex("पेड़ पर एक चिड़िया बैठी है और गाती है। मीरा और रोहन उसे देखकर खुश होते हैं।", "bird"),
        ],
        check=ACheck(
            "मीरा और रोहन कहाँ खेलते हैं?",
            ["बगीचे में", "स्कूल में", "घर में", "बाज़ार में"], 0,
            "अनुच्छेद में लिखा है कि वे बगीचे में खेलते हैं।",
        ),
    ),
    ALesson(
        class_number=1, chapter_number=4, chapter_title="Chapter 4: मैं और मेरा दिन",
        slides=[
            cs("संज्ञा वह शब्द है जो किसी व्यक्ति, जानवर, जगह या वस्तु का नाम बताता है, जैसे 'सूरज' और 'बस्ता'।", "sun"),
            ex("मेरा दिन सूरज उगने के साथ शुरू होता है। मैं सुबह उठता हूँ और नाश्ता करता हूँ।"),
            cs("वर्तमान काल के वाक्य अभी हो रहे काम को बताते हैं, जैसे 'मैं स्कूल जाता हूँ।'"),
            ex("शाम को मैं खेलता हूँ, और रात को मैं सोता हूँ — ये सब वर्तमान काल के वाक्य हैं।"),
        ],
        check=ACheck(
            "'मैं स्कूल जाता हूँ' वाक्य में 'स्कूल' शब्द क्या है?",
            ["संज्ञा", "क्रिया", "सर्वनाम", "विशेषण"], 0,
            "'स्कूल' किसी जगह का नाम बताता है, इसलिए यह संज्ञा है।",
        ),
    ),
    ALesson(
        class_number=2, chapter_number=1, chapter_title="Chapter 1: शब्द बनाना सीखना",
        slides=[
            cs("कक्षा 2 में हम वर्णों की ध्वनियों को जोड़कर पूरे शब्द पढ़ना सीखते हैं।"),
            ex("'न' और 'ल' मिलकर 'नल' बनता है, और 'ज' और 'ल' मिलकर 'जल' बनता है।"),
            cs("एक जैसी अंतिम ध्वनि वाले शब्दों का समूह, जैसे 'नल', 'जल', 'फल', नए शब्द पढ़ने में मदद करता है।"),
            ex("संयुक्ताक्षर, जैसे 'स्कूल' में 'स्क', थोड़े कठिन होते हैं, इसलिए धीरे-धीरे बोलकर पढ़ने का अभ्यास किया जाता है।"),
        ],
        check=ACheck(
            "'फल' शब्द के परिवार का शब्द कौन-सा है?",
            ["जल", "घर", "बस", "पेड़"], 0,
            "'जल' भी 'ल' ध्वनि पर खत्म होता है, इसलिए यह 'फल' के परिवार का शब्द है।",
        ),
    ),
    ALesson(
        class_number=2, chapter_number=2, chapter_title="Chapter 2: नई शब्दावली",
        slides=[
            cs("गुणवाचक शब्द किसी वस्तु के बारे में अधिक जानकारी देते हैं, जैसे 'बड़ा', 'छोटा', 'मीठा'।"),
            ex("'यह बड़ा हाथी है' कहने से वाक्य में अधिक जानकारी जुड़ जाती है।", "elephant"),
            cs("समय और मौसम से जुड़े शब्द भी सीखे जाते हैं — सुबह, शाम, गर्मी, सर्दी, और बरसात।"),
            ex("स्कूल और घर के नए शब्द, जैसे 'पुस्तकालय' और 'रसोई', शब्दावली को समृद्ध बनाते हैं।"),
        ],
        check=ACheck(
            "'यह बड़ा हाथी है' वाक्य में कौन-सा शब्द गुणवाचक है?",
            ["बड़ा", "हाथी", "यह", "है"], 0,
            "'बड़ा' शब्द हाथी के बारे में अधिक जानकारी देता है, इसलिए यह गुणवाचक शब्द है।",
        ),
    ),
    ALesson(
        class_number=2, chapter_number=3, chapter_title="Chapter 3: बारिश का दिन",
        slides=[
            cs("आज आसमान में काले बादल छाए थे। अचानक तेज़ बारिश होने लगी।", "cloud"),
            ex("गीता ने अपनी छतरी उठाई और बाहर निकल गई। बारिश में मेंढक टर्र-टर्र बोलने लगे।", "umbrella"),
            cs("पेड़ों के पत्ते धुलकर हरे-हरे चमकने लगे।"),
            ex("थोड़ी देर बाद बारिश रुक गई और आसमान में इंद्रधनुष दिखाई दिया। सब बच्चे खुश हो गए।"),
        ],
        check=ACheck(
            "बारिश रुकने के बाद आसमान में क्या दिखाई दिया?",
            ["इंद्रधनुष", "चाँद", "पतंग", "तारे"], 0,
            "अनुच्छेद में लिखा है कि आसमान में इंद्रधनुष दिखाई दिया।",
        ),
    ),
    ALesson(
        class_number=2, chapter_number=4, chapter_title="Chapter 4: सर्वनाम की दुनिया",
        slides=[
            cs("सर्वनाम वह शब्द है जो संज्ञा के स्थान पर प्रयोग होता है — 'मैं', 'तुम', 'वह', 'हम', 'वे'।"),
            ex("'रोहन खेलता है' की जगह हम कह सकते हैं 'वह खेलता है', अगर पहले से पता हो कि 'वह' कौन है।"),
            cs("सर्वनाम को वर्तमान काल की क्रिया के साथ सही ढंग से जोड़ना ज़रूरी है।"),
            ex("'मैं पढ़ता हूँ' लेकिन 'हम पढ़ते हैं' — हर सर्वनाम के साथ क्रिया का रूप थोड़ा बदल जाता है।"),
        ],
        check=ACheck(
            "'सीमा और राधा' के स्थान पर कौन-सा सर्वनाम इस्तेमाल होगा?",
            ["वे", "वह", "मैं", "तुम"], 0,
            "दो या अधिक लोगों के लिए सर्वनाम 'वे' प्रयोग होता है।",
        ),
    ),
    ALesson(
        class_number=2, chapter_number=5, chapter_title="Chapter 5: पूरा वाक्य बनाना",
        slides=[
            cs("एक पूर्ण सरल वाक्य में कर्ता (कौन) और क्रिया (क्या करता है) दोनों होते हैं।"),
            ex("'कुत्ता भौंकता है' में 'कुत्ता' कर्ता है और 'भौंकता है' क्रिया है।", "dog"),
            cs("हिंदी में आमतौर पर कर्ता पहले, कर्म बीच में, और क्रिया अंत में आती है।"),
            ex("जैसे 'राम आम खाता है' — यह सही क्रम है।"),
        ],
        check=ACheck(
            "इनमें से कौन-सा सही वाक्य है?",
            ["चिड़िया उड़ती है।", "उड़ती चिड़िया है।", "है चिड़िया उड़ती।", "उड़ती है चिड़िया।"], 0,
            "'चिड़िया' कर्ता पहले और 'उड़ती है' क्रिया अंत में आती है।",
        ),
    ),
    ALesson(
        class_number=3, chapter_number=1, chapter_title="Chapter 1: पर्यायवाची शब्दों की दुनिया",
        slides=[
            cs("पर्यायवाची शब्द वे शब्द हैं जिनका अर्थ लगभग एक जैसा होता है, जैसे 'खुश' और 'प्रसन्न'।"),
            ex("'पानी' के पर्यायवाची शब्द हैं 'जल' और 'नीर'।"),
            cs("पर्यायवाची शब्द जानने से लिखते समय एक ही शब्द बार-बार दोहराने से बचा जा सकता है।"),
            ex("अनजान शब्द को किसी जाने-पहचाने पर्यायवाची शब्द से जोड़कर अर्थ समझा जा सकता है।"),
        ],
        check=ACheck(
            "'खुश' शब्द का पर्यायवाची कौन-सा है?",
            ["प्रसन्न", "उदास", "गुस्सा", "डरा"], 0,
            "'प्रसन्न' का अर्थ 'खुश' के समान है।",
        ),
    ),
    ALesson(
        class_number=3, chapter_number=2, chapter_title="Chapter 2: बहादुर बच्चे की कहानी",
        slides=[
            cs("अजय और सोहन नदी किनारे खेल रहे थे। अचानक सोहन का पैर फिसल गया।"),
            ex("सोहन तैरना नहीं जानता था, इसलिए वह घबरा गया।"),
            cs("अजय ने बिना डरे एक लंबी लकड़ी उठाई और सोहन की तरफ़ बढ़ाई।"),
            ex("सोहन ने लकड़ी पकड़ ली, और अजय ने धीरे-धीरे उसे किनारे तक खींच लिया।"),
        ],
        check=ACheck(
            "अजय ने सोहन की मदद के लिए क्या किया?",
            ["लकड़ी बढ़ाई", "रस्सी फेंकी", "चिल्लाया", "पानी में कूद गया"], 0,
            "कहानी में लिखा है कि अजय ने लंबी लकड़ी उठाकर सोहन की तरफ़ बढ़ाई।",
        ),
    ),
    ALesson(
        class_number=3, chapter_number=3, chapter_title="Chapter 3: कल और आज",
        slides=[
            cs("भूतकाल उन कामों के बारे में बताता है जो पहले हो चुके हैं।"),
            ex("भूतकाल की क्रियाएँ अक्सर 'आ', 'ई', या 'ए' पर खत्म होती हैं, जैसे 'खेला', 'गई', 'देखे'।"),
            cs("सर्वनाम के साथ भूतकाल का सही रूप जोड़ना ज़रूरी है — 'मैं गया' या 'मैं गई'।"),
            ex("'वह कल स्कूल गया' और 'उसने कल एक किताब पढ़ी' — ये दोनों भूतकाल के वाक्य हैं।"),
        ],
        check=ACheck(
            "'वह कल पार्क में खेला।' यह वाक्य किस काल में है?",
            ["भूतकाल", "वर्तमान काल", "भविष्य काल", "कोई नहीं"], 0,
            "'खेला' पहले हो चुके काम को बताता है, इसलिए यह भूतकाल है।",
        ),
    ),
    ALesson(
        class_number=3, chapter_number=4, chapter_title="Chapter 4: लोगों और जगहों का वर्णन",
        slides=[
            cs("वर्णनात्मक वाक्य विवरण देने वाले शब्दों से एक स्पष्ट चित्र बनाता है।"),
            ex("'ऊँचा, हरा पेड़ पुराने मंदिर के पास खड़ा था' — यह वाक्य एक साफ़ तस्वीर बनाता है।", "tree"),
            cs("किसी व्यक्ति का वर्णन करते समय उसके रूप-रंग और स्वभाव के बारे में बताया जा सकता है।"),
            ex("किसी जगह का वर्णन करते समय वहाँ की दिखावट और माहौल के बारे में बताया जा सकता है, जैसे 'शांत झील के किनारे पक्षी चहचहाते हैं'।"),
        ],
        check=ACheck(
            "इनमें से कौन-सा वाक्य सबसे अच्छा वर्णन देता है?",
            ["ऊँचा, हरा पेड़ मंदिर के पास खड़ा था।", "पेड़ था।", "एक पेड़ खड़ा था।", "पेड़ मंदिर के पास था।"], 0,
            "इस वाक्य में विवरण देने वाले शब्द 'ऊँचा' और 'हरा' एक स्पष्ट चित्र बनाते हैं।",
        ),
    ),
    ALesson(
        class_number=4, chapter_number=1, chapter_title="Chapter 1: विलोम और पर्यायवाची शब्द",
        slides=[
            cs("पर्यायवाची शब्द किसी शब्द के समान अर्थ वाला शब्द होता है, जैसे 'बड़ा' और 'विशाल'।"),
            ex("विलोम शब्द उसके विपरीत अर्थ वाला शब्द होता है, जैसे 'बड़ा' और 'छोटा'।"),
            cs("'अमीर' का विलोम 'गरीब', 'ऊँचा' का विलोम 'नीचा', 'तेज़' का विलोम 'धीमा'।"),
            ex("किसी अनुच्छेद में पर्यायवाची और विलोम शब्दों को पहचानना शब्दावली को समृद्ध बनाता है।"),
        ],
        check=ACheck(
            "'बड़ा' शब्द का विलोम कौन-सा है?",
            ["छोटा", "विशाल", "लंबा", "ऊँचा"], 0,
            "'छोटा' शब्द 'बड़ा' के विपरीत अर्थ वाला है।",
        ),
    ),
    ALesson(
        class_number=4, chapter_number=2, chapter_title="Chapter 2: सवेरे की कहानी",
        slides=[
            cs("सूरज की पहली किरण के साथ ही गाँव जाग उठा। मुर्गे ने सबसे पहले बांग दी।", "sun"),
            ex("बिल्ली अंगड़ाई लेकर उठी, गाय रंभाई, और बत्तखें तालाब में तैरने लगीं।", "duck"),
            cs("खेतों में किसान अपने हल-बैल लेकर काम पर निकल पड़े।"),
            ex("स्कूल जाने वाले बच्चे अपने-अपने बस्ते उठाकर सड़क पर चलने लगे।", "bag"),
        ],
        check=ACheck(
            "मुर्गे के बांग देने के बाद सबसे पहले किसने अंगड़ाई ली?",
            ["बिल्ली ने", "गाय ने", "कुत्ते ने", "बत्तख ने"], 0,
            "अनुच्छेद में मुर्गे के बाद बिल्ली के अंगड़ाई लेने का ज़िक्र है।",
        ),
    ),
    ALesson(
        class_number=4, chapter_number=3, chapter_title="Chapter 3: कल की योजना",
        slides=[
            cs("भविष्य काल उन कामों के बारे में बताता है जो अभी नहीं हुए हैं, बल्कि आगे होंगे।"),
            ex("भविष्य काल के वाक्य अक्सर 'गा', 'गी', या 'गे' पर खत्म होते हैं, जैसे 'मैं कल दादी से मिलूँगा।'"),
            cs("विशेषण वे शब्द हैं जो संज्ञा के बारे में और जानकारी देते हैं, जैसे 'ऊँचा पहाड़' या 'दयालु दादी'।"),
            ex("'मैं कल एक रंग-बिरंगी पतंग उड़ाऊँगा' — यहाँ 'रंग-बिरंगी' विशेषण है और 'उड़ाऊँगा' भविष्य काल की क्रिया है।", "kite"),
        ],
        check=ACheck(
            "इनमें से कौन-सा वाक्य भविष्य काल में है?",
            ["मैं कल खेलूँगा।", "मैं कल खेला।", "मैं रोज़ खेलता हूँ।", "मैं खेल रहा हूँ।"], 0,
            "'खेलूँगा' आगे होने वाले काम को बताता है, इसलिए यह भविष्य काल है।",
        ),
    ),
    ALesson(
        class_number=4, chapter_number=4, chapter_title="Chapter 4: वाक्यों को जोड़ना",
        slides=[
            cs("दो छोटे वाक्यों को संयोजक शब्द जैसे 'और', 'लेकिन', या 'क्योंकि' से जोड़ा जा सकता है।"),
            ex("'मुझे आम पसंद हैं। मुझे केले पसंद हैं।' को जोड़कर 'मुझे आम और केले पसंद हैं।' बनता है।"),
            cs("'लेकिन' का प्रयोग तब होता है जब दो बातों में विरोधाभास हो।"),
            ex("'क्योंकि' का प्रयोग किसी बात का कारण बताने के लिए होता है, जैसे 'वह स्कूल नहीं गया क्योंकि उसे बुखार था।'"),
        ],
        check=ACheck(
            "'वह थका हुआ था। उसने काम पूरा किया।' — किस संयोजक शब्द से जोड़ना सही है?",
            ["लेकिन", "और", "क्योंकि", "या"], 0,
            "दोनों बातों में विरोधाभास है, इसलिए 'लेकिन' सही संयोजक है।",
        ),
    ),
    ALesson(
        class_number=5, chapter_number=1, chapter_title="Chapter 1: प्रसंग से अर्थ समझना",
        slides=[
            cs("कभी-कभी हमें कोई शब्द नहीं पता होता, लेकिन हम उसके आसपास के वाक्यों से अर्थ अनुमान लगा सकते हैं।"),
            ex("'सूखी धरती पर महीनों से बारिश नहीं हुई थी' — इस वाक्य से 'सूखी' का अर्थ समझा जा सकता है।"),
            cs("वाक्य में दिए गए कारण, परिणाम, या तुलना जैसे संकेतों को ध्यान से पढ़ना ज़रूरी है।"),
            ex("यह कौशल बड़ी कक्षाओं में बहुत काम आता है, क्योंकि हर अनजान शब्द के लिए शब्दकोश देखना संभव नहीं होता।"),
        ],
        check=ACheck(
            "'सूखी धरती पर महीनों से बारिश नहीं हुई थी।' — इस वाक्य में 'सूखी' का अर्थ क्या है?",
            ["बिना पानी के", "बहुत गीली", "बहुत ठंडी", "बहुत गरम"], 0,
            "वाक्य में बारिश न होने का ज़िक्र है, इसलिए 'सूखी' का अर्थ 'बिना पानी के' है।",
        ),
    ),
    ALesson(
        class_number=5, chapter_number=2, chapter_title="Chapter 2: बर्फ वाला दादा",
        slides=[
            cs("हर शाम मोहल्ले में एक खुशमिज़ाज़ बूढ़े व्यक्ति अपनी साइकिल पर घंटी बजाते हुए आते थे।", "bicycle"),
            ex("उनकी साइकिल के पीछे एक छोटा-सा बक्सा बंधा होता था, जिसमें रंग-बिरंगी बर्फ़ की कुल्फ़ियाँ रखी होती थीं।"),
            cs("घंटी की आवाज़ सुनते ही आस-पास के सारे बच्चे दौड़कर बाहर आ जाते।", "bell"),
            ex("दादा कभी-कभी बिना पैसे के भी एक छोटी कुल्फ़ी पकड़ा देते, और बच्चे उन्हें धन्यवाद कहते।"),
        ],
        check=ACheck(
            "इस अनुच्छेद से हम अनुमान लगा सकते हैं कि बच्चे दादा को देखकर कैसा महसूस करते थे?",
            ["बहुत खुश", "बहुत डरे हुए", "बहुत उदास", "बिल्कुल उदासीन"], 0,
            "बच्चों का दौड़कर आना और हँसना दिखाता है कि वे बहुत खुश होते थे।",
        ),
    ),
    ALesson(
        class_number=5, chapter_number=3, chapter_title="Chapter 3: भूत, वर्तमान और भविष्य साथ-साथ",
        slides=[
            cs("एक ही अनुच्छेद में भूतकाल, वर्तमान काल, और भविष्य काल — तीनों एक साथ प्रयोग हो सकते हैं।"),
            ex("'उसने अपना गृहकार्य पूरा किया, अभी वह टीवी देख रही है, और थोड़ी देर बाद सो जाएगी' — इसमें तीनों काल हैं।"),
            cs("संयोजक शब्द जैसे 'और', 'लेकिन', 'इसलिए', और 'क्योंकि' इन अलग-अलग समय की बातों को जोड़ते हैं।"),
            ex("सही काल का चुनाव करना ज़रूरी है, क्योंकि गलत काल इस्तेमाल करने से वाक्य का अर्थ बदल जाता है।"),
        ],
        check=ACheck(
            "'वह खाना खाएगी' किस काल में है?",
            ["भविष्य काल", "वर्तमान काल", "भूतकाल", "कोई नहीं"], 0,
            "'खाएगी' आगे होने वाले काम को बताता है, इसलिए यह भविष्य काल है।",
        ),
    ),
    ALesson(
        class_number=5, chapter_number=4, chapter_title="Chapter 4: एक से अधिक विचार वाले वाक्य",
        slides=[
            cs("जटिल वाक्य एक मुख्य विचार को अतिरिक्त उपवाक्य से जोड़ता है, जैसे 'क्योंकि', 'हालांकि', 'जब', 'अगर'।"),
            ex("'वह देर से आई क्योंकि बस खराब हो गई थी' — यहाँ 'क्योंकि' देरी का कारण बताता है।"),
            cs("'अगर' शर्त बताने के लिए और 'जब' समय बताने के लिए प्रयोग होता है।"),
            ex("'हालांकि वह थका हुआ था, फिर भी उसने दौड़ पूरी की' — यहाँ 'हालांकि' विरोधाभास दिखाता है।"),
        ],
        check=ACheck(
            "'अगर बारिश हुई, तो हम बाहर नहीं जाएँगे।' — यहाँ 'अगर' किसके लिए प्रयोग हुआ है?",
            ["शर्त बताने के लिए", "कारण बताने के लिए", "समय बताने के लिए", "विरोधाभास बताने के लिए"], 0,
            "'अगर' किसी शर्त को जोड़ने के लिए प्रयोग होता है।",
        ),
    ),
]


def _validate(lesson: ALesson) -> None:
    label = f"C{lesson.class_number} Ch.{lesson.chapter_number}"
    assert 4 <= len(lesson.slides) <= 5, f"{label}: expected 4-5 slides, got {len(lesson.slides)}"
    for slide in lesson.slides:
        assert slide.slide_type in ("concept", "example"), f"{label}: bad slide_type {slide.slide_type!r}"
        if slide.image_asset_key:
            assert slide.image_asset_key in ALL_ASSET_KEYS, (
                f"{label}: unknown image_asset_key {slide.image_asset_key!r}"
            )
    check = lesson.check
    assert len(check.options) == 4, f"{label}: check must have 4 options"
    assert len(set(check.options)) == 4, f"{label}: check options must be distinct"
    assert 0 <= check.correct_option_index <= 3, f"{label}: bad check correct_option_index"
    if check.image_asset_key:
        assert check.image_asset_key in ALL_ASSET_KEYS, (
            f"{label}: unknown check image_asset_key {check.image_asset_key!r}"
        )


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Author and load original Hindi lessons (slides + check MCQ)."
    )
    parser.add_argument("--dry-run", action="store_true", help="Print output, do not write to DB.")
    args = parser.parse_args()

    for lesson in LESSONS:
        _validate(lesson)

    total_slides = sum(len(l.slides) + 1 for l in LESSONS)
    print(f"Validated {len(LESSONS)} authored lessons, {total_slides} total slides "
          f"(incl. check slides).")

    if args.dry_run:
        for lesson in LESSONS[:2]:
            print(f"\n[dry-run] Class {lesson.class_number} {lesson.chapter_title}: "
                  f"{len(lesson.slides)} slide(s) + 1 check slide")
            for slide in lesson.slides:
                pic = f" [{slide.image_asset_key}]" if slide.image_asset_key else ""
                print(f"  ({slide.slide_type}){pic} {slide.text}")
            print(f"  (check) Q: {lesson.check.question_text}")
            print(f"  Options: {lesson.check.options}  Correct: {lesson.check.correct_option_index}")
        print("\n[dry-run] No DB writes performed.")
        return

    async with AsyncSessionFactory() as session:
        existing_ids = list(
            (await session.execute(
                select(Lesson.id).where(Lesson.subject == SUBJECT)
            )).scalars().all()
        )
        if existing_ids:
            await session.execute(
                delete(LessonSlide).where(LessonSlide.lesson_id.in_(existing_ids))  # type: ignore[attr-defined]
            )
            await session.execute(
                delete(Lesson).where(Lesson.id.in_(existing_ids))  # type: ignore[attr-defined]
            )
            await session.commit()
        print(f"Deleted {len(existing_ids)} existing {SUBJECT} lesson(s) (and their slides).")

        inserted_lessons = 0
        inserted_slides = 0
        for lesson in LESSONS:
            row = Lesson(
                subject=SUBJECT,
                class_number=lesson.class_number,
                chapter_number=lesson.chapter_number,
                chapter_title=lesson.chapter_title,
                generation_source=GENERATION_SOURCE,
            )
            session.add(row)
            await session.flush()

            for idx, slide in enumerate(lesson.slides):
                session.add(
                    LessonSlide(
                        lesson_id=row.id,
                        slide_index=idx,
                        slide_type=slide.slide_type,
                        text=slide.text,
                        image_asset_key=slide.image_asset_key,
                    )
                )
                inserted_slides += 1

            check = lesson.check
            session.add(
                LessonSlide(
                    lesson_id=row.id,
                    slide_index=len(lesson.slides),
                    slide_type="check",
                    text=check.question_text,
                    image_asset_key=check.image_asset_key,
                    options=check.options,
                    correct_option_index=check.correct_option_index,
                    explanation=check.explanation,
                )
            )
            inserted_slides += 1
            inserted_lessons += 1

        await session.commit()
        print(f"Inserted {inserted_lessons} {SUBJECT} lessons, {inserted_slides} lesson_slides "
              f"(generation_source={GENERATION_SOURCE!r}).")


if __name__ == "__main__":
    asyncio.run(main())
