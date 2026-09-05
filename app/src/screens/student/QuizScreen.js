import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen, LoadingScreen, ErrorBanner } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Mascot } from "../../components/Mascot";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { usePreferences } from "../../context/PreferencesContext";
import { startQuiz, answerQuiz, getQuizResult, getQuizStatus } from "../../api/student";
import { speak } from "../../speech/speech";

const ALL_SUBJECTS = ["Mathematics", "English", "Hindi", "EVS"];
const POINTS_PER_CORRECT = 10;

export default function QuizScreen() {
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const { readAloudEnabled } = usePreferences();

  const [stage, setStage] = useState("checking");
  const evsAvailable = (user?.class_number || 0) >= 3;
  const [selectedSubjects, setSelectedSubjects] = useState(ALL_SUBJECTS.filter((s) => s !== "EVS" || evsAvailable));
  const [attemptId, setAttemptId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mascotMood, setMascotMood] = useState("dance");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (mascotMood === "dance") return;
    const t = setTimeout(() => setMascotMood("dance"), 1500);
    return () => clearTimeout(t);
  }, [mascotMood]);

  const finishWithResult = async (id) => {
    try {
      const result = await getQuizResult(id);
      setAttemptId(id);
      setReport(result);
      setStage("finished");
    } catch (err) {
      setError(err.message || t("mobile.quiz.errorResult"));
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getQuizStatus();
        if (cancelled) return;
        if (status.completed && status.attempt_id) {
          await finishWithResult(status.attempt_id);
        } else if (status.in_progress_attempt_id) {
          const res = await startQuiz(selectedSubjects.length ? { subjects: selectedSubjects } : undefined);
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
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t("mobile.quiz.errorStatus"));
          setStage("idle");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== "finished" || !attemptId || report?.ai_summary_status !== "pending") return;
    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const updated = await getQuizResult(attemptId);
        if (cancelled) return;
        if (updated.ai_summary_status !== "pending" || attempts >= 20) {
          setReport(updated);
          clearInterval(interval);
        }
      } catch {
        // keep polling until the cap above
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage, attemptId, report?.ai_summary_status]);

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) => (prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]));
  };

  const handleStart = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await startQuiz(selectedSubjects.length ? { subjects: selectedSubjects } : undefined);
      setAttemptId(res.attempt_id);
      if (res.question) {
        setQuestion(res.question);
        setQuestionCount(1);
        setStage("in_progress");
      } else {
        await finishWithResult(res.attempt_id);
      }
    } catch (err) {
      setError(err.message || t("mobile.quiz.errorStart"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (optionIndex) => {
    if (!attemptId || !question || submitting || feedback) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await answerQuiz(attemptId, { question_id: question.id, selected_option_index: optionIndex });
      setFeedback({ index: optionIndex, correct: res.was_correct });

      if (res.was_correct) {
        const nextStreak = streak + 1;
        setPoints((p) => p + POINTS_PER_CORRECT);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setMascotMood(res.finished ? "celebrate" : "happy");
      } else {
        setStreak(0);
        setMascotMood("encourage");
      }

      await new Promise((r) => setTimeout(r, res.was_correct ? 500 : 750));

      if (res.finished || !res.next_question) {
        await finishWithResult(attemptId);
      } else {
        setFeedback(null);
        setQuestion(res.next_question);
        setQuestionCount((c) => c + 1);
      }
    } catch (err) {
      setError(err.message || t("mobile.quiz.errorAnswer"));
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "checking") return <LoadingScreen label={t("mobile.quiz.checking")} />;

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-extrabold text-slate-900">{t("mobile.quiz.title")}</Text>
        <Mascot mood={mascotMood} size={32} />
      </View>

      <ErrorBanner message={error} />

      {stage === "idle" && (
        <View className="bg-white rounded-3xl border border-slate-200 p-5">
          <Text className="text-sm font-bold text-slate-900">{t("mobile.quiz.introTitle")}</Text>
          <Text className="text-xs text-slate-500 mt-1">{t("mobile.quiz.introSubtitle")}</Text>
          <Text className="text-xs font-semibold text-slate-600 mt-4 mb-2">{t("mobile.quiz.subjectsLabel")}</Text>
          <View className="flex-row flex-wrap gap-2">
            {ALL_SUBJECTS.map((subject) => {
              const disabled = subject === "EVS" && !evsAvailable;
              const selected = selectedSubjects.includes(subject);
              return (
                <Pressable
                  key={subject}
                  disabled={disabled}
                  onPress={() => toggleSubject(subject)}
                  // `opacity-N` toggled via className (rather than inline style) is a
                  // known react-native-css-interop crash trigger on the New
                  // Architecture — https://github.com/nativewind/nativewind/issues/1536.
                  style={disabled ? { opacity: 0.4 } : undefined}
                  className={`px-3.5 py-1.5 rounded-full border ${selected ? "bg-sky-600 border-sky-600" : "bg-white border-slate-200"}`}
                >
                  <Text className={`text-xs font-bold ${selected ? "text-white" : "text-slate-600"}`}>{subject}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            title={submitting ? t("mobile.quiz.starting") : t("mobile.quiz.start")}
            onPress={handleStart}
            loading={submitting}
            disabled={selectedSubjects.length === 0}
            className="mt-5"
          />
        </View>
      )}

      {stage === "in_progress" && question && (
        <QuestionCard
          question={question}
          questionCount={questionCount}
          subjectsInScope={selectedSubjects}
          submitting={submitting}
          feedback={feedback}
          onAnswer={handleAnswer}
          points={points}
          streak={streak}
          readAloud={readAloudEnabled ? () => speak(question.question_text, language) : null}
          t={t}
        />
      )}

      {stage === "finished" && report && (
        <GapReportView report={report} points={points} bestStreak={bestStreak} t={t} />
      )}
    </Screen>
  );
}

function QuestionCard({ question, questionCount, subjectsInScope, submitting, feedback, onAnswer, points, streak, readAloud, t }) {
  const subjectPosition = subjectsInScope.indexOf(question.subject) + 1;
  return (
    <View className="bg-white rounded-3xl border border-slate-200 p-5">
      <View className="flex-row items-center justify-between mb-2 flex-wrap gap-1">
        <Text className="text-xs text-slate-400">
          {question.subject} ({subjectPosition}/{subjectsInScope.length}) • Q{questionCount}
        </Text>
        <View className="flex-row gap-2">
          <Text className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⭐ {points}</Text>
          {streak >= 2 && <Text className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">🔥 {streak}</Text>}
        </View>
      </View>

      {question.image_emoji && (
        <View className="items-center mb-3">
          <Text className="text-6xl">{question.image_emoji}</Text>
        </View>
      )}

      <View className="flex-row items-start gap-2">
        <Text className="text-base font-bold text-slate-900 flex-1">{question.question_text}</Text>
        {readAloud && (
          <Pressable onPress={readAloud} className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
            <Text>🔊</Text>
          </Pressable>
        )}
      </View>

      {feedback && (
        <View className={`mt-3 self-start px-3 py-1.5 rounded-full ${feedback.correct ? "bg-emerald-50" : "bg-amber-50"}`}>
          <Text className={`text-xs font-bold ${feedback.correct ? "text-emerald-700" : "text-amber-700"}`}>
            {feedback.correct ? t("mobile.quiz.correctFeedback", { points: POINTS_PER_CORRECT }) : t("mobile.quiz.incorrectFeedback")}
          </Text>
        </View>
      )}

      <View className="mt-4 gap-2.5">
        {question.options.map((option, idx) => {
          const isSelected = feedback?.index === idx;
          const showCorrect = isSelected && feedback?.correct;
          const showWrong = isSelected && feedback ? !feedback.correct : false;
          let colorClass = "border-slate-200 bg-white";
          if (showCorrect) colorClass = "border-emerald-500 bg-emerald-50";
          else if (showWrong) colorClass = "border-rose-500 bg-rose-50";
          const emoji = question.option_emojis?.[idx];
          const dimmed = feedback && !isSelected;
          return (
            <Pressable
              key={idx}
              disabled={submitting || feedback !== null}
              onPress={() => onAnswer(idx)}
              // `opacity-N` toggled via className (rather than inline style) is a
              // known react-native-css-interop crash trigger on the New
              // Architecture — https://github.com/nativewind/nativewind/issues/1536.
              style={dimmed ? { opacity: 0.4 } : undefined}
              className={`px-4 py-3 rounded-xl border flex-row items-center gap-2 ${colorClass}`}
            >
              {emoji && <Text className="text-2xl">{emoji}</Text>}
              <Text className="text-sm text-slate-800 flex-1">{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GapReportView({ report, points, bestStreak, t }) {
  const gapsBySubject = {};
  for (const subject of report.subjects_covered) {
    gapsBySubject[subject] = report.gaps.filter((g) => g.subject === subject);
  }

  return (
    <View className="gap-4">
      <View className="bg-white rounded-3xl border border-slate-200 p-6 items-center">
        <Mascot mood="celebrate" size={56} />
        <Text className="text-lg font-extrabold text-slate-900 mt-2">{t("mobile.quiz.resultsTitle")}</Text>
        {report.overall_score !== null && (
          <View className="flex-row items-baseline gap-1.5 mt-2">
            <Text className="text-4xl font-extrabold text-sky-600">{report.overall_score}%</Text>
            <Text className="text-xs text-slate-400">{t("mobile.quiz.overallMastery")}</Text>
          </View>
        )}
        <View className="flex-row gap-2 mt-3 flex-wrap justify-center">
          <Text className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            {t("mobile.quiz.xpEarned", { xp: report.xp_awarded })}
          </Text>
          <Text className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            {t("mobile.quiz.correctCount", { correct: report.correct_count, total: report.total_questions })}
          </Text>
        </View>
        <View className="flex-row gap-2 mt-2">
          <Text className="text-xs font-bold text-amber-500">{t("mobile.quiz.pointsLabel", { points })}</Text>
          {bestStreak >= 2 && <Text className="text-xs font-bold text-orange-500">{t("mobile.quiz.streakLabel", { streak: bestStreak })}</Text>}
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4">
        <Text className="text-sm font-bold text-slate-900 mb-1.5">{t("mobile.quiz.recommendedFocus")}</Text>
        {report.ai_summary_status === "ready" && report.ai_summary ? (
          <Text className="text-xs text-slate-600 leading-relaxed">{report.ai_summary}</Text>
        ) : report.ai_summary_status === "failed" ? (
          <Text className="text-xs text-slate-400 italic">{t("mobile.quiz.summaryFailed")}</Text>
        ) : (
          <Text className="text-xs text-slate-400">{t("mobile.quiz.summaryPending")}</Text>
        )}
      </View>

      {report.subjects_covered.map((subject) => {
        const gaps = gapsBySubject[subject] || [];
        const subjectScore = report.subject_scores[subject];
        return (
          <View key={subject} className="bg-white rounded-2xl border border-slate-200 p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm font-bold text-slate-900">{subject}</Text>
              {subjectScore && <Text className="text-xs font-bold text-slate-500">{subjectScore.score}%</Text>}
            </View>
            {gaps.length === 0 ? (
              <Text className="text-xs text-slate-500">{t("mobile.quiz.noGaps")}</Text>
            ) : (
              gaps.map((gap) => (
                <View key={gap.topic_code} className="flex-row justify-between items-center bg-slate-50 rounded-lg px-3 py-2 mb-1.5">
                  <Text className="text-xs font-medium text-slate-700 flex-1 pr-2" numberOfLines={2}>{gap.topic_name}</Text>
                  <Text className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {t("mobile.quiz.classLabel", { class: gap.originating_class })}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}
