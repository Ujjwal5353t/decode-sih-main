import React, { useCallback, useState } from "react";
import { View, Text, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useTranslation } from "../../context/LanguageContext";
import { getTeacherClasses } from "../../api/teacher";

export default function ClassesListScreen({ navigation }) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTeacherClasses();
      setClasses(data);
      setError(null);
    } catch (err) {
      setError(err.message || t("teacherDashboard.mobile.home.loadError"));
    }
  }, [t]);

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

  if (classes === null && !error) return <LoadingScreen label={t("teacherDashboard.mobile.classesList.loading")} />;

  if (classes === null && error) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <Text className="text-xl font-extrabold text-slate-900 mb-4">{t("teacher.classes")}</Text>
        <ErrorBanner message={error} />
        <Button title={t("actions.retry")} variant="outline" onPress={load} />
      </Screen>
    );
  }

  return (
    <Screen
      contentClassName="px-5 pt-4 pb-24"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-xl font-extrabold text-slate-900 mb-4">{t("teacher.classes")}</Text>
      <ErrorBanner message={error} />

      {(classes || []).length === 0 ? (
        <EmptyState
          emoji="🏫"
          title={t("teacherDashboard.mobile.home.noClassesTitle")}
          subtitle={t("teacherDashboard.mobile.home.noClassesSubtitle")}
        />
      ) : (
        (classes || []).map((c) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate("ClassDetail", { classNumber: c.class_number, section: c.section, subject: c.subject, label: c.label })}
          >
            <Card className="mb-3 flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                  {c.label}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                  {t("teacherDashboard.classPrefix")} {c.class_number} • {c.section}
                </Text>
              </View>
              <Text className="text-slate-400">›</Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
