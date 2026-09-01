"""
Learning progress — append-only ingest, progress computed on read.

Two halves, deliberately kept apart:

  ingest_events()   appends rows to learning_events and never updates one.
                    Idempotent on (student_id, client_event_id), so an
                    offline device can retry a failed sync as often as it
                    likes without ever creating a duplicate.

  *_progress()      projects that log into "where is this student right
                    now" — status, percentage, current lesson, timings.
                    Nothing is cached or denormalized, so a late-arriving
                    offline event can never overwrite newer state, and a
                    student switching devices simply sees the union of
                    everything that has synced.

A "module" is one subject's chapter set for one class (e.g. Mathematics /
Class 3); its lessons are the Lesson rows for that pair. Progress is
lesson-completion based, per the MVP rule: 6 of 10 lessons = 60%.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.learning import (
    CLIENT_EMITTED_EVENT_TYPES,
    LearningEvent,
    LearningEventType,
)
from src.models.lesson import Lesson
from src.models.student import Student
from src.schemas.learning import (
    ClassProgressOut,
    ClassStudentProgressOut,
    LearningEventIn,
    LearningEventSyncResponse,
    ModuleProgressOut,
    RecentActivityOut,
    RejectedEventOut,
    StudentProgressOut,
    StudentSubjectProgressOut,
)

# Longest wall-clock span we will believe for a single activity. Anything
# above this is a backgrounded tab or a sleeping device, not study time, so
# it is dropped rather than stored — "time spent" stays best-effort but is
# never quietly wrong.
_MAX_PLAUSIBLE_DURATION_MS = 4 * 60 * 60 * 1000

# Events that mean the student is actually working inside the module (as
# opposed to merely having opened it).
_ACTIVITY_EVENT_TYPES = frozenset(
    {
        LearningEventType.LESSON_STARTED.value,
        LearningEventType.LESSON_COMPLETED.value,
        LearningEventType.ACTIVITY_COMPLETED.value,
        LearningEventType.QUIZ_STARTED.value,
        LearningEventType.QUIZ_COMPLETED.value,
    }
)

STATUS_NOT_STARTED = "not_started"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"

_RECENT_ACTIVITY_LIMIT = 10


def module_key_for(subject: str, class_number: int) -> str:
    """Stable identity of a learning module. Always built server-side."""
    return f"{subject}|{class_number}"


def module_title_for(subject: str, class_number: int) -> str:
    return f"{subject} · Class {class_number}"


def _naive_utc(value: datetime) -> datetime:
    """Match the codebase's naive-UTC timestamp convention."""
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


# ── Ingest ─────────────────────────────────────────────────────────────────────

