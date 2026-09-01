"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
  CloudOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Mascot, MascotMood } from "@/components/quiz/Mascot";
import { QuizIllustration } from "@/components/quiz/illustrations/QuizIllustration";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import {
  isSoundMuted,
  setSoundMuted,
  playCorrectSound,
  playIncorrectSound,
  playCelebrationSound,
  triggerHaptic,
} from "@/lib/quizAudio";
import { StudentProfile, LessonOut, LessonSlideOut } from "@/lib/api";
import { loadLesson } from "@/lib/offline/contentCache";
import { recordLearningEvent, flushLearningEvents } from "@/lib/offline/learningEvents";

export default function LessonViewerPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();

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
          <p className="text-sm font-medium text-text-secondary">{t("dashboard.common.loading")}</p>
        </div>
      </div>
    );
  }

  if (role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">{t("diagnosticQuiz.studentsOnly")}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("diagnosticQuiz.studentsOnlyDesc")}
          </p>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="mt-4">
              {t("diagnosticQuiz.backToDashboard")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <LessonFlow student={user as StudentProfile} />;
}

type ViewState = "loading" | "error" | "slide" | "completed";

function LessonFlow({ student }: { student: StudentProfile }) {
  const { t } = useTranslation();
  const params = useParams();
  const lessonId = Array.isArray(params.lessonId) ? params.lessonId[0] : (params.lessonId as string);

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");
  const [confettiTrigger, setConfettiTrigger] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());
  const [stale, setStale] = useState<boolean>(false);

  // When this lesson was opened, so "time spent" is measured rather than
  // guessed. Wall-clock on one device — best effort, and the server drops
  // implausible spans rather than believing them.
  const openedAtRef = useRef<number>(0);
  // Slides already reported, so re-visiting one by going Back does not
  // record a second ACTIVITY_COMPLETED for it.
  const reportedSlidesRef = useRef<Set<number>>(new Set());
  const quizStartedRef = useRef<boolean>(false);

  const track = useCallback(
    (
      eventType: Parameters<typeof recordLearningEvent>[0]["eventType"],
      detail?: Record<string, unknown>
    ): Promise<void> => {
      if (!lesson) return Promise.resolve();
      // Returns the write's promise (rather than firing-and-forgetting it)
      // so a caller that needs the event durably queued before moving on —
      // handleFinish, below — can await it instead of racing it.
      return recordLearningEvent({
        studentId: student.id,
        eventType,
        lessonId: lesson.id,
        subject: lesson.subject,
        classNumber: lesson.class_number,
        detail: detail ?? null,
        durationMs:
          eventType === "LESSON_COMPLETED" && openedAtRef.current
            ? Date.now() - openedAtRef.current
            : null,
      });
    },
    [lesson, student.id]
  );

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Cached per lesson id on first view, so losing connectivity part-way
        // through a chapter does not end the session.
        const result = await loadLesson(lessonId);
        if (cancelled) return;
        setLesson(result.data);
        setStale(result.stale);
        openedAtRef.current = Date.now();
        setViewState("slide");
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load this lesson.");
          setViewState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Opening a lesson starts it. The matching MODULE_STARTED is derived by
  // the server, which is the only side that sees every device's events.
  useEffect(() => {
    if (!lesson) return;
    void track("LESSON_STARTED");
  }, [lesson, track]);

  // The quick-check slide reaching the screen starts this lesson's quiz.
  useEffect(() => {
    if (!lesson || quizStartedRef.current) return;
    if (lesson.slides[slideIdx]?.slide_type !== "check") return;
    quizStartedRef.current = true;
    void track("QUIZ_STARTED", { slide_index: slideIdx });
  }, [lesson, slideIdx, track]);

  // Mascot settles back to idle a beat after a reaction.
  useEffect(() => {
    if (mascotMood === "idle" || mascotMood === "celebrate") return;
    const timer = setTimeout(() => setMascotMood("idle"), 1700);
    return () => clearTimeout(timer);
  }, [mascotMood]);

  if (viewState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (viewState === "error" || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h1 className="text-base font-bold text-text-primary">Couldn't load this lesson</h1>
          <p className="text-sm text-text-secondary mt-1">{error}</p>
          <Link href="/dashboard/learn">
            <Button variant="secondary" size="sm" className="mt-4">
              Back to Lessons
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const slides = lesson.slides;
  const currentSlide = slides[slideIdx];

  const handleNext = () => {
    if (slideIdx < slides.length - 1) {
      // Moving on from a concept/example slide means that activity is done.
      if (!reportedSlidesRef.current.has(slideIdx)) {
        reportedSlidesRef.current.add(slideIdx);
        void track("ACTIVITY_COMPLETED", {
          slide_index: slideIdx,
          slide_type: currentSlide.slide_type,
        });
      }
      setSlideIdx((i) => i + 1);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    if (slideIdx > 0) {
      setSlideIdx((i) => i - 1);
      setSelectedOption(null);
    }
  };

  const handleSelectOption = (idx: number, checkSlide: LessonSlideOut) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const correct = idx === checkSlide.correct_option_index;
    // The check slide is this lesson's quiz. Answers are recorded per
    // attempt; nothing here is scored or graded — the quiz-attempt system
    // in /dashboard/diagnostic-quiz remains the assessment of record.
    void track("QUIZ_COMPLETED", {
      slide_index: slideIdx,
      selected_option_index: idx,
      correct,
    });
    if (correct) {
      if (!muted) playCorrectSound();
      setMascotMood("happy");
      triggerHaptic(30);
    } else {
      if (!muted) playIncorrectSound();
      setMascotMood("encourage");
      triggerHaptic([20, 40, 20]);
    }
  };

  const handleFinish = async () => {
    // Awaited so the completion is durably in the offline queue (and, in
    // the common case, already synced) before the flush below and the UI's
    // move to the "completed" state — a fire-and-forget write here was the
    // gap that let a fast dashboard return race ahead of its own event.
    await track("LESSON_COMPLETED");
    void flushLearningEvents(student.id);
    if (!muted) playCelebrationSound();
    setConfettiTrigger(Date.now());
    setMascotMood("celebrate");
    setViewState("completed");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <header className="sticky top-0 z-30 glass border-b border-border-primary px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/learn" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Lessons</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand">
              {lesson.subject} · Ch. {lesson.chapter_number}
            </span>
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

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-none">
        <Mascot mood={mascotMood} size={84} />
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6">
        {stale && (
          <div className="mb-4 p-3 rounded bg-amber-500/10 text-amber-600 text-xs flex items-center gap-2">
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>
              You&apos;re offline — this lesson is loaded from your device, and your
              progress will sync once you&apos;re back online.
            </span>
          </div>
        )}

        {viewState === "slide" && (
          <>
            <div className="mb-5">
              <ProgressDots total={slides.length} current={slideIdx} />
            </div>

            <AnimatePresence mode="wait">
              {currentSlide.slide_type === "check" ? (
                <CheckSlideCard
                  key={currentSlide.id}
                  slide={currentSlide}
                  selectedOption={selectedOption}
                  onSelect={(idx) => handleSelectOption(idx, currentSlide)}
                  onFinish={handleFinish}
                />
              ) : (
                <ContentSlideCard
                  key={currentSlide.id}
                  slide={currentSlide}
                  slideNumber={slideIdx + 1}
                  totalSlides={slides.length}
                  onBack={slideIdx > 0 ? handleBack : undefined}
                  onNext={handleNext}
                />
              )}
            </AnimatePresence>
          </>
        )}

        {viewState === "completed" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center"
          >
            <div className="flex justify-center mb-3">
              <Mascot mood="celebrate" size={88} />
            </div>
            <h1 className="text-lg font-bold text-text-primary">{t("lessons.lessonFinished")}</h1>
            <p className="text-sm text-text-secondary mt-2">
              "{lesson.chapter_title}"
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/dashboard/learn">
                <Button variant="secondary" size="md">
                  {t("lessons.returnToLessons")}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="primary" size="md">
                  {t("diagnosticQuiz.backToDashboard")}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{ scale: i === current ? 1.2 : 1 }}
          className={`h-2 rounded-full transition-colors ${
            i === current
              ? "w-6 bg-brand"
              : i < current
              ? "w-2 bg-emerald-500"
              : "w-2 bg-border-primary"
          }`}
        />
      ))}
    </div>
  );
}

