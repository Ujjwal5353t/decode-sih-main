"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  CloudOff,
  Play,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModuleProgressOut, StudentProfile, StudentProgressOut } from "@/lib/api";
import { loadStudentProgress } from "@/lib/offline/contentCache";
import {
  applyPendingEvents,
  getQueuedEvents,
  subscribeToLearningQueue,
} from "@/lib/offline/learningEvents";
import { useLearningSync } from "@/hooks/useLearningSync";

const EVENT_LABELS: Record<string, string> = {
  MODULE_OPENED: "Opened",
  MODULE_STARTED: "Started",
  LESSON_STARTED: "Started lesson",
  LESSON_COMPLETED: "Completed lesson",
  ACTIVITY_COMPLETED: "Finished an activity in",
  QUIZ_STARTED: "Started the quick check in",
  QUIZ_COMPLETED: "Answered the quick check in",
  MODULE_COMPLETED: "Completed",
};

function relativeTime(iso: string): string {
  // Backend timestamps are naive UTC; "Z" makes the browser read them as such.
  const then = new Date(iso.endsWith("Z") ? iso : `${iso}Z`).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface border border-border-primary/60 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`h-full rounded-full ${percent >= 100 ? "bg-emerald-500" : "bg-brand"}`}
      />
    </div>
  );
}

function StatusChip({ status }: { status: ModuleProgressOut["status"] }) {
  const styles =
    status === "completed"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      : status === "in_progress"
      ? "bg-brand/10 text-brand border-border-brand"
      : "bg-surface text-text-tertiary border-border-primary";
  const label =
    status === "completed"
      ? "Completed"
      : status === "in_progress"
      ? "In Progress"
      : "Not Started";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
      {label}
    </span>
  );
}

/**
 * The student's learning-activity view: what to continue, how far each
 * module has got, and what they last did.
 *
 * Reads the server's projection but overlays anything still sitting in this
 * device's offline queue, so a lesson finished without a connection shows up
 * here immediately and stays consistent once it syncs.
 */
