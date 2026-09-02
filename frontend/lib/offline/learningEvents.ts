/**
 * The offline-first learning-activity queue.
 *
 *   student does something
 *     -> recordLearningEvent() writes it to IndexedDB (survives restarts)
 *     -> a flush is attempted immediately; if it fails, the row stays put
 *     -> the browser fires `online`, or the dashboard mounts
 *     -> flushLearningEvents() POSTs the queue
 *     -> only ids the server names in its response are deleted locally
 *
 * Nothing here retries by guesswork: an event leaves this device's queue
 * only when the server has said, in a response, what it did with it. That
 * plus the device-generated `client_event_id` (which the server dedupes on)
 * is what makes a retry safe — a half-finished sync, a duplicated tab, or a
 * second device replaying the same batch all converge on one stored event.
 */

import {
  LearningEventPayload,
  LearningEventType,
  ModuleProgressOut,
  StudentProgressOut,
  syncLearningEvents,
} from "@/lib/api";
import {
  QUEUE_STORE,
  idbDeleteMany,
  idbGetAll,
  idbPut,
  isOfflineStorageAvailable,
} from "@/lib/offline/db";
import { invalidateStudentProgressCache } from "@/lib/offline/contentCache";

/** Largest batch we hand the server in one request (its cap is 200). */
const SYNC_BATCH_SIZE = 100;

export interface QueuedLearningEvent extends LearningEventPayload {
  /** Whose activity this is — a shared device must not sync it to whoever logs in next. */
  student_id: string;
  /**
   * The module this event belongs to, as this device understands it. A local
   * display hint only: the server always recomputes the authoritative
   * module_key from the lesson, and ignores anything sent here.
   */
  local_module_key?: string | null;
  attempts: number;
  last_error?: string | null;
}

type QueueListener = () => void;
const listeners = new Set<QueueListener>();

/**
 * Subscribe to queue changes — a new event recorded, or a sync settling one.
 *
 * The listener fires once immediately with the current state, so a caller
 * gets its first read through the same path as every later update instead of
 * having to kick one off separately.
 */
export function subscribeToLearningQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
}

