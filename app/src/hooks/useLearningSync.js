import { useCallback, useEffect, useState } from "react";
import { flushLearningEvents, getPendingCount, subscribeToLearningQueue } from "../offline/learningEvents";

/**
 * Reports this device's unsynced learning-activity count and lets a screen
 * trigger a sync. Flushes on mount (covers "app was closed before it could
 * sync") — see learningEvents.js for why there's no connectivity listener.
 */
export function useLearningSync(studentId) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    return subscribeToLearningQueue(() => {
      void getPendingCount(studentId).then(setPendingCount);
    });
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    void flushLearningEvents(studentId);
  }, [studentId]);

  const sync = useCallback(async () => {
    if (!studentId) return 0;
    setSyncing(true);
    try {
      const result = await flushLearningEvents(studentId);
      return result.synced;
    } finally {
      setSyncing(false);
    }
  }, [studentId]);

  return { pendingCount, syncing, sync };
}
