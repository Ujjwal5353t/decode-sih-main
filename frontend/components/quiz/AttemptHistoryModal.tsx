"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Award,
  AlertCircle,
  Brain,
  FileText,
  Clock,
  CheckCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AssignmentAttemptOut, FeedbackOut } from "@/lib/api";

interface AttemptHistoryModalProps {
  assignmentTitle: string;
  attempts: AssignmentAttemptOut[];
  teacherFeedback?: FeedbackOut | null;
  onClose: () => void;
}

export function AttemptHistoryModal({
  assignmentTitle,
  attempts,
  teacherFeedback,
  onClose,
}: AttemptHistoryModalProps) {
  const formatPdfUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    return `${apiBase}/files/view-pdf?url=${encodeURIComponent(url)}`;
  };

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
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Test Performance & Attempt History
            </span>
            <h2 className="text-base font-bold text-text-primary truncate">{assignmentTitle}</h2>
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
          {/* Teacher Feedback Banner */}
          {teacherFeedback && (
            <div className="p-4 rounded-[var(--radius-md)] bg-brand/5 border border-border-brand space-y-1">
              <div className="flex items-center gap-2 text-brand font-bold text-xs">
                <MessageSquare className="w-4 h-4" />
                <span>Teacher Feedback</span>
              </div>
              <p className="text-xs text-text-primary">{teacherFeedback.feedback_text}</p>
            </div>
          )}

          {/* Attempt List */}
          {attempts.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                All Attempts ({attempts.length})
              </h3>

              <div className="space-y-3">
                {attempts.map((att) => {
                  const percentage = att.percentage ?? (att.score && att.max_score ? (att.score / att.max_score) * 100 : null);
                  const isPassed = att.is_passed ?? (percentage !== null ? percentage >= 60 : false);

                  return (
                    <div
                      key={att.id}
                      className="glass rounded-[var(--radius-md)] p-4 border border-border-primary space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-surface border border-border-primary flex items-center justify-center text-xs font-bold text-brand">
                            #{att.attempt_number}
                          </span>
                          <span className="text-xs font-bold text-text-primary">
                            Attempt #{att.attempt_number}
                          </span>
                          <span className="text-[11px] text-text-tertiary">
                            • {new Date(att.started_at).toLocaleString()}
                          </span>
                        </div>

                        {percentage !== null ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isPassed
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            }`}
                          >
                            {percentage.toFixed(1)}% ({isPassed ? "PASSED" : "FAILED"})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-surface text-text-tertiary">
                            {att.status}
                          </span>
                        )}
                      </div>

                      {/* Response PDF */}
                      {att.response_pdf_url && (
                        <div className="pt-2 border-t border-border-primary/50">
                          <a
                            href={formatPdfUrl(att.response_pdf_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Submitted Response PDF
                          </a>
                        </div>
                      )}

                      {/* AI Advice Box */}
                      {att.ai_feedback && (
                        <div className="mt-2 p-3 rounded bg-surface/60 border border-border-primary/60 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-brand font-bold">
                            <Brain className="w-3.5 h-3.5" />
                            <span>AI Study Advice & Concept Analysis</span>
                          </div>
                          <p className="text-text-primary whitespace-pre-line leading-relaxed">
                            {att.ai_feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-tertiary text-center py-8">
              No recorded attempt history found for this test.
            </p>
          )}
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
