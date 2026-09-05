import { useCallback, useEffect, useState } from "react";
import { loadStudentProgress } from "../offline/contentCache";
import { applyPendingEvents, getQueuedEvents, subscribeToLearningQueue } from "../offline/learningEvents";

/**
 * The single authoritative read of "where is this student right now" —
 * GET /student/progress overlaid with anything this device has recorded but
 * not yet synced. Mirrors frontend/hooks/useStudentProgress.ts.
 */
export function useStudentProgress(studentId) {
  const [progress, setProgress] = useState(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const result = await loadStudentProgress(studentId);
      const pending = await getQueuedEvents(studentId);
      setProgress(applyPendingEvents(result.data, pending));
      setStale(result.stale);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your progress.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    return subscribeToLearningQueue(() => {
      void load();
    });
  }, [studentId, load]);

  return { progress, loading, stale, error, refresh: load };
}
