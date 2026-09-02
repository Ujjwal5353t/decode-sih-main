"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Lock,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Mascot, MascotMood } from "@/components/quiz/Mascot";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import {
  isSoundMuted,
  playCelebrationSound,
  playIncorrectSound,
  triggerHaptic,
} from "@/lib/quizAudio";
import {
  getLearningModule,
  startModuleQuiz,
  submitModuleQuiz,
  LearningModuleOut,
  ModuleQuizStartOut,
  ModuleQuizResultOut,
} from "@/lib/api";

type Phase = "loading" | "error" | "crux" | "quiz" | "result";

export default function LearningModuleViewerPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !role)) {
      router.push("/login");
    }
  }, [loading, user, role, router]);

  if (loading || !user || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">Students only</h1>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <ModuleFlow />;
}

function ModuleFlow() {
  const params = useParams();
  const gapId = Array.isArray(params.gapId) ? params.gapId[0] : (params.gapId as string);

  const [phase, setPhase] = useState<Phase>("loading");
  const [module, setModule] = useState<LearningModuleOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Crux slideshow state ──────────────────────────────────────────────
  const [slideIdx, setSlideIdx] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  // ── Quiz state ───────────────────────────────────────────────────────
  const [quiz, setQuiz] = useState<ModuleQuizStartOut | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ModuleQuizResultOut | null>(null);

  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const muted = useMemo(() => isSoundMuted(), []);

  useEffect(() => {
    let cancelled = false;
    if (!gapId) return;
    getLearningModule(gapId)
      .then((res) => {
        if (cancelled) return;
        setModule(res);
        setSlideIdx(0);
        setVisited(new Set([0]));
        setPhase("crux");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load this learning module.");
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [gapId]);

  useEffect(() => {
    if (mascotMood === "idle" || mascotMood === "celebrate") return;
    const timer = setTimeout(() => setMascotMood("idle"), 1700);
    return () => clearTimeout(timer);
  }, [mascotMood]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "error" || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">Couldn&apos;t load this module</h1>
          <p className="text-sm text-text-secondary mt-1">{error}</p>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const slides = module.crux_points;
  const totalSlides = slides.length;
  const allVisited = totalSlides === 0 || visited.size >= totalSlides;

  const goToSlide = (idx: number) => {
    const clamped = Math.max(0, Math.min(totalSlides - 1, idx));
    setSlideIdx(clamped);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(clamped);
      return next;
    });
  };

  const beginQuiz = () => {
    setQuizLoading(true);
    setError(null);
    startModuleQuiz(module.gap_id)
      .then((res) => {
        setQuiz(res);
        setQIndex(0);
        setAnswers({});
        setPhase("quiz");
      })
      .catch((err) => setError(err.message || "Failed to start the quiz."))
      .finally(() => setQuizLoading(false));
  };

  const question = quiz?.questions[qIndex];
  const allAnswered = quiz ? quiz.questions.every((q) => answers[q.id] !== undefined) : false;

  const submitQuiz = () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    setError(null);
    submitModuleQuiz(
      module.gap_id,
      quiz.questions.map((q) => ({ question_id: q.id, selected_option_index: answers[q.id] }))
    )
      .then((res) => {
        setResult(res);
        setPhase("result");
        if (res.passed) {
          if (!muted) playCelebrationSound();
          setConfettiTrigger(Date.now());
          setMascotMood("celebrate");
        } else {
          if (!muted) playIncorrectSound();
          setMascotMood("encourage");
          triggerHaptic([20, 40, 20]);
        }
      })
      .catch((err) => setError(err.message || "Failed to submit the quiz."))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <header className="sticky top-0 z-30 glass border-b border-border-primary px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand">
              {module.subject}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-600">
              From Class {module.origin_class}
            </span>
          </div>
        </div>
      </header>

      <ConfettiBurst triggerKey={confettiTrigger} />

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-none">
        <Mascot mood={mascotMood} size={84} />
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded bg-rose-500/10 text-rose-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {phase === "crux" && (
          <>
            <h1 className="text-lg font-bold text-text-primary text-center mb-1">{module.topic_name}</h1>
            {module.chapter_title && (
              <p className="text-xs text-text-tertiary text-center mb-5">{module.chapter_title}</p>
            )}

            {totalSlides > 0 && (
              <div className="mb-5 flex justify-center">
                <ProgressDots
                  total={totalSlides}
                  current={slideIdx}
                  visited={visited}
                  onJump={goToSlide}
                />
              </div>
            )}

            {totalSlides === 0 ? (
              <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center">
                <p className="text-sm text-text-secondary">
                  No summary content is available for this topic yet — you can still take the
                  retention quiz directly.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={slideIdx}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center min-h-[220px] flex flex-col items-center justify-center"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand mb-4">
                    Point {slideIdx + 1} / {totalSlides}
                  </span>
                  <p className="text-base font-medium text-text-primary leading-relaxed max-w-lg mx-auto">
                    {slides[slideIdx]}
                  </p>
                </motion.div>
              </AnimatePresence>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              {totalSlides > 0 && slideIdx > 0 && (
                <Button variant="secondary" size="md" onClick={() => goToSlide(slideIdx - 1)}>
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
              {totalSlides > 0 && slideIdx < totalSlides - 1 && (
                <Button variant="primary" size="md" onClick={() => goToSlide(slideIdx + 1)}>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
              {module.quiz_available ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={beginQuiz}
                    disabled={!allVisited || quizLoading}
                    className="min-w-[240px] justify-center"
                  >
                    {quizLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : allVisited ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Take Retention Quiz
                  </Button>
                  {!allVisited && totalSlides > 0 && (
                    <p className="text-[11px] text-text-tertiary">
                      Visit all {totalSlides} points to unlock ({visited.size}/{totalSlides} so far)
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-text-tertiary italic">
                  No retention quiz is available for this topic yet.
                </p>
              )}
            </div>
          </>
        )}

        {phase === "quiz" && quiz && question && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary"
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold text-text-tertiary">
                Question {qIndex + 1} of {quiz.questions.length}
              </span>
              <div className="flex gap-1.5">
                {quiz.questions.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-2 rounded-full transition-all ${
                      i === qIndex
                        ? "w-6 bg-brand"
                        : answers[q.id] !== undefined
                        ? "w-2 bg-emerald-500"
                        : "w-2 bg-border-primary"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-base font-semibold text-text-primary mb-5">{question.question_text}</p>

            <div className="space-y-2.5">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: i }))}
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

            <div className="flex items-center justify-between mt-7">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                disabled={qIndex === 0}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              {qIndex < quiz.questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setQIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
                  disabled={answers[question.id] === undefined}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="primary" size="md" onClick={submitQuiz} disabled={!allAnswered || submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Submit
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center"
          >
            <div className="flex justify-center mb-3">
              {result.passed ? (
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              ) : (
                <XCircle className="w-10 h-10 text-amber-500" />
              )}
            </div>
            <h1 className="text-lg font-bold text-text-primary">
              {result.correct_count} / {result.total_count} correct ({result.score_percent}%)
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
              {result.passed
                ? "Nice work — this gap is now marked as closed."
                : "Not quite there yet — review the crux again and retake the quiz whenever you're ready."}
            </p>
            {result.xp_awarded > 0 && (
              <p className="text-xs font-semibold text-brand mt-2">+{result.xp_awarded} XP</p>
            )}
            <div className="flex items-center justify-center gap-3 mt-6">
              {!result.passed && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setResult(null);
                    setPhase("crux");
                    setSlideIdx(0);
                  }}
                >
                  Review Again
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="primary" size="md">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ProgressDots({
  total,
  current,
  visited,
  onJump,
}: {
  total: number;
  current: number;
  visited: Set<number>;
  onJump: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          aria-label={`Go to point ${i + 1}`}
          className="p-0.5"
        >
          <motion.div
            animate={{ scale: i === current ? 1.2 : 1 }}
            className={`h-2 rounded-full transition-colors ${
              i === current
                ? "w-6 bg-brand"
                : visited.has(i)
                ? "w-2 bg-emerald-500"
                : "w-2 bg-border-primary"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
