"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Loader2,
  Brain,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getAssignmentQuizForStudent,
  submitAssignmentQuiz,
  AssignmentQuizPreviewOut,
  QuizQuestionPreview,
  QuizAnswerInput,
  SubmitQuizAttemptResult,
} from "@/lib/api";

interface QuizRunnerModalProps {
  assignmentId: string;
  assignmentTitle: string;
  timeLimitMinutes?: number; // 15-20 minutes
  onClose: () => void;
  onSuccess: () => void;
}

export function QuizRunnerModal({
  assignmentId,
  assignmentTitle,
  timeLimitMinutes = 15,
  onClose,
  onSuccess,
}: QuizRunnerModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [quizData, setQuizData] = useState<AssignmentQuizPreviewOut | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SubmitQuizAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load quiz questions
  useEffect(() => {
    setLoading(true);
    setError(null);
    getAssignmentQuizForStudent(assignmentId)
      .then((res) => {
        setQuizData(res);
        setTimeLeftSeconds(timeLimitMinutes * 60);
      })
      .catch((err) => setError(err.message || "Failed to load quiz questions."))
      .finally(() => setLoading(false));
  }, [assignmentId, timeLimitMinutes]);

  // Timer countdown
  useEffect(() => {
    if (loading || result || !quizData || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time expires
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, result, quizData, timeLeftSeconds]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (result) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleFinalSubmit = async () => {
    if (!quizData || isSubmitting || result) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const answers: QuizAnswerInput[] = quizData.questions.map((q, idx) => ({
        question_id: q.id || `q_${idx + 1}`,
        question_text: q.question_text,
        selected_option_index: selectedAnswers[idx] ?? -1,
        correct_option_index: q.correct_option_index,
        chapter_title: q.chapter_title,
        explanation: q.explanation || undefined,
      }));

      const res = await submitAssignmentQuiz(assignmentId, answers);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz attempt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = quizData?.questions[currentIndex];
  const totalQ = quizData?.questions.length || 0;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl glass rounded-[var(--radius-lg)] border border-border-primary bg-background shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-surface/50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              AI Timed Quiz ({timeLimitMinutes} Mins Max)
            </span>
            <h2 className="text-base font-bold text-text-primary truncate">{assignmentTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            {!result && !loading && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                  timeLeftSeconds < 180
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse"
                    : "bg-brand/10 text-brand border-border-brand"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
              <p className="text-sm font-medium text-text-secondary">
                Generating RAG-grounded quiz questions...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-500">{error}</p>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : result ? (
            /* Result Screen */
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-border-primary mb-2">
                {result.is_passed ? (
                  <Award className="w-8 h-8 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                )}
              </div>

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${
                    result.is_passed
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  }`}
                >
                  {result.is_passed ? "PASSED (Score ≥ 60%)" : "FAILED (Score < 60%)"}
                </span>

                <h3 className="text-2xl font-bold text-text-primary">
                  {result.percentage.toFixed(1)}% Marks Scored
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Marks: {result.score.toFixed(1)} / {result.max_score}
                </p>
              </div>

              {/* AI Study Advice Box */}
              {result.ai_feedback && (
                <div className="p-4 rounded-[var(--radius-md)] bg-brand/5 border border-border-brand text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 text-brand font-bold">
                    <Brain className="w-4 h-4" />
                    <span>AI Diagnostic Feedback & Advice (For Student, Parent & Teacher)</span>
                  </div>
                  <div className="text-text-primary whitespace-pre-line leading-relaxed">
                    {result.ai_feedback}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 pt-4">
                {result.is_passed ? (
                  <Button variant="primary" size="md" onClick={onClose}>
                    Done & Close
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="md" onClick={onClose}>
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setResult(null);
                        setSelectedAnswers({});
                        setCurrentIndex(0);
                        setLoading(true);
                        getAssignmentQuizForStudent(assignmentId)
                          .then((res) => {
                            setQuizData(res);
                            setTimeLeftSeconds(timeLimitMinutes * 60);
                          })
                          .catch((err) => setError(err.message))
                          .finally(() => setLoading(false));
                      }}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Re-attempt Quiz (Adapted Questions)
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : currentQ ? (
            /* Quiz Active Question Runner */
            <div className="space-y-6">
              {/* Question Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
                  <span>
                    Question {currentIndex + 1} of {totalQ}
                  </span>
                  <span>{answeredCount} of {totalQ} answered</span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-primary">
                  <div
                    className="bg-brand h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Box */}
              <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-4">
                {currentQ.chapter_title && (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
                    {currentQ.chapter_title}
                  </span>
                )}
                <h3 className="text-base font-bold text-text-primary leading-snug">
                  {currentQ.question_text}
                </h3>

                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentIndex, optIdx)}
                        className={`w-full text-left p-3.5 rounded-[var(--radius-md)] border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-brand/10 border-brand text-brand font-bold shadow-sm"
                            : "bg-surface/50 border-border-primary text-text-primary hover:border-brand/40"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${isSelected ? "border-brand bg-brand text-white" : "border-border-primary"}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Controls */}
        {!loading && !result && (
          <div className="px-6 py-4 border-t border-border-primary bg-surface/30 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            {currentIndex < totalQ - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting || answeredCount === 0}
                onClick={handleFinalSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                )}
                Submit Quiz Attempt
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
