import json
import logging
from typing import Dict, List

from fastapi import APIRouter
from pydantic import BaseModel

from src.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/translate", tags=["Translation"])

LANG_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "mr": "Marathi",
    "pa": "Punjabi",
    "ur": "Urdu",
    "ta": "Tamil",
    "as": "Assamese",
}

# Global In-Memory Translation Cache (persists across requests during server lifetime)
_TRANSLATION_CACHE: Dict[str, Dict[str, str]] = {
    lang: {} for lang in LANG_NAMES.keys()
}


class BatchTranslateRequest(BaseModel):
    texts: List[str]
    target_lang: str


class BatchTranslateResponse(BaseModel):
    translations: Dict[str, str]
    target_lang: str


def _get_llm_client():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize Gemini client: {e}")
        return None


@router.post("/batch", response_model=BatchTranslateResponse)
async def translate_batch(payload: BatchTranslateRequest):
    """
    Batch-translates dynamic or custom text strings into the user's requested regional language.
    Features:
    1. 0ms cache check against in-memory dictionary.
    2. Single batched Gemini prompt for uncached phrases to minimize token consumption and network latency.
    3. Graceful fallback to original text if language is 'en' or LLM is unreachable.
    """
    target_lang = payload.target_lang.lower().strip()
    if target_lang not in LANG_NAMES:
        target_lang = "en"

    results: Dict[str, str] = {}
    missing_texts: List[str] = []

    # 1. Quick cache lookup
    cache_bucket = _TRANSLATION_CACHE.setdefault(target_lang, {})
    for text in payload.texts:
        clean = text.strip()
        if not clean:
            results[text] = text
            continue
        if target_lang == "en":
            results[text] = text
            continue
        if clean in cache_bucket:
            results[text] = cache_bucket[clean]
        else:
            missing_texts.append(clean)

    # If all texts were cached or target is English, return immediately
    if not missing_texts or target_lang == "en":
        return BatchTranslateResponse(translations=results, target_lang=target_lang)

    # 2. Call Gemini for uncached strings
    client = _get_llm_client()
    if client:
        try:
            target_lang_name = LANG_NAMES[target_lang]
            prompt = (
                f"You are an expert translator for Indian school educational content.\n"
                f"Translate the following list of strings into natural, accurate {target_lang_name}.\n"
                f"Preserve numbers, symbols, and formatting.\n"
                f"Return ONLY a valid JSON object mapping each original English string to its translated string.\n\n"
                f"Strings to translate:\n"
                f"{json.dumps(missing_texts, ensure_ascii=False)}"
            )

            from google.genai import types

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )

            translated_map = json.loads(response.text)
            if isinstance(translated_map, dict):
                for original, trans in translated_map.items():
                    if isinstance(trans, str):
                        cache_bucket[original] = trans
                        results[original] = trans
        except Exception as err:
            logger.warning(f"Gemini batch translation call error: {err}")

    # 3. For any still missing, fallback to original text
    for text in payload.texts:
        clean = text.strip()
        if text not in results:
            results[text] = cache_bucket.get(clean, text)

    return BatchTranslateResponse(translations=results, target_lang=target_lang)
