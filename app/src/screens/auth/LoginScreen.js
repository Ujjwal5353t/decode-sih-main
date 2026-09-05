import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Image, KeyboardAvoidingView, Platform } from "react-native";
import { Screen, ErrorBanner } from "../../components/Screen";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";

const SELECTED_ROLE_SHADOW = { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)" };

export default function LoginScreen({ navigation }) {
  const { login, loading, error, clearError } = useAuth();
  const { t } = useTranslation();
  const [role, setRole] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [branchName, setBranchName] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const ROLES = [
    { id: "student", label: t("mobile.auth.roleStudent"), emoji: "🎓" },
    { id: "teacher", label: t("mobile.auth.roleTeacher"), emoji: "🧑‍🏫" },
    { id: "parent", label: t("mobile.auth.roleParent"), emoji: "👪" },
  ];

  const handleSubmit = async () => {
    setLocalError(null);
    clearError();
    if (!identifier.trim() || !password.trim()) {
      setLocalError(t("mobile.auth.fillRequired"));
      return;
    }
    if (role === "teacher" && !branchName.trim()) {
      setLocalError(t("mobile.auth.branchRequired"));
      return;
    }
    try {
      setSubmitting(true);
      if (role === "teacher") {
        await login("teacher", { phone_number: identifier.trim(), branch_name: branchName.trim(), password });
      } else {
        await login(role, { identifier: identifier.trim(), password });
      }
    } catch {
      // surfaced via `error` from context
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <Screen contentClassName="px-6 pb-10">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <View className="items-center mt-10 mb-8">
          <Image
            source={require("../../../assets/logo.png")}
            resizeMode="contain"
            style={{ width: 220, height: 110 }}
            accessibilityLabel="VidyaSetu"
          />
          <Text className="text-xs text-slate-500 mt-1">{t("mobile.auth.tagline")}</Text>
        </View>

        <View className="flex-row bg-slate-100 rounded-2xl p-1 mb-6">
          {ROLES.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setRole(r.id);
                setLocalError(null);
                clearError();
              }}
              // Toggling `shadow-sm` via className (rather than inline style) is a
              // known react-native-css-interop crash trigger on the New
              // Architecture — https://github.com/nativewind/nativewind/issues/1536.
              style={role === r.id ? SELECTED_ROLE_SHADOW : undefined}
              className={`flex-1 items-center py-2.5 rounded-xl ${role === r.id ? "bg-white" : ""}`}
            >
              <Text className="text-base">{r.emoji}</Text>
              <Text className={`text-xs font-semibold mt-0.5 ${role === r.id ? "text-sky-600" : "text-slate-500"}`} numberOfLines={1}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ErrorBanner message={activeError} />

        {role === "teacher" && (
          <View className="mb-4">
            <Text className="text-xs font-semibold text-slate-600 mb-1.5">{t("mobile.auth.branchName")}</Text>
            <TextInput
              value={branchName}
              onChangeText={setBranchName}
              placeholder={t("mobile.auth.branchNamePlaceholder")}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
            />
          </View>
        )}

        <View className="mb-4">
          <Text className="text-xs font-semibold text-slate-600 mb-1.5">
            {role === "teacher" ? t("mobile.auth.identifierTeacher") : t("mobile.auth.identifierOther")}
          </Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={role === "teacher" ? t("mobile.auth.identifierPlaceholderTeacher") : t("mobile.auth.identifierPlaceholderOther")}
            autoCapitalize="none"
            keyboardType={role === "teacher" ? "phone-pad" : "default"}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold text-slate-600 mb-1.5">{t("mobile.auth.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
          />
        </View>

        <Button
          title={submitting || loading ? t("mobile.auth.signingIn") : t("mobile.auth.signIn")}
          onPress={handleSubmit}
          loading={submitting || loading}
        />

        <Pressable onPress={() => navigation.navigate("Register")} className="mt-5 items-center py-2">
          <Text className="text-xs text-slate-500">
            {t("mobile.auth.noAccount")} <Text className="text-sky-600 font-bold">{t("mobile.auth.createOne")}</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
