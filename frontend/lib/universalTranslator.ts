/**
 * Universal Phrase Translation Engine for Decode-SIH / VidyaSetu Dashboards.
 * 
 * Provides:
 * 1. Instant 0ms offline phrase translations across 8 regional languages for common dashboard UI text.
 * 2. LocalStorage-backed dynamic translation caching for AI advice, teacher feedback, and custom strings.
 * 3. Batch async translation via backend Gemini API (/api/translate/batch).
 */

export type SupportedLanguage = "en" | "hi" | "bn" | "mr" | "pa" | "ur" | "ta" | "as";

export const UNIVERSAL_PHRASES: Record<string, Record<SupportedLanguage, string>> = {
  // ── Assessment & History Headers ─────────────────────────────────────────
  "Personal Assessment & Attempt History": {
    en: "Personal Assessment & Attempt History",
    hi: "व्यक्तिगत मूल्यांकन व परीक्षण इतिहास",
    bn: "ব্যক্তিগত মূল্যায়ন এবং পরীক্ষার ইতিহাস",
    mr: "वैयक्तिक मूल्यमापन आणि चाचणी इतिहास",
    pa: "ਨਿੱਜੀ ਮੁਲਾਂਕਣ ਅਤੇ ਟੈਸਟ ਇਤਿਹਾਸ",
    ur: "ذاتی تشخیص اور امتحانی تاریخ",
    ta: "தனிப்பட்ட மதிப்பீடு & தேர்வு வரலாறு",
    as: "ব্যক্তিগত মূল্যায়ন আৰু পৰীক্ষাৰ ইতিহাস",
  },
  "Review past scores, attempts, teacher feedback, and AI study advice for diagnostic & class tests.": {
    en: "Review past scores, attempts, teacher feedback, and AI study advice for diagnostic & class tests.",
    hi: "निदानात्मक व कक्षा परीक्षणों के पुराने अंक, प्रयास, शिक्षक टिप्पणियाँ व एआई अध्ययन सुझाव देखें।",
    bn: "ডায়াগনস্টিক এবং ক্লাস পরীক্ষার অতীত স্কোর, প্রচেষ্টা, শিক্ষকের প্রতিক্রিয়া এবং এআই অধ্যয়নের পরামর্শ পর্যালোচনা করুন।",
    mr: "डायग्नोस्टिक आणि वर्ग चाचण्यांचे मागील गुण, प्रयत्न, शिक्षकांचा अभिप्राय आणि एआय अभ्यास सल्ला पहा.",
    pa: "ਡਾਇਗਨੌਸਟਿਕ ਅਤੇ ਕਲਾਸ ਟੈਸਟਾਂ ਦੇ ਪਿਛਲੇ ਸਕੋਰ, ਕੋਸ਼ਿਸ਼ਾਂ, ਅਧਿਆਪਕ ਫੀਡਬੈਕ ਅਤੇ AI ਅਧਿਐਨ ਸਲਾਹ ਦੀ ਸਮੀਖਿਆ ਕਰੋ।",
    ur: "تشخیصی اور کلاس ٹیسٹوں کے ماضی کے اسکور، کوششیں، استاد کے تبصرے اور AI مطالعہ کے مشورے کا جائزہ لیں۔",
    ta: "கண்டறியும் மற்றும் வகுப்புத் தேர்வுகளுக்கான முந்தைய மதிப்பெண்கள், முயற்சிகள், ஆசிரியர் கருத்துக்கள் மற்றும் AI ஆய்வு ஆலோசனைகளை மதிப்பாய்வு செய்யவும்.",
    as: "নিদানিক আৰু শ্ৰেণী পৰীক্ষাৰ পুৰণি নম্বৰ, প্ৰচেষ্টা, শিক্ষকৰ পৰামৰ্শ আৰু এআই অধ্যয়নৰ পৰামৰ্শ পৰ্যালোচনা কৰক।",
  },

  // ── Metric Cards ────────────────────────────────────────────────────────
  "Diagnostic Assessment": {
    en: "Diagnostic Assessment",
    hi: "नैदानिक मूल्यांकन",
    bn: "ডায়াগনস্টিক মূল্যায়ন",
    mr: "डायग्नोस्टिक मूल्यमापन",
    pa: "ਡਾਇਗਨੌਸਟਿਕ ਮੁਲਾਂਕਣ",
    ur: "تشخیصی جانچ",
    ta: "கண்டறியும் மதிப்பீடு",
    as: "নিদানিক মূল্যায়ন",
  },
  "DIAGNOSTIC ASSESSMENT": {
    en: "DIAGNOSTIC ASSESSMENT",
    hi: "नैदानिक मूल्यांकन",
    bn: "ডায়াগনস্টিক মূল্যায়ন",
    mr: "डायग्नोस्टिक मूल्यमापन",
    pa: "ਡਾਇਗਨੌਸਟਿਕ ਮੁਲਾਂਕਣ",
    ur: "تشخیصی جانچ",
    ta: "கண்டறியும் மதிப்பீடு",
    as: "নিদানিক মূল্যায়ন",
  },
  "Class Tests Performance": {
    en: "Class Tests Performance",
    hi: "कक्षा परीक्षण प्रदर्शन",
    bn: "ক্লাস পরীক্ষা পারফরম্যান্স",
    mr: "वर्ग चाचणी कामगिरी",
    pa: "ਕਲਾਸ ਟੈਸਟ ਪ੍ਰਦਰਸ਼ਨ",
    ur: "کلاس ٹیسٹ کی کارکردگی",
    ta: "வகுப்புத் தேர்வு செயல்திறன்",
    as: "শ্ৰেণী পৰীক্ষাৰ প্ৰদৰ্শন",
  },
  "CLASS TESTS PERFORMANCE": {
    en: "CLASS TESTS PERFORMANCE",
    hi: "कक्षा परीक्षण प्रदर्शन",
    bn: "ক্লাস পরীক্ষা পারফরম্যান্স",
    mr: "वर्ग चाचणी कामगिरी",
    pa: "ਕਲਾਸ ਟੈਸਟ ਪ੍ਰਦਰਸ਼ਨ",
    ur: "کلاس ٹیسٹ کی کارکردگی",
    ta: "வகுப்புத் தேர்வு செயல்திறன்",
    as: "শ্ৰেণী পৰীক্ষাৰ প্ৰদৰ্শন",
  },
  "Total Assessments": {
    en: "Total Assessments",
    hi: "कुल मूल्यांकन",
    bn: "মোট মূল্যায়ন",
    mr: "एकूण मूल्यमापन",
    pa: "ਕੁੱਲ ਮੁਲਾਂਕਣ",
    ur: "کل امتحانات",
    ta: "மொத்த மதிப்பீடுகள்",
    as: "মুঠ মূল্যায়ন",
  },
  "TOTAL ASSESSMENTS": {
    en: "TOTAL ASSESSMENTS",
    hi: "कुल मूल्यांकन",
    bn: "মোট মূল্যায়ন",
    mr: "एकूण मूल्यमापन",
    pa: "ਕੁੱਲ ਮੁਲਾਂਕਣ",
    ur: "کل امتحانات",
    ta: "மொத்த மதிப்பீடுகள்",
    as: "মুঠ মূল্যায়ন",
  },
  "Diagnostic & Teacher Tests Combined": {
    en: "Diagnostic & Teacher Tests Combined",
    hi: "नैदानिक और शिक्षक परीक्षण संयुक्त",
    bn: "ডায়াগনস্টিক এবং শিক্ষক পরীক্ষা সম্মিলিত",
    mr: "डायग्नोस्टिक आणि शिक्षक चाचण्या एकत्रित",
    pa: "ਡਾਇਗਨੌਸਟਿਕ ਅਤੇ ਅਧਿਆਪਕ ਟੈਸਟ ਮਿਲਾ ਕੇ",
    ur: "تشخیصی اور استاد کے ٹیسٹ کا مجموعہ",
    ta: "கண்டறியும் & ஆசிரியர் தேர்வுகள் இரண்டும்",
    as: "নিদানিক আৰু শিক্ষক পৰীক্ষা সংযুক্ত",
  },
  "No Scores Yet": {
    en: "No Scores Yet",
    hi: "अभी कोई अंक नहीं",
    bn: "এখনো কোনো স্কোর নেই",
    mr: "अद्याप कोणतेही गुण नाहीत",
    pa: "ਅਜੇ ਕੋਈ ਸਕੋਰ ਨਹੀਂ",
    ur: "ابھی تک کوئی اسکور نہیں",
    ta: "இன்னும் மதிப்பெண்கள் இல்லை",
    as: "এতিয়ালৈকে কোনো নম্বৰ নাই",
  },
  "Completed": {
    en: "Completed",
    hi: "पूर्ण हुआ",
    bn: "সম্পন্ন",
    mr: "पूर्ण झाले",
    pa: "ਪੂਰਾ ਹੋਇਆ",
    ur: "مکمل",
    ta: "முடிந்தது",
    as: "সম্পূৰ্ণ",
  },
  "Pending": {
    en: "Pending",
    hi: "लंबित",
    bn: "বিচারাধীন",
    mr: "प्रलंबित",
    pa: "ਬਕਾਇਆ",
    ur: "زیر التواء",
    ta: "நிலுவையில் உள்ளது",
    as: "বাকী থকা",
  },
  "PASSED": {
    en: "PASSED",
    hi: "उत्तीर्ण",
    bn: "উত্তীর্ণ",
    mr: "उत्तीर्ण",
    pa: "ਪਾਸ",
    ur: "کامیاب",
    ta: "தேர்ச்சி",
    as: "উত্তীৰ্ণ",
  },
  "Passed": {
    en: "Passed",
    hi: "उत्तीर्ण",
    bn: "উত্তীর্ণ",
    mr: "उत्तीर्ण",
    pa: "ਪਾਸ",
    ur: "کامیاب",
    ta: "தேர்ச்சி",
    as: "উত্তীৰ্ণ",
  },
  "FAILED": {
    en: "FAILED",
    hi: "अनुत्तीर्ण",
    bn: "অনুত্তীর্ণ",
    mr: "अनुत्तीर्ण",
    pa: "ਫੇਲ੍ਹ",
    ur: "ناکام",
    ta: "தோல்வி",
    as: "অনুত্তীৰ্ণ",
  },

  // ── Filters & Tabs ──────────────────────────────────────────────────────
  "All": {
    en: "All",
    hi: "सभी",
    bn: "সব",
    mr: "सर्व",
    pa: "ਸਾਰੇ",
    ur: "تمام",
    ta: "அனைத்தும்",
    as: "সকলো",
  },
  "Diagnostic Quizzes": {
    en: "Diagnostic Quizzes",
    hi: "नैदानिक क्विज़",
    bn: "ডায়াগনস্টিক কুইজ",
    mr: "डायग्नोस्टिक क्विझ",
    pa: "ਡਾਇਗਨੌਸਟਿਕ ਕੁਇਜ਼",
    ur: "تشخیصی کوئز",
    ta: "கண்டறியும் வினாடிவினாக்கள்",
    as: "নিদানিক কুইজ",
  },
  "Class Tests": {
    en: "Class Tests",
    hi: "कक्षा परीक्षण",
    bn: "ক্লাস পরীক্ষা",
    mr: "वर्ग चाचण्या",
    pa: "ਕਲਾਸ ਟੈਸਟ",
    ur: "کلاس ٹیسٹ",
    ta: "வகுப்பு தேர்வுகள்",
    as: "শ্ৰেণী পৰীক্ষা",
  },
  "DIAGNOSTIC QUIZ": {
    en: "DIAGNOSTIC QUIZ",
    hi: "नैदानिक क्विज़",
    bn: "ডায়াগনস্টিক কুইজ",
    mr: "डायग्नोस्टिक क्विझ",
    pa: "ਡਾਇਗਨੌਸਟਿਕ ਕੁਇਜ਼",
    ur: "تشخیصی کوئز",
    ta: "கண்டறியும் வினாடிவினா",
    as: "নিদানিক কুইজ",
  },
  "AI QUIZ": {
    en: "AI QUIZ",
    hi: "एआई क्विज़",
    bn: "এআই কুইজ",
    mr: "एआय क्विझ",
    pa: "ਏਆਈ ਕੁਇਜ਼",
    ur: "اے آئی کوئز",
    ta: "AI வினாடிவினா",
    as: "এআই কুইজ",
  },

  // ── Action Buttons & Labels ─────────────────────────────────────────────
  "Adaptive Diagnostic Assessment Attempt": {
    en: "Adaptive Diagnostic Assessment Attempt",
    hi: "अनुकूली नैदानिक मूल्यांकन प्रयास",
    bn: "অভিযোজিত ডায়াগনস্টিক মূল্যায়ন প্রচেষ্টা",
    mr: "अनुकूली डायग्नोस्टिक मूल्यमापन प्रयत्न",
    pa: "ਅਨੁਕੂਲਿਤ ਡਾਇਗਨੌਸਟਿਕ ਮੁਲਾਂਕਣ ਕੋਸ਼ਿਸ਼",
    ur: "موافقت پذیر تشخیصی جانچ کی کوشش",
    ta: "தகவமைப்பு கண்டறியும் மதிப்பீட்டு முயற்சி",
    as: "অভিযোজিত নিদানিক মূল্যায়ন প্ৰচেষ্টা",
  },
  "View Gap Report": {
    en: "View Gap Report",
    hi: "गैप रिपोर्ट देखें",
    bn: "গ্যাপ রিপোর্ট দেখুন",
    mr: "गॅप अहवाल पहा",
    pa: "ਗੈਪ ਰਿਪੋਰਟ ਦੇਖੋ",
    ur: "گیپ رپورٹ دیکھیں",
    ta: "இடைவெளி அறிக்கை காண்க",
    as: "গেপ ৰিপোৰ্ট চাওক",
  },
  "View Attempts": {
    en: "View Attempts",
    hi: "प्रयास देखें",
    bn: "প্রচেষ্টা দেখুন",
    mr: "प्रयत्न पहा",
    pa: "ਕੋਸ਼ਿਸ਼ਾਂ ਦੇਖੋ",
    ur: "کوششیں دیکھیں",
    ta: "முயற்சிகளைக் காண்க",
    as: "প্ৰচেষ্টা চাওক",
  },
  "Started:": {
    en: "Started:",
    hi: "प्रारंभ:",
    bn: "শুরু:",
    mr: "सुरू:",
    pa: "ਸ਼ੁਰੂ:",
    ur: "شروع:",
    ta: "தொடங்கியது:",
    as: "আৰম্ভ:",
  },
  "Completed:": {
    en: "Completed:",
    hi: "समाप्त:",
    bn: "সম্পন্ন:",
    mr: "पूर्ण:",
    pa: "ਸਮਾਪਤ:",
    ur: "مکمل:",
    ta: "முடிந்தது:",
    as: "সম্পূৰ্ণ:",
  },
  "Assigned on": {
    en: "Assigned on",
    hi: "आवंटित तिथि",
    bn: "নিযুক্ত হয়েছে",
    mr: "नियुक्त केले",
    pa: "ਸੌਂਪਿਆ ਗਿਆ",
    ur: "تفویض کردہ",
    ta: "ஒதுக்கப்பட்டது",
    as: "নিযুক্ত কৰা হ'ল",
  },
  "Last Attempt:": {
    en: "Last Attempt:",
    hi: "अंतिम प्रयास:",
    bn: "শেষ প্রচেষ্টা:",
    mr: "शेवटचा प्रयत्न:",
    pa: "ਆਖਰੀ ਕੋਸ਼ਿਸ਼:",
    ur: "آخری کوشش:",
    ta: "கடைசி முயற்சி:",
    as: "শেষ প্ৰচেষ্টা:",
  },
  "Latest AI Study Advice:": {
    en: "Latest AI Study Advice:",
    hi: "नवीनतम एआई अध्ययन सुझाव:",
    bn: "সর্বশেষ এআই অধ্যয়নের পরামর্শ:",
    mr: "नवीनतम एआय अभ्यास सल्ला:",
    pa: "ਤਾਜ਼ਾ AI ਅਧਿਐਨ ਸਲਾਹ:",
    ur: "تازہ ترین AI مطالعہ کا مشورہ:",
    ta: "சமீபத்திய AI ஆய்வு ஆலோசனை:",
    as: "শেহতীয়া এআই অধ্যয়নৰ পৰামৰ্শ:",
  },
  "Latest AI Study Advice": {
    en: "Latest AI Study Advice",
    hi: "नवीनतम एआई अध्ययन सुझाव",
    bn: "সর্বশেষ এআই অধ্যয়নের পরামর্শ",
    mr: "नवीनतम एआय अभ्यास सल्ला",
    pa: "ਤਾਜ਼ਾ AI ਅਧਿਐਨ ਸਲਾਹ",
    ur: "تازہ ترین AI مطالعہ کا مشورہ",
    ta: "சமீபத்திய AI ஆய்வு ஆலோசனை",
    as: "শেহতীয়া এআই অধ্যয়নৰ পৰামৰ্শ",
  },
  "Mastery": {
    en: "Mastery",
    hi: "निपुणता",
    bn: "দক্ষতা",
    mr: "प्राविण्य",
    pa: "ਮੁਹਾਰਤ",
    ur: "مہارت",
    ta: "தேர்ச்சி",
    as: "দখল",
  },
  "Sign Out": {
    en: "Sign Out",
    hi: "लॉग आउट",
    bn: "সাইন আউট",
    mr: "साइन आउट",
    pa: "ਸਾਈਨ ਆਉਟ",
    ur: "لاگ آؤٹ",
    ta: "வெளியேறு",
    as: "ছাইন আউট",
  },
  "Close": {
    en: "Close",
    hi: "बंद करें",
    bn: "বন্ধ করুন",
    mr: "बंद करा",
    pa: "ਬੰਦ ਕਰੋ",
    ur: "بند کریں",
    ta: "மூடு",
    as: "বন্ধ কৰক",
  },
  "Search languages, lessons, modules...": {
    en: "Search languages, lessons, modules...",
    hi: "भाषाएँ, पाठ, मॉड्यूल खोजें...",
    bn: "ভাষা, পাঠ, মডিউল অনুসন্ধান করুন...",
    mr: "भाषा, धडे, मॉड्यूल शोधा...",
    pa: "ਭਾਸ਼ਾਵਾਂ, ਪਾਠ, ਮੋਡੀਊਲ ਖੋਜੋ...",
    ur: "زبانیں، اسباق، ماڈیولز تلاش کریں...",
    ta: "மொழிகள், பாடங்கள், தொகுதிகளைத் தேடுங்கள்...",
    as: "ভাষা, পাঠ, মডিউল সন্ধান কৰক...",
  },
  "Search languages, lessons, modules, classes...": {
    en: "Search languages, lessons, modules, classes...",
    hi: "भाषाएँ, पाठ, मॉड्यूल, कक्षाएँ खोजें...",
    bn: "ভাষা, পাঠ, মডিউল, ক্লাস অনুসন্ধান করুন...",
    mr: "भाषा, धडे, मॉड्यूल, वर्ग शोधा...",
    pa: "ਭਾਸ਼ਾਵਾਂ, ਪਾਠ, ਮੋਡੀਊਲ, ਕਲਾਸਾਂ ਖੋਜੋ...",
    ur: "زبانیں، اسباق، ماڈیولز، کلاسز تلاش کریں...",
    ta: "மொழிகள், பாடங்கள், தொகுதிகள், வகுப்புகளைத் தேடுங்கள்...",
    as: "ভাষা, পাঠ, মডিউল, শ্ৰেণী সন্ধান কৰক...",
  },
  "Search workspace, modules, classes...": {
    en: "Search workspace, modules, classes...",
    hi: "कार्यक्षेत्र, मॉड्यूल, कक्षाएं खोजें...",
    bn: "ওয়ার্কস্পেস, মডিউল, ক্লাস অনুসন্ধান করুন...",
    mr: "कार्यक्षेत्र, मॉड्यूल, वर्ग शोधा...",
    pa: "ਵਰਕਸਪੇਸ, ਮੋਡੀਊਲ, ਕਲਾਸਾਂ ਖੋਜੋ...",
    ur: "ورک اسپیس، ماڈیولز، کلاسز تلاش کریں...",
    ta: "பணிப்பகுதி, தொகுதிகள், வகுப்புகளைத் தேடுங்கள்...",
    as: "কাৰ্য্যক্ষেত্ৰ, মডিউল, শ্ৰেণী সন্ধান কৰক...",
  },
  "Test Performance & Attempt History": {
    en: "Test Performance & Attempt History",
    hi: "परीक्षण प्रदर्शन व प्रयास इतिहास",
    bn: "পরীক্ষা পারফরম্যান্স এবং প্রচেষ্টা ইতিহাস",
    mr: "चाचणी कामगिरी आणि प्रयत्न इतिहास",
    pa: "ਟੈਸਟ ਪ੍ਰਦਰਸ਼ਨ ਅਤੇ ਕੋਸ਼ਿਸ਼ ਇਤਿਹਾਸ",
    ur: "ٹیسٹ کی کارکردگی اور کوشش کی تاریخ",
    ta: "தேர்வு செயல்திறன் & முயற்சி வரலாறு",
    as: "পৰীক্ষাৰ প্ৰদৰ্শন আৰু প্ৰচেষ্টাৰ ইতিহাস",
  },
  "No recorded attempt history found for this test.": {
    en: "No recorded attempt history found for this test.",
    hi: "इस परीक्षण के लिए कोई प्रयास इतिहास नहीं मिला।",
    bn: "এই পরীক্ষার জন্য কোনো রেকর্ড করা প্রচেষ্টার ইতিহাস পাওয়া যায়নি।",
    mr: "या चाचणीसाठी कोणताही रेकॉर्ड केलेला प्रयत्न इतिहास आढळला नाही.",
    pa: "ਇਸ ਟੈਸਟ ਲਈ ਕੋਈ ਰਿਕਾਰਡ ਕੀਤਾ ਕੋਸ਼ਿਸ਼ ਇਤਿਹਾਸ ਨਹੀਂ ਮਿਲਿਆ।",
    ur: "اس ٹیسਟ کے لیے کوئی امتحانی ریکارڈ نہیں ملا۔",
    ta: "இந்தத் தேர்விற்கான முயற்சி வரலாறு எதுவும் காணப்படவில்லை.",
    as: "এই পৰীক্ষাৰ কোনো প্ৰচেষ্টাৰ ইতিহাস পোৱা নগ'ল।",
  },
  "Active Session": {
    en: "Active Session",
    hi: "सक्रिय सत्र",
    bn: "সক্রিয় সেশন",
    mr: "सक्रिय सत्र",
    pa: "ਸਰਗਰਮ ਸੈਸ਼ਨ",
    ur: "فعال سیشن",
    ta: "செயலில் உள்ள அமர்வு",
    as: "সক্ৰিয় অধিবেশন",
  },
  "Notifications": {
    en: "Notifications",
    hi: "सूचनाएं",
    bn: "বিজ্ঞপ্তি",
    mr: "सूचना",
    pa: "ਸੂਚਨਾਵਾਂ",
    ur: "اطلاعات",
    ta: "அறிவிப்புகள்",
    as: "জাননীসমূহ",
  },
  "Close Your Gaps": {
    en: "Close Your Gaps",
    hi: "कमजोरियों को दूर करें",
    bn: "আপনার ফাঁক পূরণ করুন",
    mr: "तुमच्या त्रुटी दूर करा",
    pa: "ਆਪਣੀਆਂ ਕਮੀਆਂ ਨੂੰ ਦੂਰ ਕਰੋ",
    ur: "اپنی کمزوریوں کو دور کریں",
    ta: "உங்கள் இடைவெளிகளை நிரப்பவும்",
    as: "আপোনাৰ খালী ঠাই পূৰণ কৰক",
  },
  "Focused reviews built from exactly what your diagnostic quiz found — the crux of each earlier-class chapter, then a quick check.": {
    en: "Focused reviews built from exactly what your diagnostic quiz found — the crux of each earlier-class chapter, then a quick check.",
    hi: "आपके डायग्नोस्टिक क्विज़ के आधार पर लक्षित पुनरीक्षण — प्रत्येक अध्याय का सार और त्वरित परीक्षण।",
    bn: "আপনার ডায়াগনস্টিক কুইজ থেকে পাওয়া তথ্যের ভিত্তিতে তৈরি পুনরাবৃত্তি — আগের ক্লাসের অধ্যায়ের সারসংক্ষেপ এবং যাচাই।",
    mr: "तुमच्या चाचणीनुसार तयार केलेले पुनरावलोकन — मागील वर्गांच्या धड्यांचा सारांश आणि त्वरित चाचणी.",
    pa: "ਤੁਹਾਡੀ ਡਾਇਗਨੋਸਟਿਕ ਕੁਇਜ਼ ਦੇ ਆਧਾਰ 'ਤੇ ਤਿਆਰ ਕੀਤੀ ਸਮੀਖਿਆ — ਪਿਛਲੇ ਅਧਿਆਵਾਂ ਦਾ ਸਾਰ ਅਤੇ ਤੇਜ਼ ਜਾਂਚ।",
    ur: "آپ کے تشخیصی ٹیسٹ کی بنیاد پر جائزہ — پچھلے ابواب کا نچوڑ اور فوری جانچ۔",
    ta: "உங்கள் கண்டறிதல் வினாடிவினாவின் அடிப்படையில் அமைந்த மறுஆய்வு — பாடச் சுருக்கம் மற்றும் விரைவான சோதனை.",
    as: "আপোনাৰ ডায়েগনষ্টিক কুইজৰ ওপৰত ভিত্তি কৰি পুনৰীক্ষণ — অধ্যায়ৰ সাৰাংশ আৰু খৰতকীয়া পৰীক্ষা।",
  },
  "Show the crux": {
    en: "Show the crux",
    hi: "मुख्य सार देखें",
    bn: "মূল বিষয় দেখুন",
    mr: "मुख्य मुद्दे पहा",
    pa: "ਮੁੱਖ ਨੁਕਤੇ ਦੇਖੋ",
    ur: "اہم نکات دیکھیں",
    ta: "முக்கிய கருத்துக்களைக் காண்க",
    as: "মূল কথা চাওক",
  },
  "Hide the crux": {
    en: "Hide the crux",
    hi: "मुख्य सार छुपाएं",
    bn: "মূল বিষয় লুকান",
    mr: "मुख्य मुद्दे लपवा",
    pa: "ਮੁੱਖ ਨੁਕਤੇ ਲੁਕਾਓ",
    ur: "اہم نکات چھپائیں",
    ta: "முக்கிய கருத்துக்களை மறைக்கவும்",
    as: "মূল কথা লুকুৱাওক",
  },
  "Start Review": {
    en: "Start Review",
    hi: "समीक्षा शुरू करें",
    bn: "রিভিউ শুরু করুন",
    mr: "पुनरावलोकन सुरू करा",
    pa: "ਸਮੀਖਿਆ ਸ਼ੁਰੂ ਕਰੋ",
    ur: "جائزہ شروع کریں",
    ta: "மறுஆய்வைத் தொடங்கு",
    as: "পুনৰীক্ষণ আৰম্ভ কৰক",
  },
  "Review the Crux": {
    en: "Review the Crux",
    hi: "सार की समीक्षा करें",
    bn: "মূল বিষয় পর্যালোচনা করুন",
    mr: "मुद्द्यांचे पुनरावलोकन करा",
    pa: "ਸਾਰ ਦੀ ਸਮੀਖਿਆ ਕਰੋ",
    ur: "اہم نکات کا جائزہ لیں",
    ta: "சுருக்கத்தை மறுஆய்வு செய்",
    as: "সাৰাংশ পুনৰীক্ষণ কৰক",
  },
  "Good morning": {
    en: "Good morning",
    hi: "शुभ प्रभात",
    bn: "সুপ্রভাত",
    mr: "शुभ सकाळ",
    pa: "ਸ਼ੁਭ ਸਵੇਰ",
    ur: "صبح بخیر",
    ta: "காலை வணக்கம்",
    as: "সুপ্ৰভাত",
  },
  "One lesson closer to your next learning adventure!": {
    en: "One lesson closer to your next learning adventure!",
    hi: "आपके अगले सीखने के सफर से बस एक पाठ दूर!",
    bn: "আপনার পরবর্তী শেখার অভিজ্ঞতার আরেক ধাপ কাছাকাছি!",
    mr: "तुमच्या पुढील शिक्षण प्रवासाच्या आणखी एक पाऊल जवळ!",
    pa: "ਤੁਹਾਡੇ ਅਗਲੇ ਸਿੱਖਣ ਦੇ ਸਫ਼ਰ ਦੇ ਇੱਕ ਹੋਰ ਕਦਮ ਨੇੜੇ!",
    ur: "آپ کے اگلے سیکھنے کے سفر کا ایک اور مرحلہ قریب!",
    ta: "உங்கள் அடுத்த கற்றல் பயணத்திற்கு இன்னும் ஒரு பாடம் மட்டுமே!",
    as: "আপোনাৰ পৰৱৰ্তী শিক্ষণ যাত্ৰাৰ আৰু এক পদক্ষেপ কাষলৈ!",
  },
  "Continue Learning →": {
    en: "Continue Learning →",
    hi: "सीखना जारी रखें →",
    bn: "শেখা চালিয়ে যান →",
    mr: "शिकणे सुरू ठेवा →",
    pa: "ਸਿੱਖਣਾ ਜਾਰੀ ਰੱਖੋ →",
    ur: "سیکھنا جاری رکھیں ←",
    ta: "கற்றலைத் தொடரவும் →",
    as: "শিকা অব্যাহত ৰাখক →",
  },
  "View My Results": {
    en: "View My Results",
    hi: "मेरे परिणाम देखें",
    bn: "আমার ফলাফল দেখুন",
    mr: "माझे निकाल पहा",
    pa: "ਮੇਰੇ ਨਤੀਜੇ ਵੇਖੋ",
    ur: "میرے نتائج دیکھیں",
    ta: "எனது முடிவுகளைக் காண்க",
    as: "মোৰ ফলাফল চাওক",
  },
  "Assigned section": {
    en: "Assigned section",
    hi: "आवंटित वर्ग",
    bn: "বরাদ্দকৃত বিভাগ",
    mr: "नियुक्त तुकडी",
    pa: "ਨਿਰਧਾਰਤ ਸੈਕਸ਼ਨ",
    ur: "تفویض کردہ سیکشن",
    ta: "ஒதுக்கப்பட்ட பிரிவு",
    as: "নিৰ্ধাৰিত শাখা",
  },
  "School Branch Syllabus": {
    en: "School Branch Syllabus",
    hi: "स्कूल शाखा पाठ्यक्रम",
    bn: "স্কুল শাখা পাঠ্যক্রম",
    mr: "शाळा शाखा अभ्यासक्रम",
    pa: "ਸਕੂਲ ਬ੍ਰਾਂਚ ਪਾਠਕ੍ਰਮ",
    ur: "اسکول برانچ کا نصاب",
    ta: "பள்ளி கிளை பாடத்திட்டம்",
    as: "বিদ্যালয় শাখা পাঠ্যক্ৰম",
  },
  "Done": {
    en: "Done",
    hi: "पूर्ण",
    bn: "সম্পন্ন",
    mr: "पूर्ण झाले",
    pa: "ਮੁਕੰਮਲ",
    ur: "مکمل",
    ta: "முடிந்தது",
    as: "সম্পন্ন",
  },
  "Unlocks your modules": {
    en: "Unlocks your modules",
    hi: "आपके मॉड्यूल अनलॉक करता है",
    bn: "আপনার মডিউল আনলক করে",
    mr: "तुमचे मॉड्यूल अनलॉक करते",
    pa: "ਤੁਹਾਡੇ ਮੋਡੀਊਲ ਅਨਲੌਕ ਕਰਦਾ ਹੈ",
    ur: "آپ کے ماڈیولز انلاک کرتا ہے",
    ta: "உங்கள் தொகுதிகளைத் திறக்கும்",
    as: "আপোনাৰ মডিউল আনলক কৰে",
  },
  "Class Tests, Quizzes & Active Homework": {
    en: "Class Tests, Quizzes & Active Homework",
    hi: "कक्षा परीक्षण, क्विज़ और गृहकार्य",
    bn: "ক্লাস পরীক্ষা, কুইজ ও হোমওয়ার্ক",
    mr: "वर्ग चाचण्या, क्विझ आणि गृहपाठ",
    pa: "ਕਲਾਸ ਟੈਸਟ, ਕੁਇਜ਼ ਅਤੇ ਹੋਮਵਰਕ",
    ur: "کلاس ٹیسٹ، کوئز اور ہوم ورک",
    ta: "வகுப்பு தேர்வுகள், வினாடிவினா & வீட்டுப்பாடம்",
    as: "শ্ৰেণী পৰীক্ষা, কুইজ আৰু গৃহকাৰ্য্য",
  },
  "Attempt assigned AI quizzes and upload PDF responses before deadlines. Past test results & feedback can be reviewed under Assessment History.": {
    en: "Attempt assigned AI quizzes and upload PDF responses before deadlines. Past test results & feedback can be reviewed under Assessment History.",
    hi: "निर्धारित समय सीमा से पहले एआई क्विज़ का प्रयास करें और पीडीएफ अपलोड करें। पिछले परिणाम मूल्यांकन इतिहास में देखे जा सकते हैं।",
    bn: "নির্ধারিত এআই কুইজ দিন এবং সময়সীমার আগে পিডিএফ জমা দিন। অতীত ফলাফল মূল্যায়ন ইতিহাসে দেখতে পারেন।",
    mr: "मुदतीपूर्वी नियुक्त एआय क्विझ सोडवा आणि पीडीएफ अपलोड करा. मागील निकाल मूल्यमापन इतिहासात पाहिले जाऊ शकतात.",
    pa: "ਨਿਰਧਾਰਤ ਮਿਤੀ ਤੋਂ ਪਹਿਲਾਂ ਏਆਈ ਕੁਇਜ਼ ਹੱਲ ਕਰੋ ਅਤੇ ਪੀਡੀਐਫ ਅਪਲੋਡ ਕਰੋ। ਪਿਛਲੇ ਨਤੀਜੇ ਮੁਲਾਂਕਣ ਇਤਿਹਾਸ ਵਿੱਚ ਵੇਖੇ ਜਾ ਸਕਦੇ ਹਨ।",
    ur: "مقررہ وقت سے پہلے اے آئی کوئز حل کریں اور پی ڈی ایف اپ لوڈ کریں۔ پچھلے نتائج تشخیصی تاریخ میں دیکھے جا سکتے ہیں۔",
    ta: "கடைசி தேதிக்கு முன் ஒதுக்கப்பட்ட AI வினாடி வினாக்களைச் செய்து PDF பதில்களைப் பதிவேற்றவும். முந்தைய முடிவுகளை மதிப்பீட்டு வரலாற்றில் பார்க்கலாம்.",
    as: "সময়সীমাৰ পূৰ্বে আৱণ্টিত AI কুইজত অংশ লওক আৰু PDF আপলোড কৰক। অতীতৰ ফলাফল মূল্যায়ন ইতিহাসত চাব পাৰি।",
  },
  "VidyaSetu Scholar": {
    en: "VidyaSetu Scholar",
    hi: "विद्यासेतु स्कॉलर",
    bn: "বিদ্যাসেতু স্কলার",
    mr: "विद्यासेतू स्कॉलर",
    pa: "ਵਿਦਿਆਸੇਤੂ ਸਕਾਲਰ",
    ur: "ودیا سیتو اسکالر",
    ta: "வித்யாசேது அறிஞர்",
    as: "বিদ্যাসেতু স্কলাৰ",
  },
  "Unlock all NCERT modules, adaptive AI quizzes & badges.": {
    en: "Unlock all NCERT modules, adaptive AI quizzes & badges.",
    hi: "सभी एनसीईआरटी मॉड्यूल, अनुकूली एआई क्विज़ और बैज अनलॉक करें।",
    bn: "সমস্ত এনসিইআরটি মডিউল, এআই কুইজ ও ব্যাজ আনলক করুন।",
    mr: "सर्व एनसीईआरटी मॉड्यूल, अनुकूलित एआय क्विझ आणि बॅज अनलॉक करा.",
    pa: "ਸਾਰੇ NCERT ਮੋਡੀਊਲ, ਅਨੁਕੂਲਿਤ AI ਕੁਇਜ਼ ਅਤੇ ਬੈਜ ਅਨਲੌਕ ਕਰੋ।",
    ur: "تمام NCERT ماڈیولز، اے آئی کوئز اور بیجز انلاک کریں۔",
    ta: "அனைத்து NCERT தொகுதிகள், AI வினாடி வினாக்கள் மற்றும் பேட்ஜ்களைத் திறக்கவும்.",
    as: "সকলো NCERT মডিউল, AI কুইজ আৰু বেজ আনলক কৰক।",
  },
  "Explore Modules": {
    en: "Explore Modules",
    hi: "मॉड्यूल देखें",
    bn: "মডিউল দেখুন",
    mr: "मॉड्यूल एक्सप्लोर करा",
    pa: "ਮੋਡੀਊਲ ਐਕਸਪਲੋਰ ਕਰੋ",
    ur: "ماڈیولز دریافت کریں",
    ta: "தொகுதிகளை ஆராயுங்கள்",
    as: "মডিউল অন্বেষণ কৰক",
  },
  "Student Learner": {
    en: "Student Learner",
    hi: "छात्र / शिक्षार्थी",
    bn: "ছাত্র / শিক্ষার্থী",
    mr: "विद्यार्थी",
    pa: "ਵਿਦਿਆਰਥੀ",
    ur: "طالب علم",
    ta: "மாணவர்",
    as: "শিক্ষাৰ্থী",
  },
  "School Enrolled": {
    en: "School Enrolled",
    hi: "स्कूल में नामांकित",
    bn: "স্কুলে নথিভুক্ত",
    mr: "शाळेत नोंदणीकृत",
    pa: "ਸਕੂਲ ਵਿੱਚ ਦਾਖਲ",
    ur: "اسکول میں داخل",
    ta: "பள்ளியில் சேர்ந்தவர்",
    as: "বিদ্যালয়ত নামভৰ্তি কৰা",
  },
  "Self Enrolled": {
    en: "Self Enrolled",
    hi: "स्व-नामांकित",
    bn: "স্ব-নথিভুক্ত",
    mr: "स्वयं-नोंदणीकृत",
    pa: "ਸਵੈ-ਦਾਖਲ",
    ur: "خود داخل شدہ",
    ta: "சுய சேர்க்கை",
    as: "স্ব-নামভৰ্তি কৰা",
  },
  "Official NCERT Standard": {
    en: "Official NCERT Standard",
    hi: "आधिकारिक एनसीईआरटी मानक",
    bn: "অফিসিয়াল এনসিইআরটি মানদণ্ড",
    mr: "अधिकृत एनसीईआरटी मानक",
    pa: "ਅਧਿਕਾਰਤ NCERT ਮਿਆਰ",
    ur: "سرکاری این سی ای آر ٹی معیار",
    ta: "அதிகாரப்பூர்வ NCERT தரம்",
    as: "আনুষ্ঠানিক NCERT মানদণ্ড",
  },
  "Study Book PDF →": {
    en: "Study Book PDF →",
    hi: "पाठ्यपुस्तक पीडीएफ पढ़ें →",
    bn: "বইয়ের পিডিএফ পড়ুন →",
    mr: "पुस्तकाची पीडीएफ वाचा →",
    pa: "ਕਿਤਾਬ ਦੀ ਪੀਡੀਐਫ ਪੜ੍ਹੋ →",
    ur: "کتاب کی پی ڈی ایف پڑھیں ←",
    ta: "புத்தக PDF படிக்க →",
    as: "কিতাপৰ PDF পঢ়ক →",
  },
  "Open PDF Module": {
    en: "Open PDF Module",
    hi: "पीडीएफ मॉड्यूल खोलें",
    bn: "পিডিএফ মডিউল খুলুন",
    mr: "पीडीएफ मॉड्यूल उघडा",
    pa: "ਪੀਡੀਐਫ ਮੋਡੀਊਲ ਖੋਲ੍ਹੋ",
    ur: "پی ڈی ایف ماڈیول کھولیں",
    ta: "PDF தொகுதியைத் திறக்கவும்",
    as: "PDF মডিউল খোলক",
  },
  "NCERT Module Content": {
    en: "NCERT Module Content",
    hi: "एनसीईआरटी मॉड्यूल सामग्री",
    bn: "এনসিইআরটি মডিউল বিষয়বস্তু",
    mr: "एनसीईआरटी मॉड्यूल सामग्री",
    pa: "NCERT ਮੋਡੀਊਲ ਸਮੱਗਰੀ",
    ur: "NCERT ماڈیول مواد",
    ta: "NCERT தொகுதி உள்ளடக்கம்",
    as: "NCERT মডিউল বিষয়বস্তু",
  },
  "PDF Pending Upload": {
    en: "PDF Pending Upload",
    hi: "पीडीएफ अपलोड लंबित",
    bn: "পিডিএফ আপলোড মুলতুবি",
    mr: "पीडीएफ अपलोड प्रलंबित",
    pa: "ਪੀਡੀਐਫ ਅਪਲੋਡ ਬਾਕੀ",
    ur: "پی ڈی ایف اپ لوڈ زیر التواء",
    ta: "PDF பதிவேற்றம் நிலுவையில் உள்ளது",
    as: "PDF আপলোড বাকী আছে",
  },
  "Not Started": {
    en: "Not Started",
    hi: "शुरू नहीं हुआ",
    bn: "শুরু হয়নি",
    mr: "सुरू झालेले नाही",
    pa: "ਸ਼ੁਰੂ ਨਹੀਂ ਹੋਇਆ",
    ur: "شروع نہیں ہوا",
    ta: "தொடங்கப்படவில்லை",
    as: "আৰম্ভ হোৱা নাই",
  },
  "In Progress": {
    en: "In Progress",
    hi: "प्रगति पर",
    bn: "চলমান",
    mr: "प्रगतीपथावर",
    pa: "ਪ੍ਰਗਤੀ ਵਿੱਚ",
    ur: "جاری ہے",
    ta: "செயல்பாட்டில் உள்ளது",
    as: "প্ৰগতি চলি আছে",
  },
  "Leaderboard": {
    en: "Leaderboard",
    hi: "लीडरबोर्ड",
    bn: "লিডারবোর্ড",
    mr: "लीडरबोर्ड",
    pa: "ਲੀਡਰਬੋਰਡ",
    ur: "لیڈر بورڈ",
    ta: "மதிப்பெண் பலகை",
    as: "শীৰ্ষতালিকা",
  },
  "This week": {
    en: "This week",
    hi: "इस सप्ताह",
    bn: "এই সপ্তাহে",
    mr: "या आठवड्यात",
    pa: "ਇਸ ਹਫ਼ਤੇ",
    ur: "اس ہفتے",
    ta: "இந்த வாரம்",
    as: "এই সপ্তাহত",
  },
  "English": {
    en: "English",
    hi: "अंग्रेजी",
    bn: "ইংরেজি",
    mr: "इंग्रजी",
    pa: "ਅੰਗਰੇਜ਼ੀ",
    ur: "انگریزی",
    ta: "ஆங்கிலம்",
    as: "ইংৰাজী",
  },
  "Mathematics": {
    en: "Mathematics",
    hi: "गणित",
    bn: "গণিত",
    mr: "गणित",
    pa: "ਗਣਿਤ",
    ur: "ریاضی",
    ta: "கணிதம்",
    as: "গণিত",
  },
  "Science": {
    en: "Science",
    hi: "विज्ञान",
    bn: "বিজ্ঞান",
    mr: "विज्ञान",
    pa: "ਵਿਗਿਆਨ",
    ur: "سائنس",
    ta: "அறிவியல்",
    as: "বিজ্ঞান",
  },
  "Social Science": {
    en: "Social Science",
    hi: "सामाजिक विज्ञान",
    bn: "সমাজবিজ্ঞান",
    mr: "सामाजिक शास्त्र",
    pa: "ਸਮਾਜਿਕ ਵਿਗਿਆਨ",
    ur: "سماجی علوم",
    ta: "சமூக அறிவியல்",
    as: "সমাজবিজ্ঞান",
  },
  "Hindi": {
    en: "Hindi",
    hi: "हिन्दी",
    bn: "হিন্দি",
    mr: "हिंदी",
    pa: "ਹਿੰਦੀ",
    ur: "ہندی",
    ta: "இந்தி",
    as: "হিন্দী",
  },
  "dashboard.student.diagnosticCompleted": {
    en: "Diagnostic Quiz Completed",
    hi: "डायग्नोस्टिक क्विज़ पूर्ण हुआ",
    bn: "ডায়াগনস্টিক কুইজ সম্পন্ন হয়েছে",
    mr: "डायग्नोस्टिक क्विझ पूर्ण झाली",
    pa: "ਡਾਇਗਨੋਸਟਿਕ ਕੁਇਜ਼ ਪੂਰੀ ਹੋਈ",
    ur: "تشخیصی کوئز مکمل ہو گیا",
    ta: "கண்டறிதல் வினாடிவினா முடிந்தது",
    as: "ডায়েগনষ্টিক কুইজ সম্পন্ন হৈছে",
  },
  "dashboard.student.viewResults": {
    en: "View Results",
    hi: "परिणाम देखें",
    bn: "ফলাফল দেখুন",
    mr: "निकाल पहा",
    pa: "ਨਤੀਜੇ ਵੇਖੋ",
    ur: "نتائج دیکھیں",
    ta: "முடிவுகளைக் காண்க",
    as: "ফলাফল চাওক",
  },
  "dashboard.student.schoolModules": {
    en: "School Learning Modules",
    hi: "स्कूल शिक्षण मॉड्यूल",
    bn: "স্কুল লার্নিং মডিউল",
    mr: "शाळा शिक्षण मॉड्यूल",
    pa: "ਸਕੂਲ ਸਿੱਖਣ ਮੋਡੀਊਲ",
    ur: "اسکول تعلیمی ماڈیولز",
    ta: "பள்ளி கற்றல் தொகுதிகள்",
    as: "বিদ্যালয় শিক্ষা মডিউল",
  },
  "dashboard.student.schoolEnrolledBadge": {
    en: "School Enrolled",
    hi: "स्कूल में नामांकित",
    bn: "স্কুলে নথিভুক্ত",
    mr: "शाळेत नोंदणीकृत",
    pa: "ਸਕੂਲ ਵਿੱਚ ਦਾਖਲ",
    ur: "اسکول میں داخل",
    ta: "பள்ளியில் சேர்ந்தவர்",
    as: "বিদ্যালয়ত নামভৰ্তি কৰা",
  },
  "dashboard.student.selfEnrolledBadge": {
    en: "Self Enrolled",
    hi: "स्व-नामांकित",
    bn: "স্ব-নথিভুক্ত",
    mr: "स्वयं-नोंदणीकृत",
    pa: "ਸਵੈ-ਦਾਖਲ",
    ur: "خود داخل شدہ",
    ta: "சுய சேர்க்கை",
    as: "স্ব-নামভৰ্তি কৰা",
  },
  "dashboard.student.classAndSection": {
    en: "Class & Section",
    hi: "कक्षा और वर्ग",
    bn: "ক্লাস ও বিভাগ",
    mr: "इयत्ता आणि तुकडी",
    pa: "ਕਲਾਸ ਅਤੇ ਸੈਕਸ਼ਨ",
    ur: "کلاس اور سیکشن",
    ta: "வகுப்பு & பிரிவு",
    as: "শ্ৰেণী আৰু শাখা",
  },
  "dashboard.student.availableModules": {
    en: "Available Modules",
    hi: "उपलब्ध मॉड्यूल",
    bn: "উপলব্ধ মডিউল",
    mr: "उपलब्ध मॉड्यूल",
    pa: "ਉਪਲਬਧ ਮੋਡੀਊਲ",
    ur: "دستیاب ماڈیولز",
    ta: "கிடைக்கும் தொகுதிகள்",
    as: "উপলব্ধ মডিউল",
  },
  "Manual PDF Test": {
    en: "Manual PDF Test",
    hi: "मैनुअल पीडीएफ टेस्ट",
    bn: "ম্যানুয়াল পিডিএফ টেস্ট",
    mr: "मॅन्युअल पीडीएफ चाचणी",
    pa: "ਮੈਨੂਅਲ ਪੀਡੀਐਫ ਟੈਸਟ",
    ur: "دستی پی ڈی ایف ٹیسٹ",
    ta: "கையேடு PDF தேர்வு",
    as: "মেনুৱেল PDF পৰীক্ষা",
  },
  "AI RAG Quiz": {
    en: "AI RAG Quiz",
    hi: "एआई क्विज़",
    bn: "এআই কুইজ",
    mr: "एआय क्विझ",
    pa: "ਏਆਈ ਕੁਇਜ਼",
    ur: "اے آئی کوئز",
    ta: "AI வினாடிவினா",
    as: "AI কুইজ",
  },
  "View Question Paper (PDF) →": {
    en: "View Question Paper (PDF) →",
    hi: "प्रश्न पत्र देखें (पीडीएफ) →",
    bn: "প্রশ্নপত্র দেখুন (পিডিএফ) →",
    mr: "प्रश्नपत्रिका पहा (पीडीएफ) →",
    pa: "ਪ੍ਰਸ਼ਨ ਪੱਤਰ ਵੇਖੋ (ਪੀਡੀਐਫ) →",
    ur: "سوالیہ پرچہ دیکھیں (پی ڈی ایف) ←",
    ta: "வினாத்தாள் காண்க (PDF) →",
    as: "প্ৰশ্নকাকত চাওক (PDF) →",
  },
  "Latest Status:": {
    en: "Latest Status:",
    hi: "नवीनतम स्थिति:",
    bn: "সর্বশেষ অবস্থা:",
    mr: "नवीनतम स्थिती:",
    pa: "ਤਾਜ਼ਾ ਸਥਿਤੀ:",
    ur: "تازہ ترین حیثیت:",
    ta: "சமீபத்திய நிலை:",
    as: "শেহতীয়া স্থিতি:",
  },
  "Test Passed (Score ≥ 60%)": {
    en: "Test Passed (Score ≥ 60%)",
    hi: "परीक्षण उत्तीर्ण (स्कोर ≥ 60%)",
    bn: "পরীক্ষায় উত্তীর্ণ (স্কোর ≥ ৬০%)",
    mr: "चाचणी उत्तीर्ण (गुण ≥ ६०%)",
    pa: "ਟੈਸਟ ਪਾਸ (ਸਕੋਰ ≥ 60%)",
    ur: "ٹیسٹ پاس (اسکور ≥ 60%)",
    ta: "தேர்வில் தேர்ச்சி (மதிப்பெண் ≥ 60%)",
    as: "পৰীক্ষাত উত্তীৰ্ণ (স্ক'ৰ ≥ ৬০%)",
  },
  "Re-attempt Quiz (Adapted Questions)": {
    en: "Re-attempt Quiz (Adapted Questions)",
    hi: "पुनः प्रयास करें (अनुकूलित प्रश्न)",
    bn: "পুনরায় চেষ্টা করুন (অনুকূল প্রশ্ন)",
    mr: "पुन्हा प्रयत्न करा (अनुकूलित प्रश्न)",
    pa: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ (ਅਨੁਕੂਲਿਤ ਪ੍ਰਸ਼ਨ)",
    ur: "دوبارہ کوشش کریں (ترمیم شدہ سوالات)",
    ta: "மீண்டும் முயற்சிக்கவும் (தழுவல் கேள்விகள்)",
    as: "পুনৰ চেষ্টা কৰক (অনুকূল প্ৰশ্ন)",
  },
  "Attempt AI Quiz (15 Mins)": {
    en: "Attempt AI Quiz (15 Mins)",
    hi: "एआई क्विज़ शुरू करें (15 मिनट)",
    bn: "এআই কুইজ শুরু করুন (১৫ মিনিট)",
    mr: "एआय क्विझ सुरू करा (१५ मिनिटे)",
    pa: "ਏਆਈ ਕੁਇਜ਼ ਸ਼ੁਰੂ ਕਰੋ (15 ਮਿੰਟ)",
    ur: "اے آئی کوئز شروع کریں (15 منٹ)",
    ta: "AI வினாடிவினாவைத் தொடங்கு (15 நிமிடங்கள்)",
    as: "AI কুইজ আৰম্ভ কৰক (১৫ মিনিট)",
  },
  "Select Response PDF (Max 5MB)": {
    en: "Select Response PDF (Max 5MB)",
    hi: "उत्तर पीडीएफ चुनें (अधिकतम 5MB)",
    bn: "উত্তর পিডিএফ নির্বাচন করুন (সর্বোচ্চ ৫ এমবি)",
    mr: "उत्तर पीडीएफ निवडा (कमाल 5MB)",
    pa: "ਉੱਤਰ ਪੀਡੀਐਫ ਚੁਣੋ (ਵੱਧ ਤੋਂ ਵੱਧ 5MB)",
    ur: "جوابی پی ڈی ایف منتخب کریں (زیادہ سے زیادہ 5MB)",
    ta: "பதில் PDF ஐத் தேர்ந்தெடுக்கவும் (அதிகபட்சம் 5MB)",
    as: "উত্তৰ PDF বাছনি কৰক (সৰ্বাধিক 5MB)",
  },
  "Upload PDF": {
    en: "Upload PDF",
    hi: "पीडीएफ अपलोड करें",
    bn: "পিডিএফ আপলোড করুন",
    mr: "पीडीएफ अपलोड करा",
    pa: "ਪੀਡੀਐਫ ਅਪਲੋਡ ਕਰੋ",
    ur: "پی ڈی ایف اپ لوڈ کریں",
    ta: "PDF ஐப் பதிவேற்றவும்",
    as: "PDF আপলোড কৰক",
  },
  "No Active Tests Available": {
    en: "No Active Tests Available",
    hi: "कोई सक्रिय परीक्षण उपलब्ध नहीं है",
    bn: "কোনো সক্রিয় পরীক্ষা উপলব্ধ নেই",
    mr: "कोणतीही सक्रिय चाचणी उपलब्ध नाही",
    pa: "ਕੋਈ ਸਰਗਰਮ ਟੈਸਟ ਉਪਲਬਧ ਨਹੀਂ ਹੈ",
    ur: "کوئی فعال ٹیسٹ دستیاب نہیں ہے",
    ta: "செயலில் உள்ள தேர்வுகள் எதுவும் இல்லை",
    as: "কোনো সক্ৰিয় পৰীক্ষা উপলব্ধ নাই",
  },
  "There are currently no active quizzes or assignments for your class section. You can check your past test attempts under \"Assessment History\".": {
    en: "There are currently no active quizzes or assignments for your class section. You can check your past test attempts under \"Assessment History\".",
    hi: "आपकी कक्षा के लिए वर्तमान में कोई सक्रिय क्विज़ या असाइनमेंट नहीं हैं। आप \"मूल्यांकन इतिहास\" के तहत अपने पिछले प्रयास देख सकते हैं।",
    bn: "আপনার ক্লাসের জন্য বর্তমানে কোনো সক্রিয় কুইজ বা অ্যাসাইনমেন্ট নেই। আপনি \"মূল্যায়ন ইতিহাস\"-এ আপনার অতীত পরীক্ষার প্রচেষ্টা দেখতে পারেন।",
    mr: "तुमच्या वर्गासाठी सध्या कोणत्याही सक्रिय क्विझ किंवा असाइनमेंट नाहीत. तुम्ही \"मूल्यमापन इतिहास\" अंतर्गत तुमचे मागील प्रयत्न पाहू शकता.",
    pa: "ਤੁਹਾਡੀ ਕਲਾਸ ਲਈ ਵਰਤਮਾਨ ਵਿੱਚ ਕੋਈ ਸਰਗਰਮ ਕੁਇਜ਼ ਜਾਂ ਅਸਾਈਨਮੈਂਟ ਨਹੀਂ ਹਨ। ਤੁਸੀਂ \"ਮੁਲਾਂਕਣ ਇਤਿਹਾਸ\" ਦੇ ਤਹਿਤ ਆਪਣੀਆਂ ਪਿਛਲੀਆਂ ਕੋਸ਼ਿਸ਼ਾਂ ਦੀ ਜਾਂਚ ਕਰ ਸਕਦੇ ਹੋ।",
    ur: "آپ کی کلاس کے لیے فی الحال کوئی فعال کوئز یا اسائنمنٹ نہیں ہے۔ آپ \"تشخیصی تاریخ\" کے تحت اپنی پچھلی کوششیں دیکھ سکتے ہیں۔",
    ta: "உங்கள் வகுப்பிற்கு தற்போது செயலில் உள்ள வினாடி வினாக்கள் அல்லது பணிகள் எதுவும் இல்லை. \"மதிப்பீட்டு வரலாறு\" என்பதன் கீழ் உங்கள் முந்தைய முயற்சிகளை நீங்கள் சரிபார்க்கலாம்.",
    as: "আপোনাৰ শ্ৰেণীৰ বাবে বৰ্তমান কোনো সক্ৰিয় কুইজ বা এছাইনমেণ্ট নাই। আপুনি \"মূল্যায়ন ইতিহাস\"ৰ অধীনত অতীতৰ প্ৰচেষ্টা চাব পাৰে।",
  },
};