// ── Concept / Example Slide ────────────────────────────────────────────────────

function ContentSlideCard({
  slide,
  slideNumber,
  totalSlides,
  onBack,
  onNext,
}: {
  slide: LessonSlideOut;
  slideNumber: number;
  totalSlides: number;
  onBack?: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center"
    >
      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand mb-4">
        {t("lessons.slide")} {slideNumber} / {totalSlides}
      </span>

      {(slide.image_asset_key || slide.image_emoji) && (
        <div className="flex justify-center mb-5">
          <div
            className="w-36 h-36 rounded-[var(--radius-lg)] bg-surface border border-border-primary flex items-center justify-center text-8xl select-none"
            aria-hidden="true"
          >
            {slide.image_asset_key ? (
              <QuizIllustration assetKey={slide.image_asset_key} size={112} />
            ) : (
              slide.image_emoji
            )}
          </div>
        </div>
      )}

      <p className="text-base font-medium text-text-primary leading-relaxed max-w-lg mx-auto">
        {slide.text}
      </p>

      <div className="mt-8 flex items-center justify-center gap-3">
        {onBack && (
          <Button variant="secondary" size="md" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            {t("lessons.prev")}
          </Button>
        )}
        <Button variant="primary" size="md" onClick={onNext}>
          {t("lessons.next")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Check Slide ─────────────────────────────────────────────────────────────

function CheckSlideCard({
  slide,
  selectedOption,
  onSelect,
  onFinish,
}: {
  slide: LessonSlideOut;
  selectedOption: number | null;
  onSelect: (idx: number) => void;
  onFinish: () => void;
}) {
  const { t } = useTranslation();
  const options = slide.options || [];
  const answered = selectedOption !== null;
  const wasCorrect = selectedOption === slide.correct_option_index;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-brand" />
        <span className="text-xs font-semibold text-text-secondary">{t("lessons.checkUnderstanding")}</span>
      </div>

      {(slide.image_asset_key || slide.image_emoji) && (
        <div className="flex justify-center mb-4">
          <div
            className="w-24 h-24 rounded-[var(--radius-lg)] bg-surface border border-border-primary flex items-center justify-center text-6xl select-none"
            aria-hidden="true"
          >
            {slide.image_asset_key ? (
              <QuizIllustration assetKey={slide.image_asset_key} size={72} />
            ) : (
              slide.image_emoji
            )}
          </div>
        </div>
      )}

      <p className="text-base font-semibold text-text-primary text-center">{slide.text}</p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrectOption = idx === slide.correct_option_index;
          let stateClasses = "border-border-primary hover:border-brand hover:bg-surface-hover";
          if (answered && isCorrectOption) {
            stateClasses = "border-emerald-500 bg-emerald-500/10";
          } else if (answered && isSelected && !isCorrectOption) {
            stateClasses = "border-rose-500 bg-rose-500/10";
          }
          return (
            <motion.button
              key={idx}
              type="button"
              disabled={answered}
              onClick={() => onSelect(idx)}
              whileTap={{ scale: answered ? 1 : 0.95 }}
              className={`text-left px-4 py-3 rounded-[var(--radius-md)] bg-surface border text-sm text-text-primary transition-all disabled:cursor-not-allowed cursor-pointer ${stateClasses}`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <div
              className={`p-3.5 rounded-[var(--radius-md)] border text-sm ${
                wasCorrect
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-600"
              }`}
            >
              <p className="font-semibold">{wasCorrect ? t("lessons.correct") : t("lessons.incorrect")}</p>
              {slide.explanation && (
                <p className="mt-1 text-text-secondary">{slide.explanation}</p>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" size="md" onClick={onFinish}>
                {t("lessons.lessonFinished")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
