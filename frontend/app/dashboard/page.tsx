"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Building2,
  Users,
  ShieldCheck,
  Sparkles,
  LogOut,
  BookOpen,
  Plus,
  CheckCircle,
  FileText,
  UserCheck,
  AlertCircle,
  Layers,
  Search,
  ExternalLink,
  UserCog,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Upload,
  Loader2,
  Brain,
  Award,
  MessageSquare,
  Check,
  X,
  ChevronRight,
  Phone,
  User,
  Menu,
  RefreshCw,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { LearningProgressPanel } from "@/components/dashboard/LearningProgressPanel";
import { ClassLearningProgress } from "@/components/dashboard/ClassLearningProgress";
import {
  AnimatedNumber,
  ConsoleMotion,
  EASE,
  Item,
  Reveal,
  Stagger,
} from "@/components/dashboard/console/motion";
import {
  Chip,
  Code,
  EmptyState,
  Field,
  FieldLabel,
  Loading,
  Meter,
  Modal,
  Notice,
  Panel,
  PanelHead,
  SectionHead,
  Segmented,
  Table,
  Td,
  Th,
  inputClass,
} from "@/components/dashboard/console/primitives";
import { Hero, HeroFact } from "@/components/dashboard/console/hero";
import {
  BarList,
  ChartLegend,
  DonutChart,
  type Segment,
} from "@/components/dashboard/console/charts";
import {
  ClassroomIllustration,
  ParentChildIllustration,
  SchoolIllustration,
  StudentIllustration,
} from "@/components/dashboard/console/illustrations";
import { DeleteModuleDialog } from "@/components/school/DeleteModuleDialog";
import { TeacherSearchModal } from "@/components/school/TeacherSearchModal";
import { AdminRequestsPanel } from "@/components/school/registration/AdminRequestsPanel";
import { SchoolRequestsPanel } from "@/components/admin/SchoolRequestsPanel";
import { SubjectSetupGate } from "@/components/school/SubjectSetupGate";
import {
  ModuleStatusBadge,
  type ModuleDisplayStatus,
} from "@/components/school/ModuleStatusBadge";
import {
  isProcessing,
  useModuleProcessing,
} from "@/components/school/ModuleProcessingProvider";
import { useAuth } from "@/hooks/useAuth";
import { Mascot, MascotMood } from "@/components/quiz/Mascot";
import {
  StudentProfile,
  SchoolProfile,
  ParentProfile,
  AdminProfile,
  TeacherProfile,
  TeacherClassOut,
  AssignmentOut,
  SubmissionOut,
  FeedbackOut,
  TeacherListItem,
  ModuleOut,
  NCERTBookOut,
  ChildLinkOut,
  RolePermissionsResponse,
  getRolePermissions,
  GapReportOut,
  QuizStatusOut,
  StudentQuizSummaryOut,
  getStudentModules,
  getNCERTBooksForClass,
  getSubjectPriority,
  SubjectPriorityOut,
  getAllNCERTBooks,
  uploadNCERTBookPdf,
  createNCERTBook,
  updateNCERTBook,
  deleteNCERTBook,
  detachNCERTBookFile,
  addNCERTModuleToSchool,
  getSchoolClassModules,
  getSchoolClassQuizSummaries,
  getParentChildren,
  addParentChild,
  getTeacherClasses,
  getTeacherClassStudents,
  getTeacherClassModules,
  getTeacherAssignments,
  createPdfAssignment,
  createAiQuizAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  setSubmissionScore,
  postStudentFeedback,
  getStudentFeedbackForAssignment,
  getStudentAssignments,
  submitStudentAssignment,
  getStudentAssignmentFeedback,
  getSchoolTeachers,
  getSchoolSubjects,
  SchoolSubjectDetail,
  assignClassToTeacher,
  deassignClassFromTeacher,
  getQuizStatus,
  getChildQuizResult,
} from "@/lib/api";



/**
 * Score-band colour, shared by the roster rail and the score-distribution
 * chart so a student's colour means the same thing in both places. Uses the
 * same 70 / 40 thresholds the existing Meter tones already used.
 */
function scoreColor(score: number | null): string {
  if (score === null) return "var(--c-line-strong)";
  if (score >= 70) return "var(--accent-emerald)";
  if (score >= 40) return "var(--accent-amber)";
  return "var(--accent-rose)";
}

function formatPdfUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${apiBase}/files/view-pdf?url=${encodeURIComponent(url)}`;
}

// Simple, rule-based grouping — not a live personalization engine. Orders
// a flat list of modules/books by subject, weakest-subject-first, using
// the diagnostic-quiz-derived ranking from GET /student/subject-priority.
// See LEARNING_PATH.txt for the plain-language write-up.
function groupBySubjectPriority<T extends { subject?: string | null }>(
  items: T[],
  priority: SubjectPriorityOut[]
): { subject: string; items: T[]; priorityInfo?: SubjectPriorityOut }[] {
  const rankOf = new Map(priority.map((p) => [p.subject, p.priority_rank]));
  const infoOf = new Map(priority.map((p) => [p.subject, p]));

  const bySubject = new Map<string, T[]>();
  for (const item of items) {
    const subject = item.subject || "General";
    if (!bySubject.has(subject)) bySubject.set(subject, []);
    bySubject.get(subject)!.push(item);
  }

  return Array.from(bySubject.entries())
    .map(([subject, groupItems]) => ({
      subject,
      items: groupItems,
      priorityInfo: infoOf.get(subject),
    }))
    .sort((a, b) => (rankOf.get(a.subject) ?? 999) - (rankOf.get(b.subject) ?? 999));
}

function SubjectGroupHeader({
  subject,
  priorityInfo,
  isTopPriority,
}: {
  subject: string;
  priorityInfo?: SubjectPriorityOut;
  isTopPriority: boolean;
}) {
  const hasGaps = !!priorityInfo && priorityInfo.gap_count > 0;
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-sm font-bold text-text-primary">{subject}</h3>
      {isTopPriority && hasGaps && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-border-brand">
          <Target className="w-3 h-3" /> Recommended first
        </span>
      )}
      {hasGaps && priorityInfo!.gap_topics.length > 0 && (
        <span className="text-[11px] text-text-tertiary truncate">
          Review: {priorityInfo!.gap_topics.slice(0, 2).join(", ")}
          {priorityInfo!.gap_topics.length > 2 ? "…" : ""}
        </span>
      )}
      <Link
        href={`/dashboard/learn?subject=${encodeURIComponent(subject)}`}
        className="ml-auto inline-flex items-center gap-1 text-[11px] text-brand font-semibold hover:underline shrink-0"
      >
        View Animated Lessons →
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading, logout, setupClass } = useAuth();

  const [permissions, setPermissions] = useState<RolePermissionsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // The console surface language (see globals.css) applies to the School
  // Admin, Teacher and Parent dashboards only. Student and Super Admin never
  // carry the class, so their shell renders exactly as it did before.
  const isConsole = role === "school" || role === "teacher" || role === "parent";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && (!user || !role)) {
      router.push("/login");
    }
  }, [loading, user, role, router]);

  // Fetch RBAC Permissions & Navigation Schema from Backend
  useEffect(() => {
    if (role) {
      getRolePermissions(role)
        .then((res) => {
          setPermissions(res);
          const tabParam =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("tab")
              : null;
          const defaultTab =
            tabParam ||
            res.navigation.find((i) => i.is_default)?.id ||
            res.navigation[0]?.id ||
            "overview";
          setActiveTab(defaultTab);
        })
        .catch((err) => {
          console.log("Fetch permissions note:", err.message);
        });
    }
  }, [role]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam) setActiveTab(tabParam);
    }
  }, []);

  if (loading || !user || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-text-secondary">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const activePermissionItem =
    permissions?.navigation.find((i) => i.id === activeTab) ||
    permissions?.navigation[0];

  return (
    <div className={`min-h-screen bg-background relative flex ${isConsole ? "console" : ""}`}>
      {/* Left Dynamic RBAC Permissions Sidebar */}
      <DashboardSidebar
        permissions={permissions}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        user={user}
        role={role}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        logout={logout}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header
          className={
            isConsole
              ? "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-panel)]/95 backdrop-blur-md px-4 sm:px-6 shadow-2xs"
              : "sticky top-0 z-30 glass border-b border-border-primary px-4 sm:px-6 py-3.5 flex items-center justify-between"
          }
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-[var(--c-sunken)] lg:hidden cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={
                    isConsole
                      ? "truncate text-[15px] font-bold tracking-tight text-text-primary font-[family-name:var(--font-display)]"
                      : "text-base sm:text-lg font-bold text-text-primary truncate"
                  }
                >
                  {activePermissionItem?.label || `${role?.toUpperCase()} Dashboard`}
                </h1>
                {activePermissionItem?.badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand/10 text-brand border border-brand/20">
                    {activePermissionItem.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate hidden sm:block">
                {activePermissionItem?.description || "Manage your inclusive learning workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Live Status Indicator */}
            {role === "school" && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Branch Active</span>
              </div>
            )}

            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-border-brand text-xs font-bold text-brand uppercase tracking-wider">
              {role === "student" && <GraduationCap className="w-3.5 h-3.5" />}
              {role === "school" && <Building2 className="w-3.5 h-3.5" />}
              {role === "parent" && <Users className="w-3.5 h-3.5" />}
              {role === "admin" && <ShieldCheck className="w-3.5 h-3.5" />}
              {role === "teacher" && <BookOpen className="w-3.5 h-3.5" />}
              <span>{role === "school" ? "School Admin" : permissions?.role_label || `${role} Role`}</span>
            </div>

            <ThemeToggle />

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-xl text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 text-xs px-2.5 sm:px-3"
            >
              <LogOut className="w-4 h-4 sm:mr-1.5 text-rose-500" />
              <span className="hidden sm:inline font-semibold">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Body with Dynamic View Routing */}
        <main
          className={
            isConsole
              ? "mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8"
              : "flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6"
          }
        >
          {role === "student" && (
            <StudentDashboardView
              student={user as StudentProfile}
              setupClass={setupClass}
              activeTab={activeTab}
            />
          )}
          {role === "school" && (
            <SubjectSetupGate>
              <SchoolDashboardView
                school={user as SchoolProfile}
                activeTab={activeTab}
              />
            </SubjectSetupGate>
          )}
          {role === "parent" && (
            <ParentDashboardView
              parent={user as ParentProfile}
              activeTab={activeTab}
            />
          )}
          {role === "admin" && (
            <AdminDashboardView
              admin={user as AdminProfile}
              activeTab={activeTab}
            />
          )}
          {role === "teacher" && (
            <TeacherDashboardView
              teacher={user as any}
              activeTab={activeTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ── Student Dashboard View ───────────────────────────────────────────────────

function StudentDashboardView({
  student,
  setupClass,
  activeTab = "overview",
}: {
  student: StudentProfile;
  setupClass: (data: { class_number: number; section: string }) => Promise<void>;
  activeTab?: string;
}) {
  const [selectedClass, setSelectedClass] = useState<number>(student.class_number || 1);
  const [selectedSection, setSelectedSection] = useState<string>(student.section || "A");
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [ncertBooks, setNcertBooks] = useState<NCERTBookOut[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatusOut | null>(null);
  const [loadingQuizStatus, setLoadingQuizStatus] = useState<boolean>(true);
  const [subjectPriority, setSubjectPriority] = useState<SubjectPriorityOut[]>([]);

  const isSelfEnrolled = student.enrollment_type === "self" || student.branch_name === "SELF";
  const needsSetup = isSelfEnrolled ? student.class_number === null : (student.class_number === null || student.section === null);

  // A persistent companion mood, derived straight from state already in
  // scope — no separate state of its own, no backend involvement. "idle"
  // (now a genuinely lively animation — blink, sway, an occasional
  // sparkle, tap-for-a-cheer) is the resting state; "encourage" is a
  // reaction to a specific wrong answer elsewhere in the app, not
  // something to show constantly just because the quiz isn't done yet —
  // that would read as a nagging/puzzled face rather than a companion.
  // "happy" is reserved as a steady positive state once the diagnostic is
  // actually complete.
  const mascotMood: MascotMood = !needsSetup && !loadingQuizStatus && quizStatus?.completed
    ? "happy"
    : "idle";


  // The diagnostic quiz is mandatory — modules/curriculum stay locked until
  // it's completed, so this must resolve before deciding what to render.
  useEffect(() => {
    if (needsSetup) return;
    setLoadingQuizStatus(true);
    getQuizStatus()
      .then((res) => setQuizStatus(res))
      .catch((err) => console.log("Quiz status fetch note:", err.message))
      .finally(() => setLoadingQuizStatus(false));
  }, [needsSetup]);

  useEffect(() => {
    if (needsSetup || !quizStatus?.completed) return;
    setLoadingModules(true);
    if (isSelfEnrolled) {
      getNCERTBooksForClass(student.class_number || 1)
        .then((res) => setNcertBooks(res))
        .catch((err) => console.log("NCERT books fetch note:", err.message))
        .finally(() => setLoadingModules(false));
    } else {
      getStudentModules()
        .then((res) => setModules(res))
        .catch((err) => console.log("School modules fetch note:", err.message))
        .finally(() => setLoadingModules(false));
    }
    // Simple, rule-based ordering (not a live personalization engine) — see
    // LEARNING_PATH.txt. Purely additive: groups/orders the same module
    // list above, never blocks it if this call fails.
    getSubjectPriority()
      .then((res) => setSubjectPriority(res))
      .catch((err) => console.log("Subject priority fetch note:", err.message));
  }, [needsSetup, quizStatus?.completed, student.class_number, isSelfEnrolled]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);
    setErrorMsg(null);
    try {
      const targetSection = isSelfEnrolled ? "SELF" : selectedSection;
      await setupClass({ class_number: selectedClass, section: targetSection });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to setup class.");
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Persistent companion — stays mounted across every tab, mood
          derived from state already in scope above (no backend call). */}
      <div className="fixed bottom-5 right-5 z-30 hidden sm:block">
        <Mascot mood={mascotMood} size={72} />
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* ── 1. Hero: Vibrant Learner Welcome Banner ──────────────────── */}
          <Hero
            variant="vibrant"
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isSelfEnrolled ? "Self Enrolled" : "School Enrolled"}</span>
                <span className="opacity-40">•</span>
                <span className="font-mono font-bold underline">{student.unique_number}</span>
              </span>
            }
            title={`Welcome, ${student.full_name || `Student #${student.unique_number}`}!`}
            subtitle={
              <p>
                {isSelfEnrolled ? (
                  <span className="font-semibold text-white">
                    🌟 Self-Educated Student (NCERT Curriculum)
                  </span>
                ) : (
                  <span>
                    {student.school_name} — {student.branch_name} ({student.state})
                  </span>
                )}
              </p>
            }
            illustration={<StudentIllustration className="h-[180px] w-[285px] drop-shadow-xl" />}
            facts={
              <>
                <HeroFact
                  label={isSelfEnrolled ? "Class" : "Class & Section"}
                  value={
                    student.class_number
                      ? isSelfEnrolled
                        ? `Class ${student.class_number}`
                        : `Class ${student.class_number} - Section ${student.section}`
                      : "Not Configured"
                  }
                  hint={isSelfEnrolled ? "NCERT Curriculum" : "Assigned section"}
                  variant="vibrant"
                />
                <HeroFact
                  label="Available Modules"
                  value={
                    <AnimatedNumber value={isSelfEnrolled ? ncertBooks.length : modules.length} />
                  }
                  hint={isSelfEnrolled ? "NCERT Official Books" : "School Branch Syllabus"}
                  variant="vibrant"
                />
                <HeroFact
                  label="Student ID"
                  value={<span className="font-mono">{student.unique_number}</span>}
                  hint={isSelfEnrolled ? "Self Enrolled" : "School Enrolled"}
                  variant="vibrant"
                />
              </>
            }
          />

          {/* Class Setup Card if Class/Section not set */}
          {needsSetup && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Panel
                flush
                className="relative overflow-hidden rounded-[18px] border border-brand/25 bg-brand/[0.04] p-5 shadow-xs"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      {isSelfEnrolled ? "Select Your Class" : "Complete Your Class & Section Setup"}
                    </h4>
                    <p className="mt-1 text-xs text-text-secondary">
                      {isSelfEnrolled
                        ? "Select your class (1–5) to view your official NCERT learning curriculum."
                        : "Select your class (1–5) and section to view your assigned school learning modules."}
                    </p>

                    {errorMsg && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-500">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <form
                      onSubmit={handleSetupSubmit}
                      className="mt-4 flex flex-wrap items-center gap-4"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-text-secondary">
                          Class
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(Number(e.target.value))}
                          className={`${inputClass} w-auto`}
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              Class {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!isSelfEnrolled && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-secondary">
                            Section
                          </label>
                          <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className={`${inputClass} w-auto`}
                          >
                            {["A", "B", "C", "D"].map((sec) => (
                              <option key={sec} value={sec}>
                                Section {sec}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="self-end">
                        <Button type="submit" variant="primary" size="sm" disabled={isSettingUp}>
                          {isSettingUp
                            ? "Saving..."
                            : isSelfEnrolled
                            ? "Save Class"
                            : "Save Class & Section"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ── 2. Metric Cards Row ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Panel
              flush
              className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[var(--c-line)] p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      Available Modules
                    </h4>
                    <div className="text-xs font-semibold text-text-primary">
                      {isSelfEnrolled ? "NCERT Official Books" : "School Branch Syllabus"}
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-brand">
                  {isSelfEnrolled ? "NCERT" : "School"}
                </span>
              </div>

              <div className="my-4">
                <div className="text-3xl font-extrabold tracking-tight text-text-primary font-[family-name:var(--font-display)]">
                  <AnimatedNumber value={isSelfEnrolled ? ncertBooks.length : modules.length} />
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {isSelfEnrolled ? "NCERT Official Books" : "School Branch Syllabus"}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--c-line)] pt-3 text-xs text-text-tertiary">
                <span>
                  {student.class_number ? `Class ${student.class_number}` : "Class not set"}
                </span>
                <span className="font-semibold text-text-secondary">
                  {isSelfEnrolled ? "Self Enrolled" : "School Enrolled"}
                </span>
              </div>
            </Panel>

            <Panel
              flush
              className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[var(--c-line)] p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                      Learning Format
                    </h4>
                    <div className="text-xs font-semibold text-text-primary">Interactive AI</div>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    quizStatus?.completed
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {quizStatus?.completed ? "Assessed" : "Pending"}
                </span>
              </div>

              <div className="my-4">
                <div className="text-3xl font-extrabold tracking-tight text-text-primary font-[family-name:var(--font-display)]">
                  Interactive AI
                </div>
                <p className="mt-1 text-xs text-emerald-500">
                  PDF Reader &amp; AI Diagnostic Quizzes
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--c-line)] pt-3 text-xs text-text-tertiary">
                <span>Diagnostic Assessment</span>
                <span className="font-semibold text-text-secondary">
                  {quizStatus?.completed ? "Completed" : "Pending"}
                </span>
              </div>
            </Panel>
          </div>

          {/* Learning progress — hidden only when we positively know the
              mandatory diagnostic is still outstanding (lessons are locked
              until then). Offline, quizStatus is null and the panel still
              renders from this device's cached progress. */}
          {!needsSetup && quizStatus?.completed !== false && (
            <LearningProgressPanel student={student} />
          )}
        </div>
      )}

      {/* TAB: MODULES */}
      {activeTab === "modules" && (
        <div>
          {/* Diagnostic Quiz — mandatory gate: modules stay locked until this is done */}
          {!needsSetup && loadingQuizStatus && (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!needsSetup && !loadingQuizStatus && quizStatus && !quizStatus.completed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[var(--radius-lg)] p-6 border border-brand/40 bg-brand/5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand text-white flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-text-primary">
                    Complete Your Diagnostic Assessment to Unlock Learning Modules
                  </h2>
                  <p className="text-xs text-text-secondary mt-1 max-w-lg">
                    Before you can access your {isSelfEnrolled ? "NCERT curriculum" : "learning modules"}, take a
                    short adaptive quiz that finds any weak topics from previous classes. This is a
                    one-time assessment — you won't be asked to retake it.
                  </p>
                  <Link href="/dashboard/diagnostic-quiz" className="inline-block mt-4">
                    <Button variant="primary" size="sm">
                      {quizStatus.in_progress_attempt_id ? "Continue Quiz" : "Start Quiz"}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {!needsSetup && quizStatus?.completed && (
            <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-text-primary font-semibold">Diagnostic Assessment Completed</span>
              </div>
              <Link href="/dashboard/diagnostic-quiz" className="text-xs text-brand font-semibold hover:underline">
                View My Results →
              </Link>
            </div>
          )}

          {!needsSetup && quizStatus?.completed && (
          <>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            <span>
              {isSelfEnrolled
                ? `NCERT Official Curriculum (Class ${student.class_number || 1})`
                : "School-Provided Learning Modules"}
            </span>
          </h2>

          {loadingModules ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isSelfEnrolled ? (
            /* Self-Enrolled NCERT Curriculum Display — subject groups ordered by learning-path priority */
            ncertBooks.length > 0 ? (
              <div className="space-y-6">
                {groupBySubjectPriority(ncertBooks, subjectPriority).map((group, idx) => (
                  <div key={group.subject}>
                    <SubjectGroupHeader
                      subject={group.subject}
                      priorityInfo={group.priorityInfo}
                      isTopPriority={idx === 0}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((book) => (
                        <div
                          key={book.id}
                          className="glass rounded-[var(--radius-md)] p-5 border border-border-primary hover:border-brand transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
                                {book.subject}
                              </span>
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                NCERT Book
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-text-primary">{book.title}</h3>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                              {book.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border-primary/50 flex items-center justify-between">
                            <span className="text-[11px] text-text-tertiary">Official NCERT Standard</span>
                            {book.file_url ? (
                              <a
                                href={formatPdfUrl(book.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Study Book PDF →
                              </a>
                            ) : (
                              <span className="text-xs text-amber-500 font-semibold italic">
                                PDF Pending Upload
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
                <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">Loading NCERT Curriculum</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                  Official NCERT textbooks for Class {student.class_number || 1} are being loaded for your learning roadmap.
                </p>
              </div>
            )
          ) : (
            /* School-Enrolled Modules Display — subject groups ordered by learning-path priority */
            modules.length > 0 ? (
              <div className="space-y-6">
                {groupBySubjectPriority(modules, subjectPriority).map((group, idx) => (
                  <div key={group.subject}>
                    <SubjectGroupHeader
                      subject={group.subject}
                      priorityInfo={group.priorityInfo}
                      isTopPriority={idx === 0}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((mod) => (
                        <div
                          key={mod.id}
                          className="glass rounded-[var(--radius-md)] p-5 border border-border-primary hover:border-brand transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
                                {mod.subject}
                              </span>
                              <span className="text-xs text-text-tertiary">Class {mod.class_number}</span>
                            </div>
                            <h3 className="text-sm font-bold text-text-primary">{mod.title}</h3>
                          </div>

                          {mod.file_url ? (
                            <a
                              href={formatPdfUrl(mod.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Open PDF Module
                            </a>
                          ) : (
                            <span className="mt-4 text-xs text-text-tertiary italic">NCERT Module Content</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state if roles/data are not seeded */
              <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
                <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">No School Modules Uploaded Yet</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                  No learning modules have been uploaded for Class {student.class_number || 1} at your school branch yet.
                </p>
              </div>
            )
          )}
          </>
          )}
        </div>
      )}

      {/* TAB: ASSIGNMENTS */}
      {activeTab === "assignments" && !isSelfEnrolled && <StudentAssignmentsSection />}

      {/* TAB: QUIZZES */}
      {activeTab === "quizzes" && (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center border border-border-primary space-y-3">
          <Sparkles className="w-10 h-10 text-brand mx-auto" />
          <h3 className="text-base font-bold text-text-primary">AI Practice Quizzes</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Adaptive diagnostic questions generated dynamically from your syllabus modules.
          </p>
        </div>
      )}
    </div>
  );
}

function StudentAssignmentsSection() {
  const [assignments, setAssignments] = useState<AssignmentOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackOut | null>>({});

  const fetchStudentAssignments = () => {
    setLoading(true);
    getStudentAssignments()
      .then((res) => {
        setAssignments(res);
        res.forEach((a) => {
          getStudentAssignmentFeedback(a.id)
            .then((fb) => setFeedbacks((prev) => ({ ...prev, [a.id]: fb })))
            .catch(() => {});
        });
      })
      .catch((err) => console.log("Student assignments note:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudentAssignments();
  }, []);

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      await submitStudentAssignment(assignmentId);
      setSubmittedIds((prev) => ({ ...prev, [assignmentId]: true }));
      alert("Assignment submitted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to submit assignment.");
    }
  };

  return (
    <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
        <FileText className="w-4 h-4 text-brand" />
        <span>Class Assignments & Teacher Feedback</span>
      </h3>

      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((asgn) => {
            const isSubmitted = submittedIds[asgn.id];
            const fb = feedbacks[asgn.id];

            return (
              <div key={asgn.id} className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                      {asgn.assignment_type === "pdf_upload" ? "PDF Assignment" : "AI Quiz"}
                    </span>
                    <h4 className="font-bold text-sm text-text-primary mt-1">{asgn.title}</h4>
                    {asgn.description && (
                      <p className="text-xs text-text-secondary mt-1">{asgn.description}</p>
                    )}
                  </div>
                </div>

                {asgn.file_url && (
                  <a
                    href={formatPdfUrl(asgn.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Open PDF Document
                  </a>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border-primary/50 text-xs">
                  {asgn.is_locked ? (
                    <span className="text-rose-500 font-semibold">Locked (Deadline Passed)</span>
                  ) : isSubmitted ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Submitted
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitAssignment(asgn.id)}
                      className="text-xs py-1 px-3"
                    >
                      Submit Assignment
                    </Button>
                  )}
                </div>

                {/* Feedback Display */}
                {fb && (
                  <div className="mt-2 p-3 rounded bg-brand/5 border border-border-brand text-xs space-y-1">
                    <span className="font-bold text-brand block">Teacher Feedback:</span>
                    <p className="text-text-primary">{fb.feedback_text}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">No assignments published for your class section yet.</p>
      )}
    </div>
  );
}

// ── School Dashboard View ────────────────────────────────────────────────────

function SchoolDashboardView({
  school,
  activeTab = "overview",
}: {
  school: SchoolProfile;
  activeTab?: string;
}) {
  const router = useRouter();
  const { jobFor, unwatch, completionNonce } = useModuleProcessing();
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [curriculumSection, setCurriculumSection] = useState<"ncert" | "upload">("ncert");
  const [ncertBooks, setNcertBooks] = useState<NCERTBookOut[]>([]);
  const [loadingNcert, setLoadingNcert] = useState<boolean>(false);
  const [attachingNcertId, setAttachingNcertId] = useState<string | null>(null);
  const [ncertActionMsg, setNcertActionMsg] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [schoolSubjects, setSchoolSubjects] = useState<SchoolSubjectDetail[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleOut | null>(null);
  const [quizSummaries, setQuizSummaries] = useState<StudentQuizSummaryOut[]>([]);
  const [loadingQuizSummaries, setLoadingQuizSummaries] = useState<boolean>(false);
  // Branch-wide, unlike the per-class state above — reuses the same
  // getSchoolTeachers() call the Teacher Management tab already makes, just
  // for the Overview's "Teachers" summary figure.
  const [teacherCount, setTeacherCount] = useState<number | null>(null);

  const fetchNcertBooks = () => {
    setLoadingNcert(true);
    getNCERTBooksForClass(selectedClass)
      .then((res) => setNcertBooks(res))
      .catch((err) => console.log("NCERT books fetch note:", err.message))
      .finally(() => setLoadingNcert(false));
  };

  const handleAddNcertToSchool = async (book: NCERTBookOut) => {
    setAttachingNcertId(book.id);
    try {
      await addNCERTModuleToSchool(book.class_number, book.id, book.title);
      setNcertActionMsg(`"${book.title}" imported to Class ${book.class_number} school modules!`);
      fetchModules();
      setTimeout(() => setNcertActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to import NCERT book to modules.");
    } finally {
      setAttachingNcertId(null);
    }
  };

  const fetchModules = () => {
    setLoadingModules(true);
    getSchoolClassModules(selectedClass)
      .then((res) => setModules(res))
      .catch((err) => console.log("School module fetch note:", err.message))
      .finally(() => setLoadingModules(false));
  };

  const fetchSubjects = () => {
    setLoadingSubjects(true);
    getSchoolSubjects(selectedClass)
      .then((res) => setSchoolSubjects(res))
      .catch((err) => console.log("School subjects fetch note:", err.message))
      .finally(() => setLoadingSubjects(false));
  };

  const fetchQuizSummaries = () => {
    setLoadingQuizSummaries(true);
    getSchoolClassQuizSummaries(selectedClass)
      .then((res) => setQuizSummaries(res))
      .catch((err) => console.log("Class quiz summaries fetch note:", err.message))
      .finally(() => setLoadingQuizSummaries(false));
  };

  // `completionNonce` changes when a background extraction reaches a result, so
  // the list re-reads the module records without polling on its own.
  useEffect(() => {
    if (activeTab === "modules" || activeTab === "overview") {
      fetchModules();
      fetchSubjects();
      fetchQuizSummaries();
      fetchNcertBooks();
    }
  }, [selectedClass, activeTab, completionNonce]);

  // Branch-wide, so it only needs fetching once per Overview visit — not on
  // every selectedClass change like the per-class data above.
  useEffect(() => {
    if (activeTab !== "overview") return;
    getSchoolTeachers()
      .then((res) => setTeacherCount(res.length))
      .catch((err) => console.log("School teacher count fetch note:", err.message));
  }, [activeTab]);

  /** Live job status wins over the record fetched with the list. */
  const statusOf = (mod: ModuleOut): ModuleDisplayStatus =>
    jobFor(mod.id)?.status ?? mod.ocr_status ?? "na";

  const classSubjects = schoolSubjects.filter((s) => s.class_number === selectedClass);
  const diagnosticCompletedCount = quizSummaries.filter((s) => s.completed).length;
  const diagnosticCompletionPct =
    quizSummaries.length > 0
      ? Math.round((diagnosticCompletedCount / quizSummaries.length) * 100)
      : 0;

  // Chart inputs, all folded from quizSummaries — the same rows the roster
  // below renders. Nothing here reaches for data that isn't already on screen.
  const diagnosticSegments: Segment[] = [
    {
      label: "Completed",
      value: diagnosticCompletedCount,
      color: "var(--accent-emerald)",
    },
    {
      label: "Not completed yet",
      value: quizSummaries.length - diagnosticCompletedCount,
      color: "var(--c-line-strong)",
    },
  ];

  const scoredSummaries = quizSummaries.filter(
    (s) => s.completed && s.overall_score !== null
  );
  const scoreBands = [
    {
      label: "70% and above",
      value: scoredSummaries.filter((s) => (s.overall_score ?? 0) >= 70).length,
      color: "var(--accent-emerald)",
    },
    {
      label: "40% to 69%",
      value: scoredSummaries.filter(
        (s) => (s.overall_score ?? 0) >= 40 && (s.overall_score ?? 0) < 70
      ).length,
      color: "var(--accent-amber)",
    },
    {
      label: "Below 40%",
      value: scoredSummaries.filter((s) => (s.overall_score ?? 0) < 40).length,
      color: "var(--accent-rose)",
    },
  ];

  const unassignedModules = modules.filter(
    (m) =>
      !classSubjects.some(
        (s) =>
          s.subject.trim().toLowerCase() === (m.subject || "").trim().toLowerCase()
      )
  );

  return (
    <ConsoleMotion>
      <div className="space-y-6">
        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ── 1. Hero: Vibrant Institutional Welcome Banner ───────────── */}
            <Hero
              variant="vibrant"
              eyebrow={
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{school.branch_name} Branch</span>
                  <span className="opacity-40">•</span>
                  <span>
                    Prefix: <span className="font-mono underline font-bold">{school.student_prefix}</span>
                  </span>
                </span>
              }
              title={`Welcome back, ${school.school_name}!`}
              subtitle={
                <p>
                  Institutional oversight for <span className="text-white font-semibold">{school.state || "National"}</span> branch.
                  Manage academic syllabus modules, review student diagnostic assessments, and track learning progress across Classes 1–5.
                </p>
              }
              illustration={<SchoolIllustration className="h-[180px] w-[285px] drop-shadow-xl" />}
              facts={
                <>
                  <HeroFact
                    label="Teachers"
                    value={teacherCount !== null ? <AnimatedNumber value={teacherCount} /> : "—"}
                    hint="Registered in branch"
                    variant="vibrant"
                  />
                  <HeroFact
                    label="Students"
                    value={<AnimatedNumber value={quizSummaries.length} />}
                    hint={`Class ${selectedClass} roster`}
                    variant="vibrant"
                  />
                  <HeroFact
                    label="Curriculum Modules"
                    value={<AnimatedNumber value={modules.length} />}
                    hint={`${classSubjects.length} subject${
                      classSubjects.length === 1 ? "" : "s"
                    } configured`}
                    variant="vibrant"
                  />
                  <HeroFact
                    label="Syllabus Coverage"
                    value="Classes 1–5"
                    hint="Active curriculum"
                    variant="vibrant"
                  />
                </>
              }
            />

            {/* ── 2. Top Metric Cards Row (EduSpot & SkillSet Inspired) ─────────── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Card 1: Diagnostic Assessment Goal */}
              <Panel flush className="p-5 rounded-[18px] border border-[var(--c-line)] shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                        Diagnostic Goal
                      </h4>
                      <div className="text-xs font-semibold text-text-primary">
                        Class {selectedClass} Assessment
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      diagnosticCompletionPct >= 70
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : diagnosticCompletionPct > 0
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    }`}
                  >
                    {diagnosticCompletionPct >= 70
                      ? "High Completion"
                      : diagnosticCompletionPct > 0
                      ? "In Progress"
                      : "Pending"}
                  </span>
                </div>

                <div className="my-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold text-text-primary tracking-tight font-[family-name:var(--font-display)]">
                      {diagnosticCompletionPct}%
                    </div>
                    <p className="text-xs text-text-secondary">
                      {diagnosticCompletedCount} of {quizSummaries.length} students assessed
                    </p>
                  </div>
                  <div className="shrink-0">
                    <DonutChart
                      size={76}
                      thickness={9}
                      segments={diagnosticSegments}
                      centerLabel={`${diagnosticCompletionPct}%`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--c-line)] flex items-center justify-between text-xs text-text-tertiary">
                  <span>Class {selectedClass} Cohort</span>
                  <span className="font-semibold text-text-secondary">
                    {quizSummaries.length - diagnosticCompletedCount} remaining
                  </span>
                </div>
              </Panel>

              {/* Card 2: Performance Mastery & Score Bands */}
              <Panel flush className="p-5 rounded-[18px] border border-[var(--c-line)] shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-brand flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                        Performance Health
                      </h4>
                      <div className="text-xs font-semibold text-text-primary">
                        Score Distribution
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-text-tertiary">
                    {scoredSummaries.length} Scored
                  </span>
                </div>

                <div className="my-4 space-y-2.5">
                  {scoredSummaries.length > 0 ? (
                    <BarList data={scoreBands} max={scoredSummaries.length} valueSuffix="" />
                  ) : (
                    <div className="py-3 text-center text-xs text-text-tertiary italic">
                      Diagnostic scores appear as students complete tests.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--c-line)] flex items-center justify-between text-xs text-text-tertiary">
                  <span>Mastery Benchmark</span>
                  <span className="font-semibold text-emerald-600">
                    {scoredSummaries.filter((s) => (s.overall_score ?? 0) >= 70).length} at 70%+
                  </span>
                </div>
              </Panel>

              {/* Card 3: Class Subject Matrix & Syllabus */}
              <Panel flush className="p-5 rounded-[18px] border border-[var(--c-line)] shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                        Curriculum Matrix
                      </h4>
                      <div className="text-xs font-semibold text-text-primary">
                        Class {selectedClass} Syllabus
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full border border-brand/20">
                    {modules.length} Modules
                  </span>
                </div>

                <div className="my-3">
                  {classSubjects.length > 0 ? (
                    <div className="max-h-[104px] space-y-1.5 overflow-y-auto pr-1">
                      {classSubjects.map((sub) => {
                        const count = modules.filter(
                          (m) =>
                            (m.subject || "").trim().toLowerCase() ===
                            sub.subject.trim().toLowerCase()
                        ).length;
                        return (
                          <div
                            key={sub.id || sub.subject}
                            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--c-line)] bg-[var(--c-sunken)] px-2.5 py-1.5"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium text-text-primary">
                                {sub.subject}
                              </div>
                              {sub.publisher_name && (
                                <div className="truncate text-[10px] text-text-tertiary">
                                  {sub.publisher_name}
                                </div>
                              )}
                            </div>
                            <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-brand/15 px-1 text-[10px] font-bold text-brand">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-3 text-center text-xs text-text-tertiary italic">
                      No subjects configured yet for Class {selectedClass}.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--c-line)] flex items-center justify-between text-xs text-text-tertiary">
                  <span>NCERT & School Uploads</span>
                  <button
                    onClick={() => {
                      const tabBtn = document.querySelector('[id*="modules"]') as HTMLElement;
                      if (tabBtn) tabBtn.click();
                      else router.push("/dashboard?tab=modules");
                    }}
                    className="font-bold text-brand hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
              </Panel>
            </div>

            {/* ── 3. Cohort roster — full width, since its analytics now live
                   in the three cards above rather than being repeated in a
                   duplicate sidebar rail. ──────────────────────────────── */}
            <Panel flush className="overflow-hidden rounded-[20px] border border-[var(--c-line)] shadow-xs">
              <PanelHead
                icon={Target}
                title={`Class ${selectedClass} Diagnostic Results`}
                description="Student gap-identification outcomes and AI summaries for the selected class."
                actions={
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs font-semibold text-text-tertiary sm:inline">
                      Select Class:
                    </span>
                    <Segmented
                      idPrefix="school-overview-class"
                      value={selectedClass}
                      onChange={(cls) => setSelectedClass(cls)}
                      options={[1, 2, 3, 4, 5].map((cls) => ({
                        value: cls,
                        label: `Class ${cls}`,
                      }))}
                    />
                  </div>
                }
              />

              {loadingQuizSummaries ? (
                <Loading label={`Loading Class ${selectedClass} diagnostic results…`} />
              ) : quizSummaries.length > 0 ? (
                <Stagger className="divide-y divide-[var(--c-line)]">
                  {quizSummaries.map((s) => (
                    <Item
                      key={s.student_unique_number}
                      className="console-row px-5 py-4 transition-colors hover:bg-[var(--c-sunken)]/60"
                    >
                      {/* Fixed measure columns rather than a single flex row, so
                          scores stay aligned down the page at full width. */}
                      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_150px_260px] lg:items-center lg:gap-6">
                        {/* Identity */}
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div
                            className="h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center font-mono text-xs font-bold"
                            style={{
                              borderColor: s.completed
                                ? `color-mix(in srgb, ${scoreColor(s.overall_score)} 35%, transparent)`
                                : "var(--c-line)",
                              background: s.completed
                                ? `color-mix(in srgb, ${scoreColor(s.overall_score)} 12%, transparent)`
                                : "var(--c-sunken)",
                              color: s.completed ? scoreColor(s.overall_score) : "var(--text-tertiary)",
                            }}
                          >
                            {s.student_unique_number.slice(-3) || "STD"}
                          </div>

                          <div className="min-w-0">
                            <Code className="text-xs font-bold text-text-primary">
                              {s.student_unique_number}
                            </Code>
                            <div className="mt-1 truncate text-xs text-text-secondary">
                              {s.student_email}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          {s.completed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              <CheckCircle className="h-3 w-3" /> Assessed
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                              Awaiting Test
                            </span>
                          )}
                        </div>

                        {/* Outcome */}
                        {s.completed ? (
                          <div className="flex items-center justify-start gap-3.5 lg:justify-end">
                            {s.gaps_found > 0 && (
                              <Chip tone="amber" className="shrink-0 text-xs font-semibold">
                                {s.gaps_found} gap{s.gaps_found === 1 ? "" : "s"} found
                              </Chip>
                            )}
                            {s.overall_score !== null && (
                              <div className="flex items-center gap-2">
                                <Meter
                                  className="h-2.5 w-24 rounded-full"
                                  value={s.overall_score}
                                  tone={
                                    s.overall_score >= 70
                                      ? "emerald"
                                      : s.overall_score >= 40
                                      ? "amber"
                                      : "rose"
                                  }
                                />
                                <span className="console-num w-12 text-right text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                                  {s.overall_score}%
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-text-tertiary lg:text-right">
                            Diagnostic in progress
                          </span>
                        )}
                      </div>

                      {s.ai_summary_status === "ready" && s.ai_summary && (
                        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-brand/15 bg-brand/[0.04] p-3 text-xs leading-relaxed text-text-secondary">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                          <div>
                            <span className="mr-1 font-bold text-text-primary">
                              AI Diagnostic Insight:
                            </span>
                            {s.ai_summary}
                          </div>
                        </div>
                      )}
                      {s.completed && s.ai_summary_status === "pending" && (
                        <p className="mt-2 flex items-center gap-1.5 text-[10px] italic text-text-tertiary">
                          <Loader2 className="h-3 w-3 animate-spin text-brand" />
                          Analyzing learning gaps and generating summary...
                        </p>
                      )}
                    </Item>
                  ))}
                </Stagger>
              ) : (
                <EmptyState icon={Target} title={`No Students in Class ${selectedClass} Yet`}>
                  Once students register under this branch and select Class {selectedClass}, their
                  diagnostic quiz results and AI gap summaries will appear here.
                </EmptyState>
              )}
            </Panel>
          </div>
        )}

        {/* TAB: MODULES */}
        {activeTab === "modules" && (
          <div>
            <SectionHead
              icon={Building2}
              title="Class Curriculum & Learning Modules"
              description="Manage official NCERT textbooks, upload school-specific syllabus modules, and view extracted OCR content for students."
              actions={
                <Segmented
                  idPrefix="school-class"
                  value={selectedClass}
                  onChange={(cls) => setSelectedClass(cls)}
                  options={[1, 2, 3, 4, 5].map((cls) => ({
                    value: cls,
                    label: `Class ${cls}`,
                  }))}
                />
              }
            />

            {/* SUB-SECTIONS: A. NCERT BOOKS  vs  B. UPLOAD MODULES */}
            <div className="border-b border-[var(--c-line)] pb-4 mb-5">
              <Segmented
                idPrefix="curriculum-subtab"
                value={curriculumSection}
                onChange={(val) => setCurriculumSection(val as "ncert" | "upload")}
                options={[
                  { value: "ncert", label: `NCERT Books (Class ${selectedClass})` },
                  { value: "upload", label: `Upload Modules (Class ${selectedClass})` },
                ]}
              />
            </div>

            {/* SECTION A: NCERT BOOKS */}
            {curriculumSection === "ncert" && (
              <div className="space-y-4">
                <AnimatePresence>
                  {ncertActionMsg && (
                    <Notice tone="emerald" icon={CheckCircle} onDismiss={() => setNcertActionMsg(null)}>
                      {ncertActionMsg}
                    </Notice>
                  )}
                </AnimatePresence>

                {loadingNcert ? (
                  <Panel flush>
                    <Loading label={`Loading Class ${selectedClass} NCERT books…`} />
                  </Panel>
                ) : ncertBooks.length > 0 ? (
                  <Panel flush className="overflow-hidden">
                    <PanelHead
                      icon={BookOpen}
                      title={`Official NCERT Textbooks for Class ${selectedClass}`}
                      description={`${ncertBooks.length} pre-loaded syllabus books available from the national curriculum`}
                    />
                    <Stagger className="divide-y divide-[var(--c-line)]">
                      {ncertBooks.map((book) => {
                        const isAttached = modules.some(
                          (m) =>
                            m.ncert_book_id === book.id ||
                            (m.source_type === "ncert" &&
                              m.title.trim().toLowerCase() === book.title.trim().toLowerCase())
                        );

                        return (
                          <Item
                            key={book.id}
                            className="console-row group flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-4"
                          >
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--c-line)] bg-[var(--c-sunken)] text-text-tertiary">
                              <BookOpen className="h-4.5 w-4.5 text-brand" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Chip tone="brand">{book.subject}</Chip>
                                <Chip tone="neutral">Class {book.class_number}</Chip>
                                {book.file_url ? (
                                  <Chip tone="emerald">PDF Document Available</Chip>
                                ) : (
                                  <Chip tone="neutral">Official Standard</Chip>
                                )}
                              </div>
                              <h4 className="truncate text-sm font-semibold text-text-primary font-[family-name:var(--font-display)]">
                                {book.title}
                              </h4>
                              {book.description && (
                                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                                  {book.description}
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-3 pt-2 lg:pt-0">
                              {book.file_url ? (
                                <a
                                  href={formatPdfUrl(book.file_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  View PDF
                                </a>
                              ) : (
                                <span className="text-[11px] italic text-text-tertiary">
                                  Text Only
                                </span>
                              )}

                              {isAttached ? (
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  In School Modules
                                </span>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={attachingNcertId === book.id}
                                  onClick={() => handleAddNcertToSchool(book)}
                                  className="text-xs"
                                >
                                  {attachingNcertId === book.id ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="mr-1.5 h-3.5 w-3.5 text-brand" />
                                  )}
                                  Import to School Modules
                                </Button>
                              )}
                            </div>
                          </Item>
                        );
                      })}
                    </Stagger>
                  </Panel>
                ) : (
                  <Panel flush>
                    <EmptyState
                      icon={BookOpen}
                      title={`No NCERT Books for Class ${selectedClass}`}
                    >
                      No pre-loaded NCERT textbooks were found for Class {selectedClass}.
                    </EmptyState>
                  </Panel>
                )}
              </div>
            )}

            {/* SECTION B: UPLOAD MODULES */}
            {curriculumSection === "upload" && (
              <div className="space-y-4">
                {/* Subject-Wise Curriculum Sections */}
                {loadingModules || loadingSubjects ? (
                  <Panel flush>
                    <Loading label={`Loading Class ${selectedClass} subjects & modules…`} />
                  </Panel>
                ) : classSubjects.length > 0 ? (
                  <div className="space-y-4">
                    {classSubjects.map((sub) => {
                      const subModules = modules.filter(
                        (m) =>
                          (m.subject || "").trim().toLowerCase() === sub.subject.trim().toLowerCase()
                      );

                      return (
                        <Reveal key={sub.id || sub.subject}>
                          <Panel flush className="overflow-hidden">
                            <PanelHead
                              title={
                                <span className="flex flex-wrap items-center gap-2">
                                  <span>{sub.subject}</span>
                                  {sub.publisher_name && (
                                    <Chip tone="brand">{sub.publisher_name}</Chip>
                                  )}
                                </span>
                              }
                              description={
                                <>
                                  Class {selectedClass} · {subModules.length}{" "}
                                  {subModules.length === 1 ? "Chapter / PDF" : "Chapters / PDFs"}{" "}
                                  uploaded
                                </>
                              }
                              icon={BookOpen}
                              actions={
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/modules/upload?class=${selectedClass}&subject=${encodeURIComponent(
                                        sub.subject
                                      )}`
                                    )
                                  }
                                  className="text-xs"
                                >
                                  <Plus className="mr-1 h-3.5 w-3.5 text-brand" />
                                  Upload PDF for {sub.subject}
                                </Button>
                              }
                            />

                            {/* Modules Under This Subject */}
                            {subModules.length > 0 ? (
                              <Stagger className="divide-y divide-[var(--c-line)]">
                                {subModules.map((mod) => {
                                  const status = statusOf(mod);
                                  const job = jobFor(mod.id);
                                  const ocrPdfUrl = job?.ocrPdfUrl ?? mod.ocr_pdf_url ?? null;

                                  return (
                                    <Item
                                      key={mod.id}
                                      className="console-row group flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center lg:gap-4"
                                    >
                                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[var(--c-line)] bg-[var(--c-sunken)] text-text-tertiary">
                                        <FileText className="h-4 w-4" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <span className="console-eyebrow">Chapter / Material</span>
                                        <h4 className="mt-0.5 truncate text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
                                          {mod.title}
                                        </h4>
                                        {status === "failed" && (
                                          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                                            Text could not be extracted. Re-upload to run extraction
                                            again.
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                                        <ModuleStatusBadge
                                          status={status}
                                          title={job?.message ?? undefined}
                                        />

                                        {mod.file_url ? (
                                          <a
                                            href={formatPdfUrl(mod.file_url)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                                          >
                                            <FileText className="h-3 w-3" />
                                            View PDF
                                          </a>
                                        ) : (
                                          <span className="text-[11px] italic text-text-tertiary">
                                            No File
                                          </span>
                                        )}

                                        {status === "done" && ocrPdfUrl && (
                                          <a
                                            href={formatPdfUrl(ocrPdfUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                                          >
                                            <Layers className="h-3 w-3" />
                                            Extracted Text
                                          </a>
                                        )}

                                        {status === "failed" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              router.push(
                                                `/dashboard/modules/upload?class=${mod.class_number}&replace=${mod.id}`
                                              )
                                            }
                                            className="px-2 py-1 text-[10px]"
                                          >
                                            <RefreshCw className="mr-1 h-3 w-3" />
                                            Retry
                                          </Button>
                                        )}

                                        <button
                                          onClick={() => setModuleToDelete(mod)}
                                          className="cursor-pointer rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-rose-500/10 hover:text-rose-500 lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
                                          title={`Delete "${mod.title}"`}
                                          aria-label={`Delete ${mod.title}`}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </Item>
                                  );
                                })}
                              </Stagger>
                            ) : (
                              <div
                                onClick={() =>
                                  router.push(
                                    `/dashboard/modules/upload?class=${selectedClass}&subject=${encodeURIComponent(
                                      sub.subject
                                    )}`
                                  )
                                }
                                className="group m-4 cursor-pointer space-y-2 rounded-[var(--c-radius)] border border-dashed border-[var(--c-line-strong)] bg-[var(--c-sunken)] p-6 text-center transition-colors hover:border-brand/50 hover:bg-brand/[0.03]"
                              >
                                <div className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-[var(--c-line)] bg-[var(--c-panel)] text-text-tertiary transition-colors group-hover:border-brand/40 group-hover:text-brand">
                                  <Upload className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-semibold text-text-secondary group-hover:text-text-primary">
                                  No PDF chapters uploaded yet for {sub.subject}
                                </p>
                                <p className="mx-auto max-w-xs text-[11px] text-text-tertiary">
                                  Click to upload textbook chapters or study notes for Class{" "}
                                  {selectedClass} students.
                                </p>
                              </div>
                            )}
                          </Panel>
                        </Reveal>
                      );
                    })}

                    {/* Unassigned / General Modules Section if any */}
                    {unassignedModules.length > 0 && (
                      <Reveal>
                        <Panel flush className="overflow-hidden">
                          <PanelHead
                            icon={Layers}
                            title="Additional / General Modules"
                            description={`${unassignedModules.length} module(s) not mapped to specific registered subjects`}
                          />

                          <Stagger className="divide-y divide-[var(--c-line)]">
                            {unassignedModules.map((mod) => {
                              const status = statusOf(mod);
                              const job = jobFor(mod.id);
                              const ocrPdfUrl = job?.ocrPdfUrl ?? mod.ocr_pdf_url ?? null;

                              return (
                                <Item
                                  key={mod.id}
                                  className="console-row group flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center lg:gap-4"
                                >
                                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[var(--c-line)] bg-[var(--c-sunken)] text-text-tertiary">
                                    <FileText className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <span className="console-eyebrow">{mod.subject || "General"}</span>
                                    <h4 className="mt-0.5 truncate text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
                                      {mod.title}
                                    </h4>
                                  </div>

                                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                                    <ModuleStatusBadge
                                      status={status}
                                      title={job?.message ?? undefined}
                                    />

                                    {mod.file_url ? (
                                      <a
                                        href={formatPdfUrl(mod.file_url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                                      >
                                        <FileText className="h-3 w-3" />
                                        View PDF
                                      </a>
                                    ) : (
                                      <span className="text-[11px] italic text-text-tertiary">
                                        No File
                                      </span>
                                    )}

                                    {status === "done" && ocrPdfUrl && (
                                      <a
                                        href={formatPdfUrl(ocrPdfUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                                      >
                                        <Layers className="h-3 w-3" />
                                        Extracted Text
                                      </a>
                                    )}

                                    <button
                                      onClick={() => setModuleToDelete(mod)}
                                      className="cursor-pointer rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-rose-500/10 hover:text-rose-500 lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
                                      title={`Delete "${mod.title}"`}
                                      aria-label={`Delete ${mod.title}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </Item>
                              );
                            })}
                          </Stagger>
                        </Panel>
                      </Reveal>
                    )}
                  </div>
                ) : (
                  <Panel flush>
                    <EmptyState
                      icon={BookOpen}
                      title={`No Subjects Registered for Class ${selectedClass}`}
                      action={
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/modules/upload?class=${selectedClass}`)
                          }
                          className="text-xs"
                        >
                          <Upload className="mr-1 h-3.5 w-3.5" />
                          Upload Module
                        </Button>
                      }
                    >
                      Upload your curriculum books or worksheets as PDFs to make content available for
                      Class {selectedClass} students &amp; AI quizzes.
                    </EmptyState>
                  </Panel>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: ADMINISTRATOR REQUESTS (school verification — owner approval) */}
        {activeTab === "admin-requests" && <AdminRequestsPanel />}

        {/* TAB: TEACHER MANAGEMENT */}
        {activeTab === "teachers" && <SchoolTeacherManagement />}

        {/* DELETE MODULE CONFIRMATION */}
        {moduleToDelete && (
          <DeleteModuleDialog
            module={moduleToDelete}
            classNumber={moduleToDelete.class_number}
            isProcessing={isProcessing(statusOf(moduleToDelete))}
            onClose={() => setModuleToDelete(null)}
            onDeleted={(moduleId) => {
              unwatch(moduleId);
              setModuleToDelete(null);
              setModules((prev) => prev.filter((m) => m.id !== moduleId));
              fetchModules();
            }}
          />
        )}
      </div>
    </ConsoleMotion>
  );
}

// ── Parent Dashboard View ────────────────────────────────────────────────────


function ParentDashboardView({
  parent,
  activeTab = "overview",
}: {
  parent: ParentProfile;
  activeTab?: string;
}) {
  const [childrenList, setChildrenList] = useState<ChildLinkOut[]>([]);
  const [loadingChildren, setLoadingChildren] = useState<boolean>(true);
  const [newStudentId, setNewStudentId] = useState<string>("");
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const fetchChildren = () => {
    setLoadingChildren(true);
    getParentChildren()
      .then((res) => setChildrenList(res))
      .catch((err) => console.log("Parent children fetch note:", err.message))
      .finally(() => setLoadingChildren(false));
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim()) return;

    setIsLinking(true);
    setLinkError(null);
    try {
      await addParentChild({ student_unique_number: newStudentId.trim().toUpperCase() });
      setNewStudentId("");
      fetchChildren();
    } catch (err: any) {
      setLinkError(err.message || "Failed to link child.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <ConsoleMotion>
      <div className="space-y-6">
        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ── 1. Hero: Vibrant Guardian Welcome Banner ─────────────────── */}
            <Hero
              variant="vibrant"
              eyebrow={
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Guardian</span>
                  <span className="opacity-40">•</span>
                  <span className="font-mono font-bold underline">
                    {parent.phone_number || parent.email || "Registered Guardian"}
                  </span>
                </span>
              }
              title={`Welcome, ${parent.full_name || "Parent"}!`}
              subtitle={
                <p>
                  Follow every ward&apos;s learning in one place — school and NCERT modules,
                  diagnostic results, and direct remarks from their teachers.
                </p>
              }
              illustration={
                <ParentChildIllustration className="h-[180px] w-[285px] drop-shadow-xl" />
              }
              facts={
                <>
                  <HeroFact
                    label="Monitored Wards"
                    value={<AnimatedNumber value={childrenList.length} />}
                    hint="Registered Students"
                    variant="vibrant"
                  />
                  <HeroFact
                    label="Progress Tracking"
                    value="Active"
                    hint="Syncing School & NCERT Modules"
                    variant="vibrant"
                  />
                  <HeroFact
                    label="Guardian Feedback"
                    value="Connected"
                    hint="Direct Teacher Remarks & Alerts"
                    variant="vibrant"
                  />
                </>
              }
            />

            {/* Wards Overview Section */}
            <div>
              <SectionHead
                icon={Users}
                title="Your Wards / Children"
                actions={
                  childrenList.length > 0 ? (
                    <span className="text-xs text-text-tertiary">
                      Showing {childrenList.length} linked student(s)
                    </span>
                  ) : undefined
                }
              />

              {loadingChildren ? (
                <Panel flush className="rounded-[20px] border border-[var(--c-line)] shadow-xs">
                  <Loading />
                </Panel>
              ) : childrenList.length > 0 ? (
                <Stagger className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {childrenList.map((child) => {
                    const isSelf =
                      child.enrollment_type === "self" || child.branch_name === "SELF";
                    return (
                      <Item key={child.id}>
                        {/* Same card anatomy as the admin metric cards: icon-tile
                            header with a status pill, a body, then a hairline
                            footer carrying the secondary facts. */}
                        <Panel
                          flush
                          className="console-lift flex h-full flex-col justify-between overflow-hidden rounded-[18px] border border-[var(--c-line)] p-5 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/10 text-sm font-bold text-brand font-[family-name:var(--font-display)]">
                                {(child.full_name || child.student_unique_number)
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-bold leading-tight text-text-primary font-[family-name:var(--font-display)]">
                                  {child.full_name || `Student #${child.student_unique_number}`}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <Code>{child.student_unique_number}</Code>
                                  <Chip tone={isSelf ? "violet" : "brand"}>
                                    {isSelf ? "Self Enrolled" : "School Enrolled"}
                                  </Chip>
                                </div>
                              </div>
                            </div>

                            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Monitoring
                            </span>
                          </div>

                          <div className="my-4 divide-y divide-[var(--c-line)]">
                            <Field label="Class & Section:">
                              {child.class_number
                                ? isSelf
                                  ? `Class ${child.class_number} (Self)`
                                  : `Class ${child.class_number} - Section ${child.section || "A"}`
                                : "Class not set"}
                            </Field>
                            <Field label="School / Branch:">
                              {isSelf
                                ? "NCERT Self-Educated"
                                : `${child.school_name || "School"} (${
                                    child.branch_name || "Branch"
                                  })`}
                            </Field>
                          </div>

                          <div className="flex items-center justify-between border-t border-[var(--c-line)] pt-3 text-xs text-text-tertiary">
                            <span>Linked:</span>
                            <span className="console-num font-semibold text-text-secondary">
                              {new Date(child.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Panel>
                      </Item>
                    );
                  })}
                </Stagger>
              ) : (
                <Panel flush className="rounded-[20px] border border-[var(--c-line)] shadow-xs">
                  <EmptyState icon={Users} title="No Wards Linked Yet">
                    Students who register with your mobile number will automatically appear here.
                    You can also link a child directly using their Unique Student ID.
                  </EmptyState>
                </Panel>
              )}
            </div>
          </div>
        )}

        {/* TAB: CHILDREN */}
        {activeTab === "children" && (
          <div className="space-y-6">
            {/* Add Child Link Form */}
            <Panel flush className="overflow-hidden">
              <PanelHead
                icon={Plus}
                title="Link an Additional Child"
                description="Enter your child's Unique Student ID (e.g. LKD0001) to link their learning progress to your dashboard."
              />

              <div className="p-5">
                <AnimatePresence>
                  {linkError && (
                    <div className="mb-4">
                      <Notice tone="rose" icon={AlertCircle}>
                        {linkError}
                      </Notice>
                    </div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleAddChild} className="flex max-w-md gap-3">
                  <input
                    type="text"
                    placeholder="Unique Student ID (e.g. LKD0001)"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value.toUpperCase())}
                    className={`${inputClass} font-mono uppercase tracking-wide`}
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={isLinking}>
                    {isLinking ? "Linking..." : "Link Child"}
                  </Button>
                </form>
              </div>
            </Panel>

            {/* Linked Children List */}
            <div>
              <SectionHead icon={Users} title="Your Linked Children & Wards" />

              {loadingChildren ? (
                <Panel flush>
                  <Loading />
                </Panel>
              ) : childrenList.length > 0 ? (
                <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {childrenList.map((child) => (
                    <Item key={child.id}>
                      <Panel flush className="console-lift flex h-full flex-col overflow-hidden">
                        <div className="flex items-start gap-3 px-5 py-4">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--c-radius)] border border-brand/20 bg-brand/8 text-brand">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold leading-tight text-text-primary font-[family-name:var(--font-display)]">
                              {child.full_name || `Student #${child.student_unique_number}`}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Code>{child.student_unique_number}</Code>
                              <Chip tone="neutral">
                                {child.enrollment_type === "self" || child.branch_name === "SELF"
                                  ? "Self Enrolled"
                                  : "School Enrolled"}
                              </Chip>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 divide-y divide-[var(--c-line)] border-t border-[var(--c-line)] px-5 py-2">
                          <Field label="Enrolled Class:">
                            {child.class_number
                              ? child.enrollment_type === "self" || child.branch_name === "SELF"
                                ? `Class ${child.class_number}`
                                : `Class ${child.class_number} - Section ${child.section || "A"}`
                              : "Not Configured"}
                          </Field>

                          <Field label="School / Institution:">
                            {child.enrollment_type === "self" || child.branch_name === "SELF"
                              ? "NCERT Self-Educated"
                              : `${child.school_name || "School"} (${child.branch_name || "Branch"})`}
                          </Field>

                          <Field label="Linked Date:">
                            <span className="console-num text-text-secondary">
                              {new Date(child.created_at).toLocaleDateString()}
                            </span>
                          </Field>
                        </div>
                      </Panel>
                    </Item>
                  ))}
                </Stagger>
              ) : (
                <Panel flush>
                  <EmptyState icon={Users} title="No Linked Children Found">
                    Link your child using their Unique Student ID above to monitor their academic
                    performance and adaptive learning progress.
                  </EmptyState>
                </Panel>
              )}
            </div>
          </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <SectionHead
              icon={Award}
              title="Academic Reports & Progress Analytics"
              description="Diagnostic quiz performance, gap topics, and AI-generated summaries for each linked child."
            />

            {loadingChildren ? (
              <Panel flush>
                <Loading />
              </Panel>
            ) : childrenList.length > 0 ? (
              <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {childrenList.map((child) => (
                  <Item key={child.id}>
                    <ChildCard child={child} />
                  </Item>
                ))}
              </Stagger>
            ) : (
              <Panel flush>
                <EmptyState icon={Users} title="No Wards Linked Yet">
                  Link a child from the Children tab to see their diagnostic assessment results
                  here.
                </EmptyState>
              </Panel>
            )}
          </div>
        )}
      </div>
    </ConsoleMotion>
  );
}

