"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import {
  AssessmentGrowthItem,
  ClassLeaderboard,
  ChildLinkOut,
  StudentDetailedProgressOut,
  getChildDetailedProgress,
  getParentChildLeaderboard,
} from "@/lib/api";
import { LeaderboardPanel } from "@/components/dashboard/shared/LeaderboardPanel";
import { Item, Stagger } from "@/components/dashboard/console/motion";
import {
  Chip,
  Code,
  EmptyState,
  Loading,
  Meter,
  Notice,
  Panel,
  PanelHead,
  Table,
  Td,
  Th,
} from "@/components/dashboard/console/primitives";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso.endsWith("Z") ? iso : `${iso}Z`).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (!Number.isFinite(minutes)) return "—";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function TrendBadge({ trend, delta }: { trend: string; delta: number }) {
  if (trend === "mastered") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <Sparkles className="w-3 h-3" /> Mastered
      </span>
    );
  }
  if (trend === "improving" || delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <TrendingUp className="w-3 h-3" /> +{delta.toFixed(1)}% Improving
      </span>
    );
  }
  if (trend === "declining" || delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <TrendingDown className="w-3 h-3" /> {delta.toFixed(1)}% Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface text-text-secondary border border-border-primary">
      Stable
    </span>
  );
}

function StatusPill({ status, isLagging }: { status: string; isLagging: boolean }) {
  if (status === "mastered") {
    return <Chip tone="emerald">Mastered</Chip>;
  }
  if (status === "progressing") {
    return <Chip tone="brand">Progressing</Chip>;
  }
  if (status === "needs_attention") {
    return <Chip tone="amber">Needs Attention</Chip>;
  }
  return <Chip tone="rose">Lagging Behind</Chip>;
}

