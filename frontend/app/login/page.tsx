"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Building2,
  Users,
  Sparkles,
  Lock,
  User,
  Building,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  UserCog,
  Phone,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SchoolAutocomplete } from "@/components/ui/SchoolAutocomplete";
import { useAuth } from "@/hooks/useAuth";
import { sendOTP } from "@/lib/api";

type LoginRole = "student" | "school" | "parent" | "teacher";
type StudentLoginType = "self" | "school";
type LoginAuthMode = "password" | "otp";

const rolesConfig: {
  id: LoginRole;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    description: "Access adaptive learning modules and NCERT quizzes",
  },
  {
    id: "school",
    label: "School",
    icon: Building2,
    description: "Manage class modules and upload curriculum material",
  },
  {
    id: "parent",
    label: "Parent",
    icon: Users,
    description: "Monitor child's progress and learning roadmap",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: UserCog,
    description: "Manage assigned classes, create assessments and track progress",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginOTP, loading, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("student");
  const [studentLoginType, setStudentLoginType] = useState<StudentLoginType>("self");
  const [authMode, setAuthMode] = useState<LoginAuthMode>("password");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [branchName, setBranchName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // OTP Login States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Handle Send Dummy OTP
  const handleSendOTP = async () => {
    setLocalError(null);
    setOtpMessage(null);
    const targetPhone = phoneNumber.trim() || identifier.trim();
    if (!targetPhone || targetPhone.length < 7) {
      setLocalError("Please enter a valid mobile number first.");
      return;
    }

    try {
      setOtpLoading(true);
      const res = await sendOTP(targetPhone);
      setOtpSent(true);
      setOtpMessage(res.message || "OTP generated and printed in server terminal!");
    } catch (err: any) {
      setLocalError(err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // ── OTP LOGIN MODE ──
    if (authMode === "otp") {
      const targetPhone = phoneNumber.trim() || identifier.trim();
      if (!targetPhone) {
        setLocalError("Please enter your registered mobile number.");
        return;
      }
      if (!otpSent) {
        setLocalError("Please click 'Send OTP' to receive the 6-digit code.");
        return;
      }
      if (!otpCode.trim() || otpCode.trim().length < 4) {
        setLocalError("Please enter the 6-digit OTP code printed on your backend console.");
        return;
      }

      if (
        (selectedRole === "school" ||
          selectedRole === "teacher" ||
          (selectedRole === "student" && studentLoginType === "school")) &&
        !branchName.trim()
      ) {
        setLocalError("Branch name is required for school/teacher login.");
        return;
      }

      try {
        await loginOTP(
          selectedRole,
          targetPhone,
          otpCode.trim(),
          branchName.trim() || undefined
        );
        router.push("/dashboard");
      } catch (err: any) {
        // Error set by auth provider
      }
      return;
    }

    // ── PASSWORD LOGIN MODE ──
    if (selectedRole === "teacher") {
      const targetPhone = phoneNumber.trim() || identifier.trim();
      if (!targetPhone || !branchName.trim() || !password.trim()) {
        setLocalError("Please fill in teacher phone number, branch name, and password.");
        return;
      }
      try {
        await login("teacher", {
          phone_number: targetPhone,
          branch_name: branchName.trim(),
          password,
        });
        router.push("/dashboard");
      } catch (err: any) {}
      return;
    }

    if (!identifier.trim() || !password.trim()) {
      setLocalError("Please fill in all required fields.");
      return;
    }

    if (
      (selectedRole === "school" || (selectedRole === "student" && studentLoginType === "school")) &&
      !branchName.trim()
    ) {
      setLocalError("Branch name is required for school-enrolled login.");
      return;
    }

    try {
      if (selectedRole === "student") {
        await login("student", {
          branch_name: studentLoginType === "school" ? branchName.trim() : undefined,
          enrollment_type: studentLoginType,
          identifier: identifier.trim(),
          password,
        });
      } else if (selectedRole === "school") {
        await login("school", {
          branch_name: branchName.trim(),
          identifier: identifier.trim(),
          password,
        });
      } else if (selectedRole === "parent") {
        await login("parent", {
          identifier: identifier.trim(),
          password,
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      // Error is handled in auth context
    }
  };

  const activeError = localError || error;
  const showBranchField =
    selectedRole === "school" ||
    selectedRole === "teacher" ||
    (selectedRole === "student" && studentLoginType === "school");

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div
        className="blob w-[500px] h-[500px] top-[-100px] left-[-100px]"
        style={{ background: "var(--brand-primary)" }}
      />
      <div
        className="blob w-[450px] h-[450px] bottom-[-100px] right-[-100px]"
        style={{ background: "var(--brand-secondary)" }}
      />

      {/* Header Bar */}
      <header className="p-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center group py-0.5"
          aria-label="VidyaSetu — Go to home"
        >
          <Image
            src="/vidyasetu-logo.png"
            alt="VidyaSetu — LEARN • GROW • BELONG — AI for Inclusive Education"
            width={320}
            height={96}
            className="h-10 sm:h-12 md:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/register">
            <Button variant="outline" size="sm">
              Create Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10 my-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="glass rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-xl)] border border-border-primary">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
                {authMode === "otp" ? "Sign In with OTP" : "Welcome Back"}
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                {authMode === "otp"
                  ? `Enter your registered mobile number for ${rolesConfig.find((r) => r.id === selectedRole)?.label}`
                  : "Sign in to your VidyaSetu account"}
              </p>
            </div>

            {/* Role Selector Tabs (4 roles) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-surface-hover rounded-[var(--radius-md)] mb-5">
              {rolesConfig.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      clearError();
                      setLocalError(null);
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-surface text-brand shadow-sm font-semibold border border-border-brand"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-brand" : ""}`} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Student Login Mode Option (Self vs School) */}
            {selectedRole === "student" && (
              <div className="mb-5 p-3 rounded-[var(--radius-lg)] bg-surface border border-border-primary space-y-2.5">
                <label className="block text-xs font-bold text-text-primary">
                  Student Login Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentLoginType("self")}
                    className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] border text-xs font-medium transition-all cursor-pointer ${
                      studentLoginType === "self"
                        ? "bg-brand/10 border-brand text-brand font-bold"
                        : "bg-surface-hover border-border-primary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="text-[11px]">Self Enrolled</div>
                      <div className="text-[9px] font-normal text-text-tertiary">NCERT Mode</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentLoginType("school")}
                    className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] border text-xs font-medium transition-all cursor-pointer ${
                      studentLoginType === "school"
                        ? "bg-brand/10 border-brand text-brand font-bold"
                        : "bg-surface-hover border-border-primary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="text-[11px]">School Enrolled</div>
                      <div className="text-[9px] font-normal text-text-tertiary">Requires Branch</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {activeError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3.5 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{activeError}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Branch Name Field */}
              {showBranchField && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <SchoolAutocomplete
                    label="Branch Name"
                    placeholder="Start typing branch name..."
                    value={branchName}
                    searchType="branch"
                    icon={Building}
                    onChange={(val) => setBranchName(val)}
                    onSelect={(item) => setBranchName(item.branch_name)}
                    required={showBranchField}
                  />
                </motion.div>
              )}

              {/* ── OTP LOGIN FORM ── */}
              {authMode === "otp" ? (
                <div className="space-y-3.5 p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border-primary">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      {selectedRole === "teacher"
                        ? "Teacher Registered Mobile Number"
                        : "Registered Mobile Number"}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            setOtpSent(false);
                          }}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-hover text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                          required
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !phoneNumber.trim()}
                        className="shrink-0 text-xs px-3"
                      >
                        {otpLoading ? (
                          <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : otpSent ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5" /> Resend
                          </span>
                        ) : (
                          "Send OTP"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* OTP Input Box */}
                  <AnimatePresence>
                    {otpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2 border-t border-border-primary"
                      >
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                          Enter 6-Digit OTP (Check Backend Terminal)
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-hover text-text-primary text-sm font-mono tracking-widest rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-text-tertiary flex items-center gap-1.5 mt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                          
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── PASSWORD LOGIN FORM ── */
                <>
                  {/* Identifier Field */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      {selectedRole === "teacher"
                        ? "Teacher Registered Phone Number"
                        : selectedRole === "student"
                        ? "Mobile Number, Email, or Student ID"
                        : "Mobile Number or Email Address"}
                    </label>
                    <div className="relative">
                      {selectedRole === "teacher" ? (
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      ) : (
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      )}
                      <input
                        type={selectedRole === "teacher" ? "tel" : "text"}
                        placeholder={
                          selectedRole === "teacher"
                            ? "e.g. 9876543210"
                            : selectedRole === "student"
                            ? "e.g. 9876543210, you@email.com, or LKD0001"
                            : "e.g. 9876543210 or you@email.com"
                        }
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                disabled={loading || (authMode === "otp" && (!otpSent || otpCode.length < 4))}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {authMode === "otp" ? "Sign In with OTP" : `Sign In as ${rolesConfig.find((r) => r.id === selectedRole)?.label}`}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {/* Small Switch Line: Login with OTP / Password */}
              <div className="pt-2 text-center">
                {authMode === "password" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setLocalError(null);
                      if (identifier && !phoneNumber) setPhoneNumber(identifier);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium cursor-pointer transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Login with Mobile OTP instead</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("password");
                      setLocalError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-medium cursor-pointer transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login with Password instead</span>
                  </button>
                )}
              </div>
            </form>

            {/* Footer / Switch link */}
            <p className="text-center text-xs text-text-secondary mt-5">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-brand font-semibold hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
