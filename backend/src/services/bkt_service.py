"""
Bayesian Knowledge Tracing (BKT) — per-topic mastery estimation.

This is fixed-parameter BKT: the four probabilities below are the standard
textbook defaults, NOT calibrated against this platform's real learner data
(there isn't a dataset for that yet — see LEARNING_PATH.txt). It is still a
legitimate simple ML technique rather than just another heuristic sort:
it's a probabilistic latent-state model (an HMM over a hidden "knows the
skill" variable) with a principled Bayesian update rule, not an arbitrary
scoring formula. It differs from the plain gap-counting it replaces because
it weighs a full chronological sequence of right/wrong evidence per topic
into a single mastery probability, instead of a single pass/fail snapshot.
Critically, the code below is written generically over the full
`QuizAnswer` history per topic — it automatically gets more accurate once
students accumulate more than one attempt per topic in the future, even
though today's diagnostic quiz is a one-time event, so most students will
only have 1-2 data points per topic right now.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.quiz import QuizAnswer, QuizAttempt

# Fixed textbook-default BKT parameters — not learned/tuned from data.
P_INIT = 0.3      # prior probability the student already knows the skill
P_TRANSIT = 0.3   # probability of learning the skill between attempts
P_SLIP = 0.1      # probability of answering wrong despite knowing the skill
P_GUESS = 0.2     # probability of answering right despite not knowing it


def compute_topic_mastery(answers_in_order: list[bool]) -> float:
    """Standard BKT: iterate a chronological (oldest-first) sequence of
    correct/incorrect observations for one student+topic, applying a Bayes-
    rule posterior update followed by the learning transition after each
    observation. Returns the final p(knows the skill). An empty sequence
    (no evidence yet) returns P_INIT, the neutral prior — not zero/None."""
    p_know = P_INIT
    for correct in answers_in_order:
        if correct:
            p_obs_given_know = 1 - P_SLIP
            p_obs_given_not_know = P_GUESS
        else:
            p_obs_given_know = P_SLIP
            p_obs_given_not_know = 1 - P_GUESS

        numerator = p_know * p_obs_given_know
        denominator = numerator + (1 - p_know) * p_obs_given_not_know
        p_know_given_obs = numerator / denominator if denominator else p_know

        p_know = p_know_given_obs + (1 - p_know_given_obs) * P_TRANSIT

    return p_know


async def get_student_topic_mastery(
    student_id: uuid.UUID, session: AsyncSession
) -> dict[uuid.UUID, float]:
    """One query for every QuizAnswer this student has ever submitted
    (QuizAnswer has no student_id of its own, so this joins through
    QuizAttempt), grouped by topic_id in Python, then reduced to a mastery
    probability per topic via compute_topic_mastery. Only topics the
    student has at least one QuizAnswer for appear in the returned dict."""
    result = await session.execute(
        select(QuizAnswer)
        .join(QuizAttempt, QuizAttempt.id == QuizAnswer.attempt_id)
        .where(QuizAttempt.student_id == student_id)
        .order_by(QuizAnswer.answered_at.asc())
    )
    answers_by_topic: dict[uuid.UUID, list[bool]] = {}
    for answer in result.scalars().all():
        answers_by_topic.setdefault(answer.topic_id, []).append(answer.is_correct)

    return {
        topic_id: compute_topic_mastery(answers)
        for topic_id, answers in answers_by_topic.items()
    }