function notifyQueueChanged() {
  listeners.forEach((listener) => listener());
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Device-local Y-M-D, used only to scope the LESSON_COMPLETED dedupe key
 * below to "this lesson, today". Coarse alignment here is fine: this key
 * only decides whether two writes are "the same completion" or two separate
 * ones. */
function localDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function moduleKeyFor(subject: string, classNumber: number): string {
  return `${subject}|${classNumber}`;
}

export async function getQueuedEvents(
  studentId: string
): Promise<QueuedLearningEvent[]> {
  const all = await idbGetAll<QueuedLearningEvent>(QUEUE_STORE);
  return all.filter((event) => event.student_id === studentId);
}

export async function getPendingCount(studentId: string): Promise<number> {
  return (await getQueuedEvents(studentId)).length;
}

/**
 * Record one thing the student just did. Always resolves — a learner must
 * never see an activity fail because tracking could not be written.
 */
export async function recordLearningEvent(input: {
  studentId: string;
  eventType: LearningEventType;
  lessonId?: string | null;
  subject?: string | null;
  classNumber?: number | null;
  durationMs?: number | null;
  detail?: Record<string, unknown> | null;
}): Promise<void> {
  if (!input.studentId) return;

  // LESSON_COMPLETED gets a deterministic, same-day id — `lesson-complete:
  // {lessonId}:{today}` — instead of a random one. A same-click double-fire,
  // a page remount racing the same "Finish" tap, or a retried sync all
  // produce the identical id and dedupe at the server's (student_id,
  // client_event_id) unique index, so they can never insert a second row
  // (XP for a lesson is already idempotent too — idempotency key
  // `lesson:{lesson_id}` — this closes the same gap one layer earlier).
  // Scoped to the day, not just the lesson: a lesson genuinely re-finished
  // on a *later* day (e.g. revisited for review) must still get its own
  // row, so that revisit shows up in recent activity / last_activity_at —
  // collapsing it into the very first completion ever would silently hide
  // later replays from those views (XP is unaffected either way: it is
  // paid at most once per lesson via idempotency_key `lesson:{lesson_id}`,
  // not per day).
  // Every other event type keeps a random id: re-attempting a check slide
  // or restarting a lesson within one sitting is real, separate activity
  // worth its own row.
  const client_event_id =
    input.eventType === "LESSON_COMPLETED" && input.lessonId
      ? `lesson-complete:${input.lessonId}:${localDateKey()}`
      : newEventId();

  const event: QueuedLearningEvent = {
    client_event_id,
    student_id: input.studentId,
    event_type: input.eventType,
    occurred_at: new Date().toISOString(),
    lesson_id: input.lessonId ?? null,
    subject: input.subject ?? null,
    local_module_key:
      input.subject && input.classNumber
        ? moduleKeyFor(input.subject, input.classNumber)
        : null,
    duration_ms: input.durationMs ?? null,
    detail: input.detail ?? null,
    attempts: 0,
    last_error: null,
  };

  if (isOfflineStorageAvailable()) {
    const queued = await idbPut(QUEUE_STORE, event);
    if (queued) {
      notifyQueueChanged();
      void flushLearningEvents(input.studentId);
      return;
    }
  }

  // No durable store on this device (private window, storage blocked): send
  // it straight through and let it go if that fails, rather than pretending
  // it was saved somewhere it was not.
  try {
    await syncLearningEvents([toPayload(event)]);
  } catch {
    /* nothing further we can honestly do here */
  }
}

function toPayload(event: QueuedLearningEvent): LearningEventPayload {
  return {
    client_event_id: event.client_event_id,
    event_type: event.event_type,
    occurred_at: event.occurred_at,
    lesson_id: event.lesson_id ?? null,
    subject: event.subject ?? null,
    duration_ms: event.duration_ms ?? null,
    detail: event.detail ?? null,
  };
}

export interface FlushResult {
  synced: number;
  remaining: number;
}

// One flush at a time per tab — two concurrent drains would send the same
// rows twice. Harmless server-side (it dedupes) but wasteful, and it makes
// the pending count flicker.
//
// A drain snapshots the queue once at its start (see drainQueue), so an
// event recorded *while* a drain is already in flight would previously be
// invisible to it — the caller just got handed the same, already-stale
// promise. That event then sat queued until some unrelated later trigger
// (the next recorded event, an `online` transition, or the next mount)
// happened to call flush again — which is exactly how a just-finished
// lesson could fail to show up immediately, or still be missing after a
// quick reload. `rerunRequested` fixes that: a flush call that arrives
// mid-drain no longer just rides the stale promise, it also schedules
// another full pass the moment the current one finishes, so anything
// queued in between is always picked up without needing an external nudge.
let inFlight: Promise<FlushResult> | null = null;
let rerunRequested = false;

export function flushLearningEvents(studentId: string): Promise<FlushResult> {
  if (!studentId) return Promise.resolve({ synced: 0, remaining: 0 });
  if (inFlight) {
    rerunRequested = true;
    return inFlight;
  }
  inFlight = runDrainPasses(studentId).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runDrainPasses(studentId: string): Promise<FlushResult> {
  let totalSynced = 0;
  let result = await drainQueue(studentId);
  totalSynced += result.synced;

  while (rerunRequested) {
    rerunRequested = false;
    result = await drainQueue(studentId);
    totalSynced += result.synced;
  }

  return { synced: totalSynced, remaining: result.remaining };
}

async function drainQueue(studentId: string): Promise<FlushResult> {
  if (!isOfflineStorageAvailable()) return { synced: 0, remaining: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { synced: 0, remaining: await getPendingCount(studentId) };
  }

  let queued = await getQueuedEvents(studentId);
  if (queued.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  for (let i = 0; i < queued.length; i += SYNC_BATCH_SIZE) {
    const batch = queued.slice(i, i + SYNC_BATCH_SIZE);
    let response;
    try {
      response = await syncLearningEvents(batch.map(toPayload));
    } catch (err) {
      // Network down, server down, or auth expired: leave everything queued
      // and stop — the next `online` event or dashboard mount retries.
      await Promise.all(
        batch.map((event) =>
          idbPut(QUEUE_STORE, {
            ...event,
            attempts: event.attempts + 1,
            last_error: err instanceof Error ? err.message : "Sync failed.",
          } satisfies QueuedLearningEvent)
        )
      );
      break;
    }

    // Accepted (stored now), duplicates (stored by an earlier attempt) and
    // rejected (never storable) are all settled — anything else stays.
    const settled = [
      ...response.accepted,
      ...response.duplicates,
      ...response.rejected.map((r) => r.client_event_id),
    ];
    if (response.rejected.length > 0) {
      console.warn("Learning events rejected by server:", response.rejected);
    }
    await idbDeleteMany(QUEUE_STORE, settled);
    synced += response.accepted.length;
  }

  // Invalidate cached progress so the next read fetches fresh data from server
  await invalidateStudentProgressCache(studentId);
  queued = await getQueuedEvents(studentId);
  notifyQueueChanged();
  return { synced, remaining: queued.length };
}

/**
 * Fold this device's not-yet-synced completions into a server progress
 * snapshot so a learner working offline sees their own progress move.
 *
 * Union of ids, never a sum, so an event that is queued here *and* already
 * counted by the server cannot be double counted.
 */
export function applyPendingEvents(
  progress: StudentProgressOut,
  pending: QueuedLearningEvent[]
): StudentProgressOut {
  const completions = pending.filter(
    (event) => event.event_type === "LESSON_COMPLETED" && event.lesson_id
  );
  if (completions.length === 0) return progress;

  const modules = progress.modules.map((module) => {
    const locallyCompleted = completions
      .filter((event) => event.local_module_key === module.module_key)
      .map((event) => event.lesson_id as string);
    if (locallyCompleted.length === 0) return module;

    const completedIds = Array.from(
      new Set([...module.completed_lesson_ids, ...locallyCompleted])
    );
    const completedCount = module.total_lessons
      ? Math.min(completedIds.length, module.total_lessons)
      : completedIds.length;
    const percent = module.total_lessons
      ? Math.round((completedCount / module.total_lessons) * 100)
      : module.progress_percent;
    const isComplete =
      module.total_lessons > 0 && completedCount >= module.total_lessons;

    return {
      ...module,
      completed_lesson_ids: completedIds,
      completed_lessons: completedCount,
      progress_percent: percent,
      status: isComplete ? "completed" : "in_progress",
      current_lesson_id: isComplete ? null : module.current_lesson_id,
      current_lesson_title: isComplete ? null : module.current_lesson_title,
    } satisfies ModuleProgressOut;
  });

  const totalLessons = modules.reduce((sum, m) => sum + m.total_lessons, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completed_lessons, 0);

  // Approximate pending points bonus for un-synced events
  let bonusPoints = 0;
  const serverKnownLessonIds = new Set(
    progress.modules.flatMap((m) => m.completed_lesson_ids)
  );
  const newlyCompleted = new Set<string>();
  for (const c of completions) {
    if (c.lesson_id && !serverKnownLessonIds.has(c.lesson_id)) {
      newlyCompleted.add(c.lesson_id);
    }
  }
  bonusPoints += newlyCompleted.size * 50;

  return {
    ...progress,
    modules,
    overall_percent: totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : progress.overall_percent,
    modules_completed: modules.filter((m) => m.status === "completed").length,
    modules_in_progress: modules.filter((m) => m.status === "in_progress").length,
    modules_not_started: modules.filter((m) => m.status === "not_started").length,
    points: (progress.points ?? 0) + bonusPoints,
    current_streak: Math.max(progress.current_streak ?? 0, completions.length > 0 ? 1 : 0),
  };
}
