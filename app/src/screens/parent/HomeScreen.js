import React, { useCallback, useState } from "react";
import { View, Text, Pressable, TextInput, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Screen, LoadingScreen, ErrorBanner, EmptyState } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { getParentChildren, addParentChild } from "../../api/parent";

function AddChildForm({ onAdded }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!value.trim()) {
      setError(t("mobile.parentHome.studentIdError"));
      setSuccess(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await addParentChild(value.trim().toUpperCase());
      setValue("");
      setSuccess(true);
      onAdded();
    } catch (err) {
      setError(err.message || t("mobile.parentHome.failedLinkChild"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-5">
      <Text className="text-sm font-bold text-slate-900 mb-2">{t("mobile.parentHome.linkChildTitle")}</Text>
      <ErrorBanner message={error} />
      {success && !error && (
        <View className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <Text className="text-emerald-700 text-xs font-medium">{t("mobile.parentHome.childLinked")}</Text>
        </View>
      )}
      <View className="flex-row gap-2">
        <TextInput
          value={value}
          onChangeText={(v) => {
            setValue(v.toUpperCase());
            if (success) setSuccess(false);
          }}
          placeholder={t("parentDashboard.studentIdPlaceholder")}
          placeholderTextColor="#94A3B8"
          autoCapitalize="characters"
          autoCorrect={false}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
        />
        <Button
          title={submitting ? t("mobile.parentHome.linking") : t("mobile.parentHome.linkBtn")}
          onPress={submit}
          loading={submitting}
          className="px-4 py-2.5"
        />
      </View>
    </Card>
  );
}

export default function ParentHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getParentChildren();
      setChildren(result);
      setError(null);
    } catch (err) {
      setError(err.message || t("mobile.parentHome.failedLoadChildren"));
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

  return (
    <Screen contentClassName="px-5 pt-4 pb-24" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text className="text-xs text-slate-500">{t("mobile.home.greeting")}</Text>
      <Text className="text-xl font-extrabold text-slate-900 mb-5" numberOfLines={1}>
        {user?.full_name || t("sidebar.subtitles.guardian")} 👋
      </Text>

      <ErrorBanner message={error} />
      <AddChildForm onAdded={load} />

      <Text className="text-sm font-bold text-slate-800 mb-3">{t("parentDashboard.linkedChildrenList")}</Text>
      {children === null && !error ? (
        <LoadingScreen label={t("mobile.parentHome.loadingChildren")} />
      ) : children === null ? null : children.length === 0 ? (
        <EmptyState
          emoji="👶"
          title={t("parentDashboard.noWardsTitle")}
          subtitle={t("parentDashboard.noWardsDesc")}
        />
      ) : (
        children.map((child) => (
          <Pressable
            key={child.id}
            onPress={() =>
              navigation.navigate("ChildDetail", {
                studentUniqueNumber: child.student_unique_number,
                fullName: child.full_name,
              })
            }
          >
            <Card className="mb-3 flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                  {child.full_name || child.student_unique_number}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                  {child.class_number
                    ? t("mobile.home.classLabel", { class: child.class_number })
                    : t("mobile.home.selfEnrolled")}{" "}
                  • {child.school_name || t("mobile.parentHome.ncertMode")}
                </Text>
              </View>
              <Text className="text-slate-400 text-base font-bold">›</Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
