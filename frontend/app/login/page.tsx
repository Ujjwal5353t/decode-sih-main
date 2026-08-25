"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Building2,
  Users,
  Sparkles,
  Lock,
  Mail,
  Building,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  UserCog,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SchoolAutocomplete } from "@/components/ui/SchoolAutocomplete";
import { useAuth } from "@/hooks/useAuth";

type LoginRole = "student" | "school" | "parent" | "teacher";
type StudentLoginType = "self" | "school";

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
  const { login, loading, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("student");
  const [studentLoginType, setStudentLoginType] = useState<StudentLoginType>("self");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchName, setBranchName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (selectedRole === "teacher") {
      if (!phoneNumber.trim() || !branchName.trim() || !password.trim()) {
        setLocalError("Please fill in all required fields.");
        return;
      }
      try {
        await login("teacher", {
          phone_number: phoneNumber.trim(),
          branch_name: branchName.trim(),
          password,
        });
        router.push("/dashboard");
      } catch (err: any) {}
      return;
    }

    if (!email.trim() || !password.trim()) {
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
          email: email.trim(),
          password,
        });
      } else if (selectedRole === "school") {
        await login("school", {
          branch_name: branchName.trim(),
          email: email.trim(),
          password,
        });
      } else if (selectedRole === "parent") {
        await login("parent", {
          email: email.trim(),
          password,
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      // Error is caught and stored in auth context or local state
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
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold text-text-primary group-hover:text-brand transition-colors">
            VidyaSetu
          </span>
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
      <main className="flex-1 flex items-center justify-center p-6 z-10">
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
                Welcome Back
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Select your account type and sign in to continue
              </p>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-surface-hover rounded-[var(--radius-md)] mb-6">
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
              <div className="mb-6 p-3 rounded-[var(--radius-lg)] bg-surface border border-border-primary space-y-2.5">
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

            {/* Role Description Badge */}
            <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-brand/5 border border-border-brand text-xs text-text-secondary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand shrink-0" />
              <span>
                {selectedRole === "student"
                  ? studentLoginType === "self"
                    ? "🌟 Self-Enrolled Login: No branch name required."
                    : "🏫 School-Enrolled Login: Enter your school branch name below."
                  : rolesConfig.find((r) => r.id === selectedRole)?.description}
              </span>
            </div>

            {/* Error Alert */}
            {activeError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-3.5 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{activeError}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Branch Name Field (Only shown if School role or School-Enrolled Student) */}
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

              {/* Email or Phone Field */}
              {selectedRole === "teacher" ? (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

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

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In as {rolesConfig.find((r) => r.id === selectedRole)?.label}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer / Switch link */}
            <p className="text-center text-xs text-text-secondary mt-6">
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