// ── LocalStorage Translation Cache ───────────────────────────────────────────

const STORAGE_CACHE_PREFIX = "vidyasetu_i18n_cache_";

export function getCachedTranslation(text: string, lang: SupportedLanguage): string | null {
  if (typeof window === "undefined" || lang === "en" || !text) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_CACHE_PREFIX}${lang}`);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[text] || null;
  } catch {
    return null;
  }
}

export function setCachedTranslation(text: string, lang: SupportedLanguage, translation: string): void {
  if (typeof window === "undefined" || lang === "en" || !text || !translation) return;
  try {
    const key = `${STORAGE_CACHE_PREFIX}${lang}`;
    const raw = localStorage.getItem(key);
    const cache = raw ? JSON.parse(raw) : {};
    cache[text] = translation;
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    console.warn("Translation cache save failed:", e);
  }
}

// ── Dynamic Translation API Caller ───────────────────────────────────────────

export async function fetchBatchTranslations(
  texts: string[],
  targetLang: SupportedLanguage
): Promise<Record<string, string>> {
  if (targetLang === "en" || texts.length === 0) {
    return texts.reduce((acc, t) => ({ ...acc, [t]: t }), {});
  }

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${apiBase}/translate/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts,
        target_lang: targetLang,
      }),
    });

    if (!res.ok) {
      throw new Error(`Translation API error: ${res.status}`);
    }

    const data = await res.json();
    const translations = data.translations || {};

    // Cache results locally
    for (const [original, translated] of Object.entries(translations)) {
      setCachedTranslation(original, targetLang, translated as string);
    }

    return translations;
  } catch (err) {
    console.warn("Batch translation fetch failed:", err);
    return texts.reduce((acc, t) => ({ ...acc, [t]: t }), {});
  }
}

// ── Main Translation Lookup ─────────────────────────────────────────────────

/**
 * Synchronous phrase translation lookup.
 * 1. Checks hardcoded phrase map (0ms)
 * 2. Checks pattern matchers (e.g. "{n} Attempts Recorded")
 * 3. Checks localStorage cache (0ms)
 * 4. Falls back to original text
 */
export function translatePhrase(text: string, lang: SupportedLanguage): string {
  if (!text || lang === "en") return text;

  const trimmed = text.trim();

  // 1. Direct match in UNIVERSAL_PHRASES
  if (UNIVERSAL_PHRASES[trimmed] && UNIVERSAL_PHRASES[trimmed][lang]) {
    return UNIVERSAL_PHRASES[trimmed][lang];
  }

  // 2. Pattern: "All (5)" -> "அனைத்தும் (5)"
  const allMatch = trimmed.match(/^All\s*\((.+)\)$/i);
  if (allMatch) {
    const allWord = UNIVERSAL_PHRASES["All"]?.[lang] || "All";
    return `${allWord} (${allMatch[1]})`;
  }

  // 3. Pattern: "Diagnostic Quizzes (1)" -> "கண்டறியும் வினாடிவினாக்கள் (1)"
  const diagMatch = trimmed.match(/^Diagnostic Quizzes\s*\((.+)\)$/i);
  if (diagMatch) {
    const diagWord = UNIVERSAL_PHRASES["Diagnostic Quizzes"]?.[lang] || "Diagnostic Quizzes";
    return `${diagWord} (${diagMatch[1]})`;
  }

  // 4. Pattern: "Class Tests (4)" -> "வகுப்பு தேர்வுகள் (4)"
  const testsMatch = trimmed.match(/^Class Tests\s*\((.+)\)$/i);
  if (testsMatch) {
    const testsWord = UNIVERSAL_PHRASES["Class Tests"]?.[lang] || "Class Tests";
    return `${testsWord} (${testsMatch[1]})`;
  }

  // 5. Pattern: "View Attempts (3)" -> "முயற்சிகளைக் காண்க (3)"
  const attemptsMatch = trimmed.match(/^View Attempts\s*\((.+)\)$/i);
  if (attemptsMatch) {
    const attemptsWord = UNIVERSAL_PHRASES["View Attempts"]?.[lang] || "View Attempts";
    return `${attemptsWord} (${attemptsMatch[1]})`;
  }

  // 6. Pattern: "1 Attempt Recorded" or "4 Attempts Recorded"
  const attemptRecMatch = trimmed.match(/^(\d+)\s+Attempts?\s+Recorded$/i);
  if (attemptRecMatch) {
    const count = attemptRecMatch[1];
    const recMap: Record<SupportedLanguage, string> = {
      en: `${count} Attempt${count === "1" ? "" : "s"} Recorded`,
      hi: `${count} प्रयास दर्ज`,
      bn: `${count}টি প্রচেষ্টা রেকর্ড করা হয়েছে`,
      mr: `${count} प्रयत्न नोंदवले गेले`,
      pa: `${count} ਕੋਸ਼ਿਸ਼ਾਂ ਦਰਜ ਕੀਤੀਆਂ`,
      ur: `${count} کوششیں ریکارڈ کی گئیں`,
      ta: `${count} முயற்சி பதிவு செய்யப்பட்டது`,
      as: `${count}টা প্ৰচেষ্টা লিপিবদ্ধ কৰা হ'ল`,
    };
    return recMap[lang] || text;
  }

  // 7. Pattern: "4 Class Tests Assigned" or "1 Class Test Assigned"
  const testAssignMatch = trimmed.match(/^(\d+)\s+Class\s+Tests?\s+Assigned$/i);
  if (testAssignMatch) {
    const count = testAssignMatch[1];
    const assignMap: Record<SupportedLanguage, string> = {
      en: `${count} Class Test${count === "1" ? "" : "s"} Assigned`,
      hi: `${count} कक्षा परीक्षण आवंटित`,
      bn: `${count}টি ক্লাস পরীক্ষা নির্ধারিত`,
      mr: `${count} वर्ग चाचण्या नियुक्त`,
      pa: `${count} ਕਲਾਸ ਟੈਸਟ ਸੌਂਪੇ ਗਏ`,
      ur: `${count} کلاس ٹیسٹ تفویض کیے گئے`,
      ta: `${count} வகுப்பு தேர்வுகள் ஒதுக்கப்பட்டன`,
      as: `${count}টা শ্ৰেণী পৰীক্ষা আবণ্টন কৰা হ'ল`,
    };
    return assignMap[lang] || text;
  }

  // 8. Pattern: "84.5% Mastery"
  const masteryMatch = trimmed.match(/^([\d.]+%)\s+Mastery$/i);
  if (masteryMatch) {
    const masteryWord = UNIVERSAL_PHRASES["Mastery"]?.[lang] || "Mastery";
    return `${masteryMatch[1]} ${masteryWord}`;
  }

  // 9. Pattern: "Chapter X: ... Quiz"
  const chapterMatch = trimmed.match(/^Chapter\s+(\d+):\s*(.+)$/i);
  if (chapterMatch) {
    const num = chapterMatch[1];
    const title = chapterMatch[2];
    const chapWord: Record<SupportedLanguage, string> = {
      en: "Chapter",
      hi: "अध्याय",
      bn: "অধ্যায়",
      mr: "धडा",
      pa: "ਅਧਿਆਇ",
      ur: "باب",
      ta: "அத்தியாயம்",
      as: "অধ্যায়",
    };
    return `${chapWord[lang] || "Chapter"} ${num}: ${title}`;
  }

  // 10. Pattern: "From Class 2"
  const fromClassMatch = trimmed.match(/^From\s+Class\s+(\d+)$/i);
  if (fromClassMatch) {
    const cls = fromClassMatch[1];
    const fromMap: Record<SupportedLanguage, string> = {
      en: `From Class ${cls}`,
      hi: `कक्षा ${cls} से`,
      bn: `ক্লাস ${cls} থেকে`,
      mr: `इयत्ता ${cls} मधून`,
      pa: `ਕਲਾਸ ${cls} ਤੋਂ`,
      ur: `کلاس ${cls} سے`,
      ta: `வகுப்பு ${cls} இலிருந்து`,
      as: `শ্ৰেণী ${cls} ৰ পৰা`,
    };
    return fromMap[lang] || text;
  }

  // 11. Pattern: "NCERT Class 3"
  const ncertClassMatch = trimmed.match(/^NCERT\s+Class\s+(\d+)$/i);
  if (ncertClassMatch) {
    const cls = ncertClassMatch[1];
    const ncertMap: Record<SupportedLanguage, string> = {
      en: `NCERT Class ${cls}`,
      hi: `एनसीईआरटी कक्षा ${cls}`,
      bn: `এনসিইআরটি ক্লাস ${cls}`,
      mr: `एनसीईआरटी इयत्ता ${cls}`,
      pa: `NCERT ਕਲਾਸ ${cls}`,
      ur: `این سی ای آر ٹی کلاس ${cls}`,
      ta: `NCERT வகுப்பு ${cls}`,
      as: `NCERT শ্ৰেণী ${cls}`,
    };
    return ncertMap[lang] || text;
  }

  // 12. Pattern: "Class 3" or "Class 3A"
  const classSecMatch = trimmed.match(/^Class\s+(\d+)([A-Za-z]?)$/i);
  if (classSecMatch) {
    const cls = classSecMatch[1];
    const sec = classSecMatch[2] || "";
    const clsMap: Record<SupportedLanguage, string> = {
      en: `Class ${cls}${sec}`,
      hi: `कक्षा ${cls}${sec}`,
      bn: `ক্লাস ${cls}${sec}`,
      mr: `इयत्ता ${cls}${sec}`,
      pa: `ਕਲਾਸ ${cls}${sec}`,
      ur: `کلاس ${cls}${sec}`,
      ta: `வகுப்பு ${cls}${sec}`,
      as: `শ্ৰেণী ${cls}${sec}`,
    };
    return clsMap[lang] || text;
  }

  // 13. Pattern: "50% In Progress"
  const inProgMatch = trimmed.match(/^([\d.]+%)\s+In\s+Progress$/i);
  if (inProgMatch) {
    const pct = inProgMatch[1];
    const progMap: Record<SupportedLanguage, string> = {
      en: `${pct} In Progress`,
      hi: `${pct} प्रगति पर`,
      bn: `${pct} চলমান`,
      mr: `${pct} प्रगतीपथावर`,
      pa: `${pct} ਪ੍ਰਗਤੀ ਵਿੱਚ`,
      ur: `${pct} جاری ہے`,
      ta: `${pct} செயல்பாட்டில் உள்ளது`,
      as: `${pct} প্ৰগতি চলি আছে`,
    };
    return progMap[lang] || text;
  }

  // 14. Pattern: "Due 10/12/2026"
  const dueMatch = trimmed.match(/^Due\s+(.+)$/i);
  if (dueMatch) {
    const dueWord: Record<SupportedLanguage, string> = {
      en: "Due",
      hi: "नियत तिथि",
      bn: "জমা দেওয়ার শেষ তারিখ",
      mr: "नियत तारीख",
      pa: "ਨਿਯਤ ਮਿਤੀ",
      ur: "مقررہ تاریخ",
      ta: "கடைசி தேதி",
      as: "নিৰ্ধাৰিত তাৰিখ",
    };
    return `${dueWord[lang] || "Due"} ${dueMatch[1]}`;
  }

  // 15. Check local cache
  const cached = getCachedTranslation(trimmed, lang);
  if (cached) return cached;

  // Fallback to original text
  return text;
}
