import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Mascot } from "../../components/Mascot";
import { useTranslation } from "../../context/LanguageContext";
import { startModuleQuiz, submitModuleQuiz } from "../../api/student";

function QuestionCard({ question, index, total, selected, onSelect, t }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <Text className="text-xs text-slate-400 mb-1.5">{t("mobile.assignments.questionLabel", { current: index + 1, total })}</Text>
      {question.image_emoji && (
        <View className="items-center mb-2">
          <Text className="text-5xl">{question.image_emoji}</Text>
        </View>
      )}
      <Text className="text-sm font-bold text-slate-900 mb-3">{question.question_text}</Text>
      <View className="gap-2">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          const emoji = question.option_emojis?.[idx];
          return (
            <Pressable
              key={idx}
              onPress={() => onSelect(idx)}
              className={`px-3.5 py-2.5 rounded-xl border flex-row items-center gap-2 ${isSelected ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"}`}
            >
              {emoji && <Text className="text-lg">{emoji}</Text>}
              <Text className="text-xs text-slate-800 flex-1">{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function GapQuizScreen({ route, navigation }) {
  const { gapId, subject, topicName } = route.params;
  const { t } = useTranslation();
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startModuleQuiz(gapId);
        if (!cancelled) setQuestions(res.questions);
      } catch (err) {
        if (!cancelled) setError(err.message || t("mobile.gapPractice.errorLoadQuiz"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapId]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setSubmitError(t("mobile.gapPractice.answerAllError"));
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ question_id: q.id, selected_option_index: answers[q.id] }));
      const res = await submitModuleQuiz(gapId, payload);
      setResult(res);
    } catch (err) {
      setSubmitError(err.message || t("mobile.gapPractice.errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <ErrorBanner message={error} />
      </Screen>
    );
  }

  if (questions === null) return <LoadingScreen label={t("mobile.gapPractice.loadingQuiz")} />;

  if (result) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <View className="bg-white rounded-3xl border border-slate-200 p-6 items-center mb-4">
          <Mascot mood={result.passed ? "celebrate" : "encourage"} size={48} />
          <Text className="text-base font-extrabold text-slate-900 mt-2">{t("mobile.gapPractice.resultTitle")}</Text>
          <Text className="text-sm font-semibold text-slate-600 mt-1 text-center">
            {result.passed ? t("mobile.gapPractice.resultPassed") : t("mobile.gapPractice.resultNotPassed")}
          </Text>
          <Text className="text-3xl font-extrabold text-sky-600 mt-3">
            {t("mobile.gapPractice.scoreLabel", {
              correct: result.correct_count,
              total: result.total_count,
              percent: Math.round(result.score_percent),
            })}
          </Text>
          <View className="flex-row gap-2 mt-3">
            {result.xp_awarded > 0 && (
              <Text className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                {t("mobile.gapPractice.xpEarned", { xp: result.xp_awarded })}
              </Text>
            )}
            {result.gap_resolved && (
              <Text className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                {t("mobile.gapPractice.resultPassed")}
              </Text>
            )}
          </View>
        </View>
        <Button title={t("mobile.gapPractice.backToProgress")} variant="secondary" onPress={() => navigation.navigate("ProgressMain")} />
      </Screen>
    );
  }

  if (questions.length === 0) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <EmptyState emoji="🎯" title={topicName} subtitle={t("mobile.gapPractice.noQuestions")} />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <Text className="text-xl font-extrabold text-slate-900 mb-1" numberOfLines={2}>{topicName}</Text>
      <Text className="text-xs text-slate-500 mb-4">{subject}</Text>

      <ErrorBanner message={submitError} />

      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          total={questions.length}
          selected={answers[q.id]}
          onSelect={(idx) => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
          t={t}
        />
      ))}

      <Button
        title={submitting ? t("mobile.gapPractice.submitting") : t("mobile.gapPractice.submitQuiz")}
        onPress={handleSubmit}
        loading={submitting}
        className="mt-2"
      />
    </Screen>
  );
}
