"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
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
import { StudentProfile, LessonOut, LessonSlideOut, getLesson } from "@/lib/api";

export default function LessonViewerPage() {
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
            Animated lessons are only available on student accounts.
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

  return <LessonFlow student={user as StudentProfile} />;
}

type ViewState = "loading" | "error" | "slide" | "completed";

function LessonFlow({ student }: { student: StudentProfile }) {
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
        const data = await getLesson(lessonId);
        if (cancelled) return;
        setLesson(data);
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

  const handleFinish = () => {
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
            <h1 className="text-lg font-bold text-text-primary">Lesson Complete!</h1>
            <p className="text-sm text-text-secondary mt-2">
              You finished "{lesson.chapter_title}" — great work.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/dashboard/learn">
                <Button variant="secondary" size="md">
                  More Lessons
                </Button>
              </Link>
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
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="glass rounded-[var(--radius-lg)] p-8 border border-border-primary text-center"
    >
      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand mb-4">
        {slide.slide_type === "example" ? "Example" : "Concept"} · Slide {slideNumber} of {totalSlides}
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
            Back
          </Button>
        )}
        <Button variant="primary" size="md" onClick={onNext}>
          Next
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
        <span className="text-xs font-semibold text-text-secondary">Quick Check</span>
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
              <p className="font-semibold">{wasCorrect ? "Correct!" : "Not quite!"}</p>
              {slide.explanation && (
                <p className="mt-1 text-text-secondary">{slide.explanation}</p>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" size="md" onClick={onFinish}>
                Finish Lesson
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
