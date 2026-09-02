import logging
import uuid
from typing import Optional
from sqlmodel import Session, select

from src.models.module import Module
from src.models.module_translation import ModuleTranslation, TranslationStatus

logger = logging.getLogger(__name__)

# Fallback basic localized translations dictionary for core curriculum topics
COMMON_SUBJECT_TRANSLATIONS: dict[str, dict[str, str]] = {
    "Mathematics": {
        "en": "Mathematics",
        "hi": "गणित",
        "bn": "গণিত",
        "mr": "गणित",
        "pa": "ਗਣਿਤ",
        "ur": "ریاضی",
        "ta": "கணிதம்",
        "as": "গণিত",
    },
    "Science": {
        "en": "Science",
        "hi": "विज्ञान",
        "bn": "বিজ্ঞান",
        "mr": "विज्ञान",
        "pa": "ਵਿਗਿਆਨ",
        "ur": "سائنس",
        "ta": "அறிவியல்",
        "as": "বিজ্ঞান",
    },
    "Environmental Studies": {
        "en": "Environmental Studies",
        "hi": "पर्यावरण अध्ययन",
        "bn": "পরিবেশ অধ্যয়ন",
        "mr": "पर्यावरण अभ्यास",
        "pa": "ਵਾਤਾਵਰਣ ਅਧਿਐਨ",
        "ur": "ماحولیاتی مطالعہ",
        "ta": "சுற்றுச்சூழல் கல்வி",
        "as": "পৰিৱেশ অধ্যয়ন",
    },
    "EVS": {
        "en": "EVS",
        "hi": "पर्यावरण",
        "bn": "পরিবেশবিদ্যা",
        "mr": "पर्यावरण",
        "pa": "ਵਾਤਾਵਰਣ",
        "ur": "ماحولیات",
        "ta": "சுற்றுச்சூழல்",
        "as": "পৰিৱেশ",
    },
    "English": {
        "en": "English",
        "hi": "अंग्रेजी",
        "bn": "ইংরেজি",
        "mr": "इंग्रजी",
        "pa": "ਅੰਗਰੇਜ਼ੀ",
        "ur": "انگریزی",
        "ta": "ஆங்கிலம்",
        "as": "ইংৰাজী",
    },
    "Hindi": {
        "en": "Hindi",
        "hi": "हिन्दी",
        "bn": "হিন্দি",
        "mr": "हिंदी",
        "pa": "ਹਿੰਦੀ",
        "ur": "ہندی",
        "ta": "இந்தி",
        "as": "হিন্দী",
    },
    "Social Science": {
        "en": "Social Science",
        "hi": "सामाजिक विज्ञान",
        "bn": "সমাজবিজ্ঞান",
        "mr": "सामाजिक शास्त्र",
        "pa": "ਸਮਾਜਿਕ ਵਿਗਿਆਨ",
        "ur": "سماجی سائنس",
        "ta": "சமூக அறிவியல்",
        "as": "সমাজ বিজ্ঞান",
    },
}


class TranslationService:
    """
    Translation Service managing database cached translations with fallback.
    Implements Phase 2 of the Regional Language Plan (VidyaSetu).
    """

    @staticmethod
    def get_subject_translation(subject: str, target_lang: str) -> str:
        """Returns the localized title of a standard subject."""
        if subject in COMMON_SUBJECT_TRANSLATIONS:
            return COMMON_SUBJECT_TRANSLATIONS[subject].get(target_lang, subject)
        return subject

    @staticmethod
    def get_cached_module_translation(
        session: Session, module_id: uuid.UUID, target_lang: str
    ) -> Optional[ModuleTranslation]:
        """
        Lookup cached translation from module_translations table.
        """
        statement = select(ModuleTranslation).where(
            ModuleTranslation.module_id == module_id,
            ModuleTranslation.language_code == target_lang,
            ModuleTranslation.status != TranslationStatus.OUTDATED,
        )
        return session.exec(statement).first()

    @staticmethod
    def cache_module_translation(
        session: Session,
        module_id: uuid.UUID,
        target_lang: str,
        title: str,
        content: str,
        summary: Optional[str] = None,
        provider: str = "gemini_bhashini",
        status: TranslationStatus = TranslationStatus.MACHINE_TRANSLATED,
    ) -> ModuleTranslation:
        """
        Save or update a translated module in the cache.
        """
        existing = session.exec(
            select(ModuleTranslation).where(
                ModuleTranslation.module_id == module_id,
                ModuleTranslation.language_code == target_lang,
            )
        ).first()

        if existing:
            existing.title = title
            existing.content = content
            existing.summary = summary
            existing.translation_provider = provider
            existing.status = status
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

        new_trans = ModuleTranslation(
            module_id=module_id,
            language_code=target_lang,
            title=title,
            content=content,
            summary=summary,
            translation_provider=provider,
            status=status,
        )
        session.add(new_trans)
        session.commit()
        session.refresh(new_trans)
        return new_trans
