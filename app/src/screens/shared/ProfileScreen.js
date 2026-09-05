import React from "react";
import { View, Text, Pressable, Switch, Alert } from "react-native";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { usePreferences } from "../../context/PreferencesContext";
import { useLearningSync } from "../../hooks/useLearningSync";
import { speak } from "../../speech/speech";

function accountSubtitle(role, user, t) {
  if (!user) return "";
  if (role === "student") return `${user.unique_number || ""} • ${user.school_name || t("mobile.profile.selfEnrolled")}`;
  if (role === "teacher") return `${user.branch_name || ""}`;
  if (role === "parent") return user.phone_number || user.email || t("mobile.profile.guardian");
  return "";
}

function SettingRow({ label, description, right }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-slate-800">{label}</Text>
        {description && <Text className="text-xs text-slate-400 mt-0.5">{description}</Text>}
      </View>
      {right}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, role, logout } = useAuth();
  const { language, setLanguage, languages, t } = useTranslation();
  const prefs = usePreferences();
  const isStudent = role === "student";
  const { pendingCount, syncing, sync } = useLearningSync(isStudent ? user?.id : null);

  const handleLogout = () => {
    Alert.alert(t("mobile.profile.signOutConfirmTitle"), t("mobile.profile.signOutConfirmBody"), [
      { text: t("mobile.profile.cancel"), style: "cancel" },
      { text: t("mobile.profile.signOut"), style: "destructive", onPress: logout },
    ]);
  };

  return (
    <Screen contentClassName="px-5 pt-4 pb-24">
      <Text className="text-xl font-extrabold text-slate-900 mb-4">{t("mobile.profile.title")}</Text>

      <Card className="mb-4 flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full bg-sky-100 items-center justify-center">
          <Text className="text-xl">{role === "student" ? "🎓" : role === "teacher" ? "🧑‍🏫" : "👪"}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{user?.full_name || user?.name || "User"}</Text>
          <Text className="text-xs text-slate-500" numberOfLines={1}>{accountSubtitle(role, user, t)}</Text>
        </View>
      </Card>

      {isStudent && (
        <Card className="mb-4">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t("mobile.profile.localFirstSync")}</Text>
          <SettingRow
            label={t("mobile.profile.pendingActivity")}
            description={pendingCount === 0 ? t("mobile.profile.everythingSynced") : t("mobile.profile.updatesSaved", { count: pendingCount })}
            right={
              <Button
                title={syncing ? t("mobile.profile.syncing") : t("mobile.profile.syncNow")}
                variant="outline"
                loading={syncing}
                onPress={sync}
                className="px-3 py-2"
              />
            }
          />
        </Card>
      )}

      <Card className="mb-4">
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t("mobile.profile.accessibility")}</Text>
        <SettingRow
          label={t("mobile.profile.readAloud")}
          description={t("mobile.profile.readAloudDesc")}
          right={<Switch value={prefs.readAloudEnabled} onValueChange={(v) => prefs.update({ readAloudEnabled: v })} />}
        />
        <SettingRow
          label={t("mobile.profile.signLanguageAssist")}
          description={t("mobile.profile.signLanguageAssistDesc")}
          right={<Switch value={prefs.signLanguageAssist} onValueChange={(v) => prefs.update({ signLanguageAssist: v })} />}
        />
        <SettingRow
          label={t("mobile.profile.soundEffects")}
          description={t("mobile.profile.soundEffectsDesc")}
          right={<Switch value={prefs.soundEffectsEnabled} onValueChange={(v) => prefs.update({ soundEffectsEnabled: v })} />}
        />
        <Pressable onPress={() => speak(t("mobile.profile.testVoiceSample"), language)} className="mt-2 py-1">
          <Text className="text-xs font-bold text-sky-600">{t("mobile.profile.testVoice")}</Text>
        </Pressable>
      </Card>

      <Card className="mb-4">
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t("mobile.profile.language")}</Text>
        <View className="flex-row flex-wrap gap-2">
          {languages.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => setLanguage(l.code)}
              className={`px-3.5 py-2 rounded-full border ${language === l.code ? "bg-sky-600 border-sky-600" : "bg-white border-slate-200"}`}
            >
              <Text className={`text-xs font-bold ${language === l.code ? "text-white" : "text-slate-600"}`}>{l.nativeLabel}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Button title={t("mobile.profile.signOut")} variant="danger" onPress={handleLogout} />
    </Screen>
  );
}
