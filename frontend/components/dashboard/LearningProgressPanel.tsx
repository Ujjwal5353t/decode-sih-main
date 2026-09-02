"use client";

import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  CloudOff,
  Flame,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { ModuleProgressOut, StudentProfile } from "@/lib/api";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { useLearningSync } from "@/hooks/useLearningSync";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const styles =
    status === "completed"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      : status === "in_progress"
      ? "bg-brand/10 text-brand border-border-brand"
      : "bg-surface text-text-tertiary border-border-primary";
  const label =
    status === "completed"
      ? t("learningProgress.completed")
      : status === "in_progress"
      ? t("learningProgress.inProgress")
      : t("learningProgress.notStarted");
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
      {label}
    </span>
  );
}

/**
 * Overall progress stat row + per-module breakdown, driven by the same
 * useStudentProgress() read the Continue Learning hero card uses — this
 * panel and that card can never disagree, because they share one fetch and
 * one offline-queue overlay instead of keeping parallel state.
 *
 * Lives in the dashboard's main content column (not the right sidebar):
 * it's substantial, detailed content, and the sidebar is reserved for
 * compact, glanceable widgets.
 */
export function ModuleProgressOverview({ student }: { student: StudentProfile }) {
  const { t } = useTranslation();
  const { progress, loading, stale, error, refresh } = useStudentProgress(student.id);
  const { pendingCount, isOnline, sync } = useLearningSync(student.id);

  const handleRefresh = async () => {
    // sync() only flushes what's queued — if the queue is already empty (the
    // common case for "stale" after being offline with nothing left to send)
    // it settles without notifying anyone, so this also re-runs the load
    // directly to guarantee a fresh network read, not just a drained queue.
    await sync();
    await refresh();
  };

  if (loading && !progress) {
    return (
      <div className="py-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!progress) {
    if (!error) return null;
    return (
      <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary text-xs text-text-secondary">
        {error}
      </div>
    );
  }

  if (progress.total_modules === 0) return null;

  return (
    <div className="space-y-4">
      {/* ── Overall progress, Points & Streak ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
          <div className="flex items-center justify-between text-text-tertiary text-xs">
            <span>{t("learningProgress.overallProgress")}</span>
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
            <span>Learning Points</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 flex items-center gap-1.5">
            <span>{progress.points ?? 0}</span>
            <span className="text-xs font-semibold text-text-secondary">XP</span>
          </div>
          <span className="text-[11px] text-text-secondary flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Real activity rewards
          </span>
        </div>

        <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
          <div className="flex items-center justify-between text-text-tertiary text-xs">
            <span>Day Streak</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500 flex items-center gap-1.5">
            <span>{progress.current_streak ?? 0}</span>
            <span className="text-xs font-semibold text-text-secondary">Days</span>
          </div>
          <span className="text-[11px] text-text-secondary">
            {progress.longest_streak ? `Best: ${progress.longest_streak} days` : "Active streak"}
          </span>
        </div>

        <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
          <div className="flex items-center justify-between text-text-tertiary text-xs">
            <span>{t("learningProgress.modulesCompleted")}</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.modules_completed}
          </div>
          <span className="text-[11px] text-text-secondary">
            {t("learningProgress.ofModulesInClass", { total: progress.total_modules })}
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
                ? t("learningProgress.savedActivitiesWaiting", { count: pendingCount })
                : !isOnline
                ? t("learningProgress.offlineNotice")
                : t("learningProgress.showingLastSaved")}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("learningProgress.syncNow")}
          </button>
        </div>
      )}

      {/* ── Per-module progress ───────────────────────────────────────────── */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" />
          <span>{t("learningProgress.moduleProgress")}</span>
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
    </div>
  );
}

/**
 * Compact recent-activity feed for the right sidebar — a short list, not the
 * full detail of ModuleProgressOverview, so the sidebar stays scannable.
 */
export function RecentActivityWidget({
  student,
  limit = 5,
}: {
  student: StudentProfile;
  limit?: number;
}) {
  const { progress } = useStudentProgress(student.id);

  if (!progress || progress.recent_activity.length === 0) return null;

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
        <Clock className="h-4 w-4 text-sky-500" />
        Recent Activity
      </h3>
      <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {progress.recent_activity.slice(0, limit).map((activity, idx) => (
          <li
            key={`${activity.event_type}-${activity.occurred_at}-${idx}`}
            className="py-2 flex items-center justify-between gap-3"
          >
            <span className="min-w-0 truncate text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {EVENT_LABELS[activity.event_type] || activity.event_type}
              </span>{" "}
              {activity.lesson_title || activity.subject}
            </span>
            <span className="shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {relativeTime(activity.occurred_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
