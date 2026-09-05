import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Button } from "../../components/Button";
import { Mascot } from "../../components/Mascot";
import { useTranslation } from "../../context/LanguageContext";
import { getAssignmentQuizForStudent, submitAssignmentQuiz } from "../../api/student";

function QuizQuestion({ question, index, total, selected, onSelect, revealed, t }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <Text className="text-xs text-slate-400 mb-1.5">{t("mobile.assignments.questionLabel", { current: index + 1, total })}</Text>
      <Text className="text-sm font-bold text-slate-900 mb-3">{question.question_text}</Text>
      <View className="gap-2">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          let style = "border-slate-200 bg-white";
          if (revealed) {
            if (idx === question.correct_option_index) style = "border-emerald-500 bg-emerald-50";
            else if (isSelected) style = "border-rose-500 bg-rose-50";
          } else if (isSelected) {
            style = "border-sky-500 bg-sky-50";
          }
          return (
            <Pressable
              key={idx}
              disabled={revealed}
              onPress={() => onSelect(idx)}
              className={`px-3.5 py-2.5 rounded-xl border ${style}`}
            >
              <Text className="text-xs text-slate-800">{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AssignmentQuizScreen({ route, navigation }) {
  const { assignmentId, title } = route.params;
  const { t } = useTranslation();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = await getAssignmentQuizForStudent(assignmentId);
        if (!cancelled) setQuiz(q);
      } catch (err) {
        if (!cancelled) setError(err.message || t("mobile.assignments.errorLoadQuiz"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      setSubmitError(t("mobile.assignments.answerAllError"));
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => ({
        question_id: q.id,
        question_text: q.question_text,
        selected_option_index: answers[q.id],
        correct_option_index: q.correct_option_index,
        chapter_title: q.chapter_title,
        explanation: q.explanation,
      }));
      const res = await submitAssignmentQuiz(assignmentId, payload);
      setResult(res);
    } catch (err) {
      setSubmitError(err.message || t("mobile.assignments.errorSubmit"));
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

  if (quiz === null) return <LoadingScreen label={t("mobile.assignments.loadingQuiz")} />;

  if (result) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <View className="bg-white rounded-3xl border border-slate-200 p-6 items-center mb-4">
          <Mascot mood={result.is_passed ? "celebrate" : "encourage"} size={48} />
          <Text className="text-base font-extrabold text-slate-900 mt-2 text-center">
            {result.is_passed ? t("mobile.assignments.resultPassed") : t("mobile.assignments.resultFailed")}
          </Text>
          <Text className="text-3xl font-extrabold text-sky-600 mt-2">
            {t("mobile.assignments.scoreLabel", { score: result.score, max: result.max_score, percent: Math.round(result.percentage) })}
          </Text>
        </View>
        {result.ai_feedback && (
          <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <Text className="text-sm font-bold text-slate-900 mb-1.5">{t("mobile.assignments.aiFeedbackTitle")}</Text>
            <Text className="text-xs text-slate-600 leading-relaxed">{result.ai_feedback}</Text>
          </View>
        )}
        {quiz.questions.map((q, i) => (
          <QuizQuestion key={q.id} question={q} index={i} total={quiz.questions.length} selected={answers[q.id]} onSelect={() => {}} revealed t={t} />
        ))}
        <Button title={t("mobile.assignments.backToAssignments")} variant="secondary" onPress={() => navigation.goBack()} className="mt-2" />
      </Screen>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <EmptyState emoji="📋" title={quiz.title} subtitle={t("mobile.assignments.noQuestions")} />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <Text className="text-xl font-extrabold text-slate-900 mb-1" numberOfLines={2}>{title || quiz.title}</Text>
      <Text className="text-xs text-slate-500 mb-4">{quiz.subject}</Text>

      <ErrorBanner message={submitError} />

      {quiz.questions.map((q, i) => (
        <QuizQuestion
          key={q.id}
          question={q}
          index={i}
          total={quiz.questions.length}
          selected={answers[q.id]}
          onSelect={(idx) => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
          revealed={false}
          t={t}
        />
      ))}

      <Button
        title={submitting ? t("mobile.assignments.submitting") : t("mobile.assignments.submitQuiz")}
        onPress={handleSubmit}
        loading={submitting}
        className="mt-2"
      />
    </Screen>
  );
}
