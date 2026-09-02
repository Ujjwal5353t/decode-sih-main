"""
Permission service — maps system roles to their allowed dashboard features,
sidebar navigation items, and action capabilities with full multilingual localization.
"""

from typing import Dict, List, Optional
from src.schemas.permission import (
    DashboardPermissionItem,
    PermissionAction,
    RolePermissionsResponse,
)

# ── Multilingual Role Titles ──────────────────────────────────────────────────
ROLE_LABELS_I18N: Dict[str, Dict[str, str]] = {
    "teacher": {
        "en": "Educator / Teacher",
        "hi": "शिक्षक / अध्यापिका",
        "bn": "শিক্ষক / শিক্ষিকা",
        "mr": "शिक्षक / शिक्षिका",
        "pa": "ਅਧਿਆਪਕ / ਸਿੱਖਿਅਕ",
        "ur": "استاد / معلم",
        "ta": "ஆசிரியர் / பயிற்றுவிப்பாளர்",
        "as": "শিক্ষক / প্ৰশিক্ষক",
    },
    "student": {
        "en": "Student Learner",
        "hi": "विद्यार्थी शिक्षार्थी",
        "bn": "ছাত্র / শিক্ষার্থী",
        "mr": "विद्यार्थी",
        "pa": "ਵਿਦਿਆਰਥੀ",
        "ur": "طالب علم",
        "ta": "மாணவர்",
        "as": "ছাত্ৰ-ছাত্ৰী",
    },
    "school": {
        "en": "School Admin",
        "hi": "विद्यालय प्रशासक",
        "bn": "স্কুল প্রশাসক",
        "mr": "शाळा प्रशासक",
        "pa": "ਸਕੂਲ ਪ੍ਰਬੰਧਕ",
        "ur": "اسکول ایڈمن",
        "ta": "பள்ளி நிர்வாகி",
        "as": "বিদ্যালয় প্ৰশাসক",
    },
    "parent": {
        "en": "Parent & Guardian",
        "hi": "अभिभावक व संरक्षक",
        "bn": "অভিভাবক",
        "mr": "पालक आणि पालक",
        "pa": "ਮਾਪੇ ਅਤੇ ਸਰਪ੍ਰਸਤ",
        "ur": "والدین و سرپرست",
        "ta": "பெற்றோர் மற்றும் பாதுகாவலர்",
        "as": "অভিভাৱক",
    },
    "admin": {
        "en": "Super Administrator",
        "hi": "मुख्य प्रशासक",
        "bn": "সুপার অ্যাডমিনিস্ট্রেটর",
        "mr": "सुपर प्रशासक",
        "pa": "ਮੁੱਖ ਪ੍ਰਬੰਧਕ",
        "ur": "سپر ایڈمنسٹریٹر",
        "ta": "முதன்மை நிர்வாகி",
        "as": "প্ৰধান প্ৰশাসক",
    },
}

# ── Category Labels ───────────────────────────────────────────────────────────
CATEGORY_I18N: Dict[str, Dict[str, str]] = {
    "Main": {
        "en": "Main",
        "hi": "मुख्य",
        "bn": "প্রধান",
        "mr": "मुख्य",
        "pa": "ਮੁੱਖ",
        "ur": "مرکزی",
        "ta": "முதன்மை",
        "as": "প্ৰধান",
    },
    "Academics": {
        "en": "Academics",
        "hi": "शैक्षणिक",
        "bn": "শিক্ষা বিষয়ক",
        "mr": "शैक्षणिक",
        "pa": "ਵਿੱਦਿਅਕ",
        "ur": "تعلیمی",
        "ta": "கல்வி",
        "as": "শৈক্ষিক",
    },
    "Learning": {
        "en": "Learning",
        "hi": "अध्ययन",
        "bn": "শিক্ষা",
        "mr": "अध्ययन",
        "pa": "ਸਿੱਖਿਆ",
        "ur": "تعلیم",
        "ta": "கற்றல்",
        "as": "শিক্ষণ",
    },
    "Evaluation": {
        "en": "Evaluation",
        "hi": "मूल्यांकन",
        "bn": "মূল্যায়ন",
        "mr": "मूल्यमापन",
        "pa": "ਮੁਲਾਂਕਣ",
        "ur": "جانچ و جائزہ",
        "ta": "மதிப்பீடு",
        "as": "মূল্যায়ন",
    },
    "Practice": {
        "en": "Practice",
        "hi": "अभ्यास",
        "bn": "অনুশীলন",
        "mr": "सराव",
        "pa": "ਅਭਿਆਸ",
        "ur": "مشق",
        "ta": "பயிற்சி",
        "as": "অনুশীলন",
    },
    "Resources": {
        "en": "Resources",
        "hi": "संसाधन",
        "bn": "সম্পদ",
        "mr": "संसाधने",
        "pa": "ਸਰੋਤ",
        "ur": "وسائل",
        "ta": "வளங்கள்",
        "as": "সম্পদ",
    },
    "Curriculum": {
        "en": "Curriculum",
        "hi": "पाठ्यक्रम",
        "bn": "পাঠ্যক্রম",
        "mr": "अभ्यासक्रम",
        "pa": "ਪਾਠਕ੍ਰਮ",
        "ur": "نصاب",
        "ta": "பாடத்திட்டம்",
        "as": "পাঠ্যক্ৰম",
    },
    "Staff": {
        "en": "Staff",
        "hi": "स्टाफ व शिक्षक",
        "bn": "কর্মী ও শিক্ষক",
        "mr": "कर्मचारी",
        "pa": "ਅਮਲਾ",
        "ur": "اسٹاف",
        "ta": "பணியாளர்கள்",
        "as": "কৰ্মচাৰী",
    },
    "Family": {
        "en": "Family",
        "hi": "परिवार व बच्चे",
        "bn": "পরিবার",
        "mr": "कुटुंब",
        "pa": "ਪਰਿਵਾਰ",
        "ur": "خاندان",
        "ta": "குடும்பம்",
        "as": "পৰিয়াল",
    },
    "Analytics": {
        "en": "Analytics",
        "hi": "प्रगति विश्लेषण",
        "bn": "বিশ্লেষণ",
        "mr": "विश्लेषण",
        "pa": "ਵਿਸ਼ਲੇਸ਼ਣ",
        "ur": "تجزیات",
        "ta": "பகுப்பாய்வு",
        "as": "বিশ্লেষণ",
    },
    "System": {
        "en": "System",
        "hi": "सिस्टम स्थिति",
        "bn": "সিস্টেম",
        "mr": "प्रणाली",
        "pa": "ਸਿਸਟਮ",
        "ur": "سسٹم",
        "ta": "கணினி",
        "as": "ব্যৱস্থা",
    },
    "Management": {
        "en": "Management",
        "hi": "प्रबंधन",
        "bn": "ব্যবস্থাপনা",
        "mr": "व्यवस्थापन",
        "pa": "ਪ੍ਰਬੰਧਨ",
        "ur": "انتظامیہ",
        "ta": "மேலாண்மை",
        "as": "ব্যৱস্থাপনা",
    },
    "Registrations": {
        "en": "Registrations",
        "hi": "पंजीकरण",
        "bn": "নিবন্ধন",
        "mr": "नोंदणी",
        "pa": "ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
        "ur": "رجسٹریشن",
        "ta": "பதிவுகள்",
        "as": "পঞ্জীয়ন",
    },
}