async def ingest_events(
    student: Student,
    events: list[LearningEventIn],
    session: AsyncSession,
) -> LearningEventSyncResponse:
    """
    Append a batch of queued events for one student.

    Every id the caller may safely drop from its queue comes back named:
    accepted (stored now), duplicates (already stored — a retry), rejected
    (never storable, so retrying is pointless). Anything unnamed stays
    queued and is retried on the next flush.
    """
    response = LearningEventSyncResponse()
    if not events:
        return response

    # Everything that identifies *who* and *which class* comes from the
    # authenticated student, never from the payload.
    now = datetime.utcnow()

    incoming_ids = [e.client_event_id for e in events if e.client_event_id]
    existing_ids = await _existing_client_event_ids(student.id, incoming_ids, session)

    lesson_cache: dict[uuid.UUID, Optional[Lesson]] = {}
    seen_in_batch: set[str] = set()
    touched_module_keys: set[str] = set()

    for incoming in events:
        client_event_id = (incoming.client_event_id or "").strip()
        if not client_event_id:
            response.rejected.append(
                RejectedEventOut(client_event_id="", reason="Missing client_event_id.")
            )
            continue

        if client_event_id in existing_ids or client_event_id in seen_in_batch:
            response.duplicates.append(client_event_id)
            continue

        try:
            event_type = LearningEventType(incoming.event_type)
        except ValueError:
            response.rejected.append(
                RejectedEventOut(
                    client_event_id=client_event_id,
                    reason=f"Unknown event type '{incoming.event_type}'.",
                )
            )
            continue

        if event_type not in CLIENT_EMITTED_EVENT_TYPES:
            response.rejected.append(
                RejectedEventOut(
                    client_event_id=client_event_id,
                    reason=f"'{event_type.value}' is derived by the server, not reported by clients.",
                )
            )
            continue

        # ── Resolve the module this event belongs to, server-side ──────────
        lesson: Optional[Lesson] = None
        if incoming.lesson_id is not None:
            if incoming.lesson_id not in lesson_cache:
                lesson_cache[incoming.lesson_id] = await session.get(
                    Lesson, incoming.lesson_id
                )
            lesson = lesson_cache[incoming.lesson_id]
            if lesson is None:
                response.rejected.append(
                    RejectedEventOut(
                        client_event_id=client_event_id, reason="Unknown lesson."
                    )
                )
                continue
            subject, class_number = lesson.subject, lesson.class_number
        else:
            subject = (incoming.subject or "").strip()
            if not subject:
                response.rejected.append(
                    RejectedEventOut(
                        client_event_id=client_event_id,
                        reason="A module-level event needs a subject or a lesson_id.",
                    )
                )
                continue
            if student.class_number is None:
                response.rejected.append(
                    RejectedEventOut(
                        client_event_id=client_event_id,
                        reason="Student has not completed class setup yet.",
                    )
                )
                continue
            class_number = student.class_number

        occurred_at = _naive_utc(incoming.occurred_at)
        # A device clock running fast would otherwise park this event at the
        # top of every "recent activity" list forever.
        if occurred_at > now + timedelta(minutes=5):
            occurred_at = now

        duration_ms = incoming.duration_ms
        if duration_ms is not None and not (0 < duration_ms <= _MAX_PLAUSIBLE_DURATION_MS):
            duration_ms = None

        key = module_key_for(subject, class_number)
        stored = await _append_event(
            session,
            LearningEvent(
                client_event_id=client_event_id,
                student_id=student.id,
                event_type=event_type.value,
                module_key=key,
                subject=subject,
                class_number=class_number,
                lesson_id=lesson.id if lesson else None,
                occurred_at=occurred_at,
                received_at=now,
                duration_ms=duration_ms,
                detail=incoming.detail,
            ),
        )
        seen_in_batch.add(client_event_id)
        if stored:
            response.accepted.append(client_event_id)
            touched_module_keys.add(key)
        else:
            # Lost a race with a concurrent sync of the same event — which is
            # exactly what the unique constraint is there for.
            response.duplicates.append(client_event_id)

    if touched_module_keys:
        await _append_derived_events(student.id, touched_module_keys, session)

    return response


async def _existing_client_event_ids(
    student_id: uuid.UUID, client_event_ids: list[str], session: AsyncSession
) -> set[str]:
    if not client_event_ids:
        return set()
    result = await session.execute(
        select(LearningEvent.client_event_id).where(
            LearningEvent.student_id == student_id,
            LearningEvent.client_event_id.in_(client_event_ids),  # type: ignore[attr-defined]
        )
    )
    return set(result.scalars().all())


async def _append_event(session: AsyncSession, event: LearningEvent) -> bool:
    """
    Insert one event inside a SAVEPOINT. Returns False when the unique
    constraint rejected it (a concurrent sync of the same event got there
    first) without poisoning the surrounding transaction.
    """
    try:
        async with session.begin_nested():
            session.add(event)
            await session.flush()
    except IntegrityError:
        return False
    return True


