/**
 * Network-first reads with a last-known-good fallback — same contract as
 * frontend/lib/offline/contentCache.ts. Try the API, cache what comes back,
 * and fall back to the cached copy only when the request itself failed.
 */

import { getLesson, getLessons, getStudentLearningProgress } from "../api/student";
import { readCache, writeCache, deleteCache } from "./storage";

async function networkFirst(cacheKey, load) {
  try {
    const data = await load();
    void writeCache(cacheKey, data);
    return { data, stale: false };
  } catch (err) {
    const cached = await readCache(cacheKey);
    if (cached !== null) return { data: cached, stale: true };
    throw err;
  }
}

export function loadLessons(studentId, subject, classNumber) {
  return networkFirst(`lessons:${studentId}:${subject ?? "all"}:${classNumber ?? "own"}`, () =>
    getLessons(subject, classNumber)
  );
}

export function loadLesson(lessonId) {
  return networkFirst(`lesson:${lessonId}`, () => getLesson(lessonId));
}

export function loadStudentProgress(studentId) {
  return networkFirst(`progress:${studentId}`, getStudentLearningProgress);
}

export async function invalidateStudentProgressCache(studentId) {
  await deleteCache(`progress:${studentId}`);
}