export function ParentDetailedProgress({
  childrenList,
  defaultStudentUniqueNumber,
}: {
  childrenList: ChildLinkOut[];
  defaultStudentUniqueNumber?: string;
}) {
  const { t } = useTranslation();
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<string>(
    defaultStudentUniqueNumber || childrenList[0]?.student_unique_number || ""
  );
  const [progress, setProgress] = useState<StudentDetailedProgressOut | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"assessments" | "subjects" | "curriculum" | "gaps" | "leaderboard">("assessments");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AssessmentGrowthItem | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // ── Leaderboard state ─────────────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboard | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSection !== "leaderboard" || !selectedStudentNumber) return;
    let cancelled = false;
    setLbLoading(true);
    setLbError(null);
    getParentChildLeaderboard(selectedStudentNumber)
      .then((data) => { if (!cancelled) setLeaderboard(data); })
      .catch((err) => {
        if (!cancelled) {
          const msg: string = err?.message ?? String(err);
          setLbError(
            msg.includes("403") || msg.includes("400")
              ? "Leaderboard not available for this child yet."
              : "Could not load leaderboard."
          );
        }
      })
      .finally(() => { if (!cancelled) setLbLoading(false); });
    return () => { cancelled = true; };
  }, [activeSection, selectedStudentNumber]);

  useEffect(() => {
    if (!selectedStudentNumber && childrenList.length > 0) {
      setSelectedStudentNumber(childrenList[0].student_unique_number);
    }
  }, [childrenList, selectedStudentNumber]);

  useEffect(() => {
    if (!selectedStudentNumber) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getChildDetailedProgress(selectedStudentNumber)
      .then((res) => {
        if (!cancelled) setProgress(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load detailed learning progress.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStudentNumber, reloadKey]);

  const activeChild = childrenList.find((c) => c.student_unique_number === selectedStudentNumber);

  return (
    <div className="space-y-6">
      {/* ── Child Selector Bar ─────────────────────────────────────────────── */}
      <Panel flush className="p-4 border border-[var(--c-line)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">
                Selected Student Profile
              </span>
              <span className="text-sm font-bold text-text-primary">
                {activeChild?.full_name || `Student #${selectedStudentNumber}`}
              </span>
            </div>
          </div>

          {childrenList.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Switch Child:</span>
              <select
                value={selectedStudentNumber}
                onChange={(e) => setSelectedStudentNumber(e.target.value)}
                className="bg-surface border border-border-primary rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-brand"
              >
                {childrenList.map((child) => (
                  <option key={child.id} value={child.student_unique_number}>
                    {child.full_name || child.student_unique_number} (Class {child.class_number || "—"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Panel>

      {loading ? (
        <Panel flush className="py-12">
          <Loading />
        </Panel>
      ) : error ? (
        <div className="space-y-3">
          <Notice tone="rose" icon={AlertCircle}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-xs shrink-0"
              >
                Try Again
              </Button>
            </div>
          </Notice>
        </div>
      ) : !progress ? null : (
        <div className="space-y-6">
          {/* ── Top Metric Cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Real Progress */}
            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-2">
              <div className="flex items-center justify-between text-text-tertiary text-xs">
                <span>Overall Progress</span>
                <Sparkles className="w-4 h-4 text-brand" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-primary">
                  {progress.holistic_mastery_percent}%
                </span>
                <span className="text-[10px] text-text-secondary font-medium">
                  (Assessments + Growth)
                </span>
              </div>
              <Meter
                value={progress.holistic_mastery_percent}
                tone={
                  progress.holistic_mastery_percent >= 80
                    ? "emerald"
                    : progress.holistic_mastery_percent >= 60
                    ? "brand"
                    : "amber"
                }
              />
              <span className="text-[11px] text-text-tertiary block pt-0.5">
                Avg Score {progress.average_test_score}% · {progress.total_assessments_taken} test{progress.total_assessments_taken === 1 ? "" : "s"}
              </span>
            </div>

            {/* 2. Consecutive Test Growth */}
            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-2">
              <div className="flex items-center justify-between text-text-tertiary text-xs">
                <span>Consecutive Test Growth</span>
                {progress.consecutive_growth_rate >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    progress.consecutive_growth_rate > 0
                      ? "text-emerald-500"
                      : progress.consecutive_growth_rate < 0
                      ? "text-rose-500"
                      : "text-text-primary"
                  }`}
                >
                  {progress.consecutive_growth_rate > 0 ? "+" : ""}
                  {progress.consecutive_growth_rate}%
                </span>
                <TrendBadge trend={progress.consecutive_trend} delta={progress.consecutive_growth_rate} />
              </div>
              <span className="text-[11px] text-text-secondary block">
                Avg Test Score: <strong>{progress.average_test_score}%</strong> across {progress.total_assessments_taken} test{progress.total_assessments_taken === 1 ? "" : "s"}
              </span>
            </div>

            {/* 3. Lagging & Remediation Alerts */}
            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-2">
              <div className="flex items-center justify-between text-text-tertiary text-xs">
                <span>Lagging / Alert Areas</span>
                <AlertTriangle className={`w-4 h-4 ${progress.assessments_lagging > 0 ? "text-rose-500" : "text-emerald-500"}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-text-primary">
                  {progress.assessments_lagging}
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  of {progress.total_assessments_taken} tests lagging
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {progress.assessments_lagging > 0 ? (
                  <span className="text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Needs Attention in {progress.assessments_lagging} topic(s)
                  </span>
                ) : (
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> All tested topics on track!
                  </span>
                )}
              </div>
            </div>

            {/* 4. Points & Learning Streak */}
            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-2">
              <div className="flex items-center justify-between text-text-tertiary text-xs">
                <span>Activity XP & Streak</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                  <Zap className="w-4 h-4" />
                  <span>{progress.points} XP</span>
                </div>
                <div className="flex items-center gap-1 text-rose-500 font-bold text-lg">
                  <Flame className="w-4 h-4" />
                  <span>{progress.current_streak}d Streak</span>
                </div>
              </div>
              <span className="text-[11px] text-text-tertiary block">
                Last active: {formatRelativeTime(progress.last_activity_at)}
              </span>
            </div>
          </div>

          {/* ── Section Navigation Pills ───────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border-primary pb-2">
            <button
              onClick={() => setActiveSection("assessments")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === "assessments"
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Consecutive Assessment Growth ({progress.total_assessments_taken})</span>
            </button>
            <button
              onClick={() => setActiveSection("subjects")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === "subjects"
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Subject Progress Matrix ({progress.subjects.length})</span>
            </button>
            <button
              onClick={() => setActiveSection("curriculum")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === "curriculum"
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum & Lessons ({progress.modules.length})</span>
            </button>
            {progress.diagnostic_gaps.length > 0 && (
              <button
                onClick={() => setActiveSection("gaps")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSection === "gaps"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Diagnostic Gaps ({progress.diagnostic_gaps.length})</span>
              </button>
            )}
            <button
              onClick={() => setActiveSection("leaderboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSection === "leaderboard"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Class Leaderboard</span>
            </button>
          </div>

          {/* ── Leaderboard Section ────────────────────────────────────────── */}
          {activeSection === "leaderboard" && (
            <div>
              {lbLoading ? (
                <div className="py-12"><Loading /></div>
              ) : lbError ? (
                <Notice tone="rose">{lbError}</Notice>
              ) : leaderboard ? (
                <LeaderboardPanel
                  data={leaderboard}
                  viewerStudentId={progress.student_id.toString()}
                  title={`🏆 Class ${leaderboard.class_number}${leaderboard.section} Leaderboard`}
                />
              ) : null}
            </div>
          )}

          {/* ── SECTION 1: Consecutive Assessment Growth Table ─────────────── */}
          {activeSection === "assessments" && (
            <Panel flush className="overflow-hidden">
              <PanelHead
                icon={Award}
                title="Consecutive Assessment & Test Growth"
                description="Chronological comparison of test performance showing real score increases, declines, and lagging warnings."
              />

              {progress.subjects.every((s) => s.assessments.length === 0) ? (
                <EmptyState
                  icon={Award}
                  title="No Class Tests or Quizzes Taken Yet"
                >
                  When your child completes class quizzes or assignments created by teachers, their consecutive score growth, improvement deltas, and teacher remarks will appear here.
                </EmptyState>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Chapter / Test Title</Th>
                      <Th>Subject</Th>
                      <Th>Attempts &amp; Progress</Th>
                      <Th>Score Trajectory</Th>
                      <Th>Status &amp; Growth</Th>
                      <Th className="text-right">Remarks &amp; History</Th>
                    </tr>
                  </thead>
                  <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
                    {progress.subjects.flatMap((s) => s.assessments).map((asgn) => (
                      <Item as="tr" key={asgn.assignment_id} className="console-row">
                        <Td>
                          <div className="font-semibold text-text-primary">{asgn.title}</div>
                          <div className="text-[10px] text-text-tertiary flex items-center gap-1 mt-0.5">
                            <span className="capitalize">{asgn.assignment_type === "ai_quiz" ? "AI Adaptive Quiz" : "PDF Assignment"}</span>
                            <span>· Last taken {formatRelativeTime(asgn.latest_attempt_at)}</span>
                          </div>
                        </Td>

                        <Td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
                            {asgn.subject}
                          </span>
                        </Td>

                        <Td>
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="font-medium text-text-secondary">
                              {asgn.total_attempts} Attempt{asgn.total_attempts === 1 ? "" : "s"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-text-tertiary">Initial: {asgn.initial_score}%</span>
                              <ChevronRight className="w-3 h-3 text-text-tertiary" />
                              <span className={`text-[11px] font-bold ${asgn.latest_score >= 60 ? "text-emerald-500" : "text-rose-500"}`}>
                                Latest: {asgn.latest_score}%
                              </span>
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="console-num text-sm font-bold text-text-primary">
                                {asgn.latest_score}%
                              </span>
                              <span className="text-[10px] text-text-tertiary">
                                (Best: {asgn.best_score}%)
                              </span>
                            </div>
                            <TrendBadge trend={asgn.trend} delta={asgn.score_delta} />
                          </div>
                        </Td>

                        <Td>
                          <div className="flex flex-col gap-1">
                            <StatusPill status={asgn.status} isLagging={asgn.is_lagging} />
                            {asgn.is_lagging && (
                              <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Lagging behind
                              </span>
                            )}
                          </div>
                        </Td>

                        <Td className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedHistoryItem(asgn)}
                            className="text-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            View History →
                          </Button>
                        </Td>
                      </Item>
                    ))}
                  </Stagger>
                </Table>
              )}
            </Panel>
          )}

          {/* ── SECTION 2: Subject Mastery Matrix ──────────────────────────── */}
          {activeSection === "subjects" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progress.subjects.map((sub) => (
                  <Panel key={sub.subject} flush className="p-5 border border-[var(--c-line)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                          {sub.subject.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text-primary">{sub.subject}</h3>
                          <span className="text-[11px] text-text-tertiary">
                            {sub.assessment_count} test{sub.assessment_count === 1 ? "" : "s"} taken
                          </span>
                        </div>
                      </div>
                      <StatusPill status={sub.status} isLagging={sub.lagging_topics_count > 0} />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary font-medium">Subject Progress</span>
                        <span className="font-bold text-brand">{sub.overall_mastery_percent}%</span>
                      </div>
                      <Meter
                        value={sub.overall_mastery_percent}
                        tone={sub.overall_mastery_percent >= 80 ? "emerald" : sub.overall_mastery_percent >= 60 ? "brand" : "amber"}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--c-line)] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-text-tertiary block">Avg Score</span>
                        <span className="font-bold text-text-primary">{sub.average_score}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-tertiary block">Consecutive Growth</span>
                        <span className={`font-bold ${sub.growth_delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {sub.growth_delta >= 0 ? `+${sub.growth_delta}%` : `${sub.growth_delta}%`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-tertiary block">Lagging Topics</span>
                        <span className={`font-bold ${sub.lagging_topics_count > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                          {sub.lagging_topics_count}
                        </span>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 3: Curriculum & Lesson Modules Table ───────────────── */}
          {activeSection === "curriculum" && (
            <Panel flush className="overflow-hidden">
              <PanelHead
                icon={BookOpen}
                title="Curriculum &amp; Learning Modules"
                description="Per-subject module progression, completed lessons, time spent, and activity timestamps."
              />

              <Table>
                <thead>
                  <tr>
                    <Th>Module / Subject</Th>
                    <Th>Progress</Th>
                    <Th>Lessons Done</Th>
                    <Th>Status</Th>
                    <Th>Time Spent</Th>
                    <Th>Last Activity</Th>
                  </tr>
                </thead>
                <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
                  {progress.modules.map((m) => (
                    <Item as="tr" key={m.module_key} className="console-row">
                      <Td>
                        <div className="font-semibold text-text-primary">{m.title}</div>
                        <div className="text-[10px] text-text-tertiary">{m.subject} · Class {m.class_number}</div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="console-num text-xs font-bold text-text-primary w-8">
                            {m.progress_percent}%
                          </span>
                          <Meter className="w-20" value={m.progress_percent} tone={m.progress_percent >= 100 ? "emerald" : "brand"} />
                        </div>
                      </Td>
                      <Td className="text-xs text-text-secondary">
                        {m.completed_lessons} / {m.total_lessons} lessons
                      </Td>
                      <Td>
                        <Chip tone={m.status === "completed" ? "emerald" : m.status === "in_progress" ? "brand" : "neutral"}>
                          {m.status === "completed" ? "Completed" : m.status === "in_progress" ? "In Progress" : "Not Started"}
                        </Chip>
                      </Td>
                      <Td className="text-xs text-text-secondary">
                        {m.time_spent_seconds ? `${Math.round(m.time_spent_seconds / 60)} mins` : "—"}
                      </Td>
                      <Td className="text-xs text-text-tertiary">
                        {formatRelativeTime(m.last_activity_at)}
                      </Td>
                    </Item>
                  ))}
                </Stagger>
              </Table>
            </Panel>
          )}

          {/* ── SECTION 4: Diagnostic Gaps ─────────────────────────────────── */}
          {activeSection === "gaps" && progress.diagnostic_gaps.length > 0 && (
            <Panel flush className="p-5 border border-rose-500/20 bg-rose-500/[0.02] space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-bold text-sm text-text-primary">Diagnostic Skill Gaps Identified</h3>
                  <p className="text-xs text-text-secondary">
                    These foundational concepts were identified during diagnostic assessment as requiring catch-up support:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {progress.diagnostic_gaps.map((gap) => (
                  <div key={gap.topic_code} className="p-3 rounded-lg bg-surface border border-border-primary space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-500 tracking-wider block">
                      {gap.subject}
                    </span>
                    <h4 className="text-xs font-semibold text-text-primary">{gap.topic_name}</h4>
                    <span className="text-[11px] text-text-tertiary block">
                      Foundational Class: Class {gap.originating_class}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* ── Attempt History & Feedback Modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedHistoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border-primary rounded-[var(--radius-lg)] max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border-primary pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                    {selectedHistoryItem.subject}
                  </span>
                  <h3 className="text-base font-bold text-text-primary">{selectedHistoryItem.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="text-text-tertiary hover:text-text-primary text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Consecutive Score Deltas History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Consecutive Attempts History
                </h4>
                <div className="space-y-2">
                  {selectedHistoryItem.attempts_history.map((att) => (
                    <div
                      key={att.attempt_number}
                      className="p-3 rounded-lg bg-surface border border-border-primary flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[11px]">
                          #{att.attempt_number}
                        </span>
                        <div>
                          <span className="font-semibold text-text-primary block">
                            Score: {att.score} / {att.max_score} ({att.percentage}%)
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {new Date(att.completed_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {att.delta_from_previous !== null && (
                          <span
                            className={`text-[11px] font-bold ${
                              att.delta_from_previous > 0
                                ? "text-emerald-500"
                                : att.delta_from_previous < 0
                                ? "text-rose-500"
                                : "text-text-secondary"
                            }`}
                          >
                            {att.delta_from_previous > 0 ? `+${att.delta_from_previous}%` : `${att.delta_from_previous}%`}
                          </span>
                        )}
                        <Chip tone={att.is_passed ? "emerald" : "amber"}>
                          {att.is_passed ? "PASS" : "FAIL"}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Feedback */}
              {selectedHistoryItem.teacher_feedback && (
                <div className="p-3.5 rounded-lg bg-brand/5 border border-brand/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Teacher Remarks</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {selectedHistoryItem.teacher_feedback}
                  </p>
                </div>
              )}

              {/* AI Advice */}
              {selectedHistoryItem.ai_feedback && (
                <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Learning Recommendation</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {selectedHistoryItem.ai_feedback}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" onClick={() => setSelectedHistoryItem(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