# ── Badge Labels ──────────────────────────────────────────────────────────────
BADGES_I18N: Dict[str, Dict[str, str]] = {
    "Tasks": {
        "en": "Tasks", "hi": "कार्य", "bn": "টাস্ক", "mr": "कार्ये", "pa": "ਕੰਮ", "ur": "کام", "ta": "பணிகள்", "as": "কাৰ্য্য",
    },
    "Active": {
        "en": "Active", "hi": "सक्रिय", "bn": "সক্রিয়", "mr": "सक्रिय", "pa": "ਸਰਗਰਮ", "ur": "فعال", "ta": "செயலில்", "as": "সক্ৰিয়",
    },
    "Core": {
        "en": "Core", "hi": "मुख्य", "bn": "কোর", "mr": "गाभा", "pa": "ਮੁੱਖ", "ur": "بنیادی", "ta": "முக்கிய", "as": "মূল",
    },
    "Admin": {
        "en": "Admin", "hi": "व्यवस्थापक", "bn": "অ্যাডমিন", "mr": "प्रशासक", "pa": "ਪ੍ਰਬੰਧਕ", "ur": "ایڈمن", "ta": "நிர்வாகி", "as": "প্ৰশাসক",
    },
    "Linked": {
        "en": "Linked", "hi": "संबद्ध", "bn": "সংযুক্ত", "mr": "जोडलेले", "pa": "ਜੁੜਿਆ", "ur": "منسلک", "ta": "இணைக்கப்பட்டது", "as": "সংযুক্ত",
    },
    "Master": {
        "en": "Master", "hi": "मास्टर", "bn": "মাস্টার", "mr": "मास्टर", "pa": "ਮਾਸਟਰ", "ur": "ماسٹر", "ta": "முதன்மை", "as": "মাষ্টাৰ",
    },
    "Review": {
        "en": "Review", "hi": "समीक्षा", "bn": "পর্যালোচনা", "mr": "पुनरावलोकन", "pa": "ਸਮੀਖਿਆ", "ur": "جائزہ", "ta": "மதிப்பாய்வு", "as": "পুনৰীক্ষণ",
    },
}

