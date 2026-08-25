"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Building2,
  Users,
  Sparkles,
  Lock,
  Mail,
  Building,
  MapPin,
  Tag,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  UserCog,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SchoolAutocomplete } from "@/components/ui/SchoolAutocomplete";
import { useAuth } from "@/hooks/useAuth";

type RegisterRole = "student" | "school" | "parent" | "teacher";
type StudentEnrollmentType = "school" | "self";

const rolesConfig: {
  id: RegisterRole;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    description: "Join your school branch or self-enroll for NCERT learning",
  },
  {
    id: "school",
    label: "School",
    icon: Building2,
    description: "Register your school branch to publish modules",
  },
  {
    id: "parent",
    label: "Parent",
    icon: Users,
    description: "Link your child using their unique student number",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: UserCog,
    description: "Register with your name, phone & branch to manage assigned classes",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("student");
  const [showPassword, setShowPassword] = useState(false);

  // Student specific enrollment mode
  const [studentEnrollment, setStudentEnrollment] = useState<StudentEnrollmentType>("school");

  // Shared form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Teacher specific fields
  const [teacherName, setTeacherName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Student & School & Teacher fields
  const [schoolName, setSchoolName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [stateName, setStateName] = useState("Delhi");

  // School specific field
  const [studentPrefix, setStudentPrefix] = useState("");

  // Parent specific field
  const [studentUniqueNumber, setStudentUniqueNumber] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }

    try {
      if (selectedRole === "teacher") {
        if (!teacherName.trim() || !phoneNumber.trim() || !schoolName.trim() || !branchName.trim()) {
          setLocalError("Please fill in your name, phone number, school name, and branch name.");
          return;
        }
        await register("teacher", {
          name: teacherName.trim(),
          phone_number: phoneNumber.trim(),
          school_name: schoolName.trim(),
          branch_name: branchName.trim(),
          password,
        });
      } else if (selectedRole === "student") {
        if (!email.trim()) {
          setLocalError("Please enter your email address.");
          return;
        }
        if (studentEnrollment === "school") {
          if (!schoolName.trim() || !branchName.trim() || !stateName.trim()) {
            setLocalError("Please select or enter school name, branch name, and state.");
            return;
          }
          await register("student", {
            enrollment_type: "school",
            school_name: schoolName.trim(),
            branch_name: branchName.trim(),
            email: email.trim(),
            password,
            state: stateName.trim(),
          });
        } else {
          // Self Enrolled Mode
          await register("student", {
            enrollment_type: "self",
            email: email.trim(),
            password,
            state: stateName.trim() || "All India",
          });
        }
      } else if (selectedRole === "school") {
        if (!email.trim()) {
          setLocalError("Please enter your email address.");
          return;
        }
        if (
          !schoolName.trim() ||
          !branchName.trim() ||
          !studentPrefix.trim() ||
          !stateName.trim()
        ) {
          setLocalError(
            "Please fill in school name, branch name, student prefix, and state."
          );
          return;
        }
        await register("school", {
          school_name: schoolName.trim(),
          branch_name: branchName.trim(),
          student_prefix: studentPrefix.trim().toUpperCase(),
          email: email.trim(),
          password,
          state: stateName.trim(),
        });
      } else if (selectedRole === "parent") {
        if (!email.trim()) {
          setLocalError("Please enter your email address.");
          return;
        }
        if (!studentUniqueNumber.trim()) {
          setLocalError(
            "Please enter your child's Unique Student ID (e.g. LKD0001)."
          );
          return;
        }
        await register("parent", {
          email: email.trim(),
          password,
          student_unique_number: studentUniqueNumber.trim().toUpperCase(),
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      // Handled in auth provider / context
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div
        className="blob w-[500px] h-[500px] top-[-100px] right-[-100px]"
        style={{ background: "var(--brand-primary)" }}
      />
      <div
        className="blob w-[450px] h-[450px] bottom-[-100px] left-[-100px]"
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
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
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
          className="w-full max-w-lg"
        >
          {/* Card */}
          <div className="glass rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-xl)] border border-border-primary">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
                Create Account
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Select account type to register
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

            {/* Student Enrollment Toggle (Self vs School) */}
            {selectedRole === "student" && (
              <div className="mb-6 p-3 rounded-[var(--radius-lg)] bg-surface border border-border-primary space-y-3">
                <label className="block text-xs font-bold text-text-primary">
                  Select Student Enrollment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentEnrollment("school")}
                    className={`flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] border text-xs font-medium transition-all cursor-pointer ${
                      studentEnrollment === "school"
                        ? "bg-brand/10 border-brand text-brand font-bold"
                        : "bg-surface-hover border-border-primary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="text-[11px]">School Enrolled</div>
                      <div className="text-[9px] text-text-tertiary font-normal">School-provided modules</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentEnrollment("self")}
                    className={`flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] border text-xs font-medium transition-all cursor-pointer ${
                      studentEnrollment === "self"
                        ? "bg-brand/10 border-brand text-brand font-bold"
                        : "bg-surface-hover border-border-primary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="text-[11px]">Self Enrolled</div>
                      <div className="text-[9px] text-text-tertiary font-normal">NCERT curriculum</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Role Description Badge */}
            <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-brand/5 border border-border-brand text-xs text-text-secondary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand shrink-0" />
              <span>
                {selectedRole === "student" && studentEnrollment === "self"
                  ? "🌟 Self-Enrolled Mode: Access official NCERT-aligned curriculum for your class."
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
              {/* Teacher Specific Fields: Name & Phone */}
              {selectedRole === "teacher" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        type="text"
                        placeholder="e.g. Dr. Rajesh Sharma"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

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
                </>
              )}

              {/* School Name & Branch Name Autocomplete Components */}
              {((selectedRole === "student" && studentEnrollment === "school") ||
                selectedRole === "school" ||
                selectedRole === "teacher") && (
                <>
                  <SchoolAutocomplete
                    label="School Name"
                    placeholder="Start typing school name..."
                    value={schoolName}
                    searchType="school"
                    icon={Building2}
                    onChange={(val) => setSchoolName(val)}
                    onSelect={(item) => {
                      setSchoolName(item.school_name);
                      setBranchName(item.branch_name);
                      setStateName(item.state);
                    }}
                    required
                  />

                  <SchoolAutocomplete
                    label="Branch Name"
                    placeholder="Start typing branch name..."
                    value={branchName}
                    searchType="branch"
                    icon={Building}
                    onChange={(val) => setBranchName(val)}
                    onSelect={(item) => {
                      setBranchName(item.branch_name);
                      setSchoolName(item.school_name);
                      setStateName(item.state);
                    }}
                    required
                  />
                </>
              )}

              {/* Student Prefix (School Only) */}
              {selectedRole === "school" && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Student Prefix (2–10 Letters)
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="e.g. LKD (Used to generate student IDs)"
                      value={studentPrefix}
                      onChange={(e) => setStudentPrefix(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm uppercase rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Child Unique Number (Parent Only) */}
              {selectedRole === "parent" && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Child's Unique Student ID
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="e.g. LKD0001"
                      value={studentUniqueNumber}
                      onChange={(e) => setStudentUniqueNumber(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm uppercase rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {/* State Field */}
              {(selectedRole === "school" ||
                (selectedRole === "student" && studentEnrollment === "school")) && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    State
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="e.g. Delhi"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Field (Non-teacher accounts) */}
              {selectedRole !== "teacher" && (
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
                  Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
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
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create {rolesConfig.find((r) => r.id === selectedRole)?.label} Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer / Switch link */}
            <p className="text-center text-xs text-text-secondary mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
