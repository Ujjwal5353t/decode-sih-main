/**
 * Offline-first learning-activity queue — same idea as
 * frontend/lib/offline/learningEvents.ts, ported onto AsyncStorage.
 *
 *   student does something
 *     -> recordLearningEvent() writes it to the on-device queue
 *     -> a sync is attempted immediately; if it fails, the row stays queued
 *     -> app foreground / dashboard mount / "Sync now" retries
 *     -> flushLearningEvents() POSTs the queue
 *     -> only ids the server names in its response are removed locally
 *
 * The device-generated client_event_id is what makes a retry safe — the
 * server dedupes on it, so a half-finished sync or a repeated flush can
 * never double-record the same activity.
 *
 * No connectivity listener here on purpose (React Native has no reliable
 * `navigator.onLine` the way a browser does) — every write already attempts
 * its own flush, and the app retries on foreground / screen focus / a
 * manual "Sync now" tap, which is enough for a USB-tethered demo without
 * building out a full online/offline detector.
 */

import { syncLearningEvents } from "../api/student";
import { getQueue, setQueue } from "./storage";
import { invalidateStudentProgressCache } from "./contentCache";

const SYNC_BATCH_SIZE = 100;

const listeners = new Set();

export function subscribeToLearningQueue(listener) {
  listeners.add(listener);
  listener();
  return () => listeners.delete(listener);
}

function notifyQueueChanged() {
  listeners.forEach((l) => l());
}

function newEventId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function moduleKeyFor(subject, classNumber) {
  return `${subject}|${classNumber}`;
}

export async function getQueuedEvents(studentId) {
  const all = await getQueue();
  return all.filter((event) => event.student_id === studentId);
}

export async function getPendingCount(studentId) {
  return (await getQueuedEvents(studentId)).length;
}

export async function recordLearningEvent(input) {
  if (!input.studentId) return;

  // LESSON_COMPLETED gets a deterministic, same-day id so a double-fire or a
  // retried sync can never insert a second row for the same completion.
  const client_event_id =
    input.eventType === "LESSON_COMPLETED" && input.lessonId
      ? `lesson-complete:${input.lessonId}:${localDateKey()}`
      : newEventId();

  const event = {
    client_event_id,
    student_id: input.studentId,
    event_type: input.eventType,
    occurred_at: new Date().toISOString(),
    lesson_id: input.lessonId ?? null,
    subject: input.subject ?? null,
    local_module_key:
      input.subject && input.classNumber ? moduleKeyFor(input.subject, input.classNumber) : null,
    duration_ms: input.durationMs ?? null,
    detail: input.detail ?? null,
    attempts: 0,
  };

  const all = await getQueue();
  const withoutDup = all.filter((e) => e.client_event_id !== client_event_id);
  await setQueue([...withoutDup, event]);
  notifyQueueChanged();
  void flushLearningEvents(input.studentId);
}

function toPayload(event) {
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

let inFlight = null;

export function flushLearningEvents(studentId) {
  if (!studentId) return Promise.resolve({ synced: 0, remaining: 0 });
  if (inFlight) return inFlight;
  inFlight = drainQueue(studentId).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function drainQueue(studentId) {
  let queued = await getQueuedEvents(studentId);
  if (queued.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  for (let i = 0; i < queued.length; i += SYNC_BATCH_SIZE) {
    const batch = queued.slice(i, i + SYNC_BATCH_SIZE);
    let response;
    try {
      response = await syncLearningEvents(batch.map(toPayload));
    } catch {
      // Offline / server down / auth expired — leave everything queued,
      // the next foreground or manual sync retries.
      break;
    }

    const settled = new Set([
      ...response.accepted,
      ...response.duplicates,
      ...response.rejected.map((r) => r.client_event_id),
    ]);
    const all = await getQueue();
    await setQueue(all.filter((e) => !settled.has(e.client_event_id)));
    synced += response.accepted.length;
  }

  await invalidateStudentProgressCache(studentId);
  queued = await getQueuedEvents(studentId);
  notifyQueueChanged();
  return { synced, remaining: queued.length };
}

/**
 * Fold this device's not-yet-synced completions into a server progress
 * snapshot so a learner working offline still sees their own progress move.
 */
export function applyPendingEvents(progress, pending) {
  const completions = pending.filter((e) => e.event_type === "LESSON_COMPLETED" && e.lesson_id);
  if (completions.length === 0) return progress;

  const modules = progress.modules.map((module) => {
    const locallyCompleted = completions
      .filter((e) => e.local_module_key === module.module_key)
      .map((e) => e.lesson_id);
    if (locallyCompleted.length === 0) return module;

    const completedIds = Array.from(new Set([...module.completed_lesson_ids, ...locallyCompleted]));
    const completedCount = module.total_lessons
      ? Math.min(completedIds.length, module.total_lessons)
      : completedIds.length;
    const percent = module.total_lessons
      ? Math.round((completedCount / module.total_lessons) * 100)
      : module.progress_percent;
    const isComplete = module.total_lessons > 0 && completedCount >= module.total_lessons;

    return {
      ...module,
      completed_lesson_ids: completedIds,
      completed_lessons: completedCount,
      progress_percent: percent,
      status: isComplete ? "completed" : "in_progress",
      current_lesson_id: isComplete ? null : module.current_lesson_id,
      current_lesson_title: isComplete ? null : module.current_lesson_title,
    };
  });

  const totalLessons = modules.reduce((sum, m) => sum + m.total_lessons, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completed_lessons, 0);

  const serverKnownLessonIds = new Set(progress.modules.flatMap((m) => m.completed_lesson_ids));
  const newlyCompleted = new Set();
  for (const c of completions) {
    if (c.lesson_id && !serverKnownLessonIds.has(c.lesson_id)) newlyCompleted.add(c.lesson_id);
  }

  return {
    ...progress,
    modules,
    overall_percent: totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : progress.overall_percent,
    modules_completed: modules.filter((m) => m.status === "completed").length,
    modules_in_progress: modules.filter((m) => m.status === "in_progress").length,
    modules_not_started: modules.filter((m) => m.status === "not_started").length,
    points: (progress.points ?? 0) + newlyCompleted.size * 50,
    current_streak: Math.max(progress.current_streak ?? 0, completions.length > 0 ? 1 : 0),
  };
}
