"""
AI Quiz Advice Service.
Generates personalized feedback, weak concept analysis, and study advice for students,
parents, and teachers upon completing an AI quiz assignment attempt.
"""
import json
import logging
import os
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

def generate_offline_advice(score_percent: float, wrong_count: int, total_count: int, weak_topics: list[str]) -> str:
    """Fallback advice generator if Gemini API key is missing or call fails."""
    if score_percent >= 90:
        tone = "Excellent performance!"
        recommendation = "You have mastered the concepts tested in this quiz. Keep practicing to maintain high performance."
    elif score_percent >= 60:
        tone = "Good job! You passed the test."
        recommendation = "You showed solid conceptual understanding. Review the questions you got wrong to solidify your grasp."
    else:
        tone = "Needs Improvement (Score below 60% threshold)."
        recommendation = "Don't worry! Review the fundamental concepts for this chapter. Take the adaptive re-attempt quiz to improve your score."

    topic_str = f" Weak areas identified: {', '.join(weak_topics)}." if weak_topics else ""
    return f"{tone} You scored {score_percent:.1f}% ({total_count - wrong_count}/{total_count} correct).{topic_str} Advice: {recommendation}"


async def generate_quiz_attempt_advice(
    attempt_id: uuid.UUID,
    _caller_session: Optional[AsyncSession] = None,
) -> None:
    """
    Background worker that updates AssignmentAttempt.ai_feedback with tailored guidance.
    Uses its own dedicated AsyncSessionFactory session.
    """
    from src.core.database import AsyncSessionFactory
    from src.models.teacher import AssignmentAttempt

    async with AsyncSessionFactory() as db:
        attempt = await db.get(AssignmentAttempt, attempt_id)
        if not attempt or not attempt.answers_json:
            return

        try:
            answers = json.loads(attempt.answers_json)
            total_count = len(answers)
            wrong_answers = [a for a in answers if not a.get("is_correct", False)]
            wrong_count = len(wrong_answers)
            score_percent = attempt.percentage or (attempt.score / attempt.max_score * 100 if attempt.score is not None else 0.0)

            weak_topics = list(dict.fromkeys([
                a.get("chapter_title") or "Chapter Concept"
                for a in wrong_answers
                if a.get("chapter_title")
            ]))

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                attempt.ai_feedback = generate_offline_advice(score_percent, wrong_count, total_count, weak_topics)
                attempt.ai_feedback_status = "ready"
                db.add(attempt)
                await db.commit()
                return

            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                
                prompt = f"""
You are an empathetic, encouraging AI education tutor.
A primary school student just completed a quiz with a score of {score_percent:.1f}% ({total_count - wrong_count}/{total_count} correct).
Pass threshold is 60%.
Status: {'PASSED' if score_percent >= 60 else 'FAILED - RE-ATTEMPT RECOMMENDED'}.

Incorrectly answered concepts/questions:
{json.dumps([{ 'question': a.get('question_text'), 'chapter': a.get('chapter_title') } for a in wrong_answers], indent=2)}

Provide a concise, 3-sentence diagnostic advice report formatted cleanly in Markdown:
1. Student Praise & Performance Summary: Highlight what they did well.
2. Concept Gaps & Weak Spots: Clearly state which topics need revision.
3. Actionable Next Step: Specific advice for the student, teacher, and parent on what to study before the next attempt.
"""
                response = await model.generate_content_async(prompt)
                if response and response.text:
                    attempt.ai_feedback = response.text.strip()
                    attempt.ai_feedback_status = "ready"
                else:
                    attempt.ai_feedback = generate_offline_advice(score_percent, wrong_count, total_count, weak_topics)
                    attempt.ai_feedback_status = "ready"
            except Exception as gemini_err:
                logger.warning(f"Gemini AI advice generation error: {gemini_err}")
                attempt.ai_feedback = generate_offline_advice(score_percent, wrong_count, total_count, weak_topics)
                attempt.ai_feedback_status = "ready"

            db.add(attempt)
            await db.commit()

        except Exception as err:
            logger.error(f"Error generating quiz attempt advice for attempt {attempt_id}: {err}")
            attempt.ai_feedback_status = "failed"
            db.add(attempt)
            await db.commit()