# ── Navigation Items & Actions Localizations ──────────────────────────────────
NAV_ITEMS_I18N: Dict[str, Dict[str, Dict[str, str]]] = {
    # Teacher Navigation
    "teacher_overview": {
        "label": {
            "en": "Teacher Overview",
            "hi": "शिक्षक विवरण",
            "bn": "শিক্ষক বিবরণ",
            "mr": "शिक्षक विहंगावलोकन",
            "pa": "ਅਧਿਆਪਕ ਸੰਖੇਪ",
            "ur": "معلم جائزہ",
            "ta": "ஆசிரியர் கண்ணோட்டம்",
            "as": "শিক্ষক সংক্ষিপ্ত বিৱৰণ",
        },
        "description": {
            "en": "Profile summary, branch details, and active assigned classes",
            "hi": "प्रोफ़ाइल सारांश, शाखा विवरण और सक्रिय आवंटित कक्षाएँ",
            "bn": "প্রোফাইল সারাংশ, শাখা বিবরণ এবং নিযুক্ত ক্লাস",
            "mr": "प्रोफाइल सारांश, शाखा तपशील आणि नियुक्त वर्ग",
            "pa": "ਪ੍ਰੋਫਾਈਲ ਸਾਰ, ਸ਼ਾਖਾ ਵੇਰਵੇ ਅਤੇ ਕਿਰਿਆਸ਼ੀਲ ਜਮਾਤਾਂ",
            "ur": "پروفائل خلاصہ، برانچ تفصیلات اور تفویض کردہ کلاسز",
            "ta": "சுயவிவர சுருக்கம், கிளை விவரங்கள் மற்றும் வகுப்புகள்",
            "as": "প্ৰফাইল সাৰাংশ, শাখাৰ বিৱৰণ আৰু কাৰ্য্যৰত শ্ৰেণীসমূহ",
        },
    },
    "teacher_classes": {
        "label": {
            "en": "Assigned Classes",
            "hi": "आवंटित कक्षाएँ",
            "bn": "নিযুক্ত ক্লাসসমূহ",
            "mr": "नियुक्त वर्ग",
            "pa": "ਸੌਂਪੀਆਂ ਗਈਆਂ ਜਮਾਤਾਂ",
            "ur": "تفویض شدہ کلاسز",
            "ta": "ஒதுக்கப்பட்ட வகுப்புகள்",
            "as": "নিযুক্ত শ্ৰেণীসমূহ",
        },
        "description": {
            "en": "Preview your assigned class sections, student rosters, and curriculum",
            "hi": "अपनी कक्षाओं के अनुभाग, छात्र सूची और पाठ्यक्रम देखें",
            "bn": "ক্লাস সেকশন, শিক্ষার্থী তালিকা এবং পাঠ্যক্রম পর্যালোচনা করুন",
            "mr": "आपल्या वर्गाचे विभाग, विद्यार्थी यादी आणि अभ्यासक्रम पहा",
            "pa": "ਜਮਾਤ ਸੈਕਸ਼ਨ, ਵਿਦਿਆਰਥੀ ਸੂਚੀ ਅਤੇ ਪਾਠਕ੍ਰਮ ਦੇਖੋ",
            "ur": "اپنی کلاس سیکشنز، طلبہ کی فہرست اور نصاب دیکھیں",
            "ta": "உங்கள் வகுப்பு பிரிவுகள், மாணவர் பட்டியல் மற்றும் பாடத்திட்டத்தைப் பார்க்கவும்",
            "as": "আপোনাৰ শ্ৰেণীৰ শাখা, ছাত্ৰ তালিকা আৰু পাঠ্যক্ৰম পৰিদৰ্শন কৰক",
        },
    },
    "teacher_assignments": {
        "label": {
            "en": "Assignments & Quizzes",
            "hi": "असाइनमेंट व क्विज़",
            "bn": "অ্যাসাইনমেন্ট ও কুইজ",
            "mr": "गृहपाठ आणि प्रश्नमंजुषा",
            "pa": "ਅਸਾਈਨਮੈਂਟ ਅਤੇ ਕੁਇਜ਼",
            "ur": "اسائنمنٹس اور کوئز",
            "ta": "பணிகள் & வினாடிவினாக்கள்",
            "as": "গৃহকৰ্ম আৰু কুইজ",
        },
        "description": {
            "en": "Create and manage PDF homework and adaptive AI quizzes",
            "hi": "पीडीएफ होमवर्क और अनुकूली एआई क्विज़ बनाएँ और प्रबंधित करें",
            "bn": "পিডিএফ বাড়ির কাজ এবং অ্যাডাপটিভ এআই কুইজ তৈরি ও পরিচালনা করুন",
            "mr": "पीडीएफ गृहपाठ आणि अनुकूलनीय एआय क्विझ तयार करा",
            "pa": "ਪੀਡੀਐਫ ਹੋਮਵਰਕ ਅਤੇ ਏਆਈ ਕੁਇਜ਼ ਬਣਾਓ ਅਤੇ ਪ੍ਰਬੰਧਿਤ ਕਰੋ",
            "ur": "پی ڈی ایف ہوم ورک اور اے آئی کوئز بنائیں اور منظم کریں",
            "ta": "PDF வீட்டுப்பாடம் மற்றும் AI வினாடிவினாக்களை உருவாக்கவும்",
            "as": "পিডিএফ গৃহকাৰ্য্য আৰু এআই কুইজ সৃষ্টি আৰু পৰিচালনা কৰক",
        },
    },
    "teacher_grading": {
        "label": {
            "en": "Submissions & Grading",
            "hi": "जमा कार्य व मूल्यांकन",
            "bn": "জমা এবং গ্রেডিং",
            "mr": "सबमिशन आणि मूल्यांकन",
            "pa": "ਸਪੁਰਦਗੀ ਅਤੇ ਮੁਲਾਂਕਣ",
            "ur": "جمع شدہ کام اور گریڈنگ",
            "ta": "சமர்ப்பிப்புகள் & தரவரிசை",
            "as": "দাখিল আৰু শ্ৰেণীবিভাজন",
        },
        "description": {
            "en": "Review student attempts, assign scores, and provide individualized feedback",
            "hi": "विद्यार्थियों के प्रयासों की समीक्षा करें, अंक दें और व्यक्तिगत सुझाव लिखें",
            "bn": "শিক্ষার্থীদের উত্তর পর্যালোচনা করুন, স্কোর দিন এবং মতামত প্রদান করুন",
            "mr": "विद्यार्थ्यांच्या प्रयत्नांचे पुनरावलोकन करा, गुण द्या आणि अभिप्राय नोंदवा",
            "pa": "ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਯਤਨਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ, ਅੰਕ ਦਿਓ ਅਤੇ ਫੀਡਬੈਕ ਲਿਖੋ",
            "ur": "طلبہ کے کام کی جانچ کریں، نمبر دیں اور رائے فراہم کریں",
            "ta": "மாணவர் முயற்சிகளை மதிப்பாய்வு செய்து கருத்துக்களை வழங்கவும்",
            "as": "ছাত্ৰ-ছাত্ৰীৰ উত্তৰ পৰীক্ষা কৰক, নম্বৰ দিয়ক আৰু পৰামৰ্শ লিখক",
        },
    },
    "teacher_curriculum": {
        "label": {
            "en": "Curriculum & Books",
            "hi": "पाठ्यक्रम व पुस्तकें",
            "bn": "পাঠ্যক্রম ও বই",
            "mr": "अभ्यासक्रम आणि पुस्तके",
            "pa": "ਪਾਠਕ੍ਰਮ ਅਤੇ ਕਿਤਾਬਾਂ",
            "ur": "نصاب اور کتب",
            "ta": "பாடத்திட்டம் & புத்தகங்கள்",
            "as": "পাঠ্যক্ৰম আৰু কিতাপ",
        },
        "description": {
            "en": "Browse NCERT books and school learning materials",
            "hi": "एनसीईआरटी पाठ्यपुस्तकें और विद्यालय अध्ययन सामग्री देखें",
            "bn": "এনসিইআরটি বই এবং স্কুলের অধ্যয়নের উপকরণ ব্রাউজ করুন",
            "mr": "एनसीईआरटी पुस्तके आणि शालेय अध्ययन साहित्य ब्राउझ करा",
            "pa": "ਐਨਸੀਈਆਰਟੀ ਕਿਤਾਬਾਂ ਅਤੇ ਸਕੂਲ ਸਿੱਖਣ ਸਮੱਗਰੀ ਵੇਖੋ",
            "ur": "این سی ای آر ٹی کتب اور تعلیمی مواد کا مطالعہ کریں",
            "ta": "NCERT புத்தகங்கள் மற்றும் பள்ளி கற்றல் பொருட்களை உலாவவும்",
            "as": "এনচিইআৰটি পুথি আৰু বিদ্যালয়ৰ শিক্ষণ সামগ্ৰী অন্বেষণ কৰক",
        },
    },

    # Student Navigation
    "student_overview": {
        "label": {
            "en": "Student Overview",
            "hi": "विद्यार्थी विवरण",
            "bn": "শিক্ষার্থী ড্যাশবোর্ড",
            "mr": "विद्यार्थी विहंगावलोकन",
            "pa": "ਵਿਦਿਆਰਥੀ ਸੰਖੇਪ",
            "ur": "طالب علم جائزہ",
            "ta": "மாணவர் கண்ணோட்டம்",
            "as": "ছাত্ৰ-ছাত্ৰীৰ সাৰাংশ",
        },
        "description": {
            "en": "Student profile, enrolled class, unique student number, and learning metrics",
            "hi": "विद्यार्थी प्रोफ़ाइल, कक्षा, विशिष्ट छात्र क्रमांक और अध्ययन प्रगति",
            "bn": "শিক্ষার্থী প্রোফাইল, নথিভুক্ত ক্লাস, আইডি এবং শিক্ষার মেট্রিক্স",
            "mr": "विद्यार्थी प्रोफाइल, नोंदणीकृत वर्ग, युनिक आयडी आणि प्रगती",
            "pa": "ਵਿਦਿਆਰਥੀ ਪ੍ਰੋਫਾਈਲ, ਦਾਖਲਾ ਜਮਾਤ, ਵਿਲੱਖਣ ਆਈਡੀ ਅਤੇ ਸਿੱਖਣ ਮਾਪਦੰਡ",
            "ur": "طالب علم پروفائل، کلاس، منفرد نمبر اور تعلیمی کارکردگی",
            "ta": "மாணவர் சுயவிவரம், பதிவுசெய்த வகுப்பு மற்றும் கற்றல் அளவீடுகள்",
            "as": "ছাত্ৰ প্ৰফাইল, শ্ৰেণী, ছাত্ৰ নম্বৰ আৰু শিক্ষণৰ অগ্ৰগতি",
        },
    },
    "student_modules": {
        "label": {
            "en": "Learning Modules",
            "hi": "अध्ययन मॉड्यूल",
            "bn": "লার্নিং মডিউল",
            "mr": "अध्ययन मॉड्यूल",
            "pa": "ਸਿੱਖਣ ਮੋਡੀਊਲ",
            "ur": "تعلیمی ماڈیولز",
            "ta": "கற்றல் தொகுதிகள்",
            "as": "শিক্ষণ মডিউল",
        },
        "description": {
            "en": "Read school-provided chapters and NCERT interactive textbooks",
            "hi": "विद्यालय द्वारा प्रदत्त अध्याय और एनसीईआरटी डिजिटल पुस्तकें पढ़ें",
            "bn": "স্কুলের পাঠ্য অধ্যায় এবং ইন্টারেক্টিভ এনসিইআরটি বই পড়ুন",
            "mr": "शाळेने दिलेले धडे आणि डिजिटल एनसीईआरटी पुस्तके वाचा",
            "pa": "ਸਕੂਲ ਦੇ ਅਧਿਆਇ ਅਤੇ ਇੰਟਰਐਕਟਿਵ ਐਨਸੀਈਆਰਟੀ ਕਿਤਾਬਾਂ ਪੜ੍ਹੋ",
            "ur": "اسکول کے اسباق اور ڈیجیٹل این سی ای آر ٹی کتب پڑھیں",
            "ta": "பள்ளி வழங்கிய பாடங்கள் மற்றும் NCERT நூல்களைப் படிக்கவும்",
            "as": "বিদ্যালয়ে দিয়া অধ্যায় আৰু এনচিইআৰটি পুথি অধ্যয়ন কৰক",
        },
    },
    "student_assignments": {
        "label": {
            "en": "Class Assignments",
            "hi": "कक्षा असाइनमेंट",
            "bn": "ক্লাস অ্যাসাইনমেন্ট",
            "mr": "वर्ग गृहपाठ",
            "pa": "ਜਮਾਤੀ ਅਸਾਈਨਮੈਂਟ",
            "ur": "کلاس اسائنمنٹس",
            "ta": "வகுப்பு பணிகள்",
            "as": "শ্ৰেণীৰ গৃহকৰ্ম",
        },
        "description": {
            "en": "Complete pending homework, submit solutions, and view teacher marks and feedback",
            "hi": "गृहकार्य पूरा करें, उत्तर जमा करें और शिक्षक द्वारा दिए अंक व टिप्पणी देखें",
            "bn": "বাকি থাকা হোমওয়ার্ক সম্পন্ন করুন এবং শিক্ষকের মতামত ও নম্বর দেখুন",
            "mr": "बाकी असलेला गृहपाठ पूर्ण करा आणि शिक्षकांचा अभिप्राय व गुण पहा",
            "pa": "ਬਾਕੀ ਹੋਮਵਰਕ ਪੂਰਾ ਕਰੋ ਅਤੇ ਅਧਿਆਪਕ ਦੇ ਅੰਕ ਤੇ ਫੀਡਬੈਕ ਦੇਖੋ",
            "ur": "ہوم ورک مکمل کریں اور استاد کے دیے گئے نمبر اور رائے دیکھیں",
            "ta": "வீட்டுப்பாடங்களை முடித்து ஆசிரியரின் கருத்துக்களைக் காண்க",
            "as": "গৃহকাৰ্য্য সম্পূৰ্ণ কৰক আৰু শিক্ষকৰ নম্বৰ ও পৰামৰ্শ চাওক",
        },
    },
    "student_quizzes": {
        "label": {
            "en": "AI Practice Quizzes",
            "hi": "एआई अभ्यास क्विज़",
            "bn": "এআই অনুশীলন কুইজ",
            "mr": "एआय सराव क्विझ",
            "pa": "ਏਆਈ ਅਭਿਆਸ ਕੁਇਜ਼",
            "ur": "اے آئی پریکٹس کوئز",
            "ta": "AI பயிற்சி வினாடிவினாக்கள்",
            "as": "এআই অনুশীলন কুইজ",
        },
        "description": {
            "en": "Interactive AI-generated concept tests and diagnostic exercises",
            "hi": "इंटरएक्टिव एआई-जनित संकल्पना परीक्षण और नैदानिक अभ्यास",
            "bn": "ইন্টারেক্টিভ এআই-নির্মিত ধারণা পরীক্ষা এবং অনুশীলন",
            "mr": "परस्परसंवादी एआय-निर्मित संकल्पना चाचण्या आणि सराव",
            "pa": "ਏਆਈ-ਤਿਆਰ ਸੰਕਲਪ ਟੈਸਟ ਅਤੇ ਅਭਿਆਸ",
            "ur": "اے آئی کے تیار کردہ انٹرایکٹو تصوراتی ٹیسٹ اور مشقیں",
            "ta": "ஊடாடும் AI கருத்து தேர்வுகள் மற்றும் பயிற்சிகள்",
            "as": "এআই-নিৰ্মিত ধাৰণা পৰীক্ষা আৰু শিক্ষণ অনুশীলন",
        },
    },
    "student_history": {
        "label": {
            "en": "Assessment History",
            "hi": "परीक्षण इतिहास",
            "bn": "মূল্যায়ন ইতিহাস",
            "mr": "मूल्यांकन इतिहास",
            "pa": "ਟੈਸਟ ਇਤਿਹਾਸ",
            "ur": "امتحانی تاریخ",
            "ta": "மதிப்பீட்டு வரலாறு",
            "as": "মূল্যায়নৰ ইতিহাস",
        },
        "description": {
            "en": "View your past test performances, diagnostic quiz attempts, scores, and feedbacks",
            "hi": "अपने पूर्व परीक्षण परिणाम, नैदानिक क्विज़ के अंक और सुझाव देखें",
            "bn": "অতীত পরীক্ষার ফলাফল, স্কোর এবং শিক্ষকের প্রতিক্রিয়া দেখুন",
            "mr": "मागील चाचण्यांचे निकाल, गुण आणि अभिप्राय पहा",
            "pa": "ਪਿਛਲੇ ਟੈਸਟ ਪ੍ਰਦਰਸ਼ਨ, ਅੰਕ ਅਤੇ ਫੀਡਬੈਕ ਦੇਖੋ",
            "ur": "ماضی کے امتحانات، اسکورز اور آراء کا ریکارڈ دیکھیں",
            "ta": "கடந்த தேர்வு செயல்திறன், மதிப்பெண்கள் மற்றும் கருத்துக்களைக் காண்க",
            "as": "পুৰণি পৰীক্ষাৰ ফলাফল, নম্বৰ আৰু পৰামৰ্শসমূহ চাওক",
        },
    },

    # School Navigation
    "school_overview": {
        "label": {
            "en": "Branch Overview",
            "hi": "शाखा विवरण",
            "bn": "শাখা ড্যাশবোর্ড",
            "mr": "शाखा विहंगावलोकन",
            "pa": "ਸ਼ਾਖਾ ਸੰਖੇਪ",
            "ur": "برانچ جائزہ",
            "ta": "கிளை கண்ணோட்டம்",
            "as": "শাখা সাৰাংশ",
        },
        "description": {
            "en": "School branch profile, student prefix, and academic summary",
            "hi": "विद्यालय शाखा प्रोफ़ाइल, छात्र उपसर्ग और शैक्षणिक सारांश",
            "bn": "স্কুল শাখা প্রোফাইল, উপসর্গ এবং একাডেমিক সারাংশ",
            "mr": "शाळा शाखा प्रोफाइल, विद्यार्थी उपसर्ग आणि शैक्षणिक सारांश",
            "pa": "ਸਕੂਲ ਸ਼ਾਖਾ ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਅਕਾਦਮਿਕ ਸਾਰ",
            "ur": "اسکول برانچ پروفائل اور تعلیمی خلاصہ",
            "ta": "பள்ளி கிளை சுயவிவரம் மற்றும் கல்வி சுருக்கம்",
            "as": "বিদ্যালয় শাখা প্ৰফাইল আৰু শৈক্ষিক সাৰাংশ",
        },
    },
    "school_modules": {
        "label": {
            "en": "Curriculum Modules",
            "hi": "पाठ्यक्रम मॉड्यूल",
            "bn": "পাঠ্যক্রম মডিউল",
            "mr": "अभ्यासक्रम मॉड्यूल",
            "pa": "ਪਾਠਕ੍ਰਮ ਮੋਡੀਊਲ",
            "ur": "نصابی ماڈیولز",
            "ta": "பாடத்திட்ட தொகுதிகள்",
            "as": "পাঠ্যক্ৰম মডিউল",
        },
        "description": {
            "en": "Upload, update, and manage PDF and image OCR modules for Classes 1 to 5",
            "hi": "कक्षा 1 से 5 हेतु पीडीएफ और चित्र ओसीआर मॉड्यूल अपलोड और प्रबंधित करें",
            "bn": "ক্লাস ১ থেকে ৫ এর জন্য পিডিএফ এবং ইমেজ ওসিআর মডিউল পরিচালনা করুন",
            "mr": "इयत्ता १ ते ५ साठी पीडीएफ आणि ओसीआर मॉड्यूल व्यवस्थापित करा",
            "pa": "ਜਮਾਤ 1 ਤੋਂ 5 ਲਈ ਪੀਡੀਐਫ ਅਤੇ ਚਿੱਤਰ ਓਸੀਆਰ ਮੋਡੀਊਲ ਅਪਲੋਡ ਕਰੋ",
            "ur": "کلاس 1 تا 5 کے لیے پی ڈی ایف اور او سی آر ماڈیولز اپ لوڈ اور منظم کریں",
            "ta": "1 முதல் 5 வகுப்புகளுக்கான PDF மற்றும் OCR தொகுதிகளை நிர்வகிக்கவும்",
            "as": "১ম ৰ পৰা ৫ম শ্ৰেণীৰ বাবে পিডিএফ আৰু অ'চিআৰ মডিউল পৰিচালনা কৰক",
        },
    },
    "school_admin-requests": {
        "label": {
            "en": "Administrator Requests",
            "hi": "प्रशासक अनुरोध",
            "bn": "প্রশাসক অনুরোধ",
            "mr": "प्रशासक विनंत्या",
            "pa": "ਪ੍ਰਬੰਧਕ ਬੇਨਤੀਆਂ",
            "ur": "ایڈمنسٹریٹر درخواستیں",
            "ta": "நிர்வாகி கோரிக்கைகள்",
            "as": "প্ৰশাসকৰ অনুৰোধ",
        },
        "description": {
            "en": "Approve or reject people requesting administrator access to your school",
            "hi": "अपने विद्यालय में प्रशासक पद हेतु आए अनुरोध स्वीकृत या अस्वीकृत करें",
            "bn": "প্রশাসক অনুমোদনের আবেদন গ্রহণ বা প্রত্যাখ্যান করুন",
            "mr": "प्रशासक पदासाठीच्या विनंत्या मंजूर किंवा नाकारा",
            "pa": "ਪ੍ਰਬੰਧਕੀ ਪਹੁੰਚ ਲਈ ਬੇਨਤੀਆਂ ਨੂੰ ਮਨਜ਼ੂਰ ਜਾਂ ਰੱਦ ਕਰੋ",
            "ur": "اسکول ایڈمن رسائی کی درخواستوں کو منظور یا مسترد کریں",
            "ta": "நிர்வாக அணுகல் கோரிக்கைகளை ஏற்கவும் அல்லது நிராகரிக்கவும்",
            "as": "প্ৰশাসক পদৰ অনুৰোধসমূহ অনুমোদন বা নাকচ কৰক",
        },
    },
    "school_teachers": {
        "label": {
            "en": "Teacher Directory & Classes",
            "hi": "शिक्षक निर्देशिका व कक्षाएँ",
            "bn": "শিক্ষক ডিরেক্টরি ও ক্লাস",
            "mr": "शिक्षक निर्देशिका आणि वर्ग",
            "pa": "ਅਧਿਆਪਕ ਸੂਚੀ ਅਤੇ ਜਮਾਤਾਂ",
            "ur": "اساتذہ ڈائرکٹری اور کلاسز",
            "ta": "ஆசிரியர் அடைவு & வகுப்புகள்",
            "as": "শিক্ষক নিৰ্দেশিকা আৰু শ্ৰেণীসমূহ",
        },
        "description": {
            "en": "Manage registered branch teachers and assign or de-assign class sections (e.g. 4th A)",
            "hi": "शाखा के पंजीकृत शिक्षकों का प्रबंधन करें और कक्षा अनुभाग आवंटित करें",
            "bn": "নিবন্ধিত শিক্ষকদের পরিচালনা করুন এবং ক্লাস সেকশন বরাদ্দ করুন",
            "mr": "नोंदणीकृत शिक्षकांचे व्यवस्थापन करा आणि वर्ग विभाग नियुक्त करा",
            "pa": "ਰਜਿਸਟਰਡ ਅਧਿਆਪਕਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ ਅਤੇ ਜਮਾਤ ਸੈਕਸ਼ਨ ਨਿਰਧਾਰਤ ਕਰੋ",
            "ur": "اساتذہ کا انتظام کریں اور کلاس سیکشن تفویض کریں",
            "ta": "பதிவுசெய்த ஆசிரியர்களை நிர்வகித்து வகுப்புகளை ஒதுக்குங்கள்",
            "as": "পঞ্জীয়নভুক্ত শিক্ষকসকলৰ ব্যৱস্থাপনা কৰক আৰু শ্ৰেণী শাখা দিয়ক",
        },
    },

    # Parent Navigation
    "parent_overview": {
        "label": {
            "en": "Parent Overview",
            "hi": "अभिभावक विवरण",
            "bn": "অভিভাবক ড্যাশবোর্ড",
            "mr": "पालक विहंगावलोकन",
            "pa": "ਮਾਪੇ ਸੰਖੇਪ",
            "ur": "والدین جائزہ",
            "ta": "பெற்றோர் கண்ணோட்டம்",
            "as": "অভিভাৱক সাৰাংশ",
        },
        "description": {
            "en": "Parent account details and quick summary of linked children",
            "hi": "अभिभावक खाता विवरण और संबद्ध बच्चों का संक्षिप्त विवरण",
            "bn": "অভিভাবক অ্যাকাউন্ট এবং সংযুক্ত সন্তানদের সংক্ষিপ্ত বিবরণ",
            "mr": "पालक खाते आणि जोडलेल्या मुलांचा संक्षिप्त सारांश",
            "pa": "ਮਾਪਿਆਂ ਦਾ ਖਾਤਾ ਅਤੇ ਜੁੜੇ ਬੱਚਿਆਂ ਦਾ ਸੰਖੇਪ",
            "ur": "والدین کا اکاؤنٹ اور منسلک بچوں کا فوری خلاصہ",
            "ta": "பெற்றோர் கணக்கு மற்றும் இணைக்கப்பட்ட குழந்தைகளின் சுருக்கம்",
            "as": "অভিভাৱক একাউণ্ট আৰু সংযুক্ত সন্তানৰ সাৰাংশ",
        },
    },
    "parent_children": {
        "label": {
            "en": "My Children",
            "hi": "मेरे बच्चे",
            "bn": "আমার সন্তান",
            "mr": "माझी मुले",
            "pa": "ਮੇਰੇ ਬੱਚੇ",
            "ur": "میرے بچے",
            "ta": "எனது குழந்தைகள்",
            "as": "মোৰ সন্তানসমূহ",
        },
        "description": {
            "en": "Monitor linked children, enrolled classes, learning modules, assignments, and grades",
            "hi": "संबद्ध बच्चों की कक्षा, अध्ययन मॉड्यूल, असाइनमेंट और अंकों की निगरानी करें",
            "bn": "সন্তানদের ক্লাস, লার্নিং মডিউল, অ্যাসাইনমেন্ট এবং গ্রেড পর্যবেক্ষণ করুন",
            "mr": "मुलांचे वर्ग, अभ्यासक्रम, गृहपाठ आणि गुण पहा",
            "pa": "ਬੱਚਿਆਂ ਦੀ ਜਮਾਤ, ਸਿੱਖਣ ਮੋਡੀਊਲ, ਹੋਮਵਰਕ ਅਤੇ ਗ੍ਰੇਡ ਵੇਖੋ",
            "ur": "بچوں کی کلاس، تعلیمی ماڈیولز، اسائنمنٹس اور گریڈز پر نظر رکھیں",
            "ta": "குழந்தைகளின் வகுப்புகள், பாடங்கள் மற்றும் மதிப்பெண்களைக் கண்காணிக்கவும்",
            "as": "সন্তানৰ শ্ৰেণী, শিক্ষণ মডিউল, গৃহকৰ্ম আৰু নম্বৰ নিৰীক্ষণ কৰক",
        },
    },
    "parent_progress": {
        "label": {
            "en": "Detailed Progress",
            "hi": "विस्तृत प्रगति विश्लेषण",
            "bn": "বিস্তারিত অগ্রগতি",
            "mr": "तपशीलवार प्रगती",
            "pa": "ਵਿਸਤ੍ਰਿਤ ਪ੍ਰਗਤੀ",
            "ur": "تفصیلی پیش رفت",
            "ta": "விரிவான முன்னேற்றம்",
            "as": "বিশদ অগ্ৰগতি",
        },
        "description": {
            "en": "Consecutive assessment trends, score growth, lagging areas, and curriculum mastery",
            "hi": "लगातार परीक्षण रुझान, अंकों में सुधार, कमजोर विषय और समग्र निपुणता",
            "bn": "পরীক্ষার ফলাফল বৃদ্ধি, দুর্বল বিষয় এবং সার্বিক দক্ষতা",
            "mr": "चाचणी ट्रेंड, गुणांची वाढ, कमकुवत विषय आणि अभ्यासक्रमातील प्राविण्य",
            "pa": "ਟੈਸਟ ਰੁਝਾਨ, ਸਕੋਰ ਵਾਧਾ, ਕਮਜ਼ੋਰ ਵਿਸ਼ੇ ਅਤੇ ਪਾਠਕ੍ਰਮ ਮੁਹਾਰਤ",
            "ur": "امتحانی رجحانات، اسکور میں بہتری اور کمزور موضوعات",
            "ta": "தேர்வு போக்குகள், மதிப்பெண் வளர்ச்சி மற்றும் பாடத்திட்ட தேர்ச்சி",
            "as": "ধাৰাবাহিক পৰীক্ষাৰ ফলাফল, নম্বৰৰ বৃদ্ধি আৰু বিষয়ৰ দখল",
        },
    },

    # Admin Navigation
    "admin_overview": {
        "label": {
            "en": "System Overview",
            "hi": "सिस्टम विवरण",
            "bn": "সিস্টেম ড্যাশবোর্ড",
            "mr": "प्रणाली विहंगावलोकन",
            "pa": "ਸਿਸਟਮ ਸੰਖੇਪ",
            "ur": "سسٹم جائزہ",
            "ta": "கணினி கண்ணோட்டம்",
            "as": "ব্যৱস্থা সাৰাংশ",
        },
        "description": {
            "en": "Platform status, system health, and overall institution statistics",
            "hi": "प्लेटफ़ॉर्म स्थिति, स्वास्थ्य और समग्र संस्थागत आंकड़े",
            "bn": "প্ল্যাটফর্ম স্থিতি, সিস্টেম স্বাস্থ্য এবং প্রাতিষ্ঠানিক পরিসংখ্যান",
            "mr": "प्लॅटफॉर्म स्थिती आणि सर्व संस्थांची आकडेवारी",
            "pa": "ਪਲੇਟਫਾਰਮ ਸਥਿਤੀ ਅਤੇ ਸਮੁੱਚੇ ਸੰਸਥਾਗਤ ਅੰਕੜੇ",
            "ur": "پلیٹ فارم کی حالت اور مجموعی ادارہ جاتی اعداد و شمار",
            "ta": "தளத்தின் நிலை மற்றும் ஒட்டுமொத்த நிறுவன புள்ளிவிவரங்கள்",
            "as": "প্লেটফৰ্ম স্থিতি আৰু সামগ্ৰিক প্ৰতিষ্ঠানিক পৰিসংখ্যা",
        },
    },
    "admin_ncert_master": {
        "label": {
            "en": "NCERT Master Catalogue",
            "hi": "एनसीईआरटी मास्टर संग्रह",
            "bn": "এনসিইআরটি মাস্টার ক্যাটালগ",
            "mr": "एनसीईआरटी मुख्य सूची",
            "pa": "ਐਨਸੀਈਆਰਟੀ ਮਾਸਟਰ ਸੂਚੀ",
            "ur": "این سی ای آر ٹی ماسٹر کیٹلاگ",
            "ta": "NCERT முதன்மை பட்டியல்",
            "as": "এনচিইআৰটি মূল সূচী",
        },
        "description": {
            "en": "Central textbook repository: upload, edit, detach, and delete official NCERT book PDFs",
            "hi": "केंद्रीय पाठ्यपुस्तक संग्रह: आधिकारिक एनसीईआरटी पीडीएफ प्रबंधित करें",
            "bn": "পাঠ্যপুস্তক সংগ্রহ: এনসিইআরটি বইয়ের পিডিএফ পরিচালনা করুন",
            "mr": "पाठ्यपुस्तक भांडार: अधिकृत एनसीईआरटी पीडीएफ व्यवस्थापित करा",
            "pa": "ਕੇਂਦਰੀ ਪਾਠ-ਪੁਸਤਕ ਭੰਡਾਰ: ਅਧਿਕਾਰਤ ਐਨਸੀਈਆਰਟੀ ਪੀਡੀਐਫ ਪ੍ਰਬੰਧਿਤ ਕਰੋ",
            "ur": "مرکزی درسی کتب ذخیرہ: سرکاری این سی ای آر ٹی پی ڈی ایف کتب کا انتظام کریں",
            "ta": "அதிகாரப்பூர்வ NCERT PDF புத்தகங்களை நிர்வகிக்கவும்",
            "as": "কেন্দ্ৰীয় পাঠ্যপুথি ভঁৰাল: এনচিইআৰটি কিতাপৰ পিডিএফ পৰিচালনা কৰক",
        },
    },
    "admin_school-requests": {
        "label": {
            "en": "School Requests",
            "hi": "विद्यालय पंजीकरण अनुरोध",
            "bn": "স্কুল অনুরোধ",
            "mr": "शाळा विनंत्या",
            "pa": "ਸਕੂਲ ਬੇਨਤੀਆਂ",
            "ur": "اسکول کی درخواستیں",
            "ta": "பள்ளி கோரிக்கைகள்",
            "as": "বিদ্যালয়ৰ অনুৰোধসমূহ",
        },
        "description": {
            "en": "Schools awaiting platform approval before their administrator gets access",
            "hi": "प्लेटफ़ॉर्म स्वीकृति की प्रतीक्षा में नए विद्यालय पंजीकरण",
            "bn": "অনুমোদনের অপেক্ষায় থাকা স্কুলের আবেদনসমূহ",
            "mr": "प्लॅটফৰ্ম मंजुरीच्या प्रतीक्षेत असलेल्या शाळा",
            "pa": "ਪਲੇਟਫਾਰਮ ਦੀ ਪ੍ਰਵਾਨਗੀ ਦੀ ਉਡੀਕ ਕਰ ਰਹੇ ਸਕੂਲ",
            "ur": "منظوری کے منتظر اسکولوں کی درخواستیں",
            "ta": "தள ஒப்புதலுக்காக காத்திருக்கும் பள்ளிகள்",
            "as": "অনুমোদনৰ অপেক্ষাত থকা বিদ্যালয় পঞ্জীয়ন",
        },
    },
    "admin_schools": {
        "label": {
            "en": "Registered Institutions",
            "hi": "पंजीकृत शिक्षण संस्थान",
            "bn": "নিবন্ধিত শিক্ষা প্রতিষ্ঠান",
            "mr": "नोंदणीकृत शैक्षणिक संस्था",
            "pa": "ਰਜਿਸਟਰਡ ਵਿੱਦਿਅਕ ਸੰਸਥਾਵਾਂ",
            "ur": "رجسٹرڈ تعلیمی ادارے",
            "ta": "பதிவுசெய்யப்பட்ட நிறுவனங்கள்",
            "as": "পঞ্জীয়নভুক্ত শিক্ষানুষ্ঠান",
        },
        "description": {
            "en": "Directory of all registered school branches and administrator accounts across India",
            "hi": "भारत भर में पंजीकृत सभी विद्यालय शाखाओं और प्रशासकों की निर्देशिका",
            "bn": "সমগ্র ভারতের নিবন্ধিত স্কুল শাখা এবং প্রশাসকদের তালিকা",
            "mr": "नोंदणीकृत शाळा शाखा आणि प्रशासकांची निर्देशिका",
            "pa": "ਰਜਿਸਟਰਡ ਸਕੂਲ ਸ਼ਾਖਾਵਾਂ ਅਤੇ ਪ੍ਰਬੰਧਕਾਂ ਦੀ ਸੂਚੀ",
            "ur": "تمام رجسٹرڈ اسکول برانچز اور ایڈمن اکاؤنٹس کی ڈائرکٹری",
            "ta": "பதிவுசெய்யப்பட்ட பள்ளி கிளைகள் மற்றும் நிர்வாகிகளின் அடைவு",
            "as": "সকলো পঞ্জীয়নভুক্ত বিদ্যালয় শাখা আৰু প্ৰশাসকৰ নিৰ্দেশিকা",
        },
    },
}

