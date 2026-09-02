"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getLearningModules,
  startModuleQuiz,
  submitModuleQuiz,
  LearningModuleOut,
  ModuleQuizStartOut,
  ModuleQuizResultOut,
  QuestionOut,
} from "@/lib/api";

/**
 * Gap-driven remediation modules — the crux of the exact earlier-class
 * chapter a student's diagnostic quiz traced a gap back to, plus a short
 * retention quiz. Distinct from the generic curriculum/module listing
 * elsewhere on this tab: every card here maps 1:1 to one open
 * StudentTopicGap, and completing (passing) its quiz makes the card
 * disappear on the next load, since the gap is then resolved server-side.
 */
export function GapModulesPanel() {
  const { t } = useTranslation();
  const [modules, setModules] = useState<LearningModuleOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeGapId, setActiveGapId] = useState<string | null>(null);

  const load = () => {
    setError(null);
    getLearningModules()
      .then(setModules)
      .catch((err) => setError(err.message || "Failed to load learning modules."));
  };

  useEffect(() => {
    load();
  }, []);

  const activeModule = modules?.find((m) => m.gap_id === activeGapId) || null;

  if (activeModule) {
    return (
      <ModuleQuizFlow
        module={activeModule}
        onExit={(refreshNeeded) => {
          setActiveGapId(null);
          if (refreshNeeded) {
            setModules(null);
            load();
          }
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Target className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">Close Your Gaps</h2>
          <p className="text-xs text-text-secondary">
            Focused reviews built from exactly what your diagnostic quiz found — the crux of
            each earlier-class chapter, then a quick check.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-rose-500/10 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {modules === null && !error ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : modules && modules.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center border border-emerald-500/25 bg-emerald-500/[0.04]">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-text-primary">No open gaps right now</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Every topic your diagnostic quiz flagged has been reviewed and passed. New gaps
            will appear here if a future check-in finds one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules?.map((m) => (
            <ModuleCard key={m.gap_id} module={m} onOpen={() => setActiveGapId(m.gap_id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  module: m,
  onOpen,
}: {
  module: LearningModuleOut;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[var(--radius-md)] border border-border-primary overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
            {m.subject}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600">
            From Class {m.origin_class}
          </span>
        </div>
        <h3 className="text-sm font-bold text-text-primary">{m.topic_name}</h3>
        {m.chapter_title && (
          <p className="text-[11px] text-text-tertiary mt-0.5">{m.chapter_title}</p>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>{expanded ? "Hide the crux" : "Show the crux"}</span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-1.5 overflow-hidden"
            >
              {m.crux_points.length === 0 ? (
                <li className="text-xs text-text-tertiary italic">
                  No summary available yet for this topic.
                </li>
              ) : (
                m.crux_points.map((point, i) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-brand/30">
                    {point}
                  </li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>

        <div className="mt-4 pt-3 border-t border-border-primary/50">
          {m.quiz_available ? (
            <Button variant="primary" size="sm" onClick={onOpen} className="w-full justify-center">
              <Sparkles className="w-3.5 h-3.5" />
              Take Retention Quiz ({m.quiz_question_count} Qs)
            </Button>
          ) : (
            <span className="text-[11px] text-text-tertiary italic">
              Retention quiz not available yet for this topic.
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ModuleQuizFlow({
  module: m,
  onExit,
}: {
  module: LearningModuleOut;
  onExit: (refreshNeeded: boolean) => void;
}) {
  const [phase, setPhase] = useState<"crux" | "quiz" | "result">("crux");
  const [quiz, setQuiz] = useState<ModuleQuizStartOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ModuleQuizResultOut | null>(null);

  const beginQuiz = () => {
    setLoading(true);
    setError(null);
    startModuleQuiz(m.gap_id)
      .then((res) => {
        setQuiz(res);
        setPhase("quiz");
        setIndex(0);
        setAnswers({});
      })
      .catch((err) => setError(err.message || "Failed to start the quiz."))
      .finally(() => setLoading(false));
  };

  const question: QuestionOut | undefined = quiz?.questions[index];
  const allAnswered = quiz ? quiz.questions.every((q) => answers[q.id] !== undefined) : false;

  const selectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submit = () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    setError(null);
    submitModuleQuiz(
      m.gap_id,
      quiz.questions.map((q) => ({ question_id: q.id, selected_option_index: answers[q.id] }))
    )
      .then((res) => {
        setResult(res);
        setPhase("result");
      })
      .catch((err) => setError(err.message || "Failed to submit the quiz."))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => onExit(phase === "result" && !!result?.gap_resolved)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to modules
      </button>

      {error && (
        <div className="mb-4 p-3 rounded bg-rose-500/10 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {phase === "crux" && (
        <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
              {m.subject}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600">
              From Class {m.origin_class}
            </span>
          </div>
          <h2 className="text-lg font-bold text-text-primary">{m.topic_name}</h2>
          {m.chapter_title && <p className="text-xs text-text-tertiary mt-0.5">{m.chapter_title}</p>}

          <ul className="mt-4 space-y-2.5">
            {m.crux_points.map((point, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed pl-3 border-l-2 border-brand/30">
                {point}
              </li>
            ))}
          </ul>

          <Button
            variant="primary"
            size="md"
            onClick={beginQuiz}
            disabled={loading || !m.quiz_available}
            className="mt-6 w-full justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Ready — Take the Retention Quiz
          </Button>
        </div>
      )}

      {phase === "quiz" && quiz && question && (
        <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text-tertiary">
              Question {index + 1} of {quiz.questions.length}
            </span>
            <div className="flex gap-1">
              {quiz.questions.map((q, i) => (
                <span
                  key={q.id}
                  className={`w-1.5 h-1.5 rounded-full ${
                    answers[q.id] !== undefined ? "bg-brand" : "bg-border-primary"
                  } ${i === index ? "scale-150" : ""}`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm font-semibold text-text-primary mb-4">{question.question_text}</p>

          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectOption(question.id, i)}
                className={`w-full text-left px-4 py-3 rounded-[var(--radius-sm)] border text-sm transition-colors ${
                  answers[question.id] === i
                    ? "border-brand bg-brand/10 text-text-primary font-semibold"
                    : "border-border-primary text-text-secondary hover:border-brand/50"
                }`}
              >
                {question.option_emojis?.[i] ? `${question.option_emojis[i]} ` : ""}
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Previous
            </Button>
            {index < quiz.questions.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
                disabled={answers[question.id] === undefined}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={submit}
                disabled={!allAnswered || submitting}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Submit
              </Button>
            )}
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary text-center">
          {result.passed ? (
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          ) : (
            <XCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          )}
          <h2 className="text-lg font-bold text-text-primary">
            {result.correct_count} / {result.total_count} correct ({result.score_percent}%)
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {result.passed
              ? "Nice work — this gap is now marked as closed."
              : "Not quite there yet — review the crux above and try again."}
          </p>
          {result.xp_awarded > 0 && (
            <p className="text-xs font-semibold text-brand mt-2">+{result.xp_awarded} XP</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-5">
            {!result.passed && (
              <Button variant="secondary" size="sm" onClick={() => setPhase("crux")}>
                Review Again
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => onExit(result.gap_resolved)}>
              Back to Modules
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
