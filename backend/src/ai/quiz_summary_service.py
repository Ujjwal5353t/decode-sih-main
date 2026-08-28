"""
AI result-summary generation for a completed diagnostic quiz attempt.

Runs as an asyncio background task fired right after an attempt finalizes
(see quiz_service._finalize_attempt) — never awaited inline, so a student
finishing their quiz gets their result screen immediately instead of
waiting on an LLM round trip. Same "fire, open your own DB session, update
status on completion/failure" shape as src/ai/ocr_service.py's
run_ocr_background.

The resulting summary is one shared piece of text surfaced in three places
that already read QuizAttempt/GapReportOut: the student's own result view,
the parent dashboard (GET /parent/children/{id}/quiz-result), and the
class teacher's roster (GET /school/classes/{n}/quiz-summaries) — so it's
written in plain language usable by all three audiences, not just one.
"""

import logging
import uuid

from pydantic import BaseModel

from src.core.config import settings
from src.core.database import AsyncSessionFactory
from src.models.quiz import QuizAttempt

logger = logging.getLogger(__name__)


class _GeneratedSummary(BaseModel):
    summary: str


def _build_prompt(attempt: QuizAttempt) -> str:
    student_class = attempt.class_number_at_attempt
    lines = [
        f"A Class {student_class} student just completed an adaptive diagnostic quiz "
        f"across these subjects: {', '.join(attempt.subjects)}.",
        f"Overall score: {attempt.overall_score if attempt.overall_score is not None else 'not available'}.",
        "Per-subject results:",
    ]
    for subject, score_info in (attempt.subject_scores or {}).items():
        if score_info is None:
            lines.append(f"  - {subject}: not tested (no question bank available yet).")
            continue
        lines.append(
            f"  - {subject}: score {score_info['score']}%, "
            f"{score_info['gaps_found']} of {score_info['topics_tested']} topics showed a gap, "
            f"averaging {score_info['average_classes_behind']} class(es) behind where a gap was found."
        )

    gaps = []
    for subject, lane in (attempt.engine_state or {}).get("lanes", {}).items():
        for g in lane.get("gaps", []):
            gaps.append(f"{subject} — {g['topic_name']} (traced back to Class {g['deepest_probed_class']})")
    if gaps:
        lines.append("Specific gaps found, traced to the class level where the student last answered correctly:")
        lines.extend(f"  - {g}" for g in gaps)
    else:
        lines.append("No gaps were found — the student answered correctly at their own class level everywhere tested.")

    return (
        "You are writing a short, warm, plain-language summary of a young child's diagnostic "
        "quiz result. The same text will be read by the child's parent, their class teacher, "
        "and shown on the student's own dashboard — so avoid jargon, avoid sounding clinical or "
        "alarming, and keep it encouraging even when gaps were found.\n\n"
        + "\n".join(lines)
        + "\n\n"
        "Write a summary of 3-5 short sentences that covers exactly these three things, in this "
        "order:\n"
        "1. The student's current performance level relative to their own Class "
        f"{student_class}.\n"
        "2. Where their level should actually be (call out specific subjects/topics if gaps were "
        "found; if no gaps, say so plainly).\n"
        "3. How the platform will address any gaps going forward — upcoming learning modules and "
        "future assessments will focus on the traced-back topics before moving on, so the student "
        "rebuilds the missing foundation rather than being pushed ahead regardless.\n"
        "Do not invent facts beyond what's given above. Do not use markdown formatting."
    )


def _get_llm_client():
    if not settings.GEMINI_API_KEY:
        return None
    from google import genai

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _generate_sync(prompt: str) -> str:
    from google.genai import types

    client = _get_llm_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured on this deployment.")

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_GeneratedSummary,
        ),
    )
    return _GeneratedSummary.model_validate_json(response.text).summary


async def run_summary_background(attempt_id: uuid.UUID) -> None:
    """Generate and store the AI summary for one completed attempt.

    On any failure (missing API key, LLM error, etc.) the attempt is marked
    ai_summary_status="failed" rather than left "pending" forever — callers
    should treat "failed" as "not available", not retry indefinitely.
    """
    import asyncio

    logger.info("[QuizSummary] Generating summary for attempt %s", attempt_id)
    try:
        async with AsyncSessionFactory() as session:
            attempt = await session.get(QuizAttempt, attempt_id)
            if attempt is None:
                logger.error("[QuizSummary] Attempt %s not found — aborting.", attempt_id)
                return
            prompt = _build_prompt(attempt)

        summary_text = await asyncio.to_thread(_generate_sync, prompt)

        async with AsyncSessionFactory() as session:
            attempt = await session.get(QuizAttempt, attempt_id)
            if attempt is None:
                return
            attempt.ai_summary = summary_text
            attempt.ai_summary_status = "ready"
            session.add(attempt)
            await session.commit()
        logger.info("[QuizSummary] Summary ready for attempt %s", attempt_id)
    except Exception as exc:  # noqa: BLE001 — never let a background task crash the loop
        logger.error("[QuizSummary] Failed for attempt %s: %s", attempt_id, exc)
        try:
            async with AsyncSessionFactory() as session:
                attempt = await session.get(QuizAttempt, attempt_id)
                if attempt is not None:
                    attempt.ai_summary_status = "failed"
                    session.add(attempt)
                    await session.commit()
        except Exception:  # noqa: BLE001
            logger.error("[QuizSummary] Could not even mark attempt %s as failed.", attempt_id)
