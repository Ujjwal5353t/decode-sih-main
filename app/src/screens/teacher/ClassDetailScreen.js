import React, { useCallback, useState } from "react";
import { View, Text, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useTranslation } from "../../context/LanguageContext";
import { getClassLearningProgress, getTeacherClassLeaderboard, getTeacherStudentDetailedProgress } from "../../api/teacher";

const TREND_EMOJI = { improving: "📈", declining: "📉", stable: "➖", mastered: "🏅" };

function StudentDetailPanel({ studentUniqueNumber, subject }) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setDetail(null);
      setError(null);
      getTeacherStudentDetailedProgress(studentUniqueNumber, subject)
        .then((d) => {
          if (!cancelled) setDetail(d);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || t("teacherDashboard.mobile.classDetail.detailLoadError"));
        });
      return () => {
        cancelled = true;
      };
    }, [studentUniqueNumber, subject, t])
  );

  if (error) {
    return <Text className="text-xs text-rose-500 mt-2">{error}</Text>;
  }
  if (!detail) {
    return <Text className="text-xs text-slate-400 mt-2">{t("teacherDashboard.mobile.classDetail.loadingDetail")}</Text>;
  }

  const gapsCount = detail.diagnostic_gaps?.length ?? 0;

  return (
    <View className="mt-3 pt-3 border-t border-slate-100">
      <View className="flex-row flex-wrap gap-2 mb-2">
        <View className="bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[45%]">
          <Text className="text-xs text-slate-400">{t("teacherDashboard.mobile.classDetail.holisticMastery")}</Text>
          <Text className="text-sm font-extrabold text-sky-600">{detail.holistic_mastery_percent}%</Text>
        </View>
        <View className="bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[45%]">
          <Text className="text-xs text-slate-400">{t("teacherDashboard.mobile.classDetail.curriculumCompletion")}</Text>
          <Text className="text-sm font-extrabold text-slate-900">{detail.curriculum_completion_percent}%</Text>
        </View>
        <View className="bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[45%]">
          <Text className="text-xs text-slate-400">{t("teacherDashboard.mobile.classDetail.avgTestScore")}</Text>
          <Text className="text-sm font-extrabold text-slate-900">{Math.round(detail.average_test_score)}%</Text>
        </View>
        <View className="bg-slate-50 rounded-xl px-3 py-2 flex-1 min-w-[45%]">
          <Text className="text-xs text-slate-400">{t("teacherDashboard.mobile.classDetail.trend")}</Text>
          <Text className="text-sm font-extrabold text-slate-900">
            {TREND_EMOJI[detail.consecutive_trend] || ""} {detail.consecutive_trend}
          </Text>
        </View>
      </View>
      <Text className="text-xs text-slate-500">
        {t("teacherDashboard.mobile.classDetail.assessmentsPassed", {
          passed: detail.assessments_passed,
          total: detail.total_assessments_taken,
        })}
        {detail.assessments_lagging > 0 ? ` • ${t("teacherDashboard.mobile.classDetail.lagging", { count: detail.assessments_lagging })}` : ""}
      </Text>
      {gapsCount > 0 && (
        <Text className="text-xs text-amber-600 mt-1">
          {t("teacherDashboard.mobile.classDetail.diagnosticGaps", { count: gapsCount })}
        </Text>
      )}
    </View>
  );
}

export default function ClassDetailScreen({ route }) {
  const { t } = useTranslation();
  const { classNumber, section, subject, label } = route.params;
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, lb] = await Promise.all([
        getClassLearningProgress(classNumber, section, subject),
        getTeacherClassLeaderboard(classNumber, section).catch(() => null),
      ]);
      setProgress(p);
      setLeaderboard(lb);
      setError(null);
    } catch (err) {
      setError(err.message || t("teacherDashboard.mobile.classDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [classNumber, section, subject, t]);

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

  if (loading) return <LoadingScreen label={t("teacherDashboard.mobile.classDetail.loading")} />;

  // Hard failure — no progress data at all. Lead with the error, not a
  // "no students" empty state that would misrepresent a network/API failure.
  if (error && progress === null) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <Text className="text-xl font-extrabold text-slate-900 mb-1" numberOfLines={2}>
          {label}
        </Text>
        <ErrorBanner message={error} />
        <Button title={t("actions.retry")} variant="outline" onPress={load} />
      </Screen>
    );
  }

  const students = progress?.students || [];

  return (
    <Screen contentClassName="px-5 pt-4 pb-24" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text className="text-xl font-extrabold text-slate-900" numberOfLines={2}>
        {label}
      </Text>
      <Text className="text-xs text-slate-400 mb-4">
        {t("teacherDashboard.mobile.classDetail.studentCount", { count: students.length })}
      </Text>

      <ErrorBanner message={error} />

      {students.length === 0 ? (
        <EmptyState emoji="🧑‍🎓" title={t("teacherDashboard.noStudentsEnrolled")} />
      ) : (
        students
          .slice()
          .sort((a, b) => b.overall_percent - a.overall_percent)
          .map((s) => {
            const expanded = expandedId === s.student_id;
            return (
              <Pressable key={s.student_id} onPress={() => setExpandedId(expanded ? null : s.student_id)}>
                <Card className="mb-2.5">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-sm font-bold text-slate-900 flex-1 pr-2" numberOfLines={1}>
                      {s.full_name}
                    </Text>
                    <Text className="text-xs font-bold text-sky-600">{s.overall_percent}%</Text>
                  </View>
                  <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <View className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.max(s.overall_percent, 3)}%` }} />
                  </View>
                  <Text className="text-xs text-slate-400" numberOfLines={1}>
                    {s.unique_number} • {t("teacherDashboard.mobile.classDetail.done", { count: s.modules_completed })} • {t("teacherDashboard.mobile.classDetail.inProgress", { count: s.modules_in_progress })}
                    {s.current_streak ? ` • 🔥 ${s.current_streak}` : ""}
                  </Text>
                  {expanded && <StudentDetailPanel studentUniqueNumber={s.unique_number} subject={subject} />}
                </Card>
              </Pressable>
            );
          })
      )}

      {leaderboard && leaderboard.top_entries.length > 0 && (
        <>
          <Text className="text-sm font-bold text-slate-800 mb-3 mt-4">🏆 {t("teacherDashboard.mobile.classDetail.leaderboard")}</Text>
          <Card>
            {leaderboard.top_entries.slice(0, 10).map((entry) => (
              <View key={entry.student_id} className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <Text className="text-xs font-bold text-slate-500 w-8" numberOfLines={1}>
                    #{entry.rank}
                  </Text>
                  <Text className="text-xs font-semibold text-slate-700 flex-1" numberOfLines={1}>
                    {entry.full_name}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-sky-600">{entry.holistic_mastery_percent}%</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
