"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  flushLearningEvents,
  getPendingCount,
  subscribeToLearningQueue,
} from "@/lib/offline/learningEvents";

function subscribeToConnectivity(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Keeps one student's offline learning queue draining, and reports what is
 * still waiting so the UI can be honest about it.
 *
 * Flushes on mount (covering "the app was closed before it could sync") and
 * whenever the browser reports connectivity returning. No polling timer:
 * `online` is the real signal, and every recorded event already attempts its
 * own flush.
 */
export function useLearningSync(studentId: string | null | undefined) {
  const [pendingCount, setPendingCount] = useState<number>(0);

  const isOnline = useSyncExternalStore(
    subscribeToConnectivity,
    () => navigator.onLine,
    () => true // server render: assume online, the client corrects on hydration
  );

  // The queue is the external system here; it reports its own changes,
  // including once on subscribe.
  useEffect(() => {
    if (!studentId) return;
    return subscribeToLearningQueue(() => {
      void getPendingCount(studentId).then(setPendingCount);
    });
  }, [studentId]);

  // Outbound only — anything drained comes back through the subscription above.
  useEffect(() => {
    if (!studentId) return;
    void flushLearningEvents(studentId);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    const handleOnline = () => {
      void flushLearningEvents(studentId);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [studentId]);

  const sync = useCallback(async () => {
    if (!studentId) return 0;
    const result = await flushLearningEvents(studentId);
    return result.synced;
  }, [studentId]);

  return { pendingCount, isOnline, sync };
}