async def _append_derived_events(
    student_id: uuid.UUID, module_keys: set[str], session: AsyncSession
) -> None:
    """
    Append MODULE_STARTED / MODULE_COMPLETED for the modules this batch
    touched.

    Derived on the server rather than emitted by the device: only the server
    sees every device's events, so only it can tell that the lesson just
    completed on this phone was the module's last one. Deterministic
    client_event_ids mean each can be appended at most once per student.
    """
    result = await session.execute(
        select(LearningEvent).where(
            LearningEvent.student_id == student_id,
            LearningEvent.module_key.in_(module_keys),  # type: ignore[attr-defined]
        )
    )
    events = list(result.scalars().all())

    lesson_totals = await _lesson_totals_for_modules(module_keys, session)

    by_module: dict[str, list[LearningEvent]] = {key: [] for key in module_keys}
    for event in events:
        by_module.setdefault(event.module_key, []).append(event)

    for module_key, module_events in by_module.items():
        if not module_events:
            continue
        present_types = {e.event_type for e in module_events}
        sample = module_events[0]

        activity = [e for e in module_events if e.event_type in _ACTIVITY_EVENT_TYPES]
        if activity and LearningEventType.MODULE_STARTED.value not in present_types:
            await _append_event(
                session,
                LearningEvent(
                    client_event_id=f"srv:MODULE_STARTED:{module_key}",
                    student_id=student_id,
                    event_type=LearningEventType.MODULE_STARTED.value,
                    module_key=module_key,
                    subject=sample.subject,
                    class_number=sample.class_number,
                    occurred_at=min(e.occurred_at for e in activity),
                ),
            )

        completed = [
            e
            for e in module_events
            if e.event_type == LearningEventType.LESSON_COMPLETED.value and e.lesson_id
        ]
        total = lesson_totals.get(module_key, 0)
        distinct_completed = {e.lesson_id for e in completed}
        if (
            total
            and len(distinct_completed) >= total
            and LearningEventType.MODULE_COMPLETED.value not in present_types
        ):
            await _append_event(
                session,
                LearningEvent(
                    client_event_id=f"srv:MODULE_COMPLETED:{module_key}",
                    student_id=student_id,
                    event_type=LearningEventType.MODULE_COMPLETED.value,
                    module_key=module_key,
                    subject=sample.subject,
                    class_number=sample.class_number,
                    occurred_at=max(e.occurred_at for e in completed),
                ),
            )


async def _lesson_totals_for_modules(
    module_keys: Iterable[str], session: AsyncSession
) -> dict[str, int]:
    class_numbers = set()
    for key in module_keys:
        _, _, raw_class = key.rpartition("|")
        if raw_class.isdigit():
            class_numbers.add(int(raw_class))
    if not class_numbers:
        return {}
    lessons = await _lessons_for_classes(class_numbers, session)
    totals: dict[str, int] = {}
    for lesson in lessons:
        key = module_key_for(lesson.subject, lesson.class_number)
        totals[key] = totals.get(key, 0) + 1
    return totals


async def _lessons_for_classes(
    class_numbers: set[int], session: AsyncSession
) -> list[Lesson]:
    if not class_numbers:
        return []
    result = await session.execute(
        select(Lesson)
        .where(Lesson.class_number.in_(class_numbers))  # type: ignore[attr-defined]
        .order_by(Lesson.subject, Lesson.chapter_number)
    )
    return list(result.scalars().all())


# ── Projection ─────────────────────────────────────────────────────────────────

def _calculate_learning_points(events: list[LearningEvent]) -> int:
    """
    Compute total learning points from verified activities:
    - 50 pts per unique completed lesson (LESSON_COMPLETED)
    - 100 pts per unique completed module (MODULE_COMPLETED)
    - 10 pts per quiz check completed (QUIZ_COMPLETED)
    - 5 pts per activity slide completed (ACTIVITY_COMPLETED)
    - 5 pts per lesson started (LESSON_STARTED)
    """
    points = 0
    completed_lessons: set[uuid.UUID] = set()
    completed_modules: set[str] = set()

    for event in events:
        if event.event_type == LearningEventType.LESSON_COMPLETED.value and event.lesson_id:
            if event.lesson_id not in completed_lessons:
                completed_lessons.add(event.lesson_id)
                points += 50
        elif event.event_type == LearningEventType.MODULE_COMPLETED.value:
            if event.module_key not in completed_modules:
                completed_modules.add(event.module_key)
                points += 100
        elif event.event_type == LearningEventType.QUIZ_COMPLETED.value:
            points += 10
        elif event.event_type == LearningEventType.ACTIVITY_COMPLETED.value:
            points += 5
        elif event.event_type == LearningEventType.LESSON_STARTED.value:
            points += 5

    return points