# ── Base English Permissions Configuration ─────────────────────────────────────
BASE_ROLE_PERMISSIONS: Dict[str, Dict] = {
    "teacher": {
        "role": "teacher",
        "role_label": "Educator / Teacher",
        "capabilities": [
            "can_view_profile",
            "can_preview_class",
            "can_view_student_roster",
            "can_view_class_modules",
            "can_create_pdf_assignment",
            "can_create_ai_quiz",
            "can_edit_assignment",
            "can_delete_assignment",
            "can_review_submissions",
            "can_grade_submissions",
            "can_provide_feedback",
            "can_browse_ncert_library",
        ],
        "navigation": [
            {
                "id": "overview",
                "label": "Teacher Overview",
                "description": "Profile summary, branch details, and active assigned classes",
                "icon": "LayoutDashboard",
                "category": "Main",
                "is_default": True,
                "actions": [
                    {"key": "view_profile", "label": "View Profile", "description": "Access teacher account details"},
                    {"key": "view_class_stats", "label": "Class Metrics", "description": "Summary of assigned student count"},
                ],
            },
            {
                "id": "classes",
                "label": "Assigned Classes",
                "description": "Preview your assigned class sections, student rosters, and curriculum",
                "icon": "Users",
                "category": "Academics",
                "actions": [
                    {"key": "preview_class", "label": "Preview Class", "description": "View class details and active section"},
                    {"key": "view_student_roster", "label": "Student Roster", "description": "List all enrolled students in your class"},
                    {"key": "view_class_modules", "label": "Class Modules", "description": "Inspect subject modules available to students"},
                ],
            },
            {
                "id": "assignments",
                "label": "Assignments & Quizzes",
                "description": "Create and manage PDF homework and adaptive AI quizzes",
                "icon": "FileText",
                "category": "Academics",
                "badge": "Tasks",
                "actions": [
                    {"key": "create_pdf_assignment", "label": "Upload PDF Assignment", "description": "Upload homework PDF with deadline"},
                    {"key": "create_ai_quiz", "label": "Create AI Quiz", "description": "Generate adaptive quiz from curriculum modules"},
                    {"key": "edit_assignment", "label": "Edit Assignment", "description": "Update title, description, or deadlines"},
                    {"key": "delete_assignment", "label": "Delete Assignment", "description": "Remove assignment from class"},
                ],
            },
            {
                "id": "grading",
                "label": "Submissions & Grading",
                "description": "Review student attempts, assign scores, and provide individualized feedback",
                "icon": "Award",
                "category": "Evaluation",
                "actions": [
                    {"key": "review_submissions", "label": "Review Submissions", "description": "Inspect student completed work"},
                    {"key": "grade_submissions", "label": "Score Assessment", "description": "Enter scores out of 100"},
                    {"key": "provide_feedback", "label": "Student Feedback", "description": "Write direct feedback to guide student learning"},
                ],
            },
            {
                "id": "curriculum",
                "label": "Curriculum & Books",
                "description": "Browse NCERT books and school learning materials",
                "icon": "BookOpen",
                "category": "Resources",
                "actions": [
                    {"key": "browse_ncert_library", "label": "Browse NCERT Library", "description": "Access textbook chapters and materials"},
                ],
            },
        ],
    },
    "student": {
        "role": "student",
        "role_label": "Student Learner",
        "capabilities": [
            "can_view_profile",
            "can_setup_class",
            "can_read_school_modules",
            "can_read_ncert_books",
            "can_view_assignments",
            "can_submit_assignment",
            "can_view_teacher_feedback",
            "can_take_practice_quizzes",
            "can_view_history",
        ],
        "navigation": [
            {
                "id": "overview",
                "label": "Student Overview",
                "description": "Student profile, enrolled class, unique student number, and learning metrics",
                "icon": "LayoutDashboard",
                "category": "Main",
                "is_default": True,
                "actions": [
                    {"key": "view_profile", "label": "View Profile", "description": "Access student information and ID"},
                    {"key": "setup_class", "label": "Class Setup", "description": "Configure enrolled class and section"},
                ],
            },
            {
                "id": "modules",
                "label": "Learning Modules",
                "description": "Read school-provided chapters and NCERT interactive textbooks",
                "icon": "BookOpen",
                "category": "Learning",
                "actions": [
                    {"key": "read_school_modules", "label": "School Modules", "description": "Access curriculum study PDFs"},
                    {"key": "read_ncert_books", "label": "NCERT Library", "description": "Access digitized textbook collection"},
                ],
            },
            {
                "id": "assignments",
                "label": "Class Assignments",
                "description": "Complete pending homework, submit solutions, and view teacher marks and feedback",
                "icon": "FileText",
                "category": "Learning",
                "badge": "Active",
                "actions": [
                    {"key": "view_assignments", "label": "View Assignments", "description": "Inspect assigned homework"},
                    {"key": "submit_assignment", "label": "Submit Assignment", "description": "Mark assignments as submitted"},
                    {"key": "view_teacher_feedback", "label": "Teacher Feedback", "description": "Read teacher guidance and scores"},
                ],
            },
            {
                "id": "quizzes",
                "label": "AI Practice Quizzes",
                "description": "Interactive AI-generated concept tests and diagnostic exercises",
                "icon": "Sparkles",
                "category": "Practice",
                "actions": [
                    {"key": "take_practice_quizzes", "label": "Take Quizzes", "description": "Interactive adaptive quiz assessments"},
                ],
            },
            {
                "id": "history",
                "label": "Assessment History",
                "description": "View your past test performances, diagnostic quiz attempts, scores, and feedbacks",
                "icon": "Clock",
                "category": "Evaluation",
                "actions": [
                    {"key": "view_history", "label": "View History", "description": "Access past test & diagnostic attempt history"},
                ],
            },
        ],
    },
    "school": {
        "role": "school",
        "role_label": "School Admin",
        "capabilities": [
            "can_view_school_profile",
            "can_upload_pdf_module",
            "can_upload_image_module",
            "can_edit_module",
            "can_delete_module",
            "can_link_ncert_books",
            "can_review_admin_claims",
            "can_manage_teachers",
            "can_assign_teacher_classes",
            "can_deassign_teacher_classes",
        ],
        "navigation": [
            {
                "id": "overview",
                "label": "Branch Overview",
                "description": "School branch profile, student prefix, and academic summary",
                "icon": "LayoutDashboard",
                "category": "Main",
                "is_default": True,
                "actions": [
                    {"key": "view_school_profile", "label": "School Profile", "description": "View school and branch configuration"},
                ],
            },
            {
                "id": "modules",
                "label": "Curriculum Modules",
                "description": "Upload, update, and manage PDF and image OCR modules for Classes 1 to 5",
                "icon": "Layers",
                "category": "Curriculum",
                "badge": "Core",
                "actions": [
                    {"key": "upload_pdf_module", "label": "Upload PDF Module", "description": "Add standard PDF curriculum content"},
                    {"key": "upload_image_module", "label": "Image-to-PDF OCR", "description": "Convert textbook photos into OCR PDF"},
                    {"key": "delete_module", "label": "Delete Module", "description": "Remove module from class syllabus"},
                ],
            },
            {
                "id": "admin-requests",
                "label": "Administrator Requests",
                "description": "Approve or reject people requesting administrator access to your school",
                "icon": "ShieldCheck",
                "category": "Staff",
                "actions": [
                    {"key": "review_admin_claims", "label": "Review Requests", "description": "Approve or reject administrator access requests"},
                ],
            },
            {
                "id": "teachers",
                "label": "Teacher Directory & Classes",
                "description": "Manage registered branch teachers and assign or de-assign class sections (e.g. 4th A)",
                "icon": "UserCog",
                "category": "Staff",
                "badge": "Admin",
                "actions": [
                    {"key": "manage_teachers", "label": "Teacher Directory", "description": "View registered branch educators"},
                    {"key": "assign_teacher_classes", "label": "Assign Class", "description": "Assign class and section to teacher"},
                    {"key": "deassign_teacher_classes", "label": "De-assign Class", "description": "Remove class section assignment"},
                ],
            },
        ],
    },
    "parent": {
        "role": "parent",
        "role_label": "Parent & Guardian",
        "capabilities": [
            "can_view_parent_profile",
            "can_link_children",
            "can_monitor_child_modules",
            "can_monitor_child_assignments",
            "can_view_child_scores",
            "can_view_child_teacher_feedback",
        ],
        "navigation": [
            {
                "id": "overview",
                "label": "Parent Overview",
                "description": "Parent account details and quick summary of linked children",
                "icon": "LayoutDashboard",
                "category": "Main",
                "is_default": True,
                "actions": [
                    {"key": "view_parent_profile", "label": "Parent Profile", "description": "Access parent profile details"},
                ],
            },
            {
                "id": "children",
                "label": "My Children",
                "description": "Monitor linked children, enrolled classes, learning modules, assignments, and grades",
                "icon": "Users",
                "category": "Family",
                "badge": "Linked",
                "actions": [
                    {"key": "link_children", "label": "Link Child", "description": "Link additional child with Student ID or phone"},
                    {"key": "monitor_child_modules", "label": "Curriculum Progress", "description": "Inspect school & NCERT materials"},
                    {"key": "monitor_child_assignments", "label": "Homework & Quizzes", "description": "Track submissions and teacher marks"},
                ],
            },
            {
                "id": "progress",
                "label": "Detailed Progress",
                "description": "Consecutive assessment trends, score growth, lagging areas, and curriculum mastery",
                "icon": "TrendingUp",
                "category": "Analytics",
                "actions": [
                    {"key": "view_child_scores", "label": "Assessment Growth", "description": "Track score deltas and lagging indicators"},
                ],
            },
        ],
    },
    "admin": {
        "role": "admin",
        "role_label": "Super Administrator",
        "capabilities": [
            "can_view_admin_metrics",
            "can_manage_ncert_master",
            "can_upload_ncert_pdf",
            "can_edit_ncert_book",
            "can_delete_ncert_book",
            "can_view_all_schools",
            "can_review_school_registrations",
        ],
        "navigation": [
            {
                "id": "overview",
                "label": "System Overview",
                "description": "Platform status, system health, and overall institution statistics",
                "icon": "ShieldCheck",
                "category": "System",
                "is_default": True,
                "actions": [
                    {"key": "view_admin_metrics", "label": "Platform Metrics", "description": "Superadmin analytics and counts"},
                ],
            },
            {
                "id": "ncert_master",
                "label": "NCERT Master Catalogue",
                "description": "Central textbook repository: upload, edit, detach, and delete official NCERT book PDFs",
                "icon": "BookOpen",
                "category": "Management",
                "badge": "Master",
                "actions": [
                    {"key": "manage_ncert_master", "label": "Create Books", "description": "Add new official NCERT textbook entries"},
                    {"key": "upload_ncert_pdf", "label": "Upload PDF Content", "description": "Attach master PDF textbook files"},
                    {"key": "delete_ncert_book", "label": "Delete Books", "description": "Remove textbook entries from platform"},
                ],
            },
            {
                "id": "school-requests",
                "label": "School Requests",
                "description": "Schools awaiting platform approval before their administrator gets access",
                "icon": "ClipboardCheck",
                "category": "Registrations",
                "badge": "Review",
                "actions": [
                    {"key": "review_school_registrations", "label": "Review Requests", "description": "Approve or reject school registration requests"},
                ],
            },
            {
                "id": "schools",
                "label": "Registered Institutions",
                "description": "Directory of all registered school branches and administrator accounts across India",
                "icon": "Building2",
                "category": "Management",
                "actions": [
                    {"key": "view_all_schools", "label": "School Directory", "description": "List and filter all school branches"},
                ],
            },
        ],
    },
}


