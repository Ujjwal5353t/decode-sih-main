"use client";

import { useState, useEffect } from "react";
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
  Mail,
  Phone,
  User,
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
  Hash,
  LayoutGrid,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SchoolAutocomplete } from "@/components/ui/SchoolAutocomplete";
import { useAuth } from "@/hooks/useAuth";
import { sendOTP, verifyOTP } from "@/lib/api";

type RegisterRole = "student" | "school" | "parent" | "teacher";
type StudentEnrollmentType = "school" | "self";
type ContactMethod = "email" | "phone";

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
    description: "Link your child using their phone number or student ID",
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

  // Contact Method: Email vs Mobile Number (for Student, School, Parent)
  const [contactMethod, setContactMethod] = useState<ContactMethod>("phone");

  // Student specific enrollment mode
  const [studentEnrollment, setStudentEnrollment] = useState<StudentEnrollmentType>("school");

  // User Name field (Student, Parent, Teacher)
  const [fullName, setFullName] = useState("");

  // Shared form fields
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Student, School & Teacher fields
  const [schoolName, setSchoolName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [stateName, setStateName] = useState("Delhi");

  // Student class/section fields
  const [classNumber, setClassNumber] = useState<number>(1);
  const [section, setSection] = useState<string>("A");

  // School specific field
  const [studentPrefix, setStudentPrefix] = useState("");

  // Parent specific field (optional if phone is used)
  const [studentUniqueNumber, setStudentUniqueNumber] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);

  // Clear stale auth errors on mount or when switching options
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [selectedRole, studentEnrollment, contactMethod]);

  // Trigger Send Dummy OTP
  const handleSendOTP = async () => {
    setLocalError(null);
    setOtpMessage(null);
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      setLocalError("Please enter a valid mobile number first.");
      return;
    }

    try {
      setOtpLoading(true);
      const res = await sendOTP(phoneNumber.trim());
      setOtpSent(true);
      setOtpVerified(false);
      setOtpMessage(res.message || "OTP printed in backend server terminal!");
    } catch (err: any) {
      setLocalError(err.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Trigger Verify Dummy OTP
  const handleVerifyOTP = async () => {
    setLocalError(null);
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setLocalError("Please enter the 6-digit OTP code.");
      return;
    }

    try {
      setOtpLoading(true);
      const res = await verifyOTP(phoneNumber.trim(), otpCode.trim());
      if (res.verified) {
        setOtpVerified(true);
        setOtpMessage("Mobile number verified successfully!");
      }
    } catch (err: any) {
      setLocalError(err.message || "Invalid OTP code. Please check the backend terminal.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPhoneVerification = () => {
    setOtpVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setOtpMessage(null);
    clearError();
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Check name for Student, Parent, Teacher
    if (
      (selectedRole === "student" || selectedRole === "parent" || selectedRole === "teacher") &&
      !fullName.trim()
    ) {
      setLocalError(
        `Please enter your ${
          selectedRole === "student"
            ? "full name"
            : selectedRole === "teacher"
            ? "teacher name"
            : "name"
        }.`
      );
      return;
    }

    if (selectedRole === "teacher") {
      if (!phoneNumber.trim() || !schoolName.trim() || !branchName.trim()) {
        setLocalError("Please fill in your phone number, school name, and branch name.");
        return;
      }
      if (!otpVerified) {
        setLocalError("Please verify your teacher mobile number with the OTP before continuing.");
        return;
      }
    } else {
      // Check credentials for non-teacher roles
      if (contactMethod === "email" && !email.trim()) {
        setLocalError("Please enter your email address.");
        return;
      }

      if (contactMethod === "phone") {
        if (!phoneNumber.trim()) {
          setLocalError("Please enter your mobile number.");
          return;
        }
        if (!otpVerified) {
          setLocalError("Please verify your mobile number with the OTP before continuing.");
          return;
        }
      }
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }

    try {
      if (selectedRole === "teacher") {
        await register("teacher", {
          name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          school_name: schoolName.trim(),
          branch_name: branchName.trim(),
          password,
        });
      } else {
        const authPayload = {
          full_name: fullName.trim() || undefined,
          email: contactMethod === "email" ? email.trim().toLowerCase() : undefined,
          phone_number: contactMethod === "phone" ? phoneNumber.trim() : undefined,
          password,
        };

        if (selectedRole === "student") {
          if (studentEnrollment === "school") {
            if (!schoolName.trim() || !branchName.trim() || !stateName.trim()) {
              setLocalError("Please select or enter school name, branch name, and state.");
              return;
            }
            await register("student", {
              ...authPayload,
              enrollment_type: "school",
              school_name: schoolName.trim(),
              branch_name: branchName.trim(),
              state: stateName.trim(),
              class_number: classNumber,
              section: section,
            });
          } else {
            // Self Enrolled Mode
            await register("student", {
              ...authPayload,
              enrollment_type: "self",
              state: stateName.trim() || "All India",
              class_number: classNumber,
              section: "SELF",
            });
          }
        } else if (selectedRole === "school") {
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
            ...authPayload,
            school_name: schoolName.trim(),
            branch_name: branchName.trim(),
            student_prefix: studentPrefix.trim().toUpperCase(),
            state: stateName.trim(),
          });
        } else if (selectedRole === "parent") {
          await register("parent", {
            ...authPayload,
            student_unique_number: studentUniqueNumber.trim()
              ? studentUniqueNumber.trim().toUpperCase()
              : undefined,
          });
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      // If backend reports that the phone number is already registered, unlock phone verification so user can edit it immediately
      const errMsg = (err?.message || error || "").toLowerCase();
      if (
        errMsg.includes("already registered") ||
        errMsg.includes("phone") ||
        errMsg.includes("mobile")
      ) {
        setOtpVerified(false);
        setOtpSent(false);
        setOtpCode("");
      }
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
                Select your account role to get started
              </p>
            </div>

            {/* Role Selector Tabs (4 roles) */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-surface-hover rounded-[var(--radius-md)] mb-6">
              {rolesConfig.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      // School accounts go through verification before they can
                      // be administered — see app/register/school/page.tsx.
                      if (r.id === "school") {
                        router.push("/register/school");
                        return;
                      }
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

            {/* Role Info Badge */}
            <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-brand/5 border border-border-brand text-xs text-text-secondary flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                {selectedRole === "student" && (
                  <span>
                    <strong>Multi-Child Support:</strong> Siblings can register with the same parent mobile number and each child will automatically appear on the parent dashboard!
                  </span>
                )}
                {selectedRole === "school" && (
                  <span>{rolesConfig.find((r) => r.id === "school")?.description}</span>
                )}
                {selectedRole === "parent" && (
                  <span>
                    <strong>Parent Portal:</strong> Registering with your mobile number automatically links all your registered children to your dashboard.
                  </span>
                )}
                {selectedRole === "teacher" && (
                  <span>
                    <strong>Teacher Portal:</strong> Register with your branch to manage assigned classes and assignments.
                  </span>
                )}
              </div>
            </div>

            {/* Contact Method Selector (for Student, School, Parent) */}
            {selectedRole !== "teacher" && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Sign Up Using
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-surface-hover rounded-[var(--radius-md)]">
                  <button
                    type="button"
                    onClick={() => {
                      setContactMethod("phone");
                      setLocalError(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer ${
                      contactMethod === "phone"
                        ? "bg-surface text-brand shadow-sm font-semibold border border-border-brand"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mobile Number (OTP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContactMethod("email");
                      setLocalError(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer ${
                      contactMethod === "email"
                        ? "bg-surface text-brand shadow-sm font-semibold border border-border-brand"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {activeError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-3.5 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{activeError}</span>
                </div>
                {(activeError.toLowerCase().includes("phone") ||
                  activeError.toLowerCase().includes("already registered") ||
                  activeError.toLowerCase().includes("mobile")) && (
                  <button
                    type="button"
                    onClick={handleResetPhoneVerification}
                    className="underline hover:text-rose-400 font-semibold cursor-pointer shrink-0 text-xs"
                  >
                    Change Number
                  </button>
                )}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field for Student, Parent, Teacher */}
              {(selectedRole === "student" || selectedRole === "parent" || selectedRole === "teacher") && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    {selectedRole === "student"
                      ? "Student Full Name"
                      : selectedRole === "teacher"
                      ? "Teacher Full Name"
                      : "Parent / Guardian Name"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder={
                        selectedRole === "student"
                          ? "e.g. Aarav Sharma"
                          : selectedRole === "teacher"
                          ? "e.g. Priyanka Verma"
                          : "e.g. Rajesh Sharma"
                      }
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
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

              {/* Child Unique Number (Parent Only - Optional if using phone) */}
              {selectedRole === "parent" && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Child's Unique Student ID {contactMethod === "phone" ? "(Optional)" : "(Required)"}
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="e.g. LKD0001 (or leave blank to auto-link by phone)"
                      value={studentUniqueNumber}
                      onChange={(e) => setStudentUniqueNumber(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm uppercase rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                      required={contactMethod === "email"}
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

              {/* Class & Section fields — student registration only */}
              {selectedRole === "student" && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Class Number */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Class
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <select
                        value={classNumber}
                        onChange={(e) => setClassNumber(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors appearance-none cursor-pointer"
                        required
                      >
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((cls) => (
                          <option key={cls} value={cls}>
                            Class {cls}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Section — only for school-enrolled */}
                  {studentEnrollment === "school" && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                        Section
                      </label>
                      <div className="relative">
                        <LayoutGrid className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <select
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors appearance-none cursor-pointer"
                          required
                        >
                          {["A", "B", "C", "D"].map((sec) => (
                            <option key={sec} value={sec}>
                              Section {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Field (Teacher always uses phone with OTP; others choose Phone/Email) */}
              {selectedRole === "teacher" || contactMethod === "phone" ? (
                <div className="space-y-3 p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border-primary">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      {selectedRole === "teacher" ? "Teacher Mobile Number" : "Mobile Number"}
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
                            setOtpVerified(false);
                            setOtpSent(false);
                          }}
                          disabled={otpVerified}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-hover text-text-primary text-sm rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors disabled:opacity-70"
                          required
                        />
                      </div>

                      {otpVerified ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetPhoneVerification}
                          className="shrink-0 text-xs px-3 text-brand border-border-brand hover:bg-brand/10 cursor-pointer"
                          title="Change mobile number"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Change
                        </Button>
                      ) : (
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
                      )}
                    </div>
                  </div>

                  {/* OTP Verification Box */}
                  <AnimatePresence>
                    {otpSent && !otpVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-2 border-t border-border-primary"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">
                            Enter 6-Digit OTP (Check Backend Terminal)
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-surface-hover text-text-primary text-sm font-mono tracking-widest rounded-[var(--radius-md)] border border-border-primary focus:border-brand focus:outline-none transition-colors"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={handleVerifyOTP}
                              disabled={otpLoading || otpCode.length < 4}
                              className="shrink-0 text-xs px-4"
                            >
                              {otpLoading ? "Verifying..." : "Verify OTP"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Verified Badge */}
                  {otpVerified && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-2.5 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-between gap-2 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>Mobile Number Verified Successfully</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPhoneVerification}
                        className="text-xs text-text-secondary hover:text-text-primary underline cursor-pointer font-semibold"
                      >
                        Change Number
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Email Field */
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
                disabled={
                  loading ||
                  ((selectedRole === "teacher" || contactMethod === "phone") && !otpVerified)
                }
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
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
