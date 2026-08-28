"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Mascot, MascotMood } from "@/components/quiz/Mascot";
import { QuizIllustration } from "@/components/quiz/illustrations/QuizIllustration";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import { StreakPointsBar } from "@/components/quiz/StreakPointsBar";
import { ProgressTrail } from "@/components/quiz/ProgressTrail";
import {
  isSoundMuted,
  setSoundMuted,
  playCorrectSound,
  playIncorrectSound,
  playStreakSound,
  playCelebrationSound,
  triggerHaptic,
} from "@/lib/quizAudio";
import {
  StudentProfile,
  QuestionOut,
  GapReportOut,
  startQuiz,
  answerQuiz,
  getQuizResult,
  getQuizStatus,
} from "@/lib/api";

const POINTS_PER_CORRECT = 10;

const ALL_SUBJECTS = ["Mathematics", "English", "Hindi", "EVS"];

type QuizStage = "checking" | "idle" | "in_progress" | "finished";

export default function DiagnosticQuizPage() {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">Students Only</h1>
          <p className="text-sm text-text-secondary mt-1">
            The diagnostic quiz is only available on student accounts.
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <QuizFlow student={user as StudentProfile} />;
}

function QuizFlow({ student }: { student: StudentProfile }) {
  const [stage, setStage] = useState<QuizStage>("checking");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    ALL_SUBJECTS.filter((s) => s !== "EVS" || (student.class_number || 0) >= 3)
  );
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionOut | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [report, setReport] = useState<GapReportOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gamification — purely a "how does it feel to play" layer, kept separate
  // from the backend's distance-weighted mastery score used for the actual
  // gap report.
  const [points, setPoints] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [answerHistory, setAnswerHistory] = useState<boolean[]>([]);
  const [mascotMood, setMascotMood] = useState<MascotMood>("dance");
  const [confettiTrigger, setConfettiTrigger] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  };

  // Mascot settles back to a dancing idle a beat after each reaction, so
  // it stays lively and engaging between questions rather than going
  // still (and isn't stuck mid-celebration once the moment has passed).
  useEffect(() => {
    if (mascotMood === "dance") return;
    const timer = setTimeout(() => setMascotMood("dance"), 1700);
    return () => clearTimeout(timer);
  }, [mascotMood]);

  const evsAvailable = (student.class_number || 0) >= 3;

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const finishWithResult = async (id: string) => {
    try {
      const result = await getQuizResult(id);
      setAttemptId(id);
      setReport(result);
      setStage("finished");
    } catch (err: any) {
      setError(err.message || "Failed to load your results.");
    }
  };

  // The diagnostic is one-time: on load, check whether this student already
  // has a completed attempt (show results directly, no retake) or an
  // in-progress one (resume it) before showing the subject picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getQuizStatus();
        if (cancelled) return;
        if (status.completed && status.attempt_id) {
          await finishWithResult(status.attempt_id);
        } else if (status.in_progress_attempt_id) {
          const res = await startQuiz(
            selectedSubjects.length ? { subjects: selectedSubjects } : undefined
          );
          if (cancelled) return;
          setAttemptId(res.attempt_id);
          if (res.question) {
            setQuestion(res.question);
            setQuestionCount(1);
            setStage("in_progress");
          } else {
            await finishWithResult(res.attempt_id);
          }
        } else {
          setStage("idle");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load quiz status.");
          setStage("idle");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The AI summary is generated in the background after the quiz finishes,
  // so it may not be ready the instant the result screen loads — poll for
  // it briefly instead of leaving "Generating..." stuck forever.
  useEffect(() => {
    if (stage !== "finished" || !attemptId || report?.ai_summary_status !== "pending") return;
    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const updated = await getQuizResult(attemptId);
        if (cancelled) return;
        if (updated.ai_summary_status !== "pending" || attempts >= 30) {
          setReport(updated);
          clearInterval(interval);
        }
      } catch {
        // transient — keep polling until the attempt cap above
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage, attemptId, report?.ai_summary_status]);

  const handleStart = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await startQuiz(
        selectedSubjects.length ? { subjects: selectedSubjects } : undefined
      );
      setAttemptId(res.attempt_id);
      if (res.question) {
        setQuestion(res.question);
        setQuestionCount(1);
        setStage("in_progress");
      } else {
        await finishWithResult(res.attempt_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start the quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!attemptId || !question || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await answerQuiz(attemptId, {
        question_id: question.id,
        selected_option_index: optionIndex,
      });

      setAnswerHistory((prev) => [...prev, res.was_correct]);

      if (res.was_correct) {
        const nextStreak = streak + 1;
        setPoints((p) => p + POINTS_PER_CORRECT);
        setStreak(nextStreak);
        setBestStreak((best) => Math.max(best, nextStreak));
        if (nextStreak >= 2 && nextStreak % 3 === 0) {
          if (!muted) playStreakSound(nextStreak);
          setConfettiTrigger(Date.now());
        } else if (!muted) {
          playCorrectSound();
        }
        setMascotMood(res.finished ? "celebrate" : "happy");
        triggerHaptic(30);
      } else {
        setStreak(0);
        if (!muted) playIncorrectSound();
        setMascotMood("encourage");
        triggerHaptic([20, 40, 20]);
      }

      if (res.finished || !res.next_question) {
        if (res.was_correct) {
          if (!muted) playCelebrationSound();
          setConfettiTrigger(Date.now());
        }
        await finishWithResult(attemptId);
      } else {
        setQuestion(res.next_question);
        setQuestionCount((c) => c + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit your answer.");
    } finally {
      setSubmitting(false);
    }
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand">
              <Target className="w-3.5 h-3.5" />
              <span>Gap Identification Quiz</span>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              title={muted ? "Unmute sound" : "Mute sound"}
              className="w-8 h-8 rounded-full bg-surface border border-border-primary flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <ConfettiBurst triggerKey={confettiTrigger} />

      {/* Persistent corner buddy — always on screen, reacting live to
          mascotMood, the way a mascot follows you around in kids' apps. */}
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

        <AnimatePresence mode="wait">
          {stage === "checking" && (
            <div key="checking" className="py-16 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {stage === "idle" && (
            <SubjectPicker
              key="idle"
              selectedSubjects={selectedSubjects}
              onToggle={toggleSubject}
              evsAvailable={evsAvailable}
              submitting={submitting}
              onStart={handleStart}
            />
          )}

          {stage === "in_progress" && question && (
            <div key="in_progress_wrap">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <ProgressTrail
                    subjectsInScope={selectedSubjects}
                    currentSubject={question.subject}
                    answerHistory={answerHistory}
                  />
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StreakPointsBar points={points} streak={streak} />
                </div>
              </div>
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionCount={questionCount}
                  subjectsInScope={selectedSubjects}
                  submitting={submitting}
                  onAnswer={handleAnswer}
                />
              </AnimatePresence>
            </div>
          )}

          {stage === "finished" && report && (
            <GapReportView
              key="finished"
              report={report}
              studentClass={student.class_number || 1}
              points={points}
              bestStreak={bestStreak}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Subject Picker ───────────────────────────────────────────────────────────

function SubjectPicker({
  selectedSubjects,
  onToggle,
  evsAvailable,
  submitting,
  onStart,
}: {
  selectedSubjects: string[];
  onToggle: (subject: string) => void;
  evsAvailable: boolean;
  submitting: boolean;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-text-primary">Diagnostic Quiz</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            This adaptive quiz checks your understanding at your current class level, and for
            any topic you find tricky, it steps back through earlier classes to find exactly
            where the gap starts — so we know what to strengthen first.
          </p>

          <div className="mt-5">
            <span className="block text-xs font-medium text-text-secondary mb-2">
              Subjects to include
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map((subject) => {
                const disabled = subject === "EVS" && !evsAvailable;
                const selected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(subject)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      selected
                        ? "bg-brand text-text-inverse border-brand"
                        : "bg-surface text-text-secondary border-border-primary hover:border-brand"
                    }`}
                    title={disabled ? "EVS starts from Class 3" : undefined}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              size="md"
              disabled={submitting || selectedSubjects.length === 0}
              onClick={onStart}
            >
              {submitting ? "Starting..." : "Start Quiz"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  questionCount,
  subjectsInScope,
  submitting,
  onAnswer,
}: {
  question: QuestionOut;
  questionCount: number;
  subjectsInScope: string[];
  submitting: boolean;
  onAnswer: (optionIndex: number) => void;
}) {
  const subjectPosition = subjectsInScope.indexOf(question.subject) + 1;
  const canReadAloud = typeof window !== "undefined" && "speechSynthesis" in window;

  const readAloud = () => {
    if (!canReadAloud) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.question_text);
    utterance.lang = question.subject === "Hindi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-text-tertiary">
          {subjectPosition > 0 ? `Subject ${subjectPosition} of ${subjectsInScope.length}` : "Diagnostic"}
          {" · "}
          Question {questionCount}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
          {question.subject} · Class {question.class_number}
        </span>
      </div>

      {(question.image_asset_key || question.image_emoji) && (
        <div className="flex justify-center mb-4">
          <div
            className="w-24 h-24 rounded-[var(--radius-lg)] bg-surface border border-border-primary flex items-center justify-center text-6xl select-none"
            aria-hidden="true"
          >
            {question.image_asset_key ? (
              <QuizIllustration assetKey={question.image_asset_key} size={72} />
            ) : (
              question.image_emoji
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2">
        <p className="text-base font-semibold text-text-primary flex-1">
          {question.question_text}
        </p>
        {canReadAloud && (
          <button
            type="button"
            onClick={readAloud}
            title="Read question aloud"
            className="shrink-0 w-8 h-8 rounded-full bg-surface border border-border-primary flex items-center justify-center text-text-secondary hover:text-brand hover:border-brand transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, idx) => {
          const assetKey = question.option_asset_keys?.[idx];
          const emoji = question.option_emojis?.[idx];
          const hasPicture = Boolean(assetKey || emoji);
          return (
            <motion.button
              key={idx}
              type="button"
              disabled={submitting}
              onClick={() => onAnswer(idx)}
              whileTap={{ scale: 0.95 }}
              className={`text-left rounded-[var(--radius-md)] bg-surface border border-border-primary text-text-primary hover:border-brand hover:bg-surface-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                hasPicture
                  ? "flex flex-col items-center gap-2 px-4 py-5 text-center"
                  : "px-4 py-3 text-sm"
              }`}
            >
              {assetKey ? (
                <QuizIllustration assetKey={assetKey} size={56} />
              ) : emoji ? (
                <span className="text-5xl select-none" aria-hidden="true">
                  {emoji}
                </span>
              ) : null}
              <span className={hasPicture ? "text-sm font-medium" : ""}>{option}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Gap Report View ──────────────────────────────────────────────────────────

function GapReportView({
  report,
  studentClass,
  points,
  bestStreak,
}: {
  report: GapReportOut;
  studentClass: number;
  points: number;
  bestStreak: number;
}) {
  const gapsBySubject: Record<string, GapReportOut["gaps"]> = {};
  for (const subject of report.subjects_covered) {
    gapsBySubject[subject] = report.gaps.filter((g) => g.subject === subject);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary text-center">
        <div className="flex justify-center mb-2">
          <Mascot mood="celebrate" size={72} />
        </div>
        <h1 className="text-lg font-bold text-text-primary">Quiz Complete</h1>
        {report.overall_score !== null && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-4xl font-bold text-brand">{report.overall_score}%</span>
            <span className="text-xs text-text-tertiary">overall score</span>
          </div>
        )}
        <p className="text-xs text-text-secondary mt-2">
          {report.gaps.length === 0
            ? "No gaps found — you're solid across everything we tested."
            : `We found ${report.gaps.length} topic${report.gaps.length === 1 ? "" : "s"} to strengthen, traced back to where the gap actually starts.`}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold">
            ⭐ {points} points
          </span>
          {bestStreak >= 2 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-bold">
              🔥 Best streak: {bestStreak}
            </span>
          )}
        </div>
      </div>

      <div className="glass rounded-[var(--radius-lg)] p-5 border border-border-primary">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-brand" />
          Summary
        </h2>
        {report.ai_summary_status === "ready" && report.ai_summary ? (
          <p className="text-sm text-text-secondary leading-relaxed">{report.ai_summary}</p>
        ) : report.ai_summary_status === "failed" ? (
          <p className="text-xs text-text-tertiary italic">Summary not available for this attempt.</p>
        ) : (
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <Mascot mood="dance" size={40} />
            <span>Putting together your summary...</span>
          </div>
        )}
      </div>

      {report.subjects_covered.map((subject) => {
        const gaps = gapsBySubject[subject] || [];
        const subjectScore = report.subject_scores[subject];
        return (
          <div key={subject} className="glass rounded-[var(--radius-md)] p-5 border border-border-primary">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text-primary">{subject}</h2>
              {subjectScore && (
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="font-bold text-text-primary">{subjectScore.score}%</span>
                  {subjectScore.gaps_found > 0 && (
                    <span>
                      avg {subjectScore.average_classes_behind}{" "}
                      class{subjectScore.average_classes_behind === 1 ? "" : "es"} behind
                    </span>
                  )}
                </div>
              )}
            </div>
            {gaps.length === 0 ? (
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No gaps found in {subject}.
              </p>
            ) : (
              <div className="space-y-2">
                {gaps.map((gap) => (
                  <div
                    key={gap.topic_code}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface border border-border-primary"
                  >
                    <span className="text-xs font-medium text-text-primary">{gap.topic_name}</span>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded shrink-0 ml-3">
                      Gap traced to Class {gap.originating_class}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="text-center pt-2">
        <Link href="/dashboard">
          <Button variant="secondary" size="md">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