def _clean_lang(lang: Optional[str]) -> str:
    """Extract standard 2-letter language code, defaulting to 'en'."""
    if not lang:
        return "en"
    clean = lang.split(",")[0].split(";")[0].split("-")[0].strip().lower()
    return clean if clean in ("en", "hi", "bn", "mr", "pa", "ur", "ta", "as") else "en"


def get_permissions_for_role(role: str, lang: str = "en") -> RolePermissionsResponse:
    """
    Returns localized role capabilities and navigation schema according to the
    requested language (Accept-Language / query param).
    """
    clean_role = role.lower().strip()
    target_lang = _clean_lang(lang)

    base = BASE_ROLE_PERMISSIONS.get(clean_role)
    if not base:
        # Generic fallback
        return RolePermissionsResponse(
            role=clean_role,
            role_label=clean_role.capitalize(),
            capabilities=[],
            navigation=[
                DashboardPermissionItem(
                    id="overview",
                    label="Dashboard Overview",
                    description="Dashboard home",
                    icon="LayoutDashboard",
                    is_default=True,
                )
            ],
        )

    # Localize role title
    role_label = ROLE_LABELS_I18N.get(clean_role, {}).get(target_lang, base["role_label"])

    # Localize navigation items
    localized_nav: List[DashboardPermissionItem] = []
    for item in base["navigation"]:
        item_id = item["id"]
        nav_key = f"{clean_role}_{item_id}"
        i18n_data = NAV_ITEMS_I18N.get(nav_key, {})

        # Localized label & description
        label = i18n_data.get("label", {}).get(target_lang, item["label"])
        description = i18n_data.get("description", {}).get(target_lang, item["description"])

        # Localized category
        raw_cat = item.get("category", "General")
        category = CATEGORY_I18N.get(raw_cat, {}).get(target_lang, raw_cat)

        # Localized badge
        raw_badge = item.get("badge")
        badge = BADGES_I18N.get(raw_badge, {}).get(target_lang, raw_badge) if raw_badge else None

        # Build actions
        actions: List[PermissionAction] = []
        for act in item.get("actions", []):
            actions.append(
                PermissionAction(
                    key=act["key"],
                    label=act["label"],
                    description=act["description"],
                )
            )

        localized_nav.append(
            DashboardPermissionItem(
                id=item_id,
                label=label,
                description=description,
                icon=item.get("icon", "LayoutDashboard"),
                category=category,
                badge=badge,
                is_default=item.get("is_default", False),
                actions=actions,
            )
        )

    return RolePermissionsResponse(
        role=clean_role,
        role_label=role_label,
        capabilities=base["capabilities"],
        navigation=localized_nav,
    )
