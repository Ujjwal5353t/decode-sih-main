import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Mascot } from "../../components/Mascot";
import { SignLanguageAvatar } from "../../components/SignLanguageAvatar";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { usePreferences } from "../../context/PreferencesContext";
import { loadLesson } from "../../offline/contentCache";
import { recordLearningEvent, flushLearningEvents } from "../../offline/learningEvents";
import { speak, stopSpeaking } from "../../speech/speech";

function ProgressDots({ total, current }) {
  return (
    <View className="flex-row items-center gap-1.5 mb-4 flex-wrap">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full ${i === current ? "w-6 bg-sky-600" : i < current ? "w-2 bg-emerald-500" : "w-2 bg-slate-200"}`}
        />
      ))}
    </View>
  );
}

export default function LessonViewerScreen({ route, navigation }) {
  const { lessonId } = route.params;
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const { signLanguageAssist, readAloudEnabled } = usePreferences();

  const [state, setState] = useState("loading");
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [mascotMood, setMascotMood] = useState("idle");
  const [stale, setStale] = useState(false);

  const openedAtRef = useRef(0);
  const reportedSlidesRef = useRef(new Set());
  const quizStartedRef = useRef(false);

  const track = useCallback(
    (eventType, detail) => {
      if (!lesson) return Promise.resolve();
      return recordLearningEvent({
        studentId: user.id,
        eventType,
        lessonId: lesson.id,
        subject: lesson.subject,
        classNumber: lesson.class_number,
        detail: detail ?? null,
        durationMs: eventType === "LESSON_COMPLETED" && openedAtRef.current ? Date.now() - openedAtRef.current : null,
      });
    },
    [lesson, user.id]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await loadLesson(lessonId);
        if (cancelled) return;
        setLesson(result.data);
        setStale(result.stale);
        openedAtRef.current = Date.now();
        setState("slide");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t("mobile.lessonViewer.errorFallback"));
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    if (!lesson) return;
    void track("LESSON_STARTED");
  }, [lesson, track]);

  useEffect(() => {
    if (!lesson || quizStartedRef.current) return;
    if (lesson.slides[slideIdx]?.slide_type !== "check") return;
    quizStartedRef.current = true;
    void track("QUIZ_STARTED", { slide_index: slideIdx });
  }, [lesson, slideIdx, track]);

  useEffect(() => {
    if (mascotMood === "idle" || mascotMood === "celebrate") return;
    const timer = setTimeout(() => setMascotMood("idle"), 1500);
    return () => clearTimeout(timer);
  }, [mascotMood]);

  if (state === "loading") return <LoadingScreen label={t("mobile.lessonViewer.loading")} />;

  if (state === "error" || !lesson) {
    return (
      <Screen contentClassName="px-6 pt-10">
        <ErrorBanner message={error || t("mobile.lessonViewer.errorFallback")} />
        <Button title={t("mobile.lessonViewer.backToLessons")} variant="secondary" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const slides = lesson.slides;

  if (!slides || slides.length === 0) {
    return (
      <Screen contentClassName="px-6 pt-10">
        <EmptyState emoji="📄" subtitle={t("mobile.lessonViewer.emptySlides")} />
        <Button title={t("mobile.lessonViewer.backToLessons")} variant="secondary" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const currentSlide = slides[slideIdx];

  const readCurrentSlide = () => {
    if (!readAloudEnabled) return;
    speak(currentSlide.text, language);
  };

  const handleNext = () => {
    stopSpeaking();
    if (slideIdx < slides.length - 1) {
      if (!reportedSlidesRef.current.has(slideIdx)) {
        reportedSlidesRef.current.add(slideIdx);
        void track("ACTIVITY_COMPLETED", { slide_index: slideIdx, slide_type: currentSlide.slide_type });
      }
      setSlideIdx((i) => i + 1);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    stopSpeaking();
    if (slideIdx > 0) {
      setSlideIdx((i) => i - 1);
      setSelectedOption(null);
    }
  };

  const handleSelectOption = (idx) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const correct = idx === currentSlide.correct_option_index;
    void track("QUIZ_COMPLETED", { slide_index: slideIdx, selected_option_index: idx, correct });
    setMascotMood(correct ? "happy" : "encourage");
  };

  const handleFinish = async () => {
    await track("LESSON_COMPLETED");
    void flushLearningEvents(user.id);
    setMascotMood("celebrate");
    setState("completed");
  };

  if (state === "completed") {
    return (
      <Screen contentClassName="px-6 items-center justify-center" scroll={false}>
        <Mascot mood="celebrate" size={72} />
        <Text className="text-lg font-extrabold text-slate-900 mt-3">{t("mobile.lessonViewer.lessonFinished")}</Text>
        <Text className="text-sm text-slate-500 mt-2 text-center">"{lesson.chapter_title}"</Text>
        <View className="flex-row flex-wrap justify-center gap-3 mt-8">
          <Button title={t("mobile.lessonViewer.backToLessons")} variant="secondary" onPress={() => navigation.goBack()} />
          <Button title={t("mobile.lessonViewer.home")} onPress={() => navigation.getParent()?.navigate("HomeTab")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold overflow-hidden flex-shrink" numberOfLines={1}>
          {lesson.subject} • Ch. {lesson.chapter_number}
        </Text>
        <Mascot mood={mascotMood} size={32} />
      </View>

      {stale && (
        <View className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <Text className="text-xs text-amber-700">{t("mobile.lessonViewer.offlineBanner")}</Text>
        </View>
      )}

      <ProgressDots total={slides.length} current={slideIdx} />

      {currentSlide.slide_type === "check" ? (
        <CheckSlide
          slide={currentSlide}
          selectedOption={selectedOption}
          onSelect={handleSelectOption}
          onFinish={handleFinish}
          t={t}
        />
      ) : (
        <ContentSlide
          slide={currentSlide}
          slideNumber={slideIdx + 1}
          totalSlides={slides.length}
          onBack={slideIdx > 0 ? handleBack : undefined}
          onNext={handleNext}
          onReadAloud={readAloudEnabled ? readCurrentSlide : undefined}
          signLanguageAssist={signLanguageAssist}
          t={t}
        />
      )}
    </Screen>
  );
}

function ContentSlide({ slide, slideNumber, totalSlides, onBack, onNext, onReadAloud, signLanguageAssist, t }) {
  return (
    <View className="bg-white rounded-3xl border border-slate-200 p-6 items-center">
      <Text className="px-2 py-0.5 rounded bg-sky-50 text-sky-600 text-xs font-bold mb-4">
        {t("mobile.lessonViewer.slideLabel", { current: slideNumber, total: totalSlides })}
      </Text>

      {(slide.image_emoji || slide.image_asset_key) && (
        <View className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-200 items-center justify-center mb-4">
          <Text className="text-7xl">{slide.image_emoji || "🖼️"}</Text>
        </View>
      )}

      <Text className="text-base font-semibold text-slate-900 text-center leading-relaxed">{slide.text}</Text>

      {onReadAloud && (
        <Pressable onPress={onReadAloud} className="mt-4 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100">
          <Text className="text-sm">🔊</Text>
          <Text className="text-xs font-bold text-slate-600">{t("mobile.lessonViewer.readAloud")}</Text>
        </Pressable>
      )}

      <SignLanguageAvatar active={signLanguageAssist} text={slide.text} />

      <View className="flex-row items-center flex-wrap justify-center gap-3 mt-7">
        {onBack && <Button title={t("mobile.lessonViewer.back")} variant="secondary" onPress={onBack} />}
        <Button title={t("mobile.lessonViewer.next")} onPress={onNext} />
      </View>
    </View>
  );
}

function CheckSlide({ slide, selectedOption, onSelect, onFinish, t }) {
  const options = slide.options || [];
  const answered = selectedOption !== null;
  const wasCorrect = selectedOption === slide.correct_option_index;

  return (
    <View className="bg-white rounded-3xl border border-slate-200 p-5">
      <View className="flex-row items-center gap-2 mb-4">
        <Text>✨</Text>
        <Text className="text-xs font-bold text-slate-600">{t("mobile.lessonViewer.checkUnderstanding")}</Text>
      </View>

      {slide.image_emoji && (
        <View className="items-center mb-4">
          <Text className="text-6xl">{slide.image_emoji}</Text>
        </View>
      )}

      <Text className="text-base font-bold text-slate-900 text-center mb-4">{slide.text}</Text>

      <View className="gap-2.5">
        {options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrectOption = idx === slide.correct_option_index;
          let style = "border-slate-200 bg-white";
          if (answered && isCorrectOption) style = "border-emerald-500 bg-emerald-50";
          else if (answered && isSelected && !isCorrectOption) style = "border-rose-500 bg-rose-50";
          return (
            <Pressable
              key={idx}
              disabled={answered}
              onPress={() => onSelect(idx)}
              className={`px-4 py-3 rounded-xl border ${style}`}
            >
              <Text className="text-sm text-slate-800">{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View className={`mt-4 p-3.5 rounded-xl border ${wasCorrect ? "border-emerald-200 bg-emerald-50" : "border-sky-200 bg-sky-50"}`}>
          <Text className={`text-sm font-bold ${wasCorrect ? "text-emerald-700" : "text-sky-700"}`}>
            {wasCorrect ? t("mobile.lessonViewer.correct") : t("mobile.lessonViewer.incorrectExplanation")}
          </Text>
          {slide.explanation && <Text className="text-xs text-slate-600 mt-1">{slide.explanation}</Text>}
          <View className="items-center mt-3">
            <Button title={t("mobile.lessonViewer.finishLesson")} onPress={onFinish} />
          </View>
        </View>
      )}
    </View>
  );
}
