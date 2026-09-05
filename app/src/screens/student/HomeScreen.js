import React, { useEffect, useState, useCallback } from "react";
import { View, Text, RefreshControl, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { SyncBanner } from "../../components/SyncBanner";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { useStudentProgress } from "../../hooks/useStudentProgress";
import { getSubjectPriority, getGamificationSummary, claimRewardChest, getStudentAssignments } from "../../api/student";

function StatPill({ emoji, value, label }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-200 p-3.5 items-center">
      <Text className="text-xl">{emoji}</Text>
      <Text className="text-lg font-extrabold text-slate-900 mt-1">{value}</Text>
      <Text className="text-xs text-slate-500 font-medium text-center">{label}</Text>
    </View>
  );
}

function MasteryBar({ subject, t }) {
  const pct = Math.round((subject.avg_mastery || 0) * 100);
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs font-bold text-slate-700 flex-1 pr-2" numberOfLines={1}>
          {subject.subject}
        </Text>
        <Text className="text-xs font-semibold text-slate-600">{pct}%</Text>
      </View>
      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </View>
      {subject.gap_count > 0 && (
        <Text className="text-xs text-slate-400 mt-1">{t("mobile.home.gapsToClose", { count: subject.gap_count })}</Text>
      )}
    </View>
  );
}

