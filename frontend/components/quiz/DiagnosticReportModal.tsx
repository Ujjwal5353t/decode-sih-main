"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GapReportOut, getQuizResult } from "@/lib/api";

interface DiagnosticReportModalProps {
  attemptId: string;
  onClose: () => void;
}

export function DiagnosticReportModal({
  attemptId,
  onClose,
}: DiagnosticReportModalProps) {
  const [report, setReport] = useState<GapReportOut | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getQuizResult(attemptId)
      .then((res) => {
        if (active) setReport(res);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load diagnostic gap report.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl glass rounded-[var(--radius-lg)] border border-border-primary bg-background shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                Diagnostic Assessment Report
              </span>
              <h2 className="text-base font-bold text-text-primary">
                Gap Identification &amp; Subject Mastery
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
              <p className="text-xs text-text-secondary">Loading diagnostic report...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : report ? (
            <>
              {/* Overall Score Summary Header */}
              <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary text-center bg-brand/5 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-border-brand text-xs font-bold text-brand uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>Class {report.student_class} Assessment</span>
                </div>

                {report.overall_score !== null && report.overall_score !== undefined ? (
                  <div className="flex items-center justify-center gap-2 my-2">
                    <span className="text-4xl font-extrabold text-brand font-[family-name:var(--font-display)]">
                      {report.overall_score.toFixed(1)}%
                    </span>
                    <span className="text-xs text-text-tertiary font-medium">Overall Mastery</span>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-text-primary">Attempt Recorded</p>
                )}

                {report.completed_at && (
                  <p className="text-[11px] text-text-tertiary">
                    Completed on {new Date(report.completed_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* AI Guidance Summary */}
              <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-2">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <span>AI Study Advice &amp; Recommended Focus</span>
                </h3>
                {report.ai_summary_status === "ready" && report.ai_summary ? (
                  <p className="text-xs text-text-secondary leading-relaxed">{report.ai_summary}</p>
                ) : report.ai_summary_status === "failed" ? (
                  <p className="text-xs text-text-tertiary italic">
                    AI summary is not available for this attempt.
                  </p>
                ) : (
                  <p className="text-xs text-text-tertiary italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                    Generating personalized AI study advice...
                  </p>
                )}
              </div>

              {/* Per Subject Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Subject Breakdown &amp; Identified Learning Gaps
                </h3>

                <div className="space-y-3">
                  {report.subjects_covered.map((subject) => {
                    const subjectGaps = report.gaps.filter((g) => g.subject === subject);
                    const subjectScore = report.subject_scores[subject];

                    return (
                      <div
                        key={subject}
                        className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                              {subject}
                            </span>
                          </div>

                          {subjectScore && (
                            <span className="text-xs font-bold text-text-primary">
                              {subjectScore.score.toFixed(1)}% Score ({subjectScore.gaps_found} Gap{subjectScore.gaps_found === 1 ? "" : "s"})
                            </span>
                          )}
                        </div>

                        {subjectGaps.length === 0 ? (
                          <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 pt-1">
                            <CheckCircle2 className="w-4 h-4" />
                            No learning gaps identified in {subject}! Strong mastery.
                          </p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-semibold text-text-tertiary">
                              Topics to Review &amp; Reinforce:
                            </p>
                            {subjectGaps.map((gap) => (
                              <div
                                key={gap.topic_code}
                                className="flex items-center justify-between px-3 py-2 rounded bg-surface border border-border-primary/70 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-3.5 h-3.5 text-brand shrink-0" />
                                  <span className="font-semibold text-text-primary">
                                    {gap.topic_name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
                                  Class {gap.originating_class} Prerequisite
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-primary bg-surface/30 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
