import React, { useCallback, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Button } from "../../components/Button";
import { useTranslation } from "../../context/LanguageContext";
import { getStudentAssignments, getStudentTestResults } from "../../api/student";

function deadlineLabel(deadlineAt, t) {
  if (!deadlineAt) return null;
  const diffMs = new Date(deadlineAt).getTime() - Date.now();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days < 0) return { text: t("mobile.assignments.deadlineOverdue"), overdue: true };
  if (days === 0) return { text: t("mobile.assignments.deadlineToday"), overdue: false };
  return { text: t("mobile.assignments.deadlineDays", { days }), overdue: false };
}

function AssignmentCard({ assignment, result, onPress, t }) {
  const submission = result?.submission;
  const deadline = deadlineLabel(assignment.deadline_at, t);
  const isAiQuiz = assignment.assignment_type === "ai_quiz";

  let statusText = t("mobile.assignments.statusNotStarted");
  let statusClass = "text-slate-400 bg-slate-50";
  if (submission?.percentage != null) {
    if (submission.is_passed) {
      statusText = t("mobile.assignments.statusPassed", { percent: Math.round(submission.percentage) });
      statusClass = "text-emerald-700 bg-emerald-50";
    } else {
      statusText = t("mobile.assignments.statusFailed", { percent: Math.round(submission.percentage) });
      statusClass = "text-amber-700 bg-amber-50";
    }
  }

  return (
    <Pressable
      onPress={() => isAiQuiz && !assignment.is_locked && onPress()}
      disabled={!isAiQuiz || assignment.is_locked}
      // `opacity-N` toggled via className (rather than inline style) is a known
      // react-native-css-interop crash trigger on the New Architecture — see Card.js.
      style={!isAiQuiz || assignment.is_locked ? { opacity: 0.6 } : undefined}
      className="bg-white rounded-2xl border border-slate-200 p-4 mb-3"
    >
      <View className="flex-row items-start justify-between mb-1.5">
        <Text className="text-sm font-bold text-slate-900 flex-1 pr-2" numberOfLines={2}>
          {assignment.title}
        </Text>
        {assignment.is_locked && (
          <Text className="text-xs font-bold text-slate-400">{t("mobile.assignments.locked")}</Text>
        )}
      </View>
      <Text className="text-xs text-slate-400 mb-2" numberOfLines={1}>
        {isAiQuiz ? t("mobile.assignments.typeAiQuiz") : t("mobile.assignments.typePdfUpload")}
        {assignment.subject ? ` • ${assignment.subject}` : ""}
      </Text>
      <View className="flex-row items-center justify-between flex-wrap gap-1.5">
        <Text className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusClass}`}>{statusText}</Text>
        {deadline && (
          <Text className={`text-xs font-semibold ${deadline.overdue ? "text-rose-500" : "text-slate-400"}`}>
            {deadline.text}
          </Text>
        )}
      </View>
      {!isAiQuiz && <Text className="text-xs text-slate-400 mt-2 italic">{t("mobile.assignments.pdfUploadNote")}</Text>}
    </Pressable>
  );
}

export default function AssignmentsListScreen({ navigation }) {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState(null);
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, testResults] = await Promise.all([getStudentAssignments(), getStudentTestResults().catch(() => [])]);
      const byId = {};
      for (const r of testResults) byId[r.assignment.id] = r;
      setAssignments(list);
      setResults(byId);
      setError(null);
    } catch (err) {
      setError(err.message || t("mobile.assignments.errorFallback"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (assignments === null && !error) return <LoadingScreen label={t("mobile.assignments.loading")} />;

  return (
    <Screen contentClassName="px-5 pt-4 pb-24" scroll={false}>
      <Text className="text-xl font-extrabold text-slate-900 mb-4">{t("mobile.assignments.title")}</Text>
      <ErrorBanner message={error} />

      {assignments === null ? (
        <Button title={t("actions.retry")} variant="outline" onPress={load} />
      ) : assignments.length === 0 ? (
        <EmptyState emoji="📋" title={t("mobile.assignments.emptyTitle")} subtitle={t("mobile.assignments.emptySubtitle")} />
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(a) => a.id}
          // Screen's own pb-24 lands on the non-scrolling wrapper View here (scroll={false}),
          // not on the FlatList's scrollable content — so the list needs its own matching
          // bottom padding to clear the bottom tab bar.
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item }) => (
            <AssignmentCard
              assignment={item}
              result={results[item.id]}
              t={t}
              onPress={() => navigation.navigate("AssignmentQuiz", { assignmentId: item.id, title: item.title })}
            />
          )}
        />
      )}
    </Screen>
  );
}
