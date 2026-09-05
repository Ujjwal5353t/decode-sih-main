import React, { useCallback, useState } from "react";
import { View, Text, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner } from "../../components/Screen";
import { Card } from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { getStudentDetailedProgress, getStudentLeaderboard, getLearningModules } from "../../api/student";

function StatBox({ value, label }) {
  return (
    <View className="flex-1 items-center px-1">
      <Text className="text-lg font-extrabold text-slate-900">{value}</Text>
      <Text className="text-xs text-slate-500 text-center">{label}</Text>
    </View>
  );
}

const TREND_EMOJI = { improving: "📈", declining: "📉", stable: "➖", mastered: "🏆" };

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [modules, setModules] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [d, lb, mods] = await Promise.all([
        getStudentDetailedProgress(),
        getStudentLeaderboard().catch(() => null),
        getLearningModules().catch(() => []),
      ]);
      setDetail(d);
      setLeaderboard(lb);
      setModules(mods);
      setError(null);
    } catch (err) {
      setError(err.message || t("mobile.progress.errorFallback"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <Screen contentClassName="px-5 pt-4 pb-24" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text className="text-xl font-extrabold text-slate-900 mb-4">{t("mobile.progress.title")}</Text>
      <ErrorBanner message={error} />

      {detail && (
        <>
          <Card className="mb-4">
            <View className="flex-row flex-wrap">
              <StatBox value={`${detail.holistic_mastery_percent}%`} label={t("mobile.progress.overallMastery")} />
              <StatBox value={`${detail.curriculum_completion_percent}%`} label={t("mobile.progress.curriculum")} />
              <StatBox value={detail.points} label={t("mobile.progress.points")} />
              <StatBox value={`${detail.current_streak}🔥`} label={t("mobile.progress.streak")} />
            </View>
          </Card>

          <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.progress.bySubject")}</Text>
          {detail.subjects.map((s) => (
            <Card key={s.subject} className="mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-bold text-slate-900 flex-1 pr-2" numberOfLines={1}>{s.subject}</Text>
                <Text className="text-xs font-semibold text-slate-500">
                  {TREND_EMOJI[s.trend] || ""} {s.overall_mastery_percent}%
                </Text>
              </View>
              <View className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <View
                  className={`h-full rounded-full ${s.overall_mastery_percent >= 70 ? "bg-emerald-500" : s.overall_mastery_percent >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${Math.max(s.overall_mastery_percent, 4)}%` }}
                />
              </View>
              <Text className="text-xs text-slate-400">
                {t("mobile.progress.assessmentsSummary", { count: s.assessment_count, avg: s.average_score })}
                {s.lagging_topics_count > 0 ? ` • ${t("mobile.progress.laggingTopics", { count: s.lagging_topics_count })}` : ""}
              </Text>
            </Card>
          ))}

          {detail.diagnostic_gaps.length > 0 && (
            <>
              <Text className="text-sm font-bold text-slate-800 mb-3 mt-2">{t("mobile.progress.openGaps")}</Text>
              <Card className="mb-4">
                {detail.diagnostic_gaps.map((g, i) => (
                  <View key={g.topic_code} className={`flex-row justify-between py-2 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                    <Text className="text-xs text-slate-700 flex-1 pr-2" numberOfLines={1}>
                      {g.subject} · {g.topic_name}
                    </Text>
                    <Text className="text-xs font-bold text-amber-600">{t("mobile.progress.classLabel", { class: g.originating_class })}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}

      {modules && modules.length > 0 && (
        <>
          <Text className="text-sm font-bold text-slate-800 mb-1">{t("mobile.progress.practiceTitle")}</Text>
          <Text className="text-xs text-slate-400 mb-3">{t("mobile.progress.practiceSubtitle")}</Text>
          <Card className="mb-4">
            {modules.map((m, i) => (
              <Pressable
                key={m.gap_id}
                onPress={() => navigation.navigate("GapModule", { gapId: m.gap_id, module: m })}
                className={`flex-row items-center justify-between py-2.5 ${i > 0 ? "border-t border-slate-100" : ""}`}
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                    {m.subject} · {m.topic_name}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">{t("mobile.gapPractice.originClassLabel", { class: m.origin_class })}</Text>
                </View>
                <Text className="text-slate-400 text-base">▸</Text>
              </Pressable>
            ))}
          </Card>
        </>
      )}

      <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.progress.leaderboardTitle")}</Text>
      <Card>
        {!leaderboard || leaderboard.top_entries.length === 0 ? (
          <Text className="text-xs text-slate-400">{t("mobile.progress.leaderboardEmpty")}</Text>
        ) : (
          <>
            {leaderboard.top_entries.map((entry) => (
              <View
                key={entry.student_id}
                className={`flex-row items-center justify-between py-2 ${entry.unique_number === user?.unique_number ? "bg-sky-50 -mx-2 px-2 rounded-lg" : ""}`}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Text className="text-xs font-bold text-slate-500 w-8" numberOfLines={1}>#{entry.rank}</Text>
                  <Text className="text-xs font-semibold text-slate-700 flex-1" numberOfLines={1}>
                    {entry.full_name}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-sky-600">{entry.holistic_mastery_percent}%</Text>
              </View>
            ))}
            {leaderboard.my_entry && !leaderboard.top_entries.some((e) => e.student_id === leaderboard.my_entry.student_id) && (
              <View className="flex-row items-center justify-between py-2 mt-1 border-t border-slate-100 bg-sky-50 -mx-2 px-2 rounded-lg">
                <Text className="text-xs font-bold text-sky-700 flex-1">{t("mobile.progress.youRank", { rank: leaderboard.my_entry.rank })}</Text>
                <Text className="text-xs font-bold text-sky-600">{leaderboard.my_entry.holistic_mastery_percent}%</Text>
              </View>
            )}
          </>
        )}
      </Card>
    </Screen>
  );
}
