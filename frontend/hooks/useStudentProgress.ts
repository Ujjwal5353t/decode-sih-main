"use client";

import { useCallback, useEffect, useState } from "react";
import { StudentProgressOut } from "@/lib/api";
import { loadStudentProgress } from "@/lib/offline/contentCache";
import {
  applyPendingEvents,
  getQueuedEvents,
  subscribeToLearningQueue,
} from "@/lib/offline/learningEvents";

export interface UseStudentProgressResult {
  /** null only before the first load resolves (or when disabled). */
  progress: StudentProgressOut | null;
  loading: boolean;
  /** True when `progress` came from this device's offline cache, not the server. */
  stale: boolean;
  error: string | null;
  /** Re-run the network-first load + offline-queue overlay on demand. */
  refresh: () => Promise<void>;
}

/**
 * The single authoritative read of "where is this student right now" —
 * GET /student/progress, overlaid with anything this device has recorded
 * but not yet synced (see applyPendingEvents).
 *
 * This used to be duplicated: the dashboard's own Continue Learning card
 * kept its own fetch/state, and LearningProgressPanel kept a second, separate
 * one. Same endpoint, same overlay logic, but two independent React states —
 * which is exactly the kind of split that lets one surface show a completed
 * lesson while another hasn't caught up yet. Every consumer should use this
 * hook instead of re-implementing the fetch, so there is exactly one place
 * that can be stale, not several that can disagree.
 *
 * Subscribes to the offline queue (see lib/offline/learningEvents) — the
 * listener fires immediately on subscribe (this hook's initial load) and
 * again on every local enqueue or server sync, so a lesson completion is
 * reflected the moment it is queued and reconciled the moment it syncs.
 */
export function useStudentProgress(
  studentId: string | null | undefined,
  options?: { enabled?: boolean }
): UseStudentProgressResult {
  const enabled = options?.enabled ?? true;

  const [progress, setProgress] = useState<StudentProgressOut | null>(null);
  const [stale, setStale] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId || !enabled) return;
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
  }, [studentId, enabled]);

  useEffect(() => {
    if (!studentId || !enabled) return;
    return subscribeToLearningQueue(() => {
      void load();
    });
  }, [studentId, enabled, load]);

  // Reported rather than the raw internal flag: a disabled/no-student hook
  // never starts loading, so it should never claim to be — without that
  // meaning a setState call inside the effect above for the disabled branch.
  return { progress, loading: enabled && !!studentId && loading, stale, error, refresh: load };
}
