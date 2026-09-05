import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { loadLessons, loadStudentProgress } from "../../offline/contentCache";
import { applyPendingEvents, getQueuedEvents } from "../../offline/learningEvents";

const SUBJECTS = ["All", "Mathematics", "English", "Hindi", "EVS"];

export default function LearnListScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState(null);
  const [stale, setStale] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());

  const loadCompleted = useCallback(async () => {
    try {
      const [progressResult, pending] = await Promise.all([
        loadStudentProgress(user.id).catch(() => null),
        getQueuedEvents(user.id).catch(() => []),
      ]);
      if (!progressResult) return;
      const projected = applyPendingEvents(progressResult.data, pending);
      const ids = new Set();
      for (const m of projected.modules) for (const lid of m.completed_lesson_ids) ids.add(lid);
      setCompletedIds(ids);
    } catch {
      // non-blocking
    }
  }, [user.id]);

  // Refresh completion state every time this list regains focus — e.g. after
  // finishing a lesson and navigating back — not just on first mount.
  useFocusEffect(
    useCallback(() => {
      loadCompleted();
    }, [loadCompleted])
  );

  useEffect(() => {
    let cancelled = false;
    setLessons(null);
    setError(null);
    (async () => {
      try {
        const subject = subjectFilter === "All" ? undefined : subjectFilter;
        const result = await loadLessons(user.id, subject, user.class_number || undefined);
        if (!cancelled) {
          setLessons(result.data);
          setStale(result.stale);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || t("mobile.lessons.errorFallback"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectFilter, user.id, user.class_number, t]);

  const groups = React.useMemo(() => {
    if (!lessons) return [];
    const bySubject = new Map();
    for (const l of lessons) {
      if (!bySubject.has(l.subject)) bySubject.set(l.subject, []);
      bySubject.get(l.subject).push(l);
    }
    return Array.from(bySubject.entries())
      .map(([subject, items]) => ({ subject, items: items.sort((a, b) => a.chapter_number - b.chapter_number) }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [lessons]);

  return (
    <Screen contentClassName="px-5 pt-4 pb-24" scroll={false}>
      <Text className="text-xl font-extrabold text-slate-900 mb-1">{t("mobile.lessons.title")}</Text>
      <Text className="text-xs text-slate-500 mb-4">{t("mobile.lessons.subtitle")}</Text>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {SUBJECTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSubjectFilter(s)}
            className={`px-3.5 py-1.5 rounded-full border ${subjectFilter === s ? "bg-sky-600 border-sky-600" : "bg-white border-slate-200"}`}
          >
            <Text className={`text-xs font-bold ${subjectFilter === s ? "text-white" : "text-slate-600"}`}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <ErrorBanner message={error} />
      {stale && (
        <View className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <Text className="text-xs text-amber-700">{t("mobile.lessons.offlineBanner")}</Text>
        </View>
      )}

      {lessons === null && !error ? (
        <LoadingScreen label={t("mobile.lessons.loading")} />
      ) : groups.length === 0 ? (
        <EmptyState emoji="📚" title={t("mobile.lessons.emptyTitle")} subtitle={t("mobile.lessons.emptySubtitle")} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.subject}
          // Screen's own pb-24 lands on the non-scrolling wrapper View here (scroll={false}),
          // not on the FlatList's scrollable content — so the list needs its own matching
          // bottom padding to clear the bottom tab bar.
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item: group }) => (
            <View className="mb-5">
              <Text className="text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wide">{group.subject}</Text>
              {group.items.map((lesson) => {
                const done = completedIds.has(lesson.id);
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => navigation.navigate("LessonViewer", { lessonId: lesson.id })}
                    className={`bg-white rounded-2xl border p-4 mb-2.5 ${done ? "border-emerald-200" : "border-slate-200"}`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded flex-shrink"
                        numberOfLines={1}
                      >
                        {t("mobile.lessons.chapterLabel", { number: lesson.chapter_number })}
                      </Text>
                      {done && <Text className="text-xs font-bold text-emerald-600 ml-2">{t("mobile.lessons.done")}</Text>}
                    </View>
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={2}>{lesson.chapter_title}</Text>
                    <Text className="text-xs text-slate-400 mt-1">
                      {t("mobile.lessons.slideCount", { count: lesson.slide_count, class: lesson.class_number })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      )}
    </Screen>
  );
}
