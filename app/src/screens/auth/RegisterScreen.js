import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Screen, ErrorBanner } from "../../components/Screen";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import { sendOTP, verifyOTP } from "../../api/auth";

function Field({ label, children }) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-slate-600 mb-1.5">{label}</Text>
      {children}
    </View>
  );
}

function TextField(props) {
  return (
    <TextInput
      {...props}
      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
    />
  );
}

const SELECTED_ROLE_SHADOW = { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)" };

function ChoiceRow({ options, value, onChange }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => (
        <Pressable
          key={String(opt)}
          onPress={() => onChange(opt)}
          className={`px-4 py-2 rounded-full border ${value === opt ? "bg-sky-600 border-sky-600" : "bg-white border-slate-200"}`}
        >
          <Text className={`text-xs font-bold ${value === opt ? "text-white" : "text-slate-600"}`}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { register, loading, error, clearError } = useAuth();
  const { t } = useTranslation();
  const [role, setRole] = useState("student");
  const [enrollment, setEnrollment] = useState("school");

  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [stateName, setStateName] = useState("Delhi");
  const [classNumber, setClassNumber] = useState(1);
  const [section, setSection] = useState("A");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [studentUniqueNumber, setStudentUniqueNumber] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [localError, setLocalError] = useState(null);

  const ROLES = [
    { id: "student", label: t("mobile.auth.roleStudent"), emoji: "🎓" },
    { id: "teacher", label: t("mobile.auth.roleTeacher"), emoji: "🧑‍🏫" },
    { id: "parent", label: t("mobile.auth.roleParent"), emoji: "👪" },
  ];

  const resetPhoneVerification = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode("");
    setOtpMessage(null);
  };

  const handleSendOTP = async () => {
    setLocalError(null);
    if (!phone.trim() || phone.trim().length < 7) {
      setLocalError(t("mobile.auth.validPhoneRequired"));
      return;
    }
    try {
      setOtpLoading(true);
      const res = await sendOTP(phone.trim());
      setOtpSent(true);
      setOtpVerified(false);
      setOtpMessage(res.message || t("mobile.auth.otpCode"));
    } catch (err) {
      setLocalError(err.message || t("mobile.auth.otpSendFailed"));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLocalError(null);
    if (!otpCode.trim()) {
      setLocalError(t("mobile.auth.otpCodeRequired"));
      return;
    }
    try {
      setOtpLoading(true);
      const res = await verifyOTP(phone.trim(), otpCode.trim());
      if (res.verified) {
        setOtpVerified(true);
        setOtpMessage(t("mobile.auth.phoneVerified"));
      }
    } catch (err) {
      setLocalError(err.message || t("mobile.auth.otpInvalid"));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLocalError(null);
    clearError();

    if ((role === "student" || role === "parent" || role === "teacher") && !fullName.trim()) {
      setLocalError(t("mobile.auth.nameRequired"));
      return;
    }
    if (!phone.trim()) {
      setLocalError(t("mobile.auth.phoneRequired"));
      return;
    }
    if (!otpVerified) {
      setLocalError(t("mobile.auth.otpRequired"));
      return;
    }
    if (password.length < 8) {
      setLocalError(t("mobile.auth.passwordTooShort"));
      return;
    }
    if (role === "teacher" && (!schoolName.trim() || !branchName.trim())) {
      setLocalError(t("mobile.auth.schoolFieldsRequired"));
      return;
    }
    if (role === "student" && enrollment === "school" && (!schoolName.trim() || !branchName.trim())) {
      setLocalError(t("mobile.auth.schoolFieldsRequired"));
      return;
    }

    try {
      if (role === "teacher") {
        await register("teacher", {
          name: fullName.trim(),
          phone_number: phone.trim(),
          school_name: schoolName.trim(),
          branch_name: branchName.trim(),
          password,
        });
      } else if (role === "student") {
        const base = { full_name: fullName.trim(), phone_number: phone.trim(), password };
        if (enrollment === "school") {
          await register("student", {
            ...base,
            enrollment_type: "school",
            school_name: schoolName.trim(),
            branch_name: branchName.trim(),
            state: stateName.trim(),
            class_number: classNumber,
            section,
          });
        } else {
          await register("student", {
            ...base,
            enrollment_type: "self",
            state: stateName.trim() || "All India",
            class_number: classNumber,
            section: "SELF",
          });
        }
      } else if (role === "parent") {
        await register("parent", {
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          password,
          student_unique_number: studentUniqueNumber.trim() ? studentUniqueNumber.trim().toUpperCase() : undefined,
        });
      }
    } catch {
      // surfaced via `error`
    }
  };

  const activeError = localError || error;
  const fullNameLabel =
    role === "student"
      ? t("mobile.auth.studentFullName")
      : role === "teacher"
        ? t("mobile.auth.teacherFullName")
        : t("mobile.auth.parentGuardianName");

  return (
    <Screen contentClassName="px-6 pb-24">
      <View className="items-center mt-6 mb-6">
        <Text className="text-2xl font-extrabold text-slate-900">{t("mobile.auth.createAccount")}</Text>
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

      {role === "student" && (
        <Field label={t("mobile.auth.enrollmentMode")}>
          <ChoiceRow options={["school", "self"]} value={enrollment} onChange={setEnrollment} />
        </Field>
      )}

      <Field label={fullNameLabel}>
        <TextField value={fullName} onChangeText={setFullName} placeholder={t("mobile.auth.fullNamePlaceholder")} />
      </Field>

      {(role === "teacher" || (role === "student" && enrollment === "school")) && (
        <>
          <Field label={t("mobile.auth.schoolName")}>
            <TextField value={schoolName} onChangeText={setSchoolName} placeholder={t("mobile.auth.schoolNamePlaceholder")} />
          </Field>
          <Field label={t("mobile.auth.branchName")}>
            <TextField value={branchName} onChangeText={setBranchName} placeholder={t("mobile.auth.branchNamePlaceholder")} />
          </Field>
        </>
      )}

      {role === "student" && enrollment === "school" && (
        <Field label={t("mobile.auth.stateLabel")}>
          <TextField value={stateName} onChangeText={setStateName} placeholder={t("mobile.auth.stateLabelPlaceholder")} />
        </Field>
      )}

      {role === "student" && (
        <View className="flex-row gap-4 mb-1">
          <View className="flex-1">
            <Field label={t("mobile.auth.classLabel")}>
              <ChoiceRow options={[1, 2, 3, 4, 5]} value={classNumber} onChange={setClassNumber} />
            </Field>
          </View>
        </View>
      )}
      {role === "student" && enrollment === "school" && (
        <Field label={t("mobile.auth.sectionLabel")}>
          <ChoiceRow options={["A", "B", "C", "D"]} value={section} onChange={setSection} />
        </Field>
      )}

      {role === "parent" && (
        <Field label={t("mobile.auth.childStudentId")}>
          <TextField
            value={studentUniqueNumber}
            onChangeText={(v) => setStudentUniqueNumber(v.toUpperCase())}
            placeholder={t("mobile.auth.childStudentIdPlaceholder")}
            autoCapitalize="characters"
          />
        </Field>
      )}

      <View className="mb-4 p-3.5 rounded-xl bg-white border border-slate-200">
        <Field label={t("mobile.auth.mobileNumber")}>
          <View className="flex-row gap-2">
            <TextInput
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                resetPhoneVerification();
              }}
              placeholder="9876543210"
              keyboardType="phone-pad"
              editable={!otpVerified}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
            />
            <Button
              title={otpVerified ? t("mobile.auth.change") : otpSent ? t("mobile.auth.resend") : t("mobile.auth.sendOtp")}
              variant="outline"
              onPress={otpVerified ? resetPhoneVerification : handleSendOTP}
              loading={otpLoading && !otpSent}
              disabled={otpLoading || !phone.trim()}
              className="px-3 py-3"
            />
          </View>
        </Field>

        {otpSent && !otpVerified && (
          <View className="flex-row gap-2 mt-1">
            <TextInput
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder={t("mobile.auth.otpCode")}
              keyboardType="number-pad"
              maxLength={6}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900"
            />
            <Button title={t("mobile.auth.verify")} onPress={handleVerifyOTP} loading={otpLoading} className="px-4 py-2.5" />
          </View>
        )}

        {otpMessage && <Text className="text-xs text-slate-500 mt-2">{otpMessage}</Text>}
        {otpVerified && <Text className="text-xs text-emerald-600 font-bold mt-2">{t("mobile.auth.mobileNumberVerifiedTick")}</Text>}
      </View>

      <Field label={t("mobile.auth.passwordMin")}>
        <TextField value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
      </Field>

      <Button
        title={loading ? t("mobile.auth.creatingAccount") : t("mobile.auth.createAccount")}
        onPress={handleSubmit}
        loading={loading}
        className="mt-2"
      />

      <Pressable onPress={() => navigation.navigate("Login")} className="mt-5 items-center py-2">
        <Text className="text-xs text-slate-500">
          {t("mobile.auth.alreadyHaveAccount")} <Text className="text-sky-600 font-bold">{t("mobile.auth.signInLink")}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}
