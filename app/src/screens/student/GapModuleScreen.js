import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Screen, LoadingScreen, ErrorBanner } from "../../components/Screen";
import { Button } from "../../components/Button";
import { useTranslation } from "../../context/LanguageContext";
import { getLearningModule } from "../../api/student";

export default function GapModuleScreen({ route, navigation }) {
  const { gapId, module: initialModule } = route.params;
  const { t } = useTranslation();
  const [module, setModule] = useState(initialModule || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await getLearningModule(gapId);
        if (!cancelled) setModule(m);
      } catch (err) {
        if (!cancelled && !initialModule) setError(err.message || t("mobile.gapPractice.errorFallback"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapId]);

  if (!module && error) {
    return (
      <Screen contentClassName="px-5 pt-4 pb-24">
        <ErrorBanner message={error} />
      </Screen>
    );
  }

  if (!module) return <LoadingScreen label={t("mobile.gapPractice.loading")} />;

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <Text className="text-xs font-bold text-amber-600 bg-amber-50 self-start px-2.5 py-1 rounded-full mb-2">
        {t("mobile.gapPractice.originClassLabel", { class: module.origin_class })}
      </Text>
      <Text className="text-xl font-extrabold text-slate-900 mb-1">{module.topic_name}</Text>
      <Text className="text-xs text-slate-500 mb-4">
        {module.subject}
        {module.chapter_title ? ` • ${module.chapter_title}` : ""}
      </Text>

      {module.topic_description && (
        <Text className="text-sm text-slate-600 leading-relaxed mb-4">{module.topic_description}</Text>
      )}

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <Text className="text-sm font-bold text-slate-900 mb-2.5">{t("mobile.gapPractice.cruxTitle")}</Text>
        {module.crux_points.map((point, i) => (
          <View key={i} className="flex-row gap-2 mb-1.5">
            <Text className="text-xs text-sky-500">•</Text>
            <Text className="text-xs text-slate-700 flex-1 leading-relaxed">{point}</Text>
          </View>
        ))}
      </View>

      <Text className="text-xs text-slate-400 mb-3 text-center">
        {module.quiz_available
          ? t("mobile.gapPractice.quizAvailable", { count: module.quiz_question_count })
          : t("mobile.gapPractice.quizNotAvailable")}
      </Text>
      <Button
        title={t("mobile.gapPractice.startQuiz")}
        onPress={() => navigation.navigate("GapQuiz", { gapId, subject: module.subject, topicName: module.topic_name })}
        disabled={!module.quiz_available}
      />
    </Screen>
  );
}