def _calculate_learning_streaks(events: list[LearningEvent]) -> tuple[int, int]:
    """
    Compute current and longest consecutive daily learning streaks (in days).
    A day counts if at least one learning event occurred on that calendar date.
    """
    if not events:
        return 0, 0

    activity_dates = sorted({event.occurred_at.date() for event in events})
    if not activity_dates:
        return 0, 0

    longest = 1
    current_run = 1
    for i in range(1, len(activity_dates)):
        if activity_dates[i] == activity_dates[i - 1] + timedelta(days=1):
            current_run += 1
            if current_run > longest:
                longest = current_run
        else:
            current_run = 1

    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    last_date = activity_dates[-1]

    if last_date < yesterday:
        current_streak = 0
    else:
        current_streak = 1
        for i in range(len(activity_dates) - 1, 0, -1):
            if activity_dates[i] - timedelta(days=1) == activity_dates[i - 1]:
                current_streak += 1
            else:
                break

    return current_streak, longest


async def get_student_progress(
    student: Student, session: AsyncSession
) -> StudentProgressOut:
    """Every module for this student's class, plus anything they have events for."""
    result = await session.execute(
        select(LearningEvent)
        .where(LearningEvent.student_id == student.id)
        .order_by(LearningEvent.occurred_at)
    )
    events = list(result.scalars().all())

    class_numbers: set[int] = {e.class_number for e in events}
    if student.class_number is not None:
        class_numbers.add(student.class_number)
    lessons = await _lessons_for_classes(class_numbers, session)

    module_lessons: dict[str, list[Lesson]] = {}
    for lesson in lessons:
        module_lessons.setdefault(
            module_key_for(lesson.subject, lesson.class_number), []
        ).append(lesson)
    lessons_by_id = {lesson.id: lesson for lesson in lessons}

    events_by_module: dict[str, list[LearningEvent]] = {}
    for event in events:
        events_by_module.setdefault(event.module_key, []).append(event)

    # A module is listed if it belongs to the student's current class, or if
    # the student has any history in it (e.g. they studied it in a class they
    # have since moved on from).
    module_keys = {
        key
        for key in module_lessons
        if student.class_number is not None and key.endswith(f"|{student.class_number}")
    } | set(events_by_module)

    modules = [
        _project_module(
            module_key,
            module_lessons.get(module_key, []),
            events_by_module.get(module_key, []),
        )
        for module_key in sorted(module_keys)
    ]

    total_lessons = sum(m.total_lessons for m in modules)
    completed_lessons = sum(m.completed_lessons for m in modules)
    overall = round(completed_lessons / total_lessons * 100) if total_lessons else 0

    points = _calculate_learning_points(events)
    current_streak, longest_streak = _calculate_learning_streaks(events)

    return StudentProgressOut(
        overall_percent=overall,
        total_modules=len(modules),
        modules_completed=sum(1 for m in modules if m.status == STATUS_COMPLETED),
        modules_in_progress=sum(1 for m in modules if m.status == STATUS_IN_PROGRESS),
        modules_not_started=sum(1 for m in modules if m.status == STATUS_NOT_STARTED),
        points=points,
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_activity_at=max((e.occurred_at for e in events), default=None),
        modules=modules,
        recent_activity=[
            RecentActivityOut(
                event_type=event.event_type,
                subject=event.subject,
                module_key=event.module_key,
                lesson_id=event.lesson_id,
                lesson_title=(
                    lessons_by_id[event.lesson_id].chapter_title
                    if event.lesson_id in lessons_by_id
                    else None
                ),
                occurred_at=event.occurred_at,
            )
            for event in sorted(events, key=lambda e: e.occurred_at, reverse=True)[
                :_RECENT_ACTIVITY_LIMIT
            ]
        ],
    )