export function LearningProgressPanel({ student }: { student: StudentProfile }) {
  const [progress, setProgress] = useState<StudentProgressOut | null>(null);
  const [stale, setStale] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { pendingCount, isOnline, sync } = useLearningSync(student.id);

  const load = useCallback(async () => {
    try {
      const result = await loadStudentProgress(student.id);
      const pending = await getQueuedEvents(student.id);
      setProgress(applyPendingEvents(result.data, pending));
      setStale(result.stale);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your progress.");
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  // A queue change means either new local activity or a completed sync —
  // both change what this panel should show. The subscription also fires
  // once on mount, which is this panel's initial load.
  useEffect(
    () =>
      subscribeToLearningQueue(() => {
        void load();
      }),
    [load]
  );

  const handleRefresh = async () => {
    setLoading(true);
    await sync();
    await load();
  };

  if (loading && !progress) {
    return (
      <div className="py-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!progress) {
    // Never loaded and nothing cached on this device yet. Say so once rather
    // than leaving a gap the student cannot explain.
    if (!error) return null;
    return (
      <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary text-xs text-text-secondary">
        Your learning progress isn&apos;t available right now. {error}
      </div>
    );
  }

  // Nothing to show for a class with no lessons published yet — stay quiet
  // rather than adding an empty card to the dashboard.
  if (progress.total_modules === 0) return null;

  const inProgress = progress.modules
    .filter((m) => m.status === "in_progress")
    .sort((a, b) => (b.last_activity_at || "").localeCompare(a.last_activity_at || ""));
  const continueModule =
    inProgress[0] || progress.modules.find((m) => m.status === "not_started") || null;
  const continueHref = continueModule?.current_lesson_id
    ? `/dashboard/learn/${continueModule.current_lesson_id}`
    : `/dashboard/learn?subject=${encodeURIComponent(continueModule?.subject || "")}`;

  return (
    <div className="space-y-4">
      {/* ── Continue Learning ─────────────────────────────────────────────── */}
      {continueModule && (
        <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-brand shrink-0" />
                <h2 className="text-sm font-bold text-text-primary">Continue Learning</h2>
              </div>
              <p className="text-base font-bold text-text-primary mt-2 truncate">
                {continueModule.current_lesson_title || continueModule.title}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {continueModule.subject} ·{" "}
                {continueModule.completed_lessons} of {continueModule.total_lessons} lessons done
                {continueModule.last_activity_at
                  ? ` · last studied ${relativeTime(continueModule.last_activity_at)}`
                  : ""}
              </p>
              <div className="mt-3 max-w-sm">
                <ProgressBar percent={continueModule.progress_percent} />
              </div>
            </div>

            <Link href={continueHref} className="shrink-0">
              <Button variant="primary" size="sm">
                {continueModule.status === "not_started" ? "Start Learning" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Overall progress ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
          <div className="flex items-center justify-between text-text-tertiary text-xs">
            <span>Overall Progress</span>
            <TrendingUp className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.overall_percent}%
          </div>
          <div className="pt-1">
            <ProgressBar percent={progress.overall_percent} />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
          <div className="flex items-center justify-between text-text-tertiary text-xs">
            <span>Modules Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.modules_completed}
          </div>
          <span className="text-[11px] text-text-secondary">
            of {progress.total_modules} in your class
          </span>
        </div>

        <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
          <div className="flex items-center justify-between text-text-tertiary text-xs">
            <span>In Progress</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.modules_in_progress}
          </div>
          <span className="text-[11px] text-text-secondary">
            {progress.last_activity_at
              ? `Last active ${relativeTime(progress.last_activity_at)}`
              : "Not started yet"}
          </span>
        </div>
      </div>

      {/* ── Sync state — only when there is something honest to say ───────── */}
      {(pendingCount > 0 || !isOnline || stale) && (
        <div className="glass rounded-[var(--radius-md)] p-3.5 border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CloudOff className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-text-secondary">
              {pendingCount > 0
                ? `${pendingCount} learning ${
                    pendingCount === 1 ? "activity" : "activities"
                  } saved on this device, waiting to sync.`
                : !isOnline
                ? "You're offline — your learning is being saved on this device."
                : "Showing your last saved progress."}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync now
          </button>
        </div>
      )}

      {/* ── Per-module progress ───────────────────────────────────────────── */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" />
          <span>Module Progress</span>
        </h3>

        <div className="space-y-3.5">
          {progress.modules.map((module) => (
            <div key={module.module_key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    {module.subject}
                  </span>
                  <StatusChip status={module.status} />
                </div>
                <span className="text-xs text-text-secondary shrink-0 tabular-nums">
                  {module.completed_lessons}/{module.total_lessons} · {module.progress_percent}%
                </span>
              </div>
              <ProgressBar percent={module.progress_percent} />
              {module.status === "in_progress" && module.current_lesson_title && (
                <p className="text-[11px] text-text-tertiary truncate">
                  Current lesson: {module.current_lesson_title}
                </p>
              )}
              {module.status === "completed" && module.completed_at && (
                <p className="text-[11px] text-emerald-500">
                  Completed {relativeTime(module.completed_at)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      {progress.recent_activity.length > 0 && (
        <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-3">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            <span>Recent Learning Activity</span>
          </h3>
          <ul className="divide-y divide-border-primary/50">
            {progress.recent_activity.map((activity, idx) => (
              <li
                key={`${activity.event_type}-${activity.occurred_at}-${idx}`}
                className="py-2 flex items-center justify-between gap-3"
              >
                <span className="text-xs text-text-secondary truncate">
                  <span className="font-semibold text-text-primary">
                    {EVENT_LABELS[activity.event_type] || activity.event_type}
                  </span>{" "}
                  {activity.lesson_title || activity.subject}
                </span>
                <span className="text-[11px] text-text-tertiary shrink-0">
                  {relativeTime(activity.occurred_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
