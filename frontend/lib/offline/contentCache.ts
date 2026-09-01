/**
 * Network-first reads with a last-known-good fallback.
 *
 * A learner who loses connectivity halfway through a chapter should be able
 * to finish it — and their dashboard should still show where they got to.
 * Each loader tries the API, caches what it gets, and falls back to the
 * cached copy only when the request could not be completed. `stale: true`
 * on the result tells the UI to say so rather than passing old data off as
 * live.
 */

import {
  LessonListItemOut,
  LessonOut,
  StudentProgressOut,
  getLesson,
  getLessons,
  getStudentLearningProgress,
} from "@/lib/api";
import { deleteCache, readCache, writeCache } from "@/lib/offline/db";

export interface OfflineAwareResult<T> {
  data: T;
  /** True when the value came from this device's cache, not the server. */
  stale: boolean;
}

async function networkFirst<T>(
  cacheKey: string,
  load: () => Promise<T>
): Promise<OfflineAwareResult<T>> {
  try {
    const data = await load();
    void writeCache(cacheKey, data);
    return { data, stale: false };
  } catch (err) {
    const cached = await readCache<T>(cacheKey);
    if (cached !== null) return { data: cached, stale: true };
    throw err;
  }
}

export function loadLessons(
  studentId: string,
  subject?: string,
  classNumber?: number
): Promise<OfflineAwareResult<LessonListItemOut[]>> {
  return networkFirst(
    `lessons:${studentId}:${subject ?? "all"}:${classNumber ?? "own"}`,
    () => getLessons(subject, classNumber)
  );
}

export function loadLesson(lessonId: string): Promise<OfflineAwareResult<LessonOut>> {
  // Lesson content is identical for every student, so it is cached by id
  // rather than per account.
  return networkFirst(`lesson:${lessonId}`, () => getLesson(lessonId));
}

export function loadStudentProgress(
  studentId: string
): Promise<OfflineAwareResult<StudentProgressOut>> {
  return networkFirst(`progress:${studentId}`, getStudentLearningProgress);
}

export async function invalidateStudentProgressCache(studentId: string): Promise<void> {
  await deleteCache(`progress:${studentId}`);
}