def _project_module(
    module_key: str,
    lessons: list[Lesson],
    events: list[LearningEvent],
) -> ModuleProgressOut:
    """Fold one module's event log into its current state."""
    if lessons:
        subject, class_number = lessons[0].subject, lessons[0].class_number
    elif events:
        subject, class_number = events[0].subject, events[0].class_number
    else:  # pragma: no cover — a key always comes from one of the two
        subject, _, raw_class = module_key.rpartition("|")
        class_number = int(raw_class) if raw_class.isdigit() else 0

    total_lessons = len(lessons)
    lesson_ids_in_module = {lesson.id for lesson in lessons}

    completed_ids: list[uuid.UUID] = []
    for event in events:
        if (
            event.event_type == LearningEventType.LESSON_COMPLETED.value
            and event.lesson_id is not None
            and event.lesson_id not in completed_ids
        ):
            completed_ids.append(event.lesson_id)
    # Only lessons that still belong to the module count toward the total.
    if lesson_ids_in_module:
        completed_ids = [lid for lid in completed_ids if lid in lesson_ids_in_module]

    module_completed_at = max(
        (
            e.occurred_at
            for e in events
            if e.event_type == LearningEventType.MODULE_COMPLETED.value
        ),
        default=None,
    )
    is_complete = module_completed_at is not None or (
        total_lessons > 0 and len(completed_ids) >= total_lessons
    )

    if not events:
        status = STATUS_NOT_STARTED
    elif is_complete:
        status = STATUS_COMPLETED
    else:
        status = STATUS_IN_PROGRESS

    if is_complete:
        progress_percent = 100
    elif total_lessons:
        progress_percent = round(len(completed_ids) / total_lessons * 100)
    else:
        progress_percent = 0

    started_at = min(
        (
            e.occurred_at
            for e in events
            if e.event_type == LearningEventType.MODULE_STARTED.value
        ),
        default=None,
    )

    current_lesson = None
    if not is_complete:
        # The lesson they were last actually inside, if it is still unfinished;
        # otherwise the next one in chapter order.
        for event in sorted(events, key=lambda e: e.occurred_at, reverse=True):
            if (
                event.event_type == LearningEventType.LESSON_STARTED.value
                and event.lesson_id is not None
                and event.lesson_id not in completed_ids
                and event.lesson_id in lesson_ids_in_module
            ):
                current_lesson = next(
                    (l for l in lessons if l.id == event.lesson_id), None
                )
                break
        if current_lesson is None:
            current_lesson = next((l for l in lessons if l.id not in completed_ids), None)

    total_duration_ms = sum(e.duration_ms or 0 for e in events)

    return ModuleProgressOut(
        module_key=module_key,
        subject=subject,
        class_number=class_number,
        title=module_title_for(subject, class_number),
        status=status,
        total_lessons=total_lessons,
        completed_lessons=len(completed_ids),
        completed_lesson_ids=completed_ids,
        progress_percent=progress_percent,
        current_lesson_id=current_lesson.id if current_lesson else None,
        current_lesson_title=current_lesson.chapter_title if current_lesson else None,
        started_at=started_at,
        last_activity_at=max((e.occurred_at for e in events), default=None),
        completed_at=module_completed_at,
        time_spent_seconds=(round(total_duration_ms / 1000) if total_duration_ms else None),
    )


def _normalize_subject_key(s: Optional[str]) -> str:
    if not s:
        return ""
    import re
    clean = s.lower().strip()
    base = re.sub(r"\s*\([^)]*\)", "", clean).strip()
    if "environmental" in base or "evs" in base:
        return "evs"
    if "mathematics" in base or "math" in base:
        return "mathematics"
    if "english" in base:
        return "english"
    if "hindi" in base:
        return "hindi"
    if "science" in base and "social" not in base:
        return "science"
    if "social" in base:
        return "social studies"
    return base


def _match_subject(subj: Optional[str], target_subjects: Optional[set[str]]) -> bool:
    if not target_subjects:
        return True
    if not subj:
        return False
    norm = _normalize_subject_key(subj)
    return norm in target_subjects or (subj.strip().lower() in target_subjects)