function ChestCard({ t }) {
  const [summary, setSummary] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      setSummary(await getGamificationSummary());
    } catch {
      // non-blocking — widget just stays hidden if this fails
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await claimRewardChest();
      if (res.claimed) {
        setMessage(t("mobile.home.chestClaimed", { xp: res.xp_awarded, badge: res.badge }));
      }
      await load();
    } catch {
      // non-blocking
    } finally {
      setClaiming(false);
    }
  };

  if (!summary) return null;

  const { chest, total_xp } = summary;
  const pct = chest.required ? Math.round((chest.progress / chest.required) * 100) : 0;

  return (
    <Card className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-slate-800">{t("mobile.home.chestTitle")}</Text>
        <Text className="text-xs font-bold text-amber-600">{t("mobile.home.totalXp", { xp: total_xp })}</Text>
      </View>
      <View className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <View className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(pct, 4)}%` }} />
      </View>
      <Text className="text-xs text-slate-500 mb-3">
        {chest.unlockable
          ? t("mobile.home.chestUnlocked")
          : t("mobile.home.chestProgress", { progress: chest.progress, required: chest.required })}
      </Text>
      {chest.unlockable && (
        <Button
          title={claiming ? t("mobile.home.chestClaiming") : t("mobile.home.chestClaim")}
          onPress={handleClaim}
          loading={claiming}
        />
      )}
      {message && <Text className="text-xs text-emerald-600 font-semibold mt-2">{message}</Text>}
    </Card>
  );
}

function AssignmentsCard({ navigation, t }) {
  const [assignments, setAssignments] = useState(null);

  useEffect(() => {
    getStudentAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]));
  }, []);

  if (!assignments || assignments.length === 0) return null;

  return (
    <Pressable onPress={() => navigation.navigate("AssignmentsList")} className="mb-5">
      <Card className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-bold text-slate-800">{t("mobile.home.assignmentsCardTitle")}</Text>
          <Text className="text-xs text-slate-500 mt-0.5">{t("mobile.home.assignmentsPending", { count: assignments.length })}</Text>
        </View>
        <Text className="text-xs font-bold text-sky-600">{t("mobile.home.viewAll")}</Text>
      </Card>
    </Pressable>
  );
}

export default function StudentHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { progress, loading, stale, error, refresh } = useStudentProgress(user?.id);
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubjects = useCallback(async () => {
    try {
      setSubjects(await getSubjectPriority());
    } catch {
      // non-blocking — home still works from cached progress
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadSubjects()]);
    setRefreshing(false);
  };

  const continueModule = progress?.modules?.find((m) => m.status === "in_progress") || progress?.modules?.find((m) => m.status === "not_started");

  const goToContinue = () => {
    if (!continueModule) return;
    if (continueModule.current_lesson_id) {
      navigation.navigate("Learn", { screen: "LessonViewer", params: { lessonId: continueModule.current_lesson_id } });
    } else {
      navigation.navigate("Learn", { screen: "LearnList" });
    }
  };

  if (loading && !progress) return <LoadingScreen label={t("mobile.home.loading")} />;

  return (
    <Screen
      contentClassName="px-5 pt-4 pb-24"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="mb-5">
        <Text className="text-xs text-slate-500">{t("mobile.home.greeting")}</Text>
        <Text className="text-xl font-extrabold text-slate-900">{user?.full_name || "Scholar"} 👋</Text>
        {user?.class_number ? (
          <Text className="text-xs text-slate-400 mt-0.5">
            {t("mobile.home.classLabel", { class: user.class_number })}
            {user.section && user.section !== "SELF" ? ` • ${t("mobile.home.sectionLabel", { section: user.section })}` : ` • ${t("mobile.home.selfEnrolled")}`}
          </Text>
        ) : null}
      </View>

      <SyncBanner studentId={user?.id} />
      {error && !progress ? (
        <ErrorBanner message={error} />
      ) : stale ? (
        <View className="mb-4 px-3 py-2 rounded-xl bg-slate-100">
          <Text className="text-xs text-slate-500">{t("mobile.home.offlineBanner")}</Text>
        </View>
      ) : null}

      <View className="flex-row gap-3 mb-5">
        <StatPill emoji="📈" value={`${progress?.overall_percent ?? 0}%`} label={t("mobile.home.statProgress")} />
        <StatPill emoji="⭐" value={progress?.points ?? 0} label={t("mobile.home.statPoints")} />
        <StatPill emoji="🔥" value={progress?.current_streak ?? 0} label={t("mobile.home.statStreak")} />
      </View>

      {continueModule && (
        <Pressable onPress={goToContinue} className="mb-5">
          <Card className="bg-sky-600 border-sky-600">
            <Text className="text-xs font-bold uppercase tracking-wide text-sky-100">{t("mobile.home.continueLearning")}</Text>
            <Text className="text-base font-extrabold text-white mt-1">{continueModule.title}</Text>
            <Text className="text-xs text-sky-100 mt-1">
              {t("mobile.home.continueSummary", {
                completed: continueModule.completed_lessons,
                total: continueModule.total_lessons,
                percent: continueModule.progress_percent,
              })}
            </Text>
            {/* Tailwind color-opacity shorthand as a className is a known
                react-native-css-interop crash trigger on the New Architecture — see Card.js. */}
            <View style={{ backgroundColor: "rgba(7, 89, 133, 0.4)" }} className="h-2 rounded-full overflow-hidden mt-3">
              <View className="h-full bg-white rounded-full" style={{ width: `${Math.max(continueModule.progress_percent, 4)}%` }} />
            </View>
          </Card>
        </Pressable>
      )}

      <ChestCard t={t} />
      <AssignmentsCard navigation={navigation} t={t} />

      <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.home.whereYouStand")}</Text>
      <Card className="mb-5">
        {subjects.length === 0 ? (
          <Text className="text-xs text-slate-400">{t("mobile.home.noMasteryYet")}</Text>
        ) : (
          subjects.map((s) => <MasteryBar key={s.subject} subject={s} t={t} />)
        )}
      </Card>

      <Text className="text-sm font-bold text-slate-800 mb-3">{t("mobile.home.recentActivity")}</Text>
      <Card>
        {(progress?.recent_activity || []).length === 0 ? (
          <Text className="text-xs text-slate-400">{t("mobile.home.noActivityYet")}</Text>
        ) : (
          progress.recent_activity.slice(0, 5).map((a, i) => (
            <View key={i} className={`flex-row justify-between py-2 ${i > 0 ? "border-t border-slate-100" : ""}`}>
              <Text className="text-xs text-slate-600 flex-1 pr-2" numberOfLines={1}>{a.lesson_title || a.subject}</Text>
              <Text className="text-xs text-slate-400">{a.event_type.replace(/_/g, " ").toLowerCase()}</Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
