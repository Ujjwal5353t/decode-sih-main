"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Flame,
  GraduationCap,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  AssessmentGrowthItem,
  ClassProgressOut,
  ClassStudentProgressOut,
  StudentDetailedProgressOut,
  getClassLearningProgress,
  getTeacherStudentDetailedProgress,
} from "@/lib/api";
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

function percentColor(percent: number): string {
  if (percent >= 80) return "text-emerald-500";
  if (percent >= 60) return "text-brand";
  if (percent > 0) return "text-amber-500";
  return "text-text-tertiary";
}

function relativeTime(iso: string | null): string {
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

export function ClassLearningProgress({
  classNumber,
  section,
  subject,
}: {
  classNumber: number;
  section: string;
  subject?: string;
}) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<"assessments" | "curriculum">("assessments");
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<ClassStudentProgressOut | null>(null);
  const [studentDetailProgress, setStudentDetailProgress] = useState<StudentDetailedProgressOut | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const isSpecificSubject = Boolean(
    subject &&
    subject.trim() &&
    subject.trim().toLowerCase() !== "general" &&
    subject.trim().toLowerCase() !== "all"
  );

  const [selectedSubject, setSelectedSubject] = useState<string>(isSpecificSubject ? subject! : "");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [modalSubject, setModalSubject] = useState<string>("");

  useEffect(() => {
    if (isSpecificSubject && subject) {
      setSelectedSubject(subject);
      setAvailableSubjects([subject]);
    } else {
      setSelectedSubject("");
      setAvailableSubjects([]);
    }
  }, [isSpecificSubject, subject, classNumber, section]);

  const effectiveSubject = isSpecificSubject ? subject : selectedSubject || undefined;
  const viewKey = `${classNumber}|${section}|${effectiveSubject || "ALL"}`;

  const [result, setResult] = useState<{
    key: string;
    data: ClassProgressOut | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  const loading = result.key !== viewKey;
  const progress = loading ? null : result.data;
  const error = loading ? null : result.error;

  useEffect(() => {
    let cancelled = false;
    getClassLearningProgress(classNumber, section, effectiveSubject)
      .then((data) => {
        if (!cancelled) {
          setResult({ key: viewKey, data, error: null });
          if (data?.subjects && data.subjects.length > 0) {
            const clean = data.subjects.filter(
              (s) => s && s.toLowerCase() !== "general" && s.toLowerCase() !== "all"
            );
            if (clean.length > 0) {
              setAvailableSubjects((prev) => {
                const combined = Array.from(new Set([...prev, ...clean]));
                return combined;
              });
              if (!isSpecificSubject && !selectedSubject) {
                setSelectedSubject(clean[0]);
              }
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: viewKey,
            data: null,
            error: err.message || "Could not load class progress.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [classNumber, section, effectiveSubject, viewKey, isSpecificSubject, selectedSubject]);

  useEffect(() => {
    if (selectedStudentForDetail) {
      setModalSubject(effectiveSubject || (availableSubjects[0] || ""));
    }
  }, [selectedStudentForDetail, effectiveSubject, availableSubjects]);

  useEffect(() => {
    if (!selectedStudentForDetail) {
      setStudentDetailProgress(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setDetailError(null);

    const targetSub = modalSubject || effectiveSubject || undefined;
    getTeacherStudentDetailedProgress(selectedStudentForDetail.unique_number, targetSub)
      .then((data) => {
        if (!cancelled) setStudentDetailProgress(data);
      })
      .catch((err) => {
        if (!cancelled) setDetailError(err.message || "Failed to load detailed progress.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStudentForDetail, modalSubject, effectiveSubject]);

  const studentsList = progress?.students || [];
  const totalStudents = studentsList.length;
  const totalTestsTaken = studentsList.reduce((sum, s) => sum + (s.total_assessments_taken || 0), 0);
  const totalTestsPassed = studentsList.reduce((sum, s) => sum + (s.assessments_passed || 0), 0);
  const classAvgScore = totalStudents > 0
    ? Math.round(studentsList.reduce((sum, s) => sum + (s.average_test_score || 0), 0) / totalStudents)
    : 0;
  const laggingStudentsCount = studentsList.filter((s) => (s.assessments_lagging || 0) > 0).length;

  const currentDisplaySubject = effectiveSubject || (availableSubjects[0] || "Subject");

  return (
    <div className="space-y-4">
      {/* ── Summary KPI Cards ──────────────────────────────────────────────── */}
      {progress && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-1">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
              Enrolled Class Size
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary">{totalStudents}</span>
              <span className="text-xs text-text-secondary">Students in Class {classNumber}{section}</span>
            </div>
          </div>

          <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-1">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
              {currentDisplaySubject} Avg Score
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${classAvgScore >= 60 ? "text-emerald-500" : "text-amber-500"}`}>
                {classAvgScore}%
              </span>
              <span className="text-xs text-text-secondary">across {currentDisplaySubject} tests</span>
            </div>
          </div>

          <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-1">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
              {currentDisplaySubject} Tests Passed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary">
                {totalTestsPassed} / {totalTestsTaken}
              </span>
              <span className="text-xs text-emerald-500 font-semibold">
                ({totalTestsTaken ? Math.round((totalTestsPassed / totalTestsTaken) * 100) : 0}% pass rate)
              </span>
            </div>
          </div>

          <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-1">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
              Lagging Attention Alerts
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${laggingStudentsCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                {laggingStudentsCount}
              </span>
              <span className="text-xs text-text-secondary">
                {laggingStudentsCount > 0 ? "students need support" : "all students on track"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Progress Table ────────────────────────────────────────────── */}
      <Panel flush className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[var(--c-line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
              {activeView === "assessments" ? <Award className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary">
                {activeView === "assessments"
                  ? `${currentDisplaySubject} Assessment Growth & Progress`
                  : `${currentDisplaySubject} Curriculum & Reading Progress`}
              </h3>
              <p className="text-[11px] text-text-tertiary">
                {activeView === "assessments"
                  ? `Real-time ${currentDisplaySubject} quiz submissions, average scores, and progress.`
                  : `NCERT ${currentDisplaySubject} textbook chapter completion percentages.`}
              </p>
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center bg-surface border border-border-primary rounded-lg p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveView("assessments")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "assessments"
                  ? "bg-brand text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Assessment &amp; Quizzes</span>
            </button>
            <button
              onClick={() => setActiveView("curriculum")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "curriculum"
                  ? "bg-brand text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum Modules</span>
            </button>
          </div>
        </div>

        {/* ── Subject Filter Bar (when multiple subjects are available for this class) ── */}
        {availableSubjects.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface/40 border-b border-[var(--c-line)] flex-wrap">
            <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1.5 shrink-0">
              <Layers className="w-3.5 h-3.5 text-brand" />
              Subject:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableSubjects.map((subName) => (
                <button
                  key={subName}
                  onClick={() => setSelectedSubject(subName)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentDisplaySubject === subName
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface text-text-secondary hover:text-text-primary border border-border-primary"
                  }`}
                >
                  <span>{subName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12"><Loading /></div>
        ) : error ? (
          <div className="p-5">
            <Notice tone="rose">{error}</Notice>
          </div>
        ) : !progress || progress.students.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title={`${t("teacherDashboard.noModulesFoundFor")} ${t("teacherDashboard.classPrefix")} ${classNumber}.`}
          />
        ) : activeView === "assessments" ? (
          /* ── VIEW 1: Assessment & Quiz Performance ──────────────────────── */
          <Table>
            <thead>
              <tr>
                <Th>{t("dashboard.student.studentPrefix")}</Th>
                <Th>Tests Taken</Th>
                <Th>Avg Test Score</Th>
                <Th>{currentDisplaySubject} Progress</Th>
                <Th>Assessment Status</Th>
                <Th>Activity &amp; Streak</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
              {progress.students.map((row) => (
                <Item as="tr" key={row.student_id} className="console-row">
                  <Td>
                    <span className="block font-medium text-text-primary">
                      {row.full_name || row.unique_number}
                    </span>
                    <Code className="mt-0.5 inline-block">{row.unique_number}</Code>
                  </Td>

                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <span className="console-num text-xs font-bold text-text-primary">
                        {row.total_assessments_taken ?? 0} Test{(row.total_assessments_taken ?? 0) === 1 ? "" : "s"}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {row.assessments_passed ?? 0} passed
                      </span>
                    </div>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2">
                      <span
                        className={`console-num font-bold text-sm ${
                          (row.average_test_score ?? 0) >= 60 ? "text-emerald-500" : (row.average_test_score ?? 0) > 0 ? "text-rose-500" : "text-text-tertiary"
                        }`}
                      >
                        {row.average_test_score ?? 0}%
                      </span>
                    </div>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="console-num text-xs font-bold text-text-primary w-8">
                        {row.holistic_mastery_percent ?? 0}%
                      </span>
                      <Meter
                        className="w-16"
                        value={row.holistic_mastery_percent ?? 0}
                        tone={(row.holistic_mastery_percent ?? 0) >= 80 ? "emerald" : (row.holistic_mastery_percent ?? 0) >= 50 ? "brand" : "amber"}
                      />
                    </div>
                  </Td>

                  <Td>
                    {(row.total_assessments_taken ?? 0) === 0 ? (
                      <Chip tone="neutral">No Tests Yet</Chip>
                    ) : (row.assessments_lagging ?? 0) > 0 ? (
                      <Chip tone="rose">Needs Attention</Chip>
                    ) : (row.average_test_score ?? 0) >= 85 ? (
                      <Chip tone="emerald">Mastered</Chip>
                    ) : (
                      <Chip tone="brand">On Track</Chip>
                    )}
                  </Td>

                  <Td>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 flex items-center gap-0.5 font-semibold">
                          <Zap className="w-3.5 h-3.5" />
                          {row.points ?? 0} XP
                        </span>
                        <span className="text-text-tertiary">·</span>
                        <span className="text-text-secondary flex items-center gap-0.5">
                          <Flame className="w-3.5 h-3.5 text-rose-500" />
                          {row.current_streak ?? 0}d streak
                        </span>
                      </div>
                      <span className="text-[10px] text-text-tertiary">
                        Active {relativeTime(row.last_activity_at)}
                      </span>
                    </div>
                  </Td>

                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudentForDetail(row)}
                      className="cursor-pointer"
                    >
                      <span>View Growth</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Td>
                </Item>
              ))}
            </Stagger>
          </Table>
        ) : (
          /* ── VIEW 2: Curriculum & Module Progression ────────────────────── */
          <Table>
            <thead>
              <tr>
                <Th>{t("dashboard.student.studentPrefix")}</Th>
                <Th>{t("teacherDashboard.thOverall")}</Th>
                {progress.subjects.map((sub) => (
                  <Th key={sub}>{sub}</Th>
                ))}
                <Th className="text-right">{t("teacherDashboard.thActivity")}</Th>
              </tr>
            </thead>
            <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
              {progress.students.map((row) => (
                <Item as="tr" key={row.student_id} className="console-row">
                  <Td>
                    <span className="block font-medium text-text-primary">
                      {row.full_name || row.unique_number}
                    </span>
                    <Code className="mt-0.5 inline-block">{row.unique_number}</Code>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="console-num text-xs font-bold text-text-primary w-8">
                        {row.overall_percent}%
                      </span>
                      <Meter className="w-16" value={row.overall_percent} tone={row.overall_percent >= 80 ? "emerald" : "brand"} />
                    </div>
                  </Td>
                  {progress.subjects.map((sub) => {
                    const cell = row.subjects.find(
                      (s) => s.subject.toLowerCase() === sub.toLowerCase()
                    );
                    const pct = cell?.progress_percent ?? 0;
                    return (
                      <Td key={sub}>
                        <span className={`console-num font-medium ${percentColor(pct)}`}>
                          {pct}%
                        </span>
                      </Td>
                    );
                  })}
                  <Td className="text-right text-xs text-text-tertiary">
                    {relativeTime(row.last_activity_at)}
                  </Td>
                </Item>
              ))}
            </Stagger>
          </Table>
        )}
      </Panel>

      {/* ── Student Detailed Progress Modal ────────────────────────────────── */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border-primary rounded-[var(--radius-lg)] max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-border-primary pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {selectedStudentForDetail.full_name || selectedStudentForDetail.unique_number}
                  </h3>
                  <span className="text-xs text-text-tertiary">
                    Student ID: {selectedStudentForDetail.unique_number} · Class {classNumber}{section} · <span className="font-semibold text-brand">{modalSubject || currentDisplaySubject}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="text-text-tertiary hover:text-text-primary p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subject Selector Tabs (if class has multiple subjects) */}
            {availableSubjects.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-surface border border-border-primary rounded-lg self-start">
                <span className="text-[11px] font-semibold text-text-tertiary px-2">Subject:</span>
                {availableSubjects.map((subName) => (
                  <button
                    key={subName}
                    onClick={() => setModalSubject(subName)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      (modalSubject || currentDisplaySubject) === subName
                        ? "bg-brand text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span>{subName}</span>
                  </button>
                ))}
              </div>
            )}

            {loadingDetail ? (
              <div className="py-12"><Loading /></div>
            ) : detailError ? (
              <Notice tone="rose">{detailError}</Notice>
            ) : !studentDetailProgress ? null : (
              <div className="space-y-5">
                {/* Metric Summary Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-surface border border-border-primary text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                      {modalSubject || currentDisplaySubject} Progress
                    </span>
                    <span className="text-xl font-bold text-brand block mt-0.5">
                      {studentDetailProgress.holistic_mastery_percent}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface border border-border-primary text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                      Avg Test Score
                    </span>
                    <span className="text-xl font-bold text-emerald-500 block mt-0.5">
                      {studentDetailProgress.average_test_score}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface border border-border-primary text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                      Tests Completed
                    </span>
                    <span className="text-xl font-bold text-text-primary block mt-0.5">
                      {studentDetailProgress.total_assessments_taken}
                    </span>
                  </div>
                </div>

                {/* Consecutive Assessments List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-brand" />
                    <span>{modalSubject || currentDisplaySubject} Completed Tests &amp; Score Trajectory</span>
                  </h4>

                  {studentDetailProgress.subjects.flatMap((s) => s.assessments).length === 0 ? (
                    <EmptyState icon={Award} title={`No ${modalSubject || currentDisplaySubject} tests attempted yet.`} />
                  ) : (
                    <div className="space-y-2">
                      {studentDetailProgress.subjects
                        .flatMap((s) => s.assessments)
                        .map((asgn) => (
                          <div
                            key={asgn.assignment_id}
                            className="p-3.5 rounded-lg bg-surface border border-border-primary space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-brand tracking-wider">
                                  {asgn.subject}
                                </span>
                                <h5 className="text-xs font-bold text-text-primary">{asgn.title}</h5>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`text-sm font-bold ${
                                    asgn.latest_score >= 60 ? "text-emerald-500" : "text-rose-500"
                                  }`}
                                >
                                  {asgn.latest_score}%
                                </span>
                                <span className="text-[10px] text-text-tertiary block">
                                  {asgn.total_attempts} attempt{asgn.total_attempts === 1 ? "" : "s"}
                                </span>
                              </div>
                            </div>

                            {/* Attempt history pills */}
                            <div className="flex items-center gap-2 pt-1 border-t border-border-primary text-[11px]">
                              <span className="text-text-tertiary">History:</span>
                              {asgn.attempts_history.map((att) => (
                                <span
                                  key={att.attempt_number}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    att.is_passed
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-rose-500/10 text-rose-500"
                                  }`}
                                >
                                  #{att.attempt_number}: {att.percentage}%
                                </span>
                              ))}
                            </div>

                            {/* AI / Teacher remarks */}
                            {asgn.ai_feedback && (
                              <div className="p-2.5 rounded bg-brand/5 border border-brand/15 text-[11px] text-text-secondary">
                                <span className="font-bold text-brand block mb-0.5 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> AI Advice:
                                </span>
                                {asgn.ai_feedback}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedStudentForDetail(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
