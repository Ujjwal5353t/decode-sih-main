"""
Gamification — XP and reward-chest logic.

The server is the only authority here. Nothing in this module accepts an XP
amount or a lesson count from the caller: every figure is either computed
from data already in the database (learning_events, quiz_attempts) or
derived from a rule constant below.

Two guarantees, each enforced by a UNIQUE constraint rather than by a
check-then-write race:

  · XP is paid at most once per source        (uq_xp_student_key)
  · a chest is claimed at most once           (uq_chest_student_index)

Each writer therefore attempts the insert inside a SAVEPOINT and treats
IntegrityError as "someone already did this" — which makes every entry point
safe to call repeatedly, from duplicate requests or concurrent devices.

Note: this module used to also track a daily streak (register_active_day /
effective_streak / local_date_for, plus a per-student timezone). That was
removed — closing knowledge gaps isn't necessarily a daily activity, so a
daily-streak mechanic didn't fit the product. XP and chests are unaffected.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from src.models.gamification import (
    ChestClaim,
    GamificationProfile,
    XpReason,
    XpTransaction,
)
from src.models.learning import LearningEvent, LearningEventType

# ── Rules ─────────────────────────────────────────────────────────────────────

#: Lessons required to earn each successive chest.
LESSONS_PER_CHEST = 5

#: Flat award for finishing a lesson.
XP_PER_LESSON = 10

#: Assessment XP = base + (score/100 * bonus). A diagnostic is worth finishing
#: even when the score is low — the base is the participation floor, the bonus
#: is what performance actually moves.
XP_QUIZ_BASE = 20
XP_QUIZ_SCORE_BONUS = 60

#: Paid out when a chest is opened.
XP_PER_CHEST = 50

#: Gap-module retention quiz XP = base + (score/100 * bonus), same shape as
#: the diagnostic quiz's own award — paid only on a pass (see
#: on_gap_module_completed), since the reward is for actually closing the
#: gap, not merely attempting the review.
XP_GAP_MODULE_BASE = 15
XP_GAP_MODULE_SCORE_BONUS = 25

#: Badge awarded with each chest, by index. Cycles once exhausted.
CHEST_BADGES = [
    "First Steps",
    "Steady Learner",
    "Curious Mind",
    "Knowledge Seeker",
    "Master Explorer",
]


def _utcnow() -> datetime:
    return datetime.utcnow()


# ── Profile ───────────────────────────────────────────────────────────────────

async def get_or_create_profile(
    student_id: uuid.UUID,
    session: AsyncSession,
) -> GamificationProfile:
    """Fetch this student's profile, creating it on first use."""
    result = await session.execute(
        select(GamificationProfile).where(GamificationProfile.student_id == student_id)
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = GamificationProfile(student_id=student_id)
        try:
            async with session.begin_nested():
                session.add(profile)
                await session.flush()
        except IntegrityError:
            # Another request created it between our SELECT and INSERT.
            result = await session.execute(
                select(GamificationProfile).where(
                    GamificationProfile.student_id == student_id
                )
            )
            profile = result.scalar_one()

    return profile


# ── XP ────────────────────────────────────────────────────────────────────────

async def grant_xp(
    session: AsyncSession,
    *,
    profile: GamificationProfile,
    amount: int,
    reason: XpReason,
    source_type: str,
    source_id: Optional[uuid.UUID],
    idempotency_key: str,
    detail: Optional[str] = None,
) -> int:
    """
    Append an XP transaction and move the running total.

    Returns the amount actually granted — 0 when this key was already paid,
    which is the normal outcome for a retried or duplicated request.
    """
    if amount <= 0:
        return 0

    transaction = XpTransaction(
        student_id=profile.student_id,
        amount=amount,
        reason=reason.value,
        source_type=source_type,
        source_id=source_id,
        idempotency_key=idempotency_key,
        detail=detail,
    )
    try:
        async with session.begin_nested():
            session.add(transaction)
            await session.flush()
    except IntegrityError:
        return 0  # already paid for this source

    profile.total_xp += amount
    profile.updated_at = _utcnow()
    session.add(profile)
    return amount


# ── Lesson counting (reads the existing learning log) ─────────────────────────

async def completed_lesson_count(student_id: uuid.UUID, session: AsyncSession) -> int:
    """
    Distinct lessons this student has ever completed.

    Counts DISTINCT lesson_id over LESSON_COMPLETED events, so replaying a
    lesson never inflates chest progress, and the number always reflects real
    learning activity rather than a counter that could drift.
    """
    result = await session.execute(
        select(func.count(func.distinct(LearningEvent.lesson_id))).where(
            LearningEvent.student_id == student_id,
            LearningEvent.event_type == LearningEventType.LESSON_COMPLETED.value,
            LearningEvent.lesson_id.is_not(None),  # type: ignore[union-attr]
        )
    )
    return int(result.scalar_one() or 0)


# ── Entry points used by the learning + quiz flows ────────────────────────────

async def on_lessons_completed(
    session: AsyncSession,
    *,
    student_id: uuid.UUID,
    lesson_ids: list[uuid.UUID],
) -> None:
    """
    Called after lesson-completion events are durably stored.

    Safe to call with lessons that were already rewarded — the per-lesson
    idempotency key absorbs repeats, which is what makes the offline sync
    queue's at-least-once delivery harmless here.
    """
    if not lesson_ids:
        return

    profile = await get_or_create_profile(student_id, session)

    for lesson_id in lesson_ids:
        await grant_xp(
            session,
            profile=profile,
            amount=XP_PER_LESSON,
            reason=XpReason.LESSON_COMPLETED,
            source_type="lesson",
            source_id=lesson_id,
            idempotency_key=f"lesson:{lesson_id}",
        )


async def on_quiz_completed(
    session: AsyncSession,
    *,
    student_id: uuid.UUID,
    attempt_id: uuid.UUID,
    overall_score: Optional[float],
) -> int:
    """
    Called once an attempt is finalised. Returns the XP granted (0 on replay).

    The award scales with the attempt's own score, so it reflects performance
    rather than a flat number chosen in the UI.
    """
    profile = await get_or_create_profile(student_id, session)

    score = max(0.0, min(100.0, overall_score if overall_score is not None else 0.0))
    amount = XP_QUIZ_BASE + round(XP_QUIZ_SCORE_BONUS * score / 100)

    granted = await grant_xp(
        session,
        profile=profile,
        amount=amount,
        reason=XpReason.QUIZ_COMPLETED,
        source_type="quiz_attempt",
        source_id=attempt_id,
        idempotency_key=f"quiz_attempt:{attempt_id}",
        detail=f"score={score}",
    )
    return granted


async def on_gap_module_completed(
    session: AsyncSession,
    *,
    student_id: uuid.UUID,
    attempt_id: uuid.UUID,
    score_percent: float,
    passed: bool,
) -> int:
    """
    Called once a gap-driven remediation quiz (src/services/remediation_service.py)
    is graded. XP is paid only on a pass — this reward is for actually closing
    the gap, not for merely attempting the review, since an unlimited-retry
    quiz with a participation-only reward could be farmed by resubmitting.
    """
    if not passed:
        return 0

    profile = await get_or_create_profile(student_id, session)
    score = max(0.0, min(100.0, score_percent))
    amount = XP_GAP_MODULE_BASE + round(XP_GAP_MODULE_SCORE_BONUS * score / 100)

    return await grant_xp(
        session,
        profile=profile,
        amount=amount,
        reason=XpReason.GAP_MODULE_COMPLETED,
        source_type="remediation_attempt",
        source_id=attempt_id,
        idempotency_key=f"remediation_attempt:{attempt_id}",
        detail=f"score={score}",
    )


async def get_xp_for_source(
    session: AsyncSession, *, student_id: uuid.UUID, source_type: str, source_id: uuid.UUID
) -> int:
    """
    Read-only lookup of the XP actually paid out for one source (e.g. a
    specific quiz attempt), independent of when the caller asks — a result
    screen can call this on first load or on a later refresh and always get
    the same durable figure, rather than recomputing the reward formula
    (and risking it drifting from what grant_xp actually recorded).
    """
    result = await session.execute(
        select(func.coalesce(func.sum(XpTransaction.amount), 0)).where(
            XpTransaction.student_id == student_id,
            XpTransaction.source_type == source_type,
            XpTransaction.source_id == source_id,
        )
    )
    return int(result.scalar_one())


# ── Chests ────────────────────────────────────────────────────────────────────

def chest_badge_for(index: int) -> str:
    return CHEST_BADGES[index % len(CHEST_BADGES)]


async def claim_chest(
    session: AsyncSession,
    *,
    student_id: uuid.UUID,
) -> dict:
    """
    Claim the next unlocked chest.

    Returns a result dict rather than raising, so the route can turn an
    "already claimed" or "not yet earned" into a clean response. The UNIQUE
    constraint on (student_id, chest_index) is what actually prevents a double
    claim under concurrent requests — the eligibility check below is only for
    a friendly message.
    """
    profile = await get_or_create_profile(student_id, session)
    lessons = await completed_lesson_count(student_id, session)

    chest_index = profile.chests_claimed
    required = (chest_index + 1) * LESSONS_PER_CHEST

    if lessons < required:
        return {
            "claimed": False,
            "reason": "locked",
            "lessons_completed": lessons,
            "lessons_required": required,
        }

    badge = chest_badge_for(chest_index)
    claim = ChestClaim(
        student_id=student_id,
        chest_index=chest_index,
        lessons_at_claim=lessons,
        xp_awarded=XP_PER_CHEST,
        badge=badge,
    )
    try:
        async with session.begin_nested():
            session.add(claim)
            await session.flush()
    except IntegrityError:
        return {
            "claimed": False,
            "reason": "already_claimed",
            "lessons_completed": lessons,
            "lessons_required": required,
        }

    await grant_xp(
        session,
        profile=profile,
        amount=XP_PER_CHEST,
        reason=XpReason.CHEST_CLAIMED,
        source_type="chest",
        source_id=claim.id,
        idempotency_key=f"chest:{chest_index}",
        detail=f"badge={badge}",
    )

    profile.chests_claimed = chest_index + 1
    profile.updated_at = _utcnow()
    session.add(profile)

    return {
        "claimed": True,
        "reason": "ok",
        "chest_index": chest_index,
        "xp_awarded": XP_PER_CHEST,
        "badge": badge,
        "lessons_completed": lessons,
        "lessons_required": required,
    }


# ── Read model for the dashboard ──────────────────────────────────────────────

async def get_summary(
    student_id: uuid.UUID,
    session: AsyncSession,
) -> dict:
    """Everything the dashboard's gamification widgets need, in one read."""
    profile = await get_or_create_profile(student_id, session)

    lessons = await completed_lesson_count(student_id, session)
    chest_index = profile.chests_claimed
    required = (chest_index + 1) * LESSONS_PER_CHEST
    earned_in_cycle = max(0, lessons - chest_index * LESSONS_PER_CHEST)

    badges_result = await session.execute(
        select(ChestClaim.badge)
        .where(ChestClaim.student_id == student_id, ChestClaim.badge.is_not(None))  # type: ignore[union-attr]
        .order_by(ChestClaim.claimed_at)
    )

    return {
        "total_xp": profile.total_xp,
        "lessons_completed": lessons,
        "chest": {
            "index": chest_index,
            "progress": min(earned_in_cycle, LESSONS_PER_CHEST),
            "required": LESSONS_PER_CHEST,
            "unlockable": lessons >= required,
            "next_badge": chest_badge_for(chest_index),
            "xp_reward": XP_PER_CHEST,
        },
        "badges": [b for b in badges_result.scalars().all() if b],
    }