// ── Child Card (with diagnostic quiz summary) ────────────────────────────────

function ChildCard({ child }: { child: ChildLinkOut }) {
  const [result, setResult] = useState<GapReportOut | null>(null);
  const [loadingResult, setLoadingResult] = useState<boolean>(true);

  useEffect(() => {
    getChildQuizResult(child.student_unique_number)
      .then((res) => setResult(res))
      .catch((err) => console.log("Child quiz result fetch note:", err.message))
      .finally(() => setLoadingResult(false));
  }, [child.student_unique_number]);

  return (
    <Panel flush className="console-lift flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--c-line)] px-5 py-3.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-brand/20 bg-brand/8 text-[10px] font-bold text-brand">
          ID
        </div>
        <Code>{child.student_unique_number}</Code>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-text-secondary">
          Linked on {new Date(child.created_at).toLocaleDateString()}
        </p>

        <div className="mt-4 border-t border-[var(--c-line)] pt-4">
          <span className="console-eyebrow">Gap Identification Quiz</span>

          {loadingResult ? (
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-[var(--c-sunken)]" />
          ) : result === null ? (
            <p className="mt-1.5 text-xs text-text-secondary">Not completed yet.</p>
          ) : (
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="console-num text-2xl font-semibold tracking-[-0.02em] text-text-primary font-[family-name:var(--font-display)]">
                  {result.overall_score !== null ? `${result.overall_score}%` : "—"}
                </span>
                <span className="text-[10px] text-text-tertiary">overall score</span>
              </div>

              {result.overall_score !== null && (
                <Meter
                  className="mt-2"
                  value={result.overall_score}
                  tone={
                    result.overall_score >= 70
                      ? "emerald"
                      : result.overall_score >= 40
                      ? "amber"
                      : "rose"
                  }
                />
              )}

              {result.gaps.length === 0 ? (
                <p className="mt-2 text-xs font-medium text-emerald-500">No gaps found.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.gaps.slice(0, 3).map((gap) => (
                    <Chip key={gap.topic_code} tone="amber">
                      {gap.subject}: Class {gap.originating_class}
                    </Chip>
                  ))}
                  {result.gaps.length > 3 && (
                    <span className="self-center text-[10px] text-text-tertiary">
                      +{result.gaps.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {result.ai_summary_status === "ready" && result.ai_summary && (
                <p className="mt-3 border-t border-[var(--c-line)] pt-3 text-xs leading-relaxed text-text-secondary">
                  {result.ai_summary}
                </p>
              )}
              {result.ai_summary_status === "pending" && (
                <p className="mt-2 text-[10px] italic text-text-tertiary">Summary generating...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ── Admin Dashboard View ─────────────────────────────────────────────────────

function AdminDashboardView({
  admin,
  activeTab = "overview",
}: {
  admin: AdminProfile;
  activeTab?: string;
}) {
  return (
    <div className="space-y-6">
      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-text-primary">Platform Administrator</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand">
                    Superadmin
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  Account: <span className="font-mono text-brand">{admin.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-emerald-500">System Healthy</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
              <span className="text-xs text-text-tertiary block">Role Status</span>
              <span className="text-lg font-bold text-text-primary mt-1 block">Active Administrator</span>
              <span className="text-xs text-brand inline-block">Platform Security Master</span>
            </div>

            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
              <span className="text-xs text-text-tertiary block">NCERT Master Catalogue</span>
              <span className="text-lg font-bold text-text-primary mt-1 block">Classes 1–5 Central DB</span>
              <span className="text-xs text-emerald-500 inline-block">Central Repository Active</span>
            </div>

            <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-1">
              <span className="text-xs text-text-tertiary block">API Framework</span>
              <span className="text-lg font-bold text-text-primary mt-1 block">FastAPI + SQLModel</span>
              <span className="text-xs text-sky-500 inline-block">JWT Bearer Security</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: NCERT MASTER CATALOGUE */}
      {activeTab === "ncert_master" && <NCERTBookManagementPanel />}

      {/* TAB: REGISTRATIONS → SCHOOL REQUESTS */}
      {activeTab === "school-requests" && <SchoolRequestsPanel />}

      {/* TAB: SCHOOLS / INSTITUTIONS */}
      {activeTab === "schools" && (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center border border-border-primary space-y-3">
          <Building2 className="w-10 h-10 text-brand mx-auto" />
          <h3 className="text-base font-bold text-text-primary">Registered Institutions & Branches</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            All registered school branches across India are operating under VidyaSetu RBAC governance.
          </p>
        </div>
      )}
    </div>
  );
}


// ── Teacher Dashboard View ───────────────────────────────────────────────────

function TeacherDashboardView({
  teacher,
  activeTab = "overview",
}: {
  teacher: TeacherProfile;
  activeTab?: string;
}) {
  const [assignedClasses, setAssignedClasses] = useState<TeacherClassOut[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeacherClassOut | null>(null);
  const [localTab, setLocalTab] = useState<"students" | "assignments" | "progress">("students");
  const [loading, setLoading] = useState<boolean>(true);

  // Sync sidebar activeTab with local tab
  const effectiveTab: "students" | "assignments" | "progress" =
    activeTab === "classes"
      ? "students"
      : activeTab === "assignments"
      ? "assignments"
      : activeTab === "grading"
      ? "progress"
      : localTab;

  // Class Students state
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);

  // Class Modules state (for AI Quiz)
  const [classModules, setClassModules] = useState<ModuleOut[]>([]);

  // Class Assignments state
  const [assignments, setAssignments] = useState<AssignmentOut[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);

  // Create Assignment Modals
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  // PDF Form state
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfDesc, setPdfDesc] = useState("");
  const [pdfDeadlineDays, setPdfDeadlineDays] = useState<number | "">("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmittingPdf, setIsSubmittingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Quiz Form state
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [quizDeadlineDays, setQuizDeadlineDays] = useState<number | "">("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Progress Tab state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmissionOut[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  // Feedback / Score editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [savingScore, setSavingScore] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Fetch Assigned Classes on Mount
  // Chart inputs folded from the arrays this view already fetches — no extra
  // requests, no derived values that aren't visible elsewhere on the page.
  const assignmentSegments: Segment[] = [
    {
      label: "Active",
      value: assignments.filter((a) => !a.is_locked).length,
      color: "var(--accent-emerald)",
    },
    {
      label: "Locked",
      value: assignments.filter((a) => a.is_locked).length,
      color: "var(--accent-rose)",
    },
  ];

  const moduleSubjectBands = Object.entries(
    classModules.reduce<Record<string, number>>((acc, m) => {
      const subject = (m.subject || "General").trim();
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const fetchClasses = () => {
    setLoading(true);
    getTeacherClasses()
      .then((res) => {
        setAssignedClasses(res);
        if (res.length > 0) {
          setSelectedClass(res[0]);
        }
      })
      .catch((err) => console.log("Fetch teacher classes note:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch Class Details when selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;

    // Load Students
    setLoadingStudents(true);
    getTeacherClassStudents(selectedClass.class_number, selectedClass.section)
      .then((res) => setStudents(res))
      .catch((err) => console.log("Fetch students note:", err.message))
      .finally(() => setLoadingStudents(false));

    // Load Modules for AI Quiz Selection
    getTeacherClassModules(selectedClass.class_number, selectedClass.section)
      .then((res) => setClassModules(res))
      .catch((err) => console.log("Fetch class modules note:", err.message));

    // Load Assignments
    fetchAssignments();
  }, [selectedClass]);

  const fetchAssignments = () => {
    if (!selectedClass) return;
    setLoadingAssignments(true);
    getTeacherAssignments(selectedClass.class_number, selectedClass.section)
      .then((res) => {
        setAssignments(res);
        if (res.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(res[0].id);
        }
      })
      .catch((err) => console.log("Fetch assignments note:", err.message))
      .finally(() => setLoadingAssignments(false));
  };

  // Load Submissions when selectedAssignmentId changes
  useEffect(() => {
    if (!selectedAssignmentId) return;
    setLoadingSubmissions(true);
    getAssignmentSubmissions(selectedAssignmentId)
      .then((res) => setSubmissions(res))
      .catch((err) => console.log("Fetch submissions note:", err.message))
      .finally(() => setLoadingSubmissions(false));
  }, [selectedAssignmentId]);

  // Handle PDF Assignment Upload
  const handleCreatePdfAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !pdfFile || !pdfTitle.trim()) return;

    if (pdfFile.size > 5 * 1024 * 1024) {
      setPdfError("File size exceeds maximum limit of 5 MB.");
      return;
    }

    setIsSubmittingPdf(true);
    setPdfError(null);
    try {
      const formData = new FormData();
      formData.append("title", pdfTitle.trim());
      if (selectedClass.subject) formData.append("subject", selectedClass.subject);
      if (pdfDesc.trim()) formData.append("description", pdfDesc.trim());
      if (pdfDeadlineDays !== "") formData.append("deadline_days", pdfDeadlineDays.toString());
      formData.append("file", pdfFile);

      await createPdfAssignment(selectedClass.class_number, selectedClass.section, formData);
      setShowPdfModal(false);
      setPdfTitle("");
      setPdfDesc("");
      setPdfDeadlineDays("");
      setPdfFile(null);
      fetchAssignments();
    } catch (err: any) {
      setPdfError(err.message || "Failed to upload assignment PDF.");
    } finally {
      setIsSubmittingPdf(false);
    }
  };

  // Handle AI Quiz Assignment Generation
  const handleCreateQuizAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !quizTitle.trim() || selectedModuleIds.length === 0) {
      setQuizError("Please enter a title and select at least one module chapter.");
      return;
    }

    setIsSubmittingQuiz(true);
    setQuizError(null);
    try {
      await createAiQuizAssignment(selectedClass.class_number, selectedClass.section, {
        title: quizTitle.trim(),
        subject: selectedClass.subject || undefined,
        description: quizDesc.trim() || undefined,
        module_ids: selectedModuleIds,
        deadline_days: quizDeadlineDays !== "" ? Number(quizDeadlineDays) : undefined,
      });
      setShowQuizModal(false);
      setQuizTitle("");
      setQuizDesc("");
      setQuizDeadlineDays("");
      setSelectedModuleIds([]);
      fetchAssignments();
    } catch (err: any) {
      setQuizError(err.message || "Failed to generate AI quiz assignment.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignment(assignmentId);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || "Failed to delete assignment.");
    }
  };

  // Save Score and Feedback for a Student
  const handleSaveScoreAndFeedback = async (studentId: string) => {
    if (!selectedAssignmentId) return;
    setSavingScore(true);
    setFeedbackMsg(null);
    try {
      const numericScore = parseFloat(scoreInput);
      if (!isNaN(numericScore)) {
        await setSubmissionScore(selectedAssignmentId, studentId, numericScore, 100);
      }
      if (feedbackInput.trim()) {
        await postStudentFeedback(selectedAssignmentId, studentId, feedbackInput.trim());
      }

      setEditingStudentId(null);
      setScoreInput("");
      setFeedbackInput("");

      // Refresh submissions
      const updated = await getAssignmentSubmissions(selectedAssignmentId);
      setSubmissions(updated);
      setFeedbackMsg("Score & feedback saved successfully!");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save score or feedback.");
    } finally {
      setSavingScore(false);
    }
  };

  return (
    <ConsoleMotion>
      <div className="space-y-6">
        {/* Main Content: Unassigned vs Assigned State */}
        {loading ? (
          <Loading />
        ) : assignedClasses.length === 0 ? (
          /* Empty State: No Class Assigned by Admin */
          <Panel flush>
            <EmptyState
              icon={AlertCircle}
              title="No Class Assigned Yet"
              action={
                <div className="max-w-md rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-4 text-xs leading-relaxed text-text-tertiary">
                  Once assigned, you will be able to view student lists, upload PDF assignments,
                  generate adaptive AI quizzes, and track student progress with feedback.
                </div>
              }
            >
              You can&apos;t perform any actions since no class has been assigned to you yet. Please
              contact your school branch administrator to assign your class (e.g. 4th A).
            </EmptyState>
          </Panel>
        ) : (
          <div className="space-y-6">
            {/* Active Class Switcher (only shown if teacher has multiple classes) */}
            {assignedClasses.length > 1 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="console-eyebrow">Active Class:</span>
                <Segmented
                  idPrefix="teacher-class"
                  value={selectedClass?.id ?? assignedClasses[0].id}
                  onChange={(id) => {
                    const found = assignedClasses.find((c) => c.id === id);
                    if (found) setSelectedClass(found);
                  }}
                  options={assignedClasses.map((c) => ({
                    value: c.id,
                    label: `Class ${c.label}`,
                  }))}
                />
              </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && selectedClass && (
              <div className="space-y-6">
                {/* ── 1. Hero: Vibrant Educator Welcome Banner ───────────── */}
                <Hero
                  variant="vibrant"
                  eyebrow={
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Educator</span>
                      <span className="opacity-40">•</span>
                      <span className="font-mono font-bold underline">
                        {teacher.branch_name}
                      </span>
                    </span>
                  }
                  title={`Welcome back, ${teacher.name}!`}
                  subtitle={
                    <p>
                      {teacher.school_name} · Currently viewing{" "}
                      <span className="font-semibold text-white">
                        Class {selectedClass.label}
                      </span>
                      . Manage assignments, review class rosters, and generate adaptive AI quizzes
                      from your curriculum modules.
                    </p>
                  }
                  illustration={
                    <ClassroomIllustration className="h-[180px] w-[285px] drop-shadow-xl" />
                  }
                  facts={
                    <>
                      <HeroFact
                        label="Enrolled Students"
                        value={<AnimatedNumber value={students.length} />}
                        hint={`Class ${selectedClass.label}`}
                        variant="vibrant"
                      />
                      <HeroFact
                        label="Active Assignments"
                        value={<AnimatedNumber value={assignments.length} />}
                        hint="PDF & AI Quizzes"
                        variant="vibrant"
                      />
                      <HeroFact
                        label="Curriculum Modules"
                        value={<AnimatedNumber value={classModules.length} />}
                        hint="Available for AI Quiz"
                        variant="vibrant"
                      />
                      <HeroFact
                        label="Assigned Classes"
                        value={<AnimatedNumber value={assignedClasses.length} />}
                        hint="Across this branch"
                        variant="vibrant"
                      />
                    </>
                  }
                />

                {/* ── 2. Metric Cards Row ─────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Card 1: Assignment Status */}
                  <Panel
                    flush
                    className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[var(--c-line)] p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                            Assignment Status
                          </h4>
                          <div className="text-xs font-semibold text-text-primary">
                            Class {selectedClass.label} Workload
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-text-tertiary">
                        {assignments.length} Total
                      </span>
                    </div>

                    {assignments.length > 0 ? (
                      <>
                        <div className="my-4 flex items-center justify-between gap-4">
                          <ChartLegend className="min-w-0 flex-1" segments={assignmentSegments} />
                          <div className="shrink-0">
                            <DonutChart
                              size={76}
                              thickness={9}
                              segments={assignmentSegments}
                              centerLabel={assignments.length}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--c-line)] pt-3 text-xs text-text-tertiary">
                          <span>Active vs Locked</span>
                          <span className="font-semibold text-emerald-600">
                            {assignments.filter((a) => !a.is_locked).length} open
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-xs italic text-text-tertiary">
                        Create a PDF assignment or an AI quiz to see its status here.
                      </div>
                    )}
                  </Panel>

                  {/* Card 2: Modules by Subject */}
                  <Panel
                    flush
                    className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[var(--c-line)] p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                            Modules by Subject
                          </h4>
                          <div className="text-xs font-semibold text-text-primary">
                            Class {selectedClass.label} Curriculum
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                        {classModules.length} Modules
                      </span>
                    </div>

                    <div className="my-4">
                      {moduleSubjectBands.length > 0 ? (
                        <BarList data={moduleSubjectBands} />
                      ) : (
                        <div className="py-3 text-center text-xs italic text-text-tertiary">
                          Modules uploaded for this class will be grouped by subject here.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--c-line)] pt-3 text-xs text-text-tertiary">
                      <span>Available for AI Quiz</span>
                      <span className="font-semibold text-text-secondary">
                        {moduleSubjectBands.length} subject
                        {moduleSubjectBands.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Panel>
                </div>

                {/* ── 3. Class roster, full width ─────────────────────────── */}
                <Panel
                  flush
                  className="overflow-hidden rounded-[20px] border border-[var(--c-line)] shadow-xs"
                >
                  <PanelHead
                    icon={Users}
                    title={`Class ${selectedClass.label} Roster`}
                    description="Students currently enrolled in the selected class section."
                    actions={<Chip tone="brand">{students.length} Student(s)</Chip>}
                  />
                  {loadingStudents ? (
                    <Loading />
                  ) : students.length > 0 ? (
                    <Stagger className="divide-y divide-[var(--c-line)]">
                      {students.slice(0, 8).map((s) => (
                        <Item
                          key={s.id}
                          className="console-row px-5 py-4 transition-colors hover:bg-[var(--c-sunken)]/60"
                        >
                          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_170px_150px] lg:items-center lg:gap-6">
                            <div className="flex min-w-0 items-center gap-3.5">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/10 text-xs font-bold text-brand">
                                {(s.full_name || s.unique_number).slice(0, 2).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold text-text-primary">
                                  {s.full_name || s.email}
                                </div>
                                <div className="mt-1">
                                  <Code>{s.unique_number}</Code>
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="rounded-full border border-[var(--c-line)] bg-[var(--c-sunken)] px-2 py-0.5 text-[10px] font-semibold capitalize text-text-secondary">
                                {s.enrollment_type}
                              </span>
                            </div>

                            <span className="console-num text-[11px] text-text-tertiary lg:text-right">
                              {new Date(s.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Item>
                      ))}
                    </Stagger>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title={`No students enrolled in Class ${selectedClass.label} yet.`}
                    />
                  )}
                </Panel>
              </div>
            )}

            {/* TAB: ASSIGNED CLASSES / STUDENTS ROSTER */}
            {activeTab === "classes" && selectedClass && (
              <Panel flush className="overflow-hidden">
                <PanelHead
                  icon={Users}
                  title={`Students Enrolled in Class ${selectedClass.label}`}
                  actions={<Chip tone="brand">{students.length} Student(s)</Chip>}
                />

                {loadingStudents ? (
                  <Loading />
                ) : students.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Unique ID</Th>
                        <Th>Student Name / Email</Th>
                        <Th>Enrollment Mode</Th>
                        <Th>Joined Date</Th>
                      </tr>
                    </thead>
                    <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
                      {students.map((s) => (
                        <Item as="tr" key={s.id} className="console-row">
                          <Td>
                            <Code>{s.unique_number}</Code>
                          </Td>
                          <Td className="font-medium text-text-primary">
                            {s.full_name || s.email}
                          </Td>
                          <Td className="capitalize text-text-secondary">{s.enrollment_type}</Td>
                          <Td className="console-num text-text-tertiary">
                            {new Date(s.created_at).toLocaleDateString()}
                          </Td>
                        </Item>
                      ))}
                    </Stagger>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Users}
                    title={`No students enrolled in Class ${selectedClass.label} yet.`}
                  />
                )}
              </Panel>
            )}

            {/* TAB: ASSIGNED CLASSES — learning-module progress for the roster above */}
            {activeTab === "classes" && selectedClass && (
              <ClassLearningProgress
                classNumber={selectedClass.class_number}
                section={selectedClass.section}
              />
            )}

            {/* TAB: ASSIGNMENTS & QUIZZES */}
            {activeTab === "assignments" && selectedClass && (
              <div>
                {/* Action Bar */}
                <SectionHead
                  icon={FileText}
                  title={`Class ${selectedClass.label} Assignments & Quizzes`}
                  description="Upload homework documents or generate automatic AI quizzes from curriculum modules."
                  actions={
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfError(null);
                          setShowPdfModal(true);
                        }}
                        className="text-xs"
                      >
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Upload PDF Assignment (Max 5MB)
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setQuizError(null);
                          setShowQuizModal(true);
                        }}
                        className="text-xs"
                      >
                        <Brain className="mr-1.5 h-3.5 w-3.5" />
                        Generate AI Quiz from Modules
                      </Button>
                    </>
                  }
                />

                {/* Assignments List */}
                <Panel flush className="overflow-hidden">
                  {loadingAssignments ? (
                    <Loading />
                  ) : assignments.length > 0 ? (
                    <Stagger className="divide-y divide-[var(--c-line)]">
                      {assignments.map((asgn) => (
                        <Item
                          key={asgn.id}
                          className="console-row group flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Chip tone={asgn.assignment_type === "pdf_upload" ? "sky" : "violet"}>
                                {asgn.assignment_type === "pdf_upload" ? "PDF Upload" : "AI Quiz"}
                              </Chip>

                              <Chip tone={asgn.is_locked ? "rose" : "emerald"}>
                                {asgn.is_locked ? "Locked" : "Active"}
                              </Chip>
                            </div>

                            <h4 className="mt-2 text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
                              {asgn.title}
                            </h4>
                            {asgn.description && (
                              <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-relaxed text-text-secondary">
                                {asgn.description}
                              </p>
                            )}

                            {asgn.file_url && (
                              <a
                                href={formatPdfUrl(asgn.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View Assignment PDF
                              </a>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-5">
                            <div className="space-y-1 text-right text-[11px] text-text-tertiary">
                              <span className="console-num flex items-center justify-end gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(asgn.created_at).toLocaleDateString()}
                              </span>

                              {asgn.deadline_at ? (
                                <span className="console-num flex items-center justify-end gap-1.5 font-medium text-amber-500">
                                  <Clock className="h-3.5 w-3.5" />
                                  Deadline: {new Date(asgn.deadline_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="block">No Deadline Set</span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteAssignment(asgn.id)}
                              className="cursor-pointer rounded-md p-2 text-text-tertiary transition-all hover:bg-rose-500/10 hover:text-rose-500 lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
                              title="Delete assignment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Item>
                      ))}
                    </Stagger>
                  ) : (
                    <EmptyState icon={FileText} title="No Assignments Created Yet">
                      Use the buttons above to upload a manual PDF assignment (max 5MB) or generate
                      an adaptive AI quiz from your class modules.
                    </EmptyState>
                  )}
                </Panel>
              </div>
            )}

            {/* TAB: SUBMISSIONS & GRADING */}
            {activeTab === "grading" && selectedClass && (
              <Panel flush className="overflow-hidden">
                <PanelHead
                  icon={Award}
                  title="Student Progress & Assessment Scores"
                  description="Select an assignment to view student scores and give individual feedback."
                  actions={
                    assignments.length > 0 ? (
                      <select
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        className={`${inputClass} w-auto font-medium`}
                      >
                        {assignments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.assignment_type === "pdf_upload" ? "PDF" : "AI Quiz"})
                          </option>
                        ))}
                      </select>
                    ) : undefined
                  }
                />

                <AnimatePresence>
                  {feedbackMsg && (
                    <div className="px-5 pt-4">
                      <Notice tone="emerald" icon={Check}>
                        {feedbackMsg}
                      </Notice>
                    </div>
                  )}
                </AnimatePresence>

                {loadingSubmissions ? (
                  <Loading />
                ) : submissions.length > 0 ? (
                  <div>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Student ID</Th>
                          <Th>Attempt Status</Th>
                          <Th>Score / Max</Th>
                          <Th>Last Attempted</Th>
                          <Th className="text-right">Actions</Th>
                        </tr>
                      </thead>
                      <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
                        {submissions.map((sub) => {
                          const isEditing = editingStudentId === sub.student_id;
                          return (
                            <Item
                              as="tr"
                              key={sub.id}
                              className={`console-row ${isEditing ? "bg-brand/[0.04]" : ""}`}
                            >
                              <Td>
                                <Code>{sub.student_unique_number}</Code>
                              </Td>
                              <Td>
                                <Chip tone="emerald">Attempted</Chip>
                              </Td>
                              <Td className="console-num font-semibold text-text-primary">
                                {sub.score !== null ? `${sub.score} / ${sub.max_score}` : "Not Graded"}
                              </Td>
                              <Td className="console-num text-text-tertiary">
                                {new Date(sub.last_attempted_at).toLocaleString()}
                              </Td>
                              <Td className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingStudentId(isEditing ? null : sub.student_id);
                                    setScoreInput(sub.score !== null ? sub.score.toString() : "");
                                    setFeedbackInput("");
                                  }}
                                  className="text-xs"
                                >
                                  <MessageSquare className="mr-1 h-3.5 w-3.5" />
                                  {isEditing ? "Close" : "Grade / Feedback"}
                                </Button>
                              </Td>
                            </Item>
                          );
                        })}
                      </Stagger>
                    </Table>

                    {/* Inline Feedback / Score Form for Selected Student */}
                    <AnimatePresence initial={false}>
                      {editingStudentId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: EASE }}
                          className="overflow-hidden border-t border-[var(--c-line)] bg-[var(--c-sunken)]"
                        >
                          <div className="space-y-4 p-5">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-[family-name:var(--font-display)]">
                              <Edit className="h-4 w-4 text-brand" />
                              <span>Grade &amp; Feedback for Student</span>
                            </h4>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <FieldLabel>Score (Out of 100)</FieldLabel>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  placeholder="e.g. 85"
                                  value={scoreInput}
                                  onChange={(e) => setScoreInput(e.target.value)}
                                  className={inputClass}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <FieldLabel>Feedback / Guidance Message</FieldLabel>
                                <textarea
                                  rows={2}
                                  placeholder="Enter feedback or advice for this student..."
                                  value={feedbackInput}
                                  onChange={(e) => setFeedbackInput(e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingStudentId(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={savingScore}
                                onClick={() => handleSaveScoreAndFeedback(editingStudentId)}
                                className="text-xs"
                              >
                                {savingScore ? "Saving..." : "Save Score & Feedback"}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <EmptyState
                    icon={Award}
                    title="No student submissions yet for this assignment."
                  />
                )}
              </Panel>
            )}

            {/* TAB: CURRICULUM & BOOKS */}
            {activeTab === "curriculum" && selectedClass && (
              <Panel flush className="overflow-hidden">
                <PanelHead
                  icon={BookOpen}
                  title={`Curriculum Modules for Class ${selectedClass.label}`}
                  actions={
                    <span className="text-xs text-text-tertiary">
                      {classModules.length} Module(s)
                    </span>
                  }
                />

                {classModules.length > 0 ? (
                  <Stagger className="divide-y divide-[var(--c-line)]">
                    {classModules.map((mod) => (
                      <Item
                        key={mod.id}
                        className="console-row flex items-center gap-4 px-5 py-3.5"
                      >
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[var(--c-line)] bg-[var(--c-sunken)] text-text-tertiary">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
                            {mod.title}
                          </h4>
                          <div className="mt-1">
                            <Chip tone="brand">{mod.subject}</Chip>
                          </div>
                        </div>

                        {mod.file_url ? (
                          <a
                            href={formatPdfUrl(mod.file_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Module PDF
                          </a>
                        ) : (
                          <span className="shrink-0 text-xs italic text-text-tertiary">
                            NCERT Module
                          </span>
                        )}
                      </Item>
                    ))}
                  </Stagger>
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title={`No curriculum modules found for Class ${selectedClass.label}.`}
                  />
                )}
              </Panel>
            )}
          </div>
        )}

        {/* PDF UPLOAD MODAL */}
        <AnimatePresence>
          {showPdfModal && (
            <Modal
              title="Upload PDF Assignment"
              icon={Upload}
              onClose={() => setShowPdfModal(false)}
            >
              {pdfError && (
                <div className="mb-4">
                  <Notice tone="rose" icon={AlertCircle}>
                    {pdfError}
                  </Notice>
                </div>
              )}

              <form onSubmit={handleCreatePdfAssignment} className="space-y-4">
                <div>
                  <FieldLabel>Assignment Title *</FieldLabel>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 1 Worksheet"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <FieldLabel>Description / Instructions</FieldLabel>
                  <textarea
                    rows={2}
                    placeholder="Instructions for students..."
                    value={pdfDesc}
                    onChange={(e) => setPdfDesc(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>Deadline (Days Active)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 7 (leave empty for no deadline)"
                    value={pdfDeadlineDays}
                    onChange={(e) =>
                      setPdfDeadlineDays(e.target.value ? Number(e.target.value) : "")
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>Select PDF Document (Max 5 MB) *</FieldLabel>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full cursor-pointer text-xs text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand hover:file:bg-brand/20"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--c-line)] pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowPdfModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isSubmittingPdf}>
                    {isSubmittingPdf ? "Uploading..." : "Upload Assignment"}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>

        {/* AI QUIZ GENERATION MODAL */}
        <AnimatePresence>
          {showQuizModal && (
            <Modal
              title="Generate Adaptive AI Quiz"
              icon={Brain}
              iconTone="violet"
              onClose={() => setShowQuizModal(false)}
            >
              {quizError && (
                <div className="mb-4">
                  <Notice tone="rose" icon={AlertCircle}>
                    {quizError}
                  </Notice>
                </div>
              )}

              <form onSubmit={handleCreateQuizAssignment} className="space-y-4">
                <div>
                  <FieldLabel>Quiz Title *</FieldLabel>
                  <input
                    type="text"
                    placeholder="e.g. Adaptive Math Quiz"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <FieldLabel>Select Modules / Chapters *</FieldLabel>
                  {classModules.length > 0 ? (
                    <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-1.5 text-xs">
                      {classModules.map((m) => {
                        const isChecked = selectedModuleIds.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
                              isChecked ? "bg-brand/8" : "hover:bg-[var(--c-panel)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedModuleIds([...selectedModuleIds, m.id]);
                                } else {
                                  setSelectedModuleIds(
                                    selectedModuleIds.filter((id) => id !== m.id)
                                  );
                                }
                              }}
                              className="rounded border-border-primary text-brand focus:ring-brand"
                            />
                            <span className="min-w-0 truncate font-medium text-text-primary">
                              {m.title}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-3 text-xs italic text-text-tertiary">
                      No uploaded modules found for this class. Upload modules first in the School
                      dashboard to generate adaptive quizzes.
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel>Deadline (Days Active)</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 7 (leave empty for no deadline)"
                    value={quizDeadlineDays}
                    onChange={(e) =>
                      setQuizDeadlineDays(e.target.value ? Number(e.target.value) : "")
                    }
                    className={inputClass}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--c-line)] pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowQuizModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingQuiz || classModules.length === 0}
                  >
                    {isSubmittingQuiz ? "Generating..." : "Generate Quiz"}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </ConsoleMotion>
  );
}

// ── NCERT Books & Content Management Panel (School Branch Admin & Superadmin) ─────

function NCERTBookManagementPanel({ onModuleAttached }: { onModuleAttached?: () => void }) {
  const [classFilter, setClassFilter] = useState<number>(0); // 0 = All Classes
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [books, setBooks] = useState<NCERTBookOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Upload PDF Modal
  const [uploadBook, setUploadBook] = useState<NCERTBookOut | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Create Book Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createClass, setCreateClass] = useState<number>(1);
  const [createSubject, setCreateSubject] = useState<string>("Mathematics");
  const [createTitle, setCreateTitle] = useState<string>("");
  const [createDesc, setCreateDesc] = useState<string>("");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Book Modal
  const [editingBook, setEditingBook] = useState<NCERTBookOut | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editSubject, setEditSubject] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editClass, setEditClass] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Attaching module loading ID
  const [attachingId, setAttachingId] = useState<string | null>(null);

  const fetchBooks = () => {
    setLoading(true);
    getAllNCERTBooks(classFilter || undefined, subjectFilter.trim() || undefined)
      .then((res) => setBooks(res))
      .catch((err) => console.log("Fetch NCERT books error:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooks();
  }, [classFilter, subjectFilter]);

  const handleUploadPdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadBook || !pdfFile) return;

    if (pdfFile.size > 50 * 1024 * 1024) {
      setUploadError("PDF file size cannot exceed 50 MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadNCERTBookPdf(uploadBook.id, pdfFile);
      setActionMsg(`PDF content successfully attached to "${uploadBook.title}"!`);
      setUploadBook(null);
      setPdfFile(null);
      fetchBooks();
      if (onModuleAttached) onModuleAttached();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload PDF file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createSubject.trim()) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const formData = new FormData();
      formData.append("class_number", createClass.toString());
      formData.append("subject", createSubject.trim());
      formData.append("title", createTitle.trim());
      if (createDesc.trim()) formData.append("description", createDesc.trim());
      if (createFile) formData.append("file", createFile);

      await createNCERTBook(formData);
      setShowCreateModal(false);
      setCreateTitle("");
      setCreateDesc("");
      setCreateFile(null);
      setActionMsg("New NCERT book created successfully!");
      fetchBooks();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create NCERT book.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !editTitle.trim()) return;

    setIsUpdating(true);
    setEditError(null);
    try {
      await updateNCERTBook(editingBook.id, {
        title: editTitle.trim(),
        subject: editSubject.trim(),
        description: editDesc.trim() || undefined,
        class_number: editClass,
      });
      setEditingBook(null);
      setActionMsg("NCERT book details updated successfully!");
      fetchBooks();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setEditError(err.message || "Failed to update NCERT book.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBook = async (book: NCERTBookOut) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) return;
    try {
      await deleteNCERTBook(book.id);
      setActionMsg(`NCERT book "${book.title}" deleted.`);
      fetchBooks();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete NCERT book.");
    }
  };

  const handleDetachFile = async (book: NCERTBookOut) => {
    if (!confirm(`Remove the attached PDF file from "${book.title}"?`)) return;
    try {
      await detachNCERTBookFile(book.id);
      setActionMsg(`PDF file detached from "${book.title}".`);
      fetchBooks();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to detach PDF file.");
    }
  };

  const handleAttachToSchoolModules = async (book: NCERTBookOut) => {
    setAttachingId(book.id);
    try {
      await addNCERTModuleToSchool(book.class_number, book.id, book.title);
      setActionMsg(`"${book.title}" attached to Class ${book.class_number} school modules!`);
      if (onModuleAttached) onModuleAttached();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to attach module.");
    } finally {
      setAttachingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand" />
              <span>NCERT Books & Catalogue Management</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Upload real textbook PDF files, attach them to classes and subjects, and seed them into your school module library for learning and diagnostic quiz generation.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="text-xs shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New NCERT Book
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border-primary/50">
          {/* Class Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-[var(--radius-md)] overflow-x-auto">
            <button
              onClick={() => setClassFilter(0)}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
                classFilter === 0
                  ? "bg-surface text-brand shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              All Classes
            </button>
            {[1, 2, 3, 4, 5].map((cls) => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
                  classFilter === cls
                    ? "bg-surface text-brand shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>

          {/* Subject Filter Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by subject (e.g. Math, EVS)..."
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
            />
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* NCERT Books Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => {
            const hasPdf = Boolean(book.file_url);

            return (
              <div
                key={book.id}
                className="glass rounded-[var(--radius-lg)] p-5 border border-border-primary hover:border-brand transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                      {book.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-text-secondary border border-border-primary">
                      Class {book.class_number}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-primary">{book.title}</h3>
                  {book.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {book.description}
                    </p>
                  )}

                  {/* PDF Status Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    {hasPdf ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> PDF File Attached
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> No File Content
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-border-primary/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    {hasPdf ? (
                      <a
                        href={formatPdfUrl(book.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand font-semibold hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" /> View PDF
                      </a>
                    ) : (
                      <span className="text-text-tertiary italic text-[11px]">Attach file to seed</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditTitle(book.title);
                          setEditSubject(book.subject);
                          setEditDesc(book.description || "");
                          setEditClass(book.class_number);
                          setEditError(null);
                          setEditingBook(book);
                        }}
                        className="text-text-tertiary hover:text-brand transition-colors p-1 rounded hover:bg-surface"
                        title="Edit Book Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteBook(book)}
                        className="text-text-tertiary hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-500/10"
                        title="Delete NCERT Book"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={hasPdf ? "outline" : "primary"}
                      size="sm"
                      onClick={() => {
                        setUploadError(null);
                        setPdfFile(null);
                        setUploadBook(book);
                      }}
                      className="w-full text-xs py-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      {hasPdf ? "Replace PDF" : "Upload PDF File"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={attachingId === book.id}
                      onClick={() => handleAttachToSchoolModules(book)}
                      className="w-full text-xs py-1.5"
                      title="Instantly add this NCERT book into Class Modules"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {attachingId === book.id ? "Attaching..." : "Attach to Modules"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
          <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-text-primary">No NCERT Books Found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
            No NCERT books match your filter criteria. Use the "Add New NCERT Book" button above to add a title and upload PDF content.
          </p>
        </div>
      )}

      {/* UPLOAD PDF MODAL */}
      {uploadBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-[var(--radius-xl)] p-6 max-w-md w-full border border-border-primary space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand" />
                <span>Upload PDF for {uploadBook.title}</span>
              </h3>
              <button
                onClick={() => setUploadBook(null)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Upload the official textbook PDF content for Class {uploadBook.class_number} {uploadBook.subject}. This content will be attached to all linked modules and used for student reading & diagnostic quiz generation.
            </p>

            {uploadError && (
              <div className="p-3 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadPdfSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Select PDF File (Max 50 MB) *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setUploadBook(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isUploading || !pdfFile}>
                  {isUploading ? "Uploading..." : "Upload & Attach PDF"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW NCERT BOOK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-[var(--radius-xl)] p-6 max-w-md w-full border border-border-primary space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand" />
                <span>Add New NCERT Book Entry</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBookSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Target Class *
                  </label>
                  <select
                    value={createClass}
                    onChange={(e) => setCreateClass(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                  >
                    {[1, 2, 3, 4, 5].map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={createSubject}
                    onChange={(e) => setCreateSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Textbook Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Math Magic - Class 1"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of textbook content..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Attach PDF File (Optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create NCERT Book"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NCERT BOOK MODAL */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-[var(--radius-xl)] p-6 max-w-md w-full border border-border-primary space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand" />
                <span>Edit NCERT Book Entry</span>
              </h3>
              <button
                onClick={() => setEditingBook(null)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBookSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Class</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                  >
                    {[1, 2, 3, 4, 5].map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-surface text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                {editingBook.file_url ? (
                  <button
                    type="button"
                    onClick={() => {
                      const bookToDetach = editingBook;
                      setEditingBook(null);
                      handleDetachFile(bookToDetach);
                    }}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Detach PDF File
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setEditingBook(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── School Teacher Management Panel (for SchoolDashboardView) ─────────────────

const DEFAULT_PRIMARY_SUBJECTS = ["Mathematics", "English", "Hindi", "Environmental Studies (EVS)", "Computer", "Science", "Social Studies"];

function parseSubjectMeta(raw: string): { title: string; subtitle: string; color: string } {
  if (!raw) return { title: "General", subtitle: "", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
  const trimmed = raw.trim();
  const match = trimmed.match(/^([^(]+)(?:\((.*)\))?$/);
  const title = match ? match[1].trim() : trimmed;
  const subtitle = match && match[2] ? match[2].trim() : "";

  const lower = title.toLowerCase();
  let color = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (lower.includes("math")) {
    color = "bg-sky-500/10 text-sky-500 border-sky-500/20";
  } else if (lower.includes("english")) {
    color = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  } else if (lower.includes("hindi") || lower.includes("urdu")) {
    color = "bg-orange-500/10 text-orange-500 border-orange-500/20";
  } else if (lower.includes("env") || lower.includes("evs") || lower.includes("science")) {
    color = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  } else if (lower.includes("computer")) {
    color = "bg-purple-500/10 text-purple-500 border-purple-500/20";
  } else if (lower.includes("art")) {
    color = "bg-pink-500/10 text-pink-500 border-pink-500/20";
  }

  return { title, subtitle, color };
}

function normalizeSubjectKey(s: string): string {
  if (!s) return "";
  const clean = s.toLowerCase().trim();
  if (clean.includes("environmental") || clean.includes("evs")) return "evs";
  if (clean.includes("mathematics") || clean.includes("math")) return "mathematics";
  if (clean.includes("english")) return "english";
  if (clean.includes("hindi")) return "hindi";
  if (clean.includes("science") && !clean.includes("social")) return "science";
  if (clean.includes("social")) return "social studies";
  if (clean.includes("computer")) return "computer";
  if (clean.includes("art")) return "art & craft";
  if (clean.includes("urdu")) return "urdu";
  return clean.replace(/\s*\([^)]*\)/g, "").trim();
}

function isMatchingSubject(a: string, b: string): boolean {
  if (!a || !b) return false;
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();
  if (strA === strB) return true;
  const normA = normalizeSubjectKey(a);
  const normB = normalizeSubjectKey(b);
  if (normA && normB && normA === normB) return true;
  return strA.includes(strB) || strB.includes(strA);
}

function SchoolTeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SchoolSubjectDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"hierarchy" | "directory">("hierarchy");

  // Hierarchy filter state
  const [selectedClassNum, setSelectedClassNum] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>("A");

  // Search & Filter Teacher Selection Modal state
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [modalClassNum, setModalClassNum] = useState<number>(1);
  const [modalSection, setModalSection] = useState<string>("A");
  const [modalSubject, setModalSubject] = useState<string>("");
  const [modalInitialTeacherId, setModalInitialTeacherId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Directory search & filter state
  const [directorySearch, setDirectorySearch] = useState<string>("");
  const [directoryFilter, setDirectoryFilter] = useState<"all" | "assigned" | "unassigned" | "active">("all");

  // Status message
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTeachersAndSubjects = async () => {
    setLoading(true);
    try {
      const [teacherList, subjectList] = await Promise.all([
        getSchoolTeachers(),
        getSchoolSubjects().catch(() => [] as SchoolSubjectDetail[]),
      ]);
      setTeachers(teacherList);
      setAllSubjects(subjectList);
    } catch (err: any) {
      console.error("Fetch teachers/subjects error:", err.message);
      setMsg({ type: "error", text: "Failed to load teacher data. Please refresh the page." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachersAndSubjects();
  }, []);

  // Helper: get configured subjects for a class, or fallback to defaults
  const getSubjectsForClass = (classNum: number): string[] => {
    const configured = (allSubjects || [])
      .filter((s) => s && Number(s.class_number) === Number(classNum) && s.subject)
      .map((s) => s.subject.trim());
    if (configured.length > 0) {
      return Array.from(new Set(configured));
    }
    return DEFAULT_PRIMARY_SUBJECTS;
  };

  // Helper: find teacher assigned to a specific (class, section, subject)
  const getAssignedTeacherForSubject = (classNum: number, sec: string, subj: string) => {
    if (!subj) return null;
    const targetSec = (sec || "").toUpperCase().trim();
    const targetNum = Number(classNum);

    // Direct or matching subject assignment
    for (const t of (teachers || [])) {
      const assigned = t?.assigned_classes || [];
      const match = assigned.find(
        (c) =>
          c &&
          Number(c.class_number) === targetNum &&
          (c.section || "").toUpperCase().trim() === targetSec &&
          isMatchingSubject(c.subject || "", subj)
      );
      if (match) {
        return { teacher: t, assignment: match };
      }
    }

    return null;
  };

  const handleAssign = async (teacherId: string, classNum: number, sec: string, rawSubj: string) => {
    if (!teacherId) {
      setMsg({ type: "error", text: "Please select a teacher to assign." });
      return;
    }
    const cleanSubj = rawSubj.trim();
    if (!cleanSubj) {
      setMsg({ type: "error", text: "Subject is required. A teacher cannot be assigned without a subject." });
      return;
    }

    const normalizedSec = (sec || "A").toUpperCase().trim();
    const normalizedClassNum = Number(classNum);

    setIsAssigning(true);
    setMsg(null);
    try {
      const res = await assignClassToTeacher(teacherId, normalizedClassNum, normalizedSec, cleanSubj);

      // Optimistically update React state immediately so UI updates instantaneously
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) => {
          const isTargetTeacher = String(t.id) === String(teacherId);
          const filteredAssignments = (t.assigned_classes || []).filter(
            (c) =>
              !(
                Number(c.class_number) === normalizedClassNum &&
                (c.section || "").toUpperCase().trim() === normalizedSec &&
                isMatchingSubject(c.subject || "", cleanSubj)
              )
          );

          if (isTargetTeacher) {
            const newAssignment: TeacherClassOut = res || {
              id: String(Date.now()),
              teacher_id: teacherId,
              class_number: normalizedClassNum,
              section: normalizedSec,
              subject: cleanSubj,
              label: `${normalizedClassNum}${normalizedSec} • ${cleanSubj}`,
              assigned_at: new Date().toISOString(),
            };
            return {
              ...t,
              assigned_classes: [...filteredAssignments, newAssignment],
            };
          }
          return {
            ...t,
            assigned_classes: filteredAssignments,
          };
        })
      );

      // Ensure active view displays the assigned class and section
      setSelectedClassNum(normalizedClassNum);
      setSelectedSection(normalizedSec);

      setMsg({
        type: "success",
        text: `Assigned Class ${normalizedClassNum}${normalizedSec} (${parseSubjectMeta(cleanSubj).title}) successfully!`,
      });
      setShowTeacherModal(false);
      await fetchTeachersAndSubjects();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      const errMsg: string = err.message || "";
      // If server says teacher is already assigned (409), it means the DB is already correct.
      if (errMsg.toLowerCase().includes("already assigned") || String(err.status) === "409") {
        await fetchTeachersAndSubjects();
        setShowTeacherModal(false);
        setMsg({
          type: "success",
          text: `Teacher is already assigned to Class ${normalizedClassNum}${normalizedSec} for this subject.`,
        });
      } else {
        setMsg({
          type: "error",
          text: errMsg || "Failed to assign teacher to class and subject.",
        });
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeassign = async (
    teacherId: string,
    classNum: number,
    sec: string,
    subj: string,
    assignmentId?: string
  ) => {
    const displaySubj = parseSubjectMeta(subj || "").title;
    if (
      !confirm(
        `De-assign Class ${classNum}${sec} (${displaySubj}) from this teacher?`
      )
    ) {
      return;
    }
    const normalizedSec = (sec || "").toUpperCase().trim();
    const normalizedClassNum = Number(classNum);

    setMsg(null);
    try {
      await deassignClassFromTeacher(teacherId, normalizedClassNum, normalizedSec, subj, assignmentId);

      // Optimistic removal
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) => {
          if (String(t.id) === String(teacherId)) {
            return {
              ...t,
              assigned_classes: (t.assigned_classes || []).filter(
                (c) =>
                  !(
                    Number(c.class_number) === normalizedClassNum &&
                    (c.section || "").toUpperCase().trim() === normalizedSec &&
                    isMatchingSubject(c.subject || "", subj)
                  ) && (!assignmentId || c.id !== assignmentId)
              ),
            };
          }
          return t;
        })
      );

      setMsg({
        type: "success",
        text: `De-assigned Class ${normalizedClassNum}${normalizedSec} (${displaySubj}) successfully.`,
      });
      await fetchTeachersAndSubjects();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err.message || "Failed to de-assign class subject.",
      });
    }
  };

  // Filtered teachers for Directory View
  const filteredDirectoryTeachers = useMemo(() => {
    let list = [...teachers];

    // Filter by tab
    if (directoryFilter === "assigned") {
      list = list.filter((t) => (t.assigned_classes || []).length > 0);
    } else if (directoryFilter === "unassigned") {
      list = list.filter((t) => (t.assigned_classes || []).length === 0);
    } else if (directoryFilter === "active") {
      list = list.filter((t) => t.is_active);
    }

    // Search query
    if (directorySearch.trim()) {
      const q = directorySearch.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = (t.name || "").toLowerCase().includes(q);
        const phoneMatch = (t.phone_number || "").toLowerCase().includes(q);
        const subjectMatch = (t.assigned_classes || []).some((c) =>
          (c.subject || "").toLowerCase().includes(q) ||
          `class ${c.class_number}${c.section}`.toLowerCase().includes(q)
        );
        return nameMatch || phoneMatch || subjectMatch;
      });
    }

    return list;
  }, [teachers, directoryFilter, directorySearch]);

  const directoryCounts = useMemo(() => {
    let assigned = 0;
    let unassigned = 0;
    let active = 0;
    teachers.forEach((t) => {
      if ((t.assigned_classes || []).length > 0) assigned++;
      else unassigned++;
      if (t.is_active) active++;
    });
    return { all: teachers.length, assigned, unassigned, active };
  }, [teachers]);

  const currentClassSubjects = getSubjectsForClass(selectedClassNum);

  // Calculate allocation statistics for active class & section
  const assignedCount = currentClassSubjects.filter((s) =>
    getAssignedTeacherForSubject(selectedClassNum, selectedSection, s)
  ).length;
  const totalCount = currentClassSubjects.length;

  return (
    <ConsoleMotion>
      <Panel flush className="overflow-hidden">
        <PanelHead
          icon={UserCog}
          title="Teacher & Subject Allocation"
          description="Assign one subject teacher per class subject. Teachers can teach multiple subjects across different classes."
          actions={
            <>
              <Segmented
                idPrefix="teacher-alloc-view"
                value={viewMode}
                onChange={(v) => setViewMode(v)}
                options={[
                  { value: "hierarchy", label: "Class Subject Matrix" },
                  { value: "directory", label: `Teacher Directory (${teachers.length})` },
                ]}
              />

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setModalClassNum(selectedClassNum);
                  setModalSection(selectedSection);
                  setModalSubject(currentClassSubjects[0] || "Mathematics");
                  setModalInitialTeacherId("");
                  setShowTeacherModal(true);
                }}
                disabled={teachers.length === 0}
                className="shrink-0 text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Assign Teacher
              </Button>
            </>
          }
        />

        {/* Status Alerts */}
        <AnimatePresence>
          {msg && (
            <div className="px-5 pt-4">
              <Notice
                tone={msg.type === "success" ? "emerald" : "rose"}
                icon={msg.type === "success" ? Check : AlertCircle}
                onDismiss={() => setMsg(null)}
              >
                {msg.text}
              </Notice>
            </div>
          )}
        </AnimatePresence>

        {loading ? (
          <Loading />
        ) : teachers.length === 0 ? (
          <EmptyState icon={UserCog} title="No teachers registered in this branch yet">
            When teachers sign up with your branch name, they will appear in this directory for
            class and subject assignments.
          </EmptyState>
        ) : viewMode === "hierarchy" ? (
          /* ═══════════════════════════════════════════════════════════════════
             CLASS SUBJECT MATRIX VIEW
             ═══════════════════════════════════════════════════════════════════ */
          <div className="p-5 pt-4">
            {/* Filter Bar: Class/Section selectors & staffing metric */}
            <div className="flex flex-col gap-3 rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-tertiary">Class:</span>
                  <select
                    value={selectedClassNum}
                    onChange={(e) => setSelectedClassNum(Number(e.target.value))}
                    className={`${inputClass} w-auto py-1.5 font-medium`}
                  >
                    {[1, 2, 3, 4, 5].map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-tertiary">Section:</span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={`${inputClass} w-auto py-1.5 font-medium`}
                  >
                    {["A", "B", "C", "D"].map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Staffing Status:</span>
                <Chip tone={assignedCount === totalCount ? "emerald" : assignedCount > 0 ? "sky" : "amber"}>
                  {assignedCount} of {totalCount} Subjects Assigned
                </Chip>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="mt-4 overflow-hidden rounded-[var(--c-radius)] border border-[var(--c-line)]">
              <Table>
                <thead>
                  <tr>
                    <Th>Subject</Th>
                    <Th>Status</Th>
                    <Th>Assigned Subject Teacher</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
                  {currentClassSubjects.map((rawSubj) => {
                    const meta = parseSubjectMeta(rawSubj);
                    const assignedInfo = getAssignedTeacherForSubject(
                      selectedClassNum,
                      selectedSection,
                      rawSubj
                    );
                    const hasTeacher = !!assignedInfo;

                    return (
                      <Item as="tr" key={rawSubj} className="console-row">
                        {/* Subject Name & Subtitle */}
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${meta.color}`}
                            >
                              {meta.title.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-text-primary">
                                {meta.title}
                              </div>
                              {meta.subtitle && (
                                <div className="mt-0.5 text-[10px] text-text-tertiary">
                                  {meta.subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </Td>

                        {/* Status */}
                        <Td>
                          <Chip tone={hasTeacher ? "emerald" : "amber"}>
                            {hasTeacher ? "Assigned" : "Unassigned"}
                          </Chip>
                        </Td>

                        {/* Assigned Teacher or Search & Select Trigger */}
                        <Td>
                          {hasTeacher ? (
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/8 text-xs font-bold text-brand">
                                {assignedInfo.teacher.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                                  <span>{assignedInfo.teacher.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalClassNum(selectedClassNum);
                                      setModalSection(selectedSection);
                                      setModalSubject(rawSubj);
                                      setModalInitialTeacherId(assignedInfo.teacher.id);
                                      setShowTeacherModal(true);
                                    }}
                                    className="cursor-pointer text-[10px] font-medium text-brand hover:underline"
                                    title="Change assigned teacher"
                                  >
                                    (Change)
                                  </button>
                                </div>
                                <div className="font-mono text-[10px] text-text-tertiary">
                                  {assignedInfo.teacher.phone_number}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setModalClassNum(selectedClassNum);
                                setModalSection(selectedSection);
                                setModalSubject(rawSubj);
                                setModalInitialTeacherId("");
                                setShowTeacherModal(true);
                              }}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[var(--c-line-strong)] bg-[var(--c-sunken)] px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:border-brand/50 hover:bg-brand/[0.05]"
                            >
                              <Search className="h-3.5 w-3.5" />
                              <span>Select Teacher</span>
                            </button>
                          )}
                        </Td>

                        {/* Action */}
                        <Td className="text-right">
                          {hasTeacher ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalClassNum(selectedClassNum);
                                  setModalSection(selectedSection);
                                  setModalSubject(rawSubj);
                                  setModalInitialTeacherId(assignedInfo.teacher.id);
                                  setShowTeacherModal(true);
                                }}
                                className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-brand/10 hover:text-brand"
                                title="Change teacher for this subject"
                              >
                                Reassign
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeassign(
                                    assignedInfo.teacher.id,
                                    selectedClassNum,
                                    selectedSection,
                                    assignedInfo.assignment.subject || rawSubj,
                                    assignedInfo.assignment.id
                                  )
                                }
                                className="cursor-pointer rounded px-2.5 py-1 text-xs font-medium text-text-tertiary transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                                title="Remove teacher from subject"
                              >
                                De-assign
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setModalClassNum(selectedClassNum);
                                setModalSection(selectedSection);
                                setModalSubject(rawSubj);
                                setModalInitialTeacherId("");
                                setShowTeacherModal(true);
                              }}
                              className="h-auto px-3 py-1 text-xs"
                            >
                              Assign
                            </Button>
                          )}
                        </Td>
                      </Item>
                    );
                  })}
                </Stagger>
              </Table>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             TEACHER DIRECTORY VIEW
             ═══════════════════════════════════════════════════════════════════ */
          <div className="p-5 pt-4">
            {/* Directory Search & Filters */}
            <div className="flex flex-col gap-3 rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search by teacher name, phone, or class..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className={`${inputClass} bg-[var(--c-panel)] py-1.5 pl-8 pr-8`}
                />
                {directorySearch && (
                  <button
                    type="button"
                    onClick={() => setDirectorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-tertiary hover:text-text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <Segmented
                idPrefix="teacher-directory-filter"
                value={directoryFilter}
                onChange={(v) => setDirectoryFilter(v)}
                options={[
                  { value: "all", label: `All (${directoryCounts.all})` },
                  { value: "unassigned", label: `Unassigned (${directoryCounts.unassigned})` },
                  { value: "assigned", label: `Assigned (${directoryCounts.assigned})` },
                  { value: "active", label: `Active Only (${directoryCounts.active})` },
                ]}
              />
            </div>

            {/* Teacher Directory List */}
            <div className="mt-4">
              {filteredDirectoryTeachers.length === 0 ? (
                <EmptyState icon={Search} title="No teachers found">
                  Try clearing the search query or changing filter tabs.
                </EmptyState>
              ) : (
                <Stagger className="divide-y divide-[var(--c-line)]">
                  {filteredDirectoryTeachers.map((t: TeacherListItem) => (
                    <Item
                      key={t.id}
                      className="console-row flex flex-col gap-4 rounded-[var(--c-radius)] px-3 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-brand/20 bg-brand/8 text-xs font-bold text-brand">
                            {t.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-text-primary font-[family-name:var(--font-display)]">
                            {t.name}
                          </span>
                          <span className="font-mono text-xs text-text-tertiary">
                            ({t.phone_number})
                          </span>
                          <Chip tone={t.is_active ? "emerald" : "rose"}>
                            {t.is_active ? "Active" : "Inactive"}
                          </Chip>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pl-9">
                          <span className="text-xs font-medium text-text-secondary">
                            Teaching:
                          </span>
                          {t.assigned_classes && t.assigned_classes.length > 0 ? (
                            t.assigned_classes.map((c: TeacherClassOut) => (
                              <span
                                key={c.id || `${c.class_number}-${c.section}-${c.subject}`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-brand/25 bg-brand/8 py-0.5 pl-2 pr-1 text-xs font-semibold text-brand"
                              >
                                <span>
                                  Class {c.class_number}
                                  {c.section} • {parseSubjectMeta(c.subject || "General").title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeassign(
                                      t.id,
                                      c.class_number,
                                      c.section,
                                      c.subject || "General",
                                      c.id
                                    )
                                  }
                                  className="ml-0.5 cursor-pointer rounded p-0.5 text-brand/60 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                                  title="De-assign subject"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-text-tertiary">
                              No classes assigned yet (Available)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-9 md:pl-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModalInitialTeacherId(t.id);
                            setModalClassNum(selectedClassNum);
                            setModalSection(selectedSection);
                            const subjs = getSubjectsForClass(selectedClassNum);
                            setModalSubject(subjs[0] || "Mathematics");
                            setShowTeacherModal(true);
                          }}
                          className="text-xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Assign Class
                        </Button>
                      </div>
                    </Item>
                  ))}
                </Stagger>
              )}
            </div>
          </div>
        )}

        {/* Modern Filter-based Teacher Selection Modal */}
        <AnimatePresence>
          {showTeacherModal && (
            <TeacherSearchModal
              isOpen={showTeacherModal}
              onClose={() => setShowTeacherModal(false)}
              teachers={teachers}
              classNum={modalClassNum}
              section={modalSection}
              subject={modalSubject}
              onClassNumChange={setModalClassNum}
              onSectionChange={setModalSection}
              onSubjectChange={setModalSubject}
              availableSubjects={getSubjectsForClass(modalClassNum)}
              onAssign={handleAssign}
              isAssigning={isAssigning}
              initialTeacherId={modalInitialTeacherId}
              parseSubjectMeta={parseSubjectMeta}
              isMatchingSubject={isMatchingSubject}
            />
          )}
        </AnimatePresence>
      </Panel>
    </ConsoleMotion>
  );
}
