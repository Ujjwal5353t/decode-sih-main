import React, { useCallback, useState } from "react";
import { View, Text, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner } from "../../components/Screen";
import { Card } from "../../components/Card";
import { useTranslation } from "../../context/LanguageContext";
import {
  getChildDetailedProgress,
  getChildQuizResult,
  getParentChildLeaderboard,
  getChildTestResults,
} from "../../api/parent";

const TREND_EMOJI = { improving: "📈", declining: "📉", stable: "➖", mastered: "🏆" };

export default function ChildDetailScreen({ route }) {
  const { studentUniqueNumber, fullName } = route.params;
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, q, lb, tr] = await Promise.all([
        getChildDetailedProgress(studentUniqueNumber),
        getChildQuizResult(studentUniqueNumber).catch(() => null),
        getParentChildLeaderboard(studentUniqueNumber).catch(() => null),
        getChildTestResults(studentUniqueNumber).catch(() => []),
      ]);
      setDetail(d);
      setQuizResult(q);
      setLeaderboard(lb);
      setTestResults(tr || []);
      setError(null);
    } catch (err) {
      setError(err.message || t("mobile.childDetail.failedLoadProgress"));
    } finally {
      setLoading(false);
    }
  }, [studentUniqueNumber, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen label={t("mobile.progress.loading")} />;

  const ownEntryOutsideTop = leaderboard?.my_entry && !leaderboard.top_entries.some((e) => e.student_id === leaderboard.my_entry.student_id);

  return (
    <Screen contentClassName="px-5 pt-4 pb-24" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text className="text-xl font-extrabold text-slate-900 mb-4" numberOfLines={2}>
        {fullName || detail?.full_name}
      </Text>
      <ErrorBanner message={error} />

      {detail && (
        <>
          <Card className="mb-4">
            <View className="flex-row flex-wrap">
              <View className="w-1/4 items-center mb-1">
                <Text className="text-lg font-extrabold text-slate-900">{detail.holistic_mastery_percent}%</Text>
                <Text className="text-xs text-slate-500 text-center">{t("mobile.progress.overallMastery")}</Text>
              </View>
              <View className="w-1/4 items-center mb-1">
                <Text className="text-lg font-extrabold text-slate-900">{detail.curriculum_completion_percent}%</Text>
                <Text className="text-xs text-slate-500 text-center">{t("mobile.progress.curriculum")}</Text>
              </View>
              <View className="w-1/4 items-center mb-1">
                <Text className="text-lg font-extrabold text-slate-900">{detail.points}</Text>
                <Text className="text-xs text-slate-500 text-center">{t("mobile.progress.points")}</Text>
              </View>
              <View className="w-1/4 items-center mb-1">
                <Text className="text-lg font-extrabold text-slate-900">{detail.current_streak}🔥</Text>
                <Text className="text-xs text-slate-500 text-center">{t("mobile.progress.streak")}</Text>
              </View>
            </View>
          </Card>

          <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.progress.bySubject")}</Text>
          {detail.subjects.map((s) => (
            <Card key={s.subject} className="mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                  {s.subject}
                </Text>
                <Text className="text-xs font-semibold text-slate-500">
                  {TREND_EMOJI[s.trend] || ""} {s.overall_mastery_percent}%
                </Text>
              </View>
              <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${s.overall_mastery_percent >= 70 ? "bg-emerald-500" : s.overall_mastery_percent >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${Math.max(s.overall_mastery_percent, 4)}%` }}
                />
              </View>
              <View className="flex-row justify-between items-center mt-2 flex-wrap gap-1">
                <Text className="text-xs text-slate-500">
                  {t("mobile.progress.assessmentsSummary", { count: s.assessment_count, avg: s.average_score })}
                </Text>
                {s.lagging_topics_count > 0 && (
                  <Text className="text-xs font-bold text-rose-500">
                    {t("mobile.progress.laggingTopics", { count: s.lagging_topics_count })}
                  </Text>
                )}
              </View>
            </Card>
          ))}

          {detail.diagnostic_gaps.length > 0 && (
            <>
              <Text className="text-sm font-bold text-slate-800 mb-3 mt-2">{t("mobile.progress.openGaps")}</Text>
              <Card className="mb-4">
                {detail.diagnostic_gaps.map((g, i) => (
                  <View key={g.topic_code} className={`flex-row justify-between items-center py-2 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                    <Text className="text-xs text-slate-700 flex-1 mr-2" numberOfLines={2}>
                      {g.subject} · {g.topic_name}
                    </Text>
                    <Text className="text-xs font-bold text-amber-600">
                      {t("mobile.progress.classLabel", { class: g.originating_class })}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          {detail.modules?.length > 0 && (
            <>
              <Text className="text-sm font-bold text-slate-800 mb-3 mt-2">{t("parentDashboard.curriculumLessons")}</Text>
              <Card className="mb-4">
                {detail.modules.map((m, i) => (
                  <View key={m.module_key} className={`py-2 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-semibold text-slate-800 flex-1 mr-2" numberOfLines={1}>
                        {m.title}
                      </Text>
                      <Text className="text-xs font-bold text-slate-500">{m.progress_percent}%</Text>
                    </View>
                    <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                      {m.subject} · {t("learningProgress.lessonsDone", { done: m.completed_lessons, total: m.total_lessons })}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}

      {quizResult && (
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-1.5 flex-wrap gap-1">
            <Text className="text-sm font-bold text-slate-900">{t("mobile.childDetail.diagnosticSummary")}</Text>
            {quizResult.overall_score != null && (
              <Text className="text-xs font-bold text-sky-600">
                {Math.round(quizResult.overall_score)}% {t("parentDashboard.overallScore")}
              </Text>
            )}
          </View>
          <Text className={`text-xs font-semibold mb-1.5 ${quizResult.gaps?.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {quizResult.gaps?.length > 0
              ? t("mobile.childDetail.gapsFound", { count: quizResult.gaps.length })
              : t("parentDashboard.noGapsFound")}
          </Text>
          <Text className="text-xs text-slate-600 leading-relaxed">
            {quizResult.ai_summary || t("parentDashboard.summaryGenerating")}
          </Text>
        </Card>
      )}

      {testResults.length > 0 && (
        <>
          <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.childDetail.testResults")}</Text>
          {testResults.map((r) => {
            const attempts = r.attempts || [];
            const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;
            const percent = latest?.percentage ?? r.submission?.percentage ?? null;
            const passed = latest?.is_passed ?? r.submission?.is_passed ?? null;
            return (
              <Card key={r.assignment.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                    {r.assignment.title}
                  </Text>
                  {percent != null && (
                    <Text className={`text-xs font-bold ${passed === false ? "text-rose-600" : "text-emerald-600"}`}>
                      {Math.round(percent)}%
                    </Text>
                  )}
                </View>
                <Text className="text-xs text-slate-400" numberOfLines={1}>
                  {r.assignment.subject || "—"} ·{" "}
                  {r.assignment.assignment_type === "ai_quiz"
                    ? t("mobile.childDetail.aiQuiz")
                    : t("mobile.childDetail.pdfAssignment")}
                </Text>
                {r.teacher_feedback?.feedback_text && (
                  <Text className="text-xs text-sky-700 mt-1.5 italic">"{r.teacher_feedback.feedback_text}"</Text>
                )}
              </Card>
            );
          })}
        </>
      )}

      {leaderboard && (leaderboard.top_entries.length > 0 || leaderboard.my_entry) && (
        <>
          <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.progress.leaderboardTitle")}</Text>
          <Card>
            {leaderboard.top_entries.map((entry) => (
              <View
                key={entry.student_id}
                className={`flex-row items-center justify-between py-2 ${entry.unique_number === studentUniqueNumber ? "bg-sky-50 -mx-2 px-2 rounded-lg" : ""}`}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-xs font-bold text-slate-400 w-8" numberOfLines={1}>#{entry.rank}</Text>
                  <Text className="text-xs font-semibold text-slate-700 flex-1" numberOfLines={1}>
                    {entry.full_name}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-sky-600">{entry.holistic_mastery_percent}%</Text>
              </View>
            ))}
            {ownEntryOutsideTop && (
              <View className="flex-row items-center justify-between py-2 mt-1 pt-2.5 border-t border-dashed border-slate-200 bg-sky-50 -mx-2 px-2 rounded-lg">
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-xs font-bold text-slate-400 w-8" numberOfLines={1}>#{leaderboard.my_entry.rank}</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-700" numberOfLines={1}>
                      {leaderboard.my_entry.full_name}
                    </Text>
                    <Text className="text-xs font-bold text-sky-500 uppercase tracking-wide">
                      {t("mobile.childDetail.childRank")}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs font-bold text-sky-600">{leaderboard.my_entry.holistic_mastery_percent}%</Text>
              </View>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