async def get_class_progress(
    students: list[Student],
    class_number: int,
    section: str,
    session: AsyncSession,
    subject: Optional[str] = None,
    allowed_subjects: Optional[list[str]] = None,
) -> ClassProgressOut:
    """
    One row per student, scoped to the teacher's assigned subject(s).
    """
    target_subjects: Optional[set[str]] = None
    raw_candidates = []
    if subject and subject.strip():
        raw_candidates.append(subject.strip())
    elif allowed_subjects:
        raw_candidates.extend([s.strip() for s in allowed_subjects if s and s.strip()])

    specific_candidates = [
        s for s in raw_candidates if s.lower() not in ("general", "all", "")
    ]
    if specific_candidates:
        target_subjects = {_normalize_subject_key(s) for s in specific_candidates}

    raw_lessons = await _lessons_for_classes({class_number}, session)
    all_class_subjects = sorted({l.subject for l in raw_lessons if l.subject})

    lessons = raw_lessons
    if target_subjects:
        lessons = [l for l in raw_lessons if _match_subject(l.subject, target_subjects)]

    module_lessons: dict[str, list[Lesson]] = {}
    for lesson in lessons:
        module_lessons.setdefault(
            module_key_for(lesson.subject, lesson.class_number), []
        ).append(lesson)

    is_general_or_multi = (
        not target_subjects
        or len(allowed_subjects or []) > 1
        or any((s or "").lower() in ("general", "all", "") for s in (allowed_subjects or []))
    )
    if is_general_or_multi and all_class_subjects:
        subjects = all_class_subjects
    elif lessons:
        subjects = sorted({lesson.subject for lesson in lessons})
    elif target_subjects:
        subjects = sorted([s.capitalize() for s in target_subjects])
    else:
        subjects = []

    events_by_student: dict[uuid.UUID, list[LearningEvent]] = {}
    subs_by_student: dict[uuid.UUID, list] = {}
    student_ids = [s.id for s in students]
    if student_ids:
        evt_query = select(LearningEvent).where(
            LearningEvent.student_id.in_(student_ids),  # type: ignore[attr-defined]
            LearningEvent.class_number == class_number,
        )
        result = await session.execute(evt_query.order_by(LearningEvent.occurred_at))
        for event in result.scalars().all():
            if not _match_subject(event.subject, target_subjects):
                continue
            events_by_student.setdefault(event.student_id, []).append(event)

        subs_by_student: dict[uuid.UUID, list] = {}
        attempts_by_student: dict[uuid.UUID, list] = {}
        try:
            from src.models.teacher import Assignment, AssignmentSubmission, AssignmentAttempt
            asgn_stmt = select(Assignment).where(Assignment.class_number == class_number)
            asgn_res = await session.execute(asgn_stmt)
            all_asgns = asgn_res.scalars().all()
            valid_asgn_ids = {
                a.id for a in all_asgns
                if _match_subject(a.subject, target_subjects)
            }

            subs_res = await session.execute(
                select(AssignmentSubmission).where(
                    AssignmentSubmission.student_id.in_(student_ids)  # type: ignore[attr-defined]
                )
            )
            for sub in subs_res.scalars().all():
                if sub.assignment_id in valid_asgn_ids:
                    subs_by_student.setdefault(sub.student_id, []).append(sub)

            attempts_res = await session.execute(
                select(AssignmentAttempt)
                .where(AssignmentAttempt.student_id.in_(student_ids))  # type: ignore[attr-defined]
                .order_by(AssignmentAttempt.started_at.asc(), AssignmentAttempt.attempt_number.asc())
            )
            for att in attempts_res.scalars().all():
                if att.assignment_id in valid_asgn_ids:
                    attempts_by_student.setdefault(att.student_id, []).append(att)
        except Exception:
            pass

    rows: list[ClassStudentProgressOut] = []
    for student in students:
        student_events = events_by_student.get(student.id, [])
        by_module: dict[str, list[LearningEvent]] = {}
        for event in student_events:
            by_module.setdefault(event.module_key, []).append(event)

        modules = [
            _project_module(key, module_lessons[key], by_module.get(key, []))
            for key in sorted(module_lessons)
        ]
        by_subject = {m.subject: m for m in modules}

        total_lessons = sum(m.total_lessons for m in modules)
        completed_lessons = sum(m.completed_lessons for m in modules)
        curriculum_pct = round(completed_lessons / total_lessons * 100) if total_lessons else 0
        points = _calculate_learning_points(student_events)
        current_streak, _ = _calculate_learning_streaks(student_events)

        st_subs = subs_by_student.get(student.id, [])
        st_attempts = attempts_by_student.get(student.id, [])

        attempts_by_asgn: dict[uuid.UUID, list] = {}
        for att in st_attempts:
            attempts_by_asgn.setdefault(att.assignment_id, []).append(att)

        asgn_ids = set(attempts_by_asgn.keys()) | {s.assignment_id for s in st_subs}
        asgn_metrics = []
        for aid in asgn_ids:
            raw_atts = attempts_by_asgn.get(aid, [])
            sub = next((s for s in st_subs if s.assignment_id == aid), None)
            if raw_atts:
                sorted_atts = sorted(raw_atts, key=lambda a: (a.started_at, a.attempt_number))
                initial_pct = float(
                    sorted_atts[0].percentage
                    if sorted_atts[0].percentage is not None
                    else ((sorted_atts[0].score or 0) / max(1.0, sorted_atts[0].max_score or 100.0)) * 100.0
                )
                latest_pct = float(
                    sorted_atts[-1].percentage
                    if sorted_atts[-1].percentage is not None
                    else ((sorted_atts[-1].score or 0) / max(1.0, sorted_atts[-1].max_score or 100.0)) * 100.0
                )
                delta = round(latest_pct - initial_pct, 1)
                is_passed = bool(sorted_atts[-1].is_passed if sorted_atts[-1].is_passed is not None else (latest_pct >= 60.0))
                is_lagging = (latest_pct < 60.0) or (delta <= -5.0)
            elif sub:
                sub_pct = float(
                    sub.percentage
                    if sub.percentage is not None
                    else ((sub.score or 0) / max(1.0, sub.max_score or 100.0)) * 100.0
                )
                latest_pct = sub_pct
                delta = 0.0
                is_passed = bool(sub.is_passed if sub.is_passed is not None else (sub_pct >= 60.0))
                is_lagging = sub_pct < 60.0
            else:
                continue

            asgn_metrics.append({
                "latest_score": latest_pct,
                "delta": delta,
                "is_passed": is_passed,
                "is_lagging": is_lagging,
            })

        total_asgns = len(asgn_metrics)
        passed_asgns = sum(1 for m in asgn_metrics if m["is_passed"])
        lagging_asgns = sum(1 for m in asgn_metrics if m["is_lagging"])
        avg_score = round(sum(m["latest_score"] for m in asgn_metrics) / total_asgns, 1) if total_asgns else 0.0
        overall_growth = round(sum(m["delta"] for m in asgn_metrics) / total_asgns, 1) if total_asgns else 0.0
        # Holistic mastery solely based on assessment performance and consecutive growth trajectory
        holistic = min(100, max(0, round(avg_score + (overall_growth * 0.25)))) if total_asgns else 0

        rows.append(
            ClassStudentProgressOut(
                student_id=student.id,
                unique_number=student.unique_number,
                full_name=student.full_name or "",
                overall_percent=curriculum_pct,
                modules_completed=sum(1 for m in modules if m.status == STATUS_COMPLETED),
                modules_in_progress=sum(1 for m in modules if m.status == STATUS_IN_PROGRESS),
                points=points,
                current_streak=current_streak,
                last_activity_at=max((e.occurred_at for e in student_events), default=None),
                total_assessments_taken=total_asgns,
                average_test_score=avg_score,
                assessments_passed=passed_asgns,
                assessments_lagging=lagging_asgns,
                holistic_mastery_percent=holistic,
                subjects=[
                    StudentSubjectProgressOut(
                        subject=subject,
                        progress_percent=(
                            by_subject[subject].progress_percent
                            if subject in by_subject
                            else 0
                        ),
                        status=(
                            by_subject[subject].status
                            if subject in by_subject
                            else STATUS_NOT_STARTED
                        ),
                    )
                    for subject in subjects
                ],
            )
        )

    return ClassProgressOut(
        class_number=class_number,
        section=section.upper(),
        subjects=subjects,
        students=rows,
    )
