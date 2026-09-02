"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  Menu,
  RefreshCw,
  Target,
  Flame,
  Play,
  Bell,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { ModuleProgressOverview, RecentActivityWidget } from "@/components/dashboard/LearningProgressPanel";
import { ClassLearningProgress } from "@/components/dashboard/ClassLearningProgress";
import { ParentDetailedProgress } from "@/components/dashboard/ParentDetailedProgress";
import { StudentHero, StudentHeroFact } from "@/components/dashboard/student/StudentHero";
import {
  LearningCard,
  SkillCard,
  StudentSection,
  ContinueLearningHeroCard,
} from "@/components/dashboard/student/LearningCards";
import { StudentSideWidgets } from "@/components/dashboard/student/StudentSideWidgets";
import { GapModulesPanel } from "@/components/dashboard/student/GapModulesPanel";
import { ParentHero, ParentHeroFact } from "@/components/dashboard/parent/ParentHero";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { subscribeToLearningQueue } from "@/lib/offline/learningEvents";
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
import { TeacherHero } from "@/components/dashboard/teacher/TeacherHero";
import {
  BarList,
  ChartLegend,
  DonutChart,
  type Segment,
} from "@/components/dashboard/console/charts";
import {
  ClassroomIllustration,
  SchoolIllustration,
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
import { useTranslation, DynamicText } from "@/hooks/useTranslation";
import { Mascot, MascotMood } from "@/components/quiz/Mascot";
import { QuizRunnerModal } from "@/components/quiz/QuizRunnerModal";
import { AttemptHistoryModal } from "@/components/quiz/AttemptHistoryModal";
import { DiagnosticReportModal } from "@/components/quiz/DiagnosticReportModal";
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
  getStudentLearningProgress,
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
  getTeacherClassChapters,
  ChapterOut,
  getAssignmentQuizPreview,
  AssignmentQuizPreviewOut,
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
  getQuizAttempts,
  QuizAttemptSummaryOut,
  getGamificationSummary,
  claimRewardChest,
  type GamificationSummaryOut,
  getChildQuizResult,
  getAssignmentQuizForStudent,
  submitAssignmentQuiz,
  uploadAssignmentResponsePdf,
  getStudentAssignmentAttempts,
  getStudentTestResults,
  getChildTestResults,
  getTeacherStudentAttempts,
  getChildLearningProgress,
  StudentProgressOut,
  AssignmentAttemptOut,
  StudentTestResultSummaryOut,
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
  const { t, language } = useTranslation();

  const [permissions, setPermissions] = useState<RolePermissionsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // ── Gamification (XP / chest) ────────────────────────────────────────────
  // Lives here, not inside StudentDashboardView, because the topbar's XP
  // pill needs the same real numbers as the Mystery Chest widget further
  // down — one fetch, one source of truth, instead of the topbar guessing at
  // its own figures.
  const [gamification, setGamification] = useState<GamificationSummaryOut | null>(null);
  const [claimingChest, setClaimingChest] = useState<boolean>(false);

  const refreshGamification = useCallback(async () => {
    if (role !== "student") return;
    try {
      const fresh = await getGamificationSummary();
      setGamification(fresh);
    } catch (err: any) {
      console.log("Gamification fetch note:", err.message);
    }
  }, [role]);

  useEffect(() => {
    if (role !== "student") return;
    void refreshGamification();
    const unsubscribe = subscribeToLearningQueue(() => {
      void refreshGamification();
    });
    return () => {
      unsubscribe();
    };
  }, [role, refreshGamification]);

  const handleClaimChest = async () => {
    if (claimingChest) return; // guard the double-click; server is authoritative regardless
    setClaimingChest(true);
    try {
      await claimRewardChest();
      // Re-read rather than patching locally: the server decides the new XP
      // total, chest cycle and badge list.
      const fresh = await getGamificationSummary();
      setGamification(fresh);
    } catch (err: any) {
      console.log("Chest claim note:", err.message);
    } finally {
      setClaimingChest(false);
    }
  };

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

  // Fetch RBAC Permissions & Navigation Schema from Backend (re-fetches on language change)
  useEffect(() => {
    if (role) {
      getRolePermissions(role, language)
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
          setActiveTab((prev) => tabParam || prev || defaultTab);
        })
        .catch((err) => {
          console.log("Fetch permissions note:", err.message);
        });
    }
  }, [role, language]);

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
            {t("actions.loading")}
          </p>
        </div>
      </div>
    );
  }

  const activePermissionItem =
    permissions?.navigation.find((i) => i.id === activeTab) ||
    permissions?.navigation[0];

  const navItemKeyMap: Record<string, string> = {
    overview: "dashboard.nav.overview",
    modules: "dashboard.nav.learningModules",
    assignments: "dashboard.nav.classAssignments",
    practice: "dashboard.nav.practiceQuizzes",
    quizzes: "dashboard.nav.quizzes",
    grading: "dashboard.nav.grading",
    "diagnostic-quiz": "dashboard.nav.diagnosticQuiz",
    "gap-report": "dashboard.nav.gapReport",
    classes: "dashboard.nav.classes",
    teachers: "dashboard.nav.teachers",
    students: "dashboard.nav.students",
    subjects: "dashboard.nav.subjects",
    curriculum: "dashboard.nav.curriculum",
    analytics: "dashboard.nav.analytics",
    "parent-connect": "dashboard.nav.parentConnect",
    settings: "dashboard.nav.settings",
    "admin-requests": "dashboard.nav.adminRequests",
    "school-requests": "dashboard.nav.schoolRequests",
    history: "dashboard.nav.history",
    children: "dashboard.nav.children",
    progress: "dashboard.nav.progress",
    ncert_master: "dashboard.nav.ncertMaster",
    schools: "dashboard.nav.schools",
  };

  const getPageTitle = () => {
    if (role === "student" && activeTab === "overview") {
      const studentOverview = t("dashboard.nav.studentOverview");
      if (studentOverview && studentOverview !== "dashboard.nav.studentOverview") return studentOverview;
    }
    const navKey = navItemKeyMap[activeTab] || `dashboard.nav.${activeTab}`;
    const translated = t(navKey as any);
    if (translated && translated !== navKey) return translated;
    return activePermissionItem?.label || `${role?.toUpperCase()} Dashboard`;
  };

  const getPageDesc = () => {
    if (role === "student" && activeTab === "overview") {
      const studentDesc = t("dashboard.topbar.studentOverviewDesc");
      if (studentDesc && studentDesc !== "dashboard.topbar.studentOverviewDesc") return studentDesc;
    }
    const descKey = `dashboard.descriptions.${activeTab}`;
    const translated = t(descKey as any);
    if (translated && translated !== descKey) return translated;
    return activePermissionItem?.description || t("dashboard.topbar.manageWorkspace");
  };

  const getRoleBadge = () => {
    const key = `dashboard.topbar.roles.${role}`;
    const translated = t(key as any);
    return translated && translated !== key ? translated : (permissions?.role_label || `${role} Role`);
  };

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
              aria-label={t("nav.openMenu")}
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
                  {getPageTitle()}
                </h1>
                {activePermissionItem?.badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand/10 text-brand border border-brand/20">
                    {activePermissionItem.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate hidden sm:block">
                {getPageDesc()}
              </p>
            </div>
          </div>

          {/* Student Playful Search Bar in Topbar */}
          {role === "student" && (
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("Search languages, lessons, modules...")}
                  className="w-full rounded-full border border-slate-200/80 bg-slate-50/90 pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200/50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-sky-600"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Student XP Counter Badge — real /student/gamification data, the
                same summary the Mystery Chest widget reads, so the topbar can
                never disagree with it. */}
            {role === "student" && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-xs font-black text-sky-600 dark:text-sky-400 shadow-xs">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <AnimatedNumber value={gamification?.total_xp ?? 0} />
                </div>
              </div>
            )}

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
              <span>{getRoleBadge()}</span>
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
              <span className="hidden sm:inline font-semibold">{t("dashboard.topbar.signOut")}</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Body with Dynamic View Routing */}
        <main
          className={
            isConsole
              ? "mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8"
              : role === "student"
              ? // Wider, airier canvas for the learner view — the reference's
                // two-column composition needs the room.
                "student-canvas mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8"
              : "flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6"
          }
        >
          {role === "student" && (
            <StudentDashboardView
              student={user as StudentProfile}
              setupClass={setupClass}
              activeTab={activeTab}
              gamification={gamification}
              claimingChest={claimingChest}
              onClaimChest={handleClaimChest}
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
              onSelectTab={setActiveTab}
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
  gamification,
  claimingChest,
  onClaimChest,
}: {
  student: StudentProfile;
  setupClass: (data: { class_number: number; section: string }) => Promise<void>;
  activeTab?: string;
  /** Real XP/chest state from /student/gamification, lifted to
   * DashboardPage so the topbar pill and these widgets never disagree. */
  gamification: GamificationSummaryOut | null;
  claimingChest: boolean;
  onClaimChest: () => void;
}) {
  const { t } = useTranslation();
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

  const mascotMood: MascotMood = !needsSetup && !loadingQuizStatus && quizStatus?.completed
    ? "happy"
    : "idle";

  useEffect(() => {
    if (needsSetup) return;
    setLoadingQuizStatus(true);
    getQuizStatus()
      .then((res) => setQuizStatus(res))
      .catch((err) => console.log("Quiz status fetch note:", err.message))
      .finally(() => setLoadingQuizStatus(false));
  }, [needsSetup]);

  // Single authoritative progress read — the same hook ModuleProgressOverview
  // and RecentActivityWidget use, so this card and the rest of the dashboard
  // can never disagree about what's completed. See hooks/useStudentProgress.
  const { progress: learningProgress } = useStudentProgress(student.id, {
    enabled: !needsSetup && !!quizStatus?.completed,
  });

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
    getSubjectPriority()
      .then((res) => setSubjectPriority(res))
      .catch((err) => console.log("Subject priority fetch note:", err.message));
  }, [needsSetup, quizStatus?.completed, student.class_number, isSelfEnrolled]);

  // Which module "Continue Learning" points at. Nothing is fabricated: if the
  // backend reports no modules, this is null and the section does not render.
  const continueModule = (() => {
    const mods = learningProgress?.modules ?? [];
    if (mods.length === 0) return null;
    const inProgress = mods
      .filter((m) => m.status === "in_progress")
      .sort((a, b) => (b.last_activity_at || "").localeCompare(a.last_activity_at || ""));
    return inProgress[0] ?? mods.find((m) => m.status === "not_started") ?? null;
  })();

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
      <div className="fixed bottom-5 right-5 z-30 hidden sm:block">
        <Mascot mood={mascotMood} size={72} />
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* ── 1. Hero — daylight panoramic banner with cute 3D cartoon panda ── */}
          <StudentHero
            mascotMood={mascotMood}
            topBadge={
              <>
                <BookOpen className="h-3.5 w-3.5 text-sky-500" />
                <span>
                  {isSelfEnrolled
                    ? `NCERT Class ${student.class_number || 1}`
                    : `Class ${student.class_number || 1}${student.section || "A"} · ${student.branch_name}`}
                </span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </>
            }
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-sky-900 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-sky-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isSelfEnrolled
                    ? t("dashboard.student.selfEnrolledBadge")
                    : t("dashboard.student.schoolEnrolledBadge")}
                </span>
                <span className="opacity-30">•</span>
                <span className="font-mono font-extrabold">{student.unique_number}</span>
              </span>
            }
            title={`${t("Good morning")}, ${
              student.full_name || `${t("dashboard.student.studentPrefix")}${student.unique_number}`
            }! 👋`}
            subtitle={
              <p className="student-hero-sub">
                {isSelfEnrolled
                  ? t("dashboard.student.selfEnrolledTag")
                  : `${student.school_name} — ${student.branch_name} (${student.state})`}
                . {t("One lesson closer to your next learning adventure!")}
              </p>
            }
            actions={
              needsSetup ? undefined : quizStatus && !quizStatus.completed ? (
                <Link href="/dashboard/diagnostic-quiz">
                  <Button variant="primary" size="md" className="rounded-full px-6 shadow-md shadow-sky-500/25">
                    <Target className="mr-1.5 h-4 w-4" />
                    {quizStatus.in_progress_attempt_id ? t("Continue Quiz") : t("Start Diagnostic Quiz")}
                  </Button>
                </Link>
              ) : quizStatus?.completed ? (
                <>
                  <Link href="/dashboard/learn">
                    <Button variant="primary" size="md" className="rounded-full px-6 shadow-md shadow-sky-500/25">
                      <Play className="mr-1.5 h-4 w-4 fill-white" />
                      {t("Continue Learning →")}
                    </Button>
                  </Link>
                  <Link href="/dashboard/diagnostic-quiz">
                    <Button
                      variant="secondary"
                      size="md"
                      className="rounded-full border-white/90 bg-white/90 px-5 text-sky-900 shadow-sm backdrop-blur-md hover:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    >
                      {t("View My Results")}
                    </Button>
                  </Link>
                </>
              ) : undefined
            }
            facts={
              <>
                <StudentHeroFact
                  label={
                    isSelfEnrolled
                      ? t("dashboard.student.class")
                      : t("dashboard.student.classAndSection")
                  }
                  value={
                    student.class_number
                      ? isSelfEnrolled
                        ? `${student.class_number}`
                        : `${student.class_number}${student.section}`
                      : "—"
                  }
                  hint={
                    student.class_number
                      ? isSelfEnrolled
                        ? t("NCERT Curriculum")
                        : t("Assigned section")
                      : t("dashboard.student.notConfigured")
                  }
                />
                <StudentHeroFact
                  label={t("dashboard.student.availableModules")}
                  value={
                    <AnimatedNumber value={isSelfEnrolled ? ncertBooks.length : modules.length} />
                  }
                  hint={isSelfEnrolled ? t("NCERT Official Books") : t("School Branch Syllabus")}
                />
                <StudentHeroFact
                  label={t("Diagnostic Assessment")}
                  value={quizStatus?.completed ? t("Done") : t("Pending")}
                  hint={quizStatus?.completed ? t("Completed") : t("Unlocks your modules")}
                />
              </>
            }
          />

          {/* ── 2. Class setup — only when the account still needs it ────── */}
          {needsSetup && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="student-card rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                      {isSelfEnrolled
                        ? t("dashboard.student.selectClassTitle")
                        : t("dashboard.student.setupClassTitle")}
                    </h4>
                    <p className="mt-1 text-xs text-text-secondary">
                      {isSelfEnrolled
                        ? t("dashboard.student.selectClassDesc")
                        : t("dashboard.student.setupClassDesc")}
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
                          {t("dashboard.student.class")}
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(Number(e.target.value))}
                          className={`${inputClass} w-auto`}
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              {t("dashboard.student.class")} {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!isSelfEnrolled && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-secondary">
                            {t("dashboard.student.section")}
                          </label>
                          <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className={`${inputClass} w-auto`}
                          >
                            {["A", "B", "C", "D"].map((sec) => (
                              <option key={sec} value={sec}>
                                {t("dashboard.student.section")} {sec}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="self-end">
                        <Button type="submit" variant="primary" size="sm" disabled={isSettingUp}>
                          {isSettingUp
                            ? t("actions.loading")
                            : isSelfEnrolled
                            ? t("dashboard.student.saveClass")
                            : t("dashboard.student.saveClassAndSection")}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 3. Main 2-Column Content + Right Widgets Layout ────────────────── */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Left Column: Learning Sections */}
            <div className="min-w-0 space-y-8">
              {/* ── A. Continue Learning — driven entirely by the real
                     /student/progress payload. Rendered only when the backend
                     actually reports a module in progress; there is no
                     placeholder title, thumbnail or percentage. ─────────── */}
              {!needsSetup && quizStatus?.completed && continueModule && (
                <StudentSection
                  title="Continue Learning"
                  icon={Play}
                  action={
                    <Link
                      href="/dashboard/learn"
                      className="text-xs font-extrabold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                    >
                      See All
                    </Link>
                  }
                >
                  <ContinueLearningHeroCard
                    title={continueModule.current_lesson_title || continueModule.title}
                    subtitle={`${continueModule.subject} · ${continueModule.completed_lessons} of ${continueModule.total_lessons} lessons`}
                    progressPercent={continueModule.progress_percent}
                    href={
                      continueModule.current_lesson_id
                        ? `/dashboard/learn/${continueModule.current_lesson_id}`
                        : `/dashboard/learn?subject=${encodeURIComponent(continueModule.subject)}`
                    }
                    actionText={continueModule.completed_lessons > 0 ? "Resume" : "Start"}
                  />
                </StudentSection>
              )}

              {/* ── B. Focus Areas — diagnostic gap priorities ────────────── */}
              {!needsSetup && quizStatus?.completed && subjectPriority.length > 0 && (
                <StudentSection title="Your Focus Areas" icon={Target}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {subjectPriority.map((sp, i) => (
                      <SkillCard
                        key={sp.subject}
                        index={i}
                        subject={sp.subject}
                        percent={Math.round(sp.avg_mastery * 100)}
                        caption={
                          sp.gap_count > 0
                            ? `${sp.gap_count} gap${sp.gap_count === 1 ? "" : "s"} to review`
                            : "No gaps found"
                        }
                        footnote={i === 0 ? "Review this first" : `Priority ${sp.priority_rank}`}
                      />
                    ))}
                  </div>
                </StudentSection>
              )}

              {/* ── C. Module & Overall Progress — same authoritative
                     /student/progress read as Continue Learning above (see
                     hooks/useStudentProgress). Lives here, in the main
                     column, rather than stacked into the right sidebar: it's
                     substantial detail, and this is where the dashboard had
                     the most unused vertical space. ─────────────────────── */}
              {!needsSetup &&
                quizStatus?.completed !== false &&
                (learningProgress === null || learningProgress.total_modules > 0) && (
                  <StudentSection title="Your Learning Progress" icon={BarChart3}>
                    <ModuleProgressOverview student={student} />
                  </StudentSection>
                )}

              {/* ── E. Detailed Modules & Textbooks with PDF Links ────────── */}
              {!needsSetup && quizStatus?.completed && (
                <StudentSection
                  title={
                    isSelfEnrolled
                      ? `Class ${student.class_number || 1} Textbooks`
                      : "Class Modules & Textbooks"
                  }
                  icon={Layers}
                >
                  {loadingModules ? (
                    <div className="rounded-2xl border border-slate-200 bg-white grid place-items-center py-10 dark:border-slate-800 dark:bg-slate-900">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    </div>
                  ) : (isSelfEnrolled ? ncertBooks.length : modules.length) > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {isSelfEnrolled
                        ? ncertBooks.slice(0, 6).map((book, i) => (
                            <LearningCard
                              key={book.id}
                              index={i}
                              icon={BookOpen}
                              subject={book.subject}
                              title={book.title}
                              meta={`Class ${book.class_number} · Official NCERT Standard`}
                              action={
                                book.file_url ? (
                                  <a
                                    href={formatPdfUrl(book.file_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-600"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Study PDF
                                  </a>
                                ) : (
                                  <span className="text-[11px] italic text-slate-400">
                                    PDF Pending Upload
                                  </span>
                                )
                              }
                            />
                          ))
                        : modules.slice(0, 6).map((mod, i) => (
                            <LearningCard
                              key={mod.id}
                              index={i}
                              icon={FileText}
                              subject={mod.subject}
                              title={mod.title}
                              meta={`Class ${mod.class_number}`}
                              action={
                                mod.file_url ? (
                                  <a
                                    href={formatPdfUrl(mod.file_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-600"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Open PDF
                                  </a>
                                ) : (
                                  <span className="text-[11px] italic text-slate-400">
                                    NCERT Content
                                  </span>
                                )
                              }
                            />
                          ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white grid place-items-center gap-3 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
                      <Image
                        src="/images/panda_app_logo.jpg"
                        alt="Panda Mascot"
                        width={64}
                        height={64}
                        className="rounded-full shadow-sm"
                      />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isSelfEnrolled
                          ? "Loading NCERT Curriculum"
                          : "No School Modules Uploaded Yet"}
                      </h3>
                      <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {isSelfEnrolled
                          ? `Official NCERT textbooks for Class ${
                              student.class_number || 1
                            } are ready for your learning journey.`
                          : `No learning modules have been uploaded for Class ${
                              student.class_number || 1
                            } at your school branch yet.`}
                      </p>
                    </div>
                  )}
                </StudentSection>
              )}
            </div>

            {/* Right Column: compact, high-priority widgets only — Daily
                Goal, Leaderboard, Mystery Chest, then a short Recent
                Activity list. The heavier progress detail moved to the main
                column above so this column stays scannable instead of
                growing into a long stack. */}
            <div className="min-w-0 space-y-6">
              <StudentSideWidgets
                student={student}
                summary={gamification}
                onClaimChest={onClaimChest}
                claiming={claimingChest}
              />
              {!needsSetup && quizStatus?.completed !== false && (
                <RecentActivityWidget student={student} limit={5} />
              )}
            </div>
          </div>
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
                    {t("dashboard.student.unlockBannerTitle")}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1 max-w-lg">
                    {t("dashboard.student.unlockBannerDesc", {
                      curriculum: isSelfEnrolled
                        ? t("dashboard.student.ncertCurriculum")
                        : t("dashboard.student.learningModules"),
                    })}
                  </p>
                  <Link href="/dashboard/diagnostic-quiz" className="inline-block mt-4">
                    <Button variant="primary" size="sm">
                      {quizStatus.in_progress_attempt_id
                        ? t("dashboard.student.continueQuiz")
                        : t("dashboard.student.startQuiz")}
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
                <span className="text-sm text-text-primary font-semibold">
                  {t("dashboard.student.diagnosticCompleted")}
                </span>
              </div>
              <Link href="/dashboard/diagnostic-quiz" className="text-xs text-brand font-semibold hover:underline">
                {t("dashboard.student.viewResults")}
              </Link>
            </div>
          )}

          {!needsSetup && quizStatus?.completed && (
            <div className="mb-8">
              <GapModulesPanel />
            </div>
          )}

          {!needsSetup && quizStatus?.completed && (
          <>
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            <span>
              {isSelfEnrolled
                ? t("dashboard.student.ncertClassCurriculum", { class: student.class_number || 1 })
                : t("dashboard.student.schoolModules")}
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
                      {group.items.map((book) => {
                        const prog = learningProgress?.modules.find(
                          (m) => m.subject.toLowerCase() === (book.subject || "").toLowerCase()
                        );
                        return (
                          <div
                            key={book.id}
                            className="glass rounded-[var(--radius-md)] p-5 border border-border-primary hover:border-brand transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand truncate">
                                    {book.subject}
                                  </span>
                                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">
                                    NCERT Book
                                  </span>
                                </div>
                                {prog && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                                      prog.status === "completed"
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : prog.status === "in_progress"
                                        ? "bg-brand/10 text-brand border-border-brand"
                                        : "bg-surface text-text-tertiary border-border-primary"
                                    }`}
                                  >
                                    {prog.status === "completed"
                                      ? "Completed"
                                      : prog.status === "in_progress"
                                      ? `${prog.progress_percent}% In Progress`
                                      : "Not Started"}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-text-primary">{book.title}</h3>
                              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                {book.description}
                              </p>
                            </div>

                          <div className="mt-4 pt-3 border-t border-border-primary/50 flex items-center justify-between">
                            <span className="text-[11px] text-text-tertiary">{t("Official NCERT Standard")}</span>
                            {book.file_url ? (
                              <a
                                href={formatPdfUrl(book.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {t("Study Book PDF →")}
                              </a>
                            ) : (
                              <span className="text-xs text-amber-500 font-semibold italic">
                                {t("PDF Pending Upload")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
                <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">{t("Loading NCERT Curriculum")}</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                  {t("Official NCERT textbooks are being loaded for your learning roadmap.")}
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
                      subject={t(group.subject)}
                      priorityInfo={group.priorityInfo}
                      isTopPriority={idx === 0}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((mod) => {
                        const prog = learningProgress?.modules.find(
                          (m) => m.subject.toLowerCase() === (mod.subject || "").toLowerCase()
                        );
                        return (
                          <div
                            key={mod.id}
                            className="glass rounded-[var(--radius-md)] p-5 border border-border-primary hover:border-brand transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand truncate">
                                    {t(mod.subject)}
                                  </span>
                                  <span className="text-xs text-text-tertiary shrink-0">{t(`Class ${mod.class_number}`)}</span>
                                </div>
                                {prog && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                                      prog.status === "completed"
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : prog.status === "in_progress"
                                        ? "bg-brand/10 text-brand border-border-brand"
                                        : "bg-surface text-text-tertiary border-border-primary"
                                    }`}
                                  >
                                    {prog.status === "completed"
                                      ? t("Completed")
                                      : prog.status === "in_progress"
                                      ? t(`${prog.progress_percent}% In Progress`)
                                      : t("Not Started")}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-text-primary">{t(mod.title)}</h3>
                            </div>

                            {mod.file_url ? (
                              <a
                                href={formatPdfUrl(mod.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {t("Open PDF Module")}
                              </a>
                            ) : (
                              <span className="mt-4 text-xs text-text-tertiary italic">{t("NCERT Module Content")}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state if roles/data are not seeded */
              <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
                <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">{t("No School Modules Uploaded Yet")}</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
                  {t("No learning modules have been uploaded for your class yet.")}
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

      {/* TAB: HISTORY */}
      {activeTab === "history" && <StudentHistorySection />}
    </div>
  );
}

function StudentHistorySection() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "diagnostic" | "class_tests">("all");
  const [diagnosticAttempts, setDiagnosticAttempts] = useState<QuizAttemptSummaryOut[]>([]);
  const [testResults, setTestResults] = useState<StudentTestResultSummaryOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [selectedClassTestHistory, setSelectedClassTestHistory] = useState<{
    title: string;
    attempts: AssignmentAttemptOut[];
    feedback?: FeedbackOut | null;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getQuizAttempts().catch((err) => {
        console.log("Diagnostic attempts fetch error:", err.message);
        return [];
      }),
      getStudentTestResults().catch((err) => {
        console.log("Student test results fetch error:", err.message);
        return [];
      }),
    ])
      .then(([diagAttempts, results]) => {
        setDiagnosticAttempts(diagAttempts);
        setTestResults(results);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute metric stats
  const completedDiagnosticCount = diagnosticAttempts.filter((a) => a.status === "completed").length;
  const latestCompletedDiagnostic = diagnosticAttempts.find((a) => a.status === "completed");

  const classTestCount = testResults.length;
  const gradedClassTests = testResults.filter(
    (r) => (r.submission?.percentage ?? r.attempts[0]?.percentage) !== null && (r.submission?.percentage ?? r.attempts[0]?.percentage) !== undefined
  );
  const avgClassTestScore =
    gradedClassTests.length > 0
      ? gradedClassTests.reduce(
          (acc, r) => acc + (r.submission?.percentage ?? r.attempts[0]?.percentage ?? 0),
          0
        ) / gradedClassTests.length
      : null;

  // Build unified items list for "all" filter, ordered by date descending
  type UnifiedHistoryItem =
    | { type: "diagnostic"; date: string; data: QuizAttemptSummaryOut }
    | { type: "class_test"; date: string; data: StudentTestResultSummaryOut };

  const unifiedItems: UnifiedHistoryItem[] = [];

  if (filter === "all" || filter === "diagnostic") {
    diagnosticAttempts.forEach((att) => {
      unifiedItems.push({
        type: "diagnostic",
        date: att.completed_at || att.started_at,
        data: att,
      });
    });
  }

  if (filter === "all" || filter === "class_tests") {
    testResults.forEach((res) => {
      const date =
        res.submission?.last_attempted_at ||
        res.attempts[0]?.started_at ||
        res.assignment.created_at;
      unifiedItems.push({
        type: "class_test",
        date,
        data: res,
      });
    });
  }

  unifiedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-6">
      {/* Top Header & Filter Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand" />
            <span>{t("Personal Assessment & Attempt History")}</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {t("Review past scores, attempts, teacher feedback, and AI study advice for diagnostic & class tests.")}
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-[var(--radius-md)] border border-border-primary self-start sm:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t(`All (${diagnosticAttempts.length + testResults.length})`)}
          </button>
          <button
            onClick={() => setFilter("diagnostic")}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
              filter === "diagnostic"
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t(`Diagnostic Quizzes (${diagnosticAttempts.length})`)}
          </button>
          <button
            onClick={() => setFilter("class_tests")}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
              filter === "class_tests"
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t(`Class Tests (${testResults.length})`)}
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {t("Diagnostic Assessment")}
            </span>
            <div className="text-lg font-extrabold text-text-primary mt-0.5">
              {latestCompletedDiagnostic?.overall_score !== null &&
              latestCompletedDiagnostic?.overall_score !== undefined
                ? `${latestCompletedDiagnostic.overall_score.toFixed(1)}%`
                : completedDiagnosticCount > 0
                ? t("Completed")
                : t("Pending")}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {t(`${completedDiagnosticCount} Attempt${completedDiagnosticCount === 1 ? "" : "s"} Recorded`)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {t("Class Tests Performance")}
            </span>
            <div className="text-lg font-extrabold text-text-primary mt-0.5">
              {avgClassTestScore !== null ? `${avgClassTestScore.toFixed(1)}% Avg` : t("No Scores Yet")}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {t(`${classTestCount} Class Test${classTestCount === 1 ? "" : "s"} Assigned`)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-md)] p-4 border border-border-primary flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {t("Total Assessments")}
            </span>
            <div className="text-lg font-extrabold text-text-primary mt-0.5 font-[family-name:var(--font-display)]">
              {diagnosticAttempts.length + testResults.length}
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {t("Diagnostic & Teacher Tests Combined")}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : unifiedItems.length > 0 ? (
        <div className="space-y-4">
          {unifiedItems.map((item) => {
            if (item.type === "diagnostic") {
              const att = item.data;
              const isCompleted = att.status === "completed";

              return (
                <div
                  key={`diag-${att.id}`}
                  className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-4 hover:border-brand/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand border border-border-brand">
                          {t("Diagnostic Quiz")}
                        </span>
                        <span className="text-xs text-text-tertiary font-medium">
                          • {att.subjects?.join(", ") || "All Subjects"}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                        <Target className="w-4 h-4 text-brand shrink-0" />
                        <span>{t("Adaptive Diagnostic Assessment Attempt")}</span>
                      </h4>

                      <p className="text-[11px] text-text-tertiary">
                        {t("Started:")} {new Date(att.started_at).toLocaleString()}
                        {att.completed_at &&
                          ` • ${t("Completed:")} ${new Date(att.completed_at).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {att.overall_score !== null && att.overall_score !== undefined ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand/10 text-brand border border-border-brand">
                          {att.overall_score.toFixed(1)}% {t("Mastery")}
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {isCompleted ? t("Completed") : t("Pending")}
                        </span>
                      )}

                      {isCompleted && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedDiagnosticId(att.id)}
                          className="text-xs py-1 gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {t("View Gap Report")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              const res = item.data;
              const asgn = res.assignment;
              const sub = res.submission;
              const attempts = res.attempts;
              const fb = res.teacher_feedback;

              const latestAttempt = attempts[0];
              const scorePercent = sub?.percentage ?? latestAttempt?.percentage;
              const isPassed = sub?.is_passed ?? latestAttempt?.is_passed;

              return (
                <div
                  key={`asgn-${asgn.id}`}
                  className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-4 hover:border-brand/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand">
                          {asgn.assignment_type === "pdf_upload" ? t("Manual PDF Test") : t("AI Quiz")}
                        </span>
                        {asgn.subject && (
                          <span className="text-xs text-text-tertiary font-medium">• {asgn.subject}</span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand shrink-0" />
                        <span>{t(asgn.title)}</span>
                      </h4>

                      <p className="text-[11px] text-text-tertiary">
                        {t("Assigned on")} {new Date(asgn.created_at).toLocaleDateString()}
                        {sub?.last_attempted_at &&
                          ` • ${t("Last Attempt:")} ${new Date(sub.last_attempted_at).toLocaleString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {scorePercent !== null && scorePercent !== undefined ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            isPassed
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          }`}
                        >
                          {scorePercent.toFixed(1)}% ({isPassed ? t("PASSED") : t("FAILED")})
                        </span>
                      ) : (
                        <span className="text-xs text-text-tertiary italic">{t("Pending")}</span>
                      )}

                      {attempts.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setSelectedClassTestHistory({
                              title: asgn.title,
                              attempts,
                              feedback: fb,
                            })
                          }
                          className="text-xs py-1 gap-1 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {t(`View Attempts (${attempts.length})`)}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Teacher Feedback Banner if present */}
                  {fb && (
                    <div className="p-3 rounded bg-brand/5 border border-border-brand text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-brand font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t("Teacher Feedback:")}</span>
                      </div>
                      <p className="text-text-primary">
                        <DynamicText text={fb.feedback_text} />
                      </p>
                    </div>
                  )}

                  {/* AI Feedback Preview if present */}
                  {latestAttempt?.ai_feedback && (
                    <div className="p-3 rounded bg-surface/60 border border-border-primary/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-brand font-bold">
                        <Brain className="w-3.5 h-3.5" />
                        <span>{t("Latest AI Study Advice:")}</span>
                      </div>
                      <p className="text-text-primary line-clamp-2">
                        <DynamicText text={latestAttempt.ai_feedback} />
                      </p>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      ) : (
        <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
          <Clock className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
          <h4 className="text-sm font-semibold text-text-primary">{t("No recorded attempt history found for this test.")}</h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
            Complete your diagnostic quiz or submit class assignments to start building your personal assessment history.
          </p>
        </div>
      )}

      {/* Diagnostic Gap Report Modal */}
      {selectedDiagnosticId && (
        <DiagnosticReportModal
          attemptId={selectedDiagnosticId}
          onClose={() => setSelectedDiagnosticId(null)}
        />
      )}

      {/* Class Test Attempt History Modal */}
      {selectedClassTestHistory && (
        <AttemptHistoryModal
          assignmentTitle={selectedClassTestHistory.title}
          attempts={selectedClassTestHistory.attempts}
          teacherFeedback={selectedClassTestHistory.feedback}
          onClose={() => setSelectedClassTestHistory(null)}
        />
      )}
    </div>
  );
}

function StudentAssignmentsSection() {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<AssignmentOut[]>([]);
  const [testResults, setTestResults] = useState<StudentTestResultSummaryOut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active quiz runner state
  const [activeQuizAsgn, setActiveQuizAsgn] = useState<{ id: string; title: string } | null>(null);

  // PDF Response upload state per assignment
  const [uploadingPdfId, setUploadingPdfId] = useState<string | null>(null);
  const [selectedResponseFile, setSelectedResponseFile] = useState<Record<string, File | null>>({});
  const [pdfUploadError, setPdfUploadError] = useState<Record<string, string | null>>({});

  const fetchStudentData = () => {
    setLoading(true);
    Promise.all([getStudentAssignments(), getStudentTestResults()])
      .then(([asgns, results]) => {
        setAssignments(asgns);
        setTestResults(results);
      })
      .catch((err) => console.log("Student assignments note:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleResponseFileChange = (asgnId: string, file: File | null) => {
    if (!file) {
      setSelectedResponseFile((prev) => ({ ...prev, [asgnId]: null }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPdfUploadError((prev) => ({
        ...prev,
        [asgnId]: "File exceeds 5 MB limit. Please select a smaller PDF.",
      }));
      setSelectedResponseFile((prev) => ({ ...prev, [asgnId]: null }));
      return;
    }
    if (file.type !== "application/pdf") {
      setPdfUploadError((prev) => ({
        ...prev,
        [asgnId]: "Only PDF files are allowed.",
      }));
      setSelectedResponseFile((prev) => ({ ...prev, [asgnId]: null }));
      return;
    }

    setPdfUploadError((prev) => ({ ...prev, [asgnId]: null }));
    setSelectedResponseFile((prev) => ({ ...prev, [asgnId]: file }));
  };

  const handleUploadResponsePdf = async (asgnId: string) => {
    const file = selectedResponseFile[asgnId];
    if (!file) return;

    setUploadingPdfId(asgnId);
    setPdfUploadError((prev) => ({ ...prev, [asgnId]: null }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadAssignmentResponsePdf(asgnId, formData);
      alert("Response PDF uploaded successfully!");
      setSelectedResponseFile((prev) => ({ ...prev, [asgnId]: null }));
      fetchStudentData();
    } catch (err: any) {
      setPdfUploadError((prev) => ({
        ...prev,
        [asgnId]: err.message || "Failed to upload response PDF.",
      }));
    } finally {
      setUploadingPdfId(null);
    }
  };

  return (
    <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            <span>{t("Class Tests, Quizzes & Active Homework")}</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {t(
              "Attempt assigned AI quizzes and upload PDF responses before deadlines. Past test results & feedback can be reviewed under Assessment History."
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((asgn) => {
            const resSummary = testResults.find((r) => r.assignment.id === asgn.id);
            const submission = resSummary?.submission;
            const attempts = resSummary?.attempts || [];
            const latestAttempt = attempts[0];

            const isPassed = submission?.is_passed ?? latestAttempt?.is_passed ?? false;
            const hasAttempts = attempts.length > 0;
            const scorePercent = submission?.percentage ?? latestAttempt?.percentage;

            return (
              <div
                key={asgn.id}
                className="glass rounded-[var(--radius-md)] p-5 border border-border-primary space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand border border-border-brand">
                      {asgn.assignment_type === "pdf_upload" ? t("Manual PDF Test") : t("AI RAG Quiz")}
                    </span>

                    {asgn.deadline_at && (
                      <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("Due")} {new Date(asgn.deadline_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-text-primary">{t(asgn.title)}</h4>
                  {asgn.description && (
                    <p className="text-xs text-text-secondary line-clamp-2">{t(asgn.description)}</p>
                  )}

                  {asgn.subject && (
                    <span className="inline-block text-[11px] font-semibold text-text-tertiary">
                      {t("Subject:")} {t(asgn.subject)}
                    </span>
                  )}

                  {/* Question PDF Link for manual PDF test */}
                  {asgn.file_url && (
                    <div className="pt-1">
                      <a
                        href={formatPdfUrl(asgn.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        {t("View Question Paper (PDF) →")}
                      </a>
                    </div>
                  )}
                </div>

                {/* Submission Status & Action */}
                <div className="pt-3 border-t border-border-primary/50 space-y-3">
                  {hasAttempts && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">{t("Latest Status:")}</span>
                      {scorePercent !== null && scorePercent !== undefined ? (
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isPassed
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {scorePercent.toFixed(1)}% ({isPassed ? t("PASSED") : t("FAILED")})
                        </span>
                      ) : (
                        <span className="text-brand font-semibold">
                          {t("Submitted")} ({t(`${attempts.length} Attempt${attempts.length === 1 ? "" : "s"} Recorded`)})
                        </span>
                      )}
                    </div>
                  )}

                  {asgn.assignment_type === "ai_quiz" ? (
                    /* AI Quiz Attempt Button */
                    <div className="flex items-center justify-between gap-2">
                      {isPassed ? (
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> {t("Test Passed (Score ≥ 60%)")}
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActiveQuizAsgn({ id: asgn.id, title: asgn.title })}
                          className="w-full text-xs py-1.5 gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {hasAttempts ? t("Re-attempt Quiz (Adapted Questions)") : t("Attempt AI Quiz (15 Mins)")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* Manual PDF Response Upload Widget */
                    <div className="space-y-2">
                      {pdfUploadError[asgn.id] && (
                        <p className="text-[11px] text-rose-500">{pdfUploadError[asgn.id]}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleResponseFileChange(asgn.id, e.target.files?.[0] || null)
                            }
                          />
                          <div className="px-3 py-1.5 rounded bg-surface border border-border-primary text-xs text-text-secondary hover:border-brand truncate text-center font-medium">
                            {selectedResponseFile[asgn.id]
                              ? selectedResponseFile[asgn.id]?.name
                              : t("Select Response PDF (Max 5MB)")}
                          </div>
                        </label>

                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!selectedResponseFile[asgn.id] || uploadingPdfId === asgn.id}
                          onClick={() => handleUploadResponsePdf(asgn.id)}
                          className="text-xs py-1.5 shrink-0 cursor-pointer"
                        >
                          {uploadingPdfId === asgn.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            t("Upload PDF")
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
          <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
          <h4 className="text-sm font-semibold text-text-primary">{t("No Active Tests Available")}</h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
            {t(
              "There are currently no active quizzes or assignments for your class section. You can check your past test attempts under \"Assessment History\"."
            )}
          </p>
        </div>
      )}

      {/* Quiz Runner Modal */}
      {activeQuizAsgn && (
        <QuizRunnerModal
          assignmentId={activeQuizAsgn.id}
          assignmentTitle={activeQuizAsgn.title}
          timeLimitMinutes={15}
          onClose={() => setActiveQuizAsgn(null)}
          onSuccess={() => {
            fetchStudentData();
          }}
        />
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
  const { t } = useTranslation();
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
            {/* ── 1. Hero: Premium Admin Institutional Welcome Banner ── */}
            <Hero
              eyebrow={
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100/80 bg-white/80 px-3.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{school.branch_name} Branch</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span>
                    Prefix: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{school.student_prefix}</span>
                  </span>
                </span>
              }
              title={`Hello, ${school.school_name || "Admin"}! 👋`}
              subtitle={
                <p>
                  Welcome back! Here&apos;s what&apos;s happening across{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {school.school_name || "your school"}
                  </span>{" "}
                  today.
                </p>
              }
              actions={
                <>
                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      const curriculumTab = document.querySelector('[data-tab="curriculum"]') as HTMLElement;
                      curriculumTab?.click();
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-blue-700/30"
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>View Reports</span>
                  </button>

                  {/* Secondary CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      const teachersTab = document.querySelector('[data-tab="teachers"]') as HTMLElement;
                      teachersTab?.click();
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700/90 dark:hover:border-slate-600"
                  >
                    <Users className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span>Manage Users</span>
                  </button>
                </>
              }
              illustration={
                <Image
                  src="/images/admin_hero_illustration.png"
                  alt="Admin at workspace"
                  width={480}
                  height={360}
                  priority
                  className="h-[210px] sm:h-[255px] lg:h-[285px] xl:h-[310px] w-auto select-none object-contain object-bottom drop-shadow-lg"
                />
              }
              facts={
                <>
                  <HeroFact
                    label="Teachers"
                    value={teacherCount !== null ? <AnimatedNumber value={teacherCount} /> : "—"}
                    hint="Registered in branch"
                    accent="#3b82f6"
                  />
                  <HeroFact
                    label="Students"
                    value={<AnimatedNumber value={quizSummaries.length} />}
                    hint={`Class ${selectedClass} roster`}
                    accent="#10b981"
                  />
                  <HeroFact
                    label="Modules"
                    value={<AnimatedNumber value={modules.length} />}
                    hint={`${classSubjects.length} subject${classSubjects.length === 1 ? "" : "s"}`}
                    accent="#8b5cf6"
                  />
                  <HeroFact
                    label="Syllabus"
                    value="1–5"
                    hint="Active classes"
                    accent="#f59e0b"
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

function WardProgressWidget({
  uniqueNumber,
  onViewDetailed,
}: {
  uniqueNumber: string;
  onViewDetailed?: () => void;
}) {
  const [progress, setProgress] = useState<StudentProgressOut | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    getChildLearningProgress(uniqueNumber)
      .then((data) => {
        if (!cancelled) setProgress(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uniqueNumber]);

  if (loading) {
    return (
      <div className="py-2 flex items-center justify-center border-t border-[var(--c-line)] mt-3 pt-3">
        <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="mt-3 pt-3 border-t border-[var(--c-line)] space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-primary">Learning Progress</span>
        <span className="font-bold text-brand">{progress.overall_percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--c-sunken)] overflow-hidden">
        <div
          className={`h-full rounded-full ${progress.overall_percent >= 100 ? "bg-emerald-500" : "bg-brand"}`}
          style={{ width: `${Math.min(100, Math.max(0, progress.overall_percent))}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-text-secondary pt-0.5">
        <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
          <Award className="w-3.5 h-3.5" /> {progress.points ?? 0} XP
        </span>
        <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
          <Flame className="w-3 h-3" /> {progress.current_streak ?? 0}d streak
        </span>
        <span>
          {progress.modules_completed}/{progress.total_modules} done
        </span>
      </div>
      {onViewDetailed && (
        <button
          onClick={onViewDetailed}
          className="w-full text-center text-[11px] font-bold text-brand hover:underline pt-1 cursor-pointer block"
        >
          View Detailed Progress &amp; Growth →
        </button>
      )}
    </div>
  );
}

function getGreetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ParentDashboardView({
  parent,
  activeTab = "overview",
  onSelectTab,
}: {
  parent: ParentProfile;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}) {
  const { t } = useTranslation();
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

  // Helper values for dynamic overview display
  const greeting = getGreetingPrefix();
  const parentFirstName = parent.full_name ? parent.full_name.split(" ")[0] : "Rajesh";
  const enrolledClassesCount =
    new Set(childrenList.map((c) => c.class_number).filter(Boolean)).size ||
    (childrenList.length > 0 ? childrenList.length : 3);

  const firstChildName = childrenList[0]?.full_name || "Aarav Sharma";
  const secondChildName = childrenList[1]?.full_name || "Ananya Sharma";

  return (
    <ConsoleMotion>
      <div className="space-y-6">
        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ── 0. Top Greeting & Date Header ───────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                  {greeting}, {parentFirstName}! 👋
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  Here&apos;s what&apos;s happening with your children today.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  type="button"
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                    3
                  </span>
                </button>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200">
                  <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* ── 1. Hero: light guardian banner with warm study background & family scene ── */}
            <ParentHero
              eyebrow={
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/80 px-3.5 py-1 text-xs font-bold text-sky-900 shadow-2xs backdrop-blur-sm dark:border-sky-900/50 dark:bg-slate-800/80 dark:text-sky-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{t("parentDashboard.guardianAccount")}</span>
                  <span className="opacity-30">•</span>
                  <span className="font-mono font-extrabold text-sky-600 dark:text-sky-400">
                    {parent.phone_number || parent.email || t("parentDashboard.registeredGuardian")}
                  </span>
                </span>
              }
              title={t("parentDashboard.welcome", {
                name: parentFirstName,
              })}
              subtitle={
                <p>
                  Follow every ward&apos;s learning in one place — school and NCERT modules,
                  diagnostic results, and direct remarks from their teachers.
                </p>
              }
              facts={
                <>
                  <ParentHeroFact
                    label={t("parentDashboard.monitoredWards")}
                    value={<AnimatedNumber value={childrenList.length > 0 ? childrenList.length : 2} />}
                    hint={t("parentDashboard.registeredStudents")}
                  />
                  <ParentHeroFact
                    label={t("parentDashboard.progressTracking")}
                    value={t("parentDashboard.activeStatus")}
                    hint={t("parentDashboard.syncingModules")}
                  />
                  <ParentHeroFact
                    label={t("parentDashboard.guardianFeedback")}
                    value={t("parentDashboard.connectedStatus")}
                    hint={t("parentDashboard.directTeacherRemarks")}
                  />
                </>
              }
            />

            {/* ── 2. Horizontal Pastel Quick Stat Cards (5 Cards) ─────────────── */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {/* Card 1: My Children */}
              <div className="group flex items-center justify-between rounded-2xl border border-sky-100 bg-white p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      My Children
                    </span>
                    <div className="text-lg font-black leading-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      {childrenList.length > 0 ? childrenList.length : 2}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Linked Children
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-sky-400 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Card 2: Classes Enrolled */}
              <div className="group flex items-center justify-between rounded-2xl border border-purple-100 bg-white p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Classes Enrolled
                    </span>
                    <div className="text-lg font-black leading-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      {enrolledClassesCount}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Across All Children
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-purple-400 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Card 3: Active Assignments */}
              <div className="group flex items-center justify-between rounded-2xl border border-amber-100 bg-white p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Active Assignments
                    </span>
                    <div className="text-lg font-black leading-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      5
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Needs Attention
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-400 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Card 4: Average Progress */}
              <div className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Average Progress
                    </span>
                    <div className="text-lg font-black leading-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      78%
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Overall Performance
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-400 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Card 5: Upcoming Tests */}
              <div className="group flex items-center justify-between rounded-2xl border border-rose-100 bg-white p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Upcoming Tests
                    </span>
                    <div className="text-lg font-black leading-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      2
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      This Week
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-400 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* ── 3. Bottom 3-Column Grid: Your Children | Recent Assignments | Upcoming Events ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Column 1: Your Children */}
              <div className="flex flex-col space-y-4 rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-2xs backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                    Your Children
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const childrenTab = document.querySelector('[data-tab="children"]') as HTMLElement;
                      childrenTab?.click();
                    }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {childrenList.length > 0 ? (
                    childrenList.map((child, idx) => {
                      const progress = idx === 0 ? 82 : idx === 1 ? 75 : 80;
                      return (
                        <div
                          key={child.id}
                          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all hover:border-sky-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-850"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                {(child.full_name || child.student_unique_number).slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate text-xs font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                                  {child.full_name || `Student #${child.student_unique_number}`}
                                </h4>
                                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  Class {child.class_number || "3"}{child.section || "A"} • Roll No.{" "}
                                  {child.student_unique_number ? child.student_unique_number.slice(-2) : "12"}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-[10px] font-bold text-slate-400">Progress</div>
                              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {progress}%
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      {/* Demo Child 1 */}
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all hover:border-sky-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-850">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                              AS
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate text-xs font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                                Aarav Sharma
                              </h4>
                              <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Class 3A • Roll No. 12
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[10px] font-bold text-slate-400">Progress</div>
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              82%
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: "82%" }} />
                        </div>
                      </div>

                      {/* Demo Child 2 */}
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all hover:border-sky-200 hover:shadow-xs dark:border-slate-800 dark:bg-slate-850">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-purple-100 text-xs font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              AS
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate text-xs font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                                Ananya Sharma
                              </h4>
                              <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Class 1B • Roll No. 08
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[10px] font-bold text-slate-400">Progress</div>
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              75%
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: "75%" }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Column 2: Recent Assignments */}
              <div className="flex flex-col space-y-4 rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-2xs backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                    Recent Assignments
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const reportsTab = document.querySelector('[data-tab="reports"]') as HTMLElement;
                      reportsTab?.click();
                    }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Assignment 1 */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                            Math Worksheet – Fractions
                          </h4>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {firstChildName} • Class 3A
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
                        Pending
                      </span>
                    </div>
                    <div className="mt-2 text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      Due: May 22, 2025
                    </div>
                  </div>

                  {/* Assignment 2 */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                            English Reading Activity
                          </h4>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {secondChildName} • Class 1B
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400">
                        In Progress
                      </span>
                    </div>
                    <div className="mt-2 text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      Due: May 23, 2025
                    </div>
                  </div>

                  {/* Assignment 3 */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                            EVS Project – My Family
                          </h4>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {firstChildName} • Class 3A
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Submitted
                      </span>
                    </div>
                    <div className="mt-2 text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      Submitted on: May 18, 2025
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Upcoming Events */}
              <div className="flex flex-col space-y-4 rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-2xs backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                    Upcoming Events
                  </h3>
                  <button
                    type="button"
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
                  >
                    View Calendar
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Event 1 */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-2.5 py-1.5 text-center dark:bg-slate-800">
                        <span className="text-[9px] font-black uppercase text-slate-400">MAY</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                          22
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          PTM Meeting
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          10:00 AM – 11:00 AM
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          School Auditorium
                        </p>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Event 2 */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-2.5 py-1.5 text-center dark:bg-slate-800">
                        <span className="text-[9px] font-black uppercase text-slate-400">MAY</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                          24
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Science Quiz
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          09:00 AM – 10:00 AM
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Class 3A
                        </p>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Event 3 */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-2.5 py-1.5 text-center dark:bg-slate-800">
                        <span className="text-[9px] font-black uppercase text-slate-400">MAY</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                          28
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Annual Day Rehearsal
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          02:00 PM – 04:00 PM
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          School Ground
                        </p>
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
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
                title={t("parentDashboard.linkChildTitle")}
                description={t("parentDashboard.linkChildDesc")}
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
                    placeholder={t("parentDashboard.studentIdPlaceholder")}
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value.toUpperCase())}
                    className={`${inputClass} font-mono uppercase tracking-wide`}
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={isLinking}>
                    {isLinking ? t("parentDashboard.linkingBtn") : t("parentDashboard.linkChildBtn")}
                  </Button>
                </form>
              </div>
            </Panel>

            {/* Linked Children List */}
            <div>
              <SectionHead icon={Users} title={t("parentDashboard.linkedChildrenList")} />

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
                              {child.full_name || t("parentDashboard.studentPrefix", { id: child.student_unique_number })}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Code>{child.student_unique_number}</Code>
                              <Chip tone="neutral">
                                {child.enrollment_type === "self" || child.branch_name === "SELF"
                                  ? t("parentDashboard.selfEnrolled")
                                  : t("parentDashboard.schoolEnrolled")}
                              </Chip>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 divide-y divide-[var(--c-line)] border-t border-[var(--c-line)] px-5 py-2">
                          <Field label={t("parentDashboard.enrolledClass")}>
                            {child.class_number
                              ? child.enrollment_type === "self" || child.branch_name === "SELF"
                                ? t("parentDashboard.classSelf", { classNumber: child.class_number })
                                : t("parentDashboard.classSectionVal", { classNumber: child.class_number, section: child.section || "A" })
                              : t("parentDashboard.notConfigured")}
                          </Field>

                          <Field label={t("parentDashboard.schoolInstitution")}>
                            {child.enrollment_type === "self" || child.branch_name === "SELF"
                              ? t("parentDashboard.selfEducated")
                              : t("parentDashboard.schoolBranchVal", { school: child.school_name || "School", branch: child.branch_name || "Branch" })}
                          </Field>

                          <Field label={t("parentDashboard.classSection")}>
                            <span className="console-num text-text-secondary">
                              {t("parentDashboard.linkedDate", { date: new Date(child.created_at).toLocaleDateString() })}
                            </span>
                          </Field>
                        </div>
                        <div className="px-5 pb-3">
                          <WardProgressWidget
                            uniqueNumber={child.student_unique_number}
                            onViewDetailed={() => onSelectTab && onSelectTab("progress")}
                          />
                        </div>
                      </Panel>
                    </Item>
                  ))}
                </Stagger>
              ) : (
                <Panel flush>
                  <EmptyState icon={Users} title={t("parentDashboard.noLinkedChildrenFound")}>
                    {t("parentDashboard.noLinkedChildrenDesc")}
                  </EmptyState>
                </Panel>
              )}
            </div>
          </div>
        )}

        {/* TAB: PROGRESS & CONSECUTIVE GROWTH ANALYTICS */}
        {(activeTab === "progress" || activeTab === "analytics") && (
          <ParentDetailedProgress childrenList={childrenList} />
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <SectionHead
              icon={Award}
              title={t("parentDashboard.reportsTitle")}
              description={t("parentDashboard.reportsDesc")}
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
                <EmptyState icon={Users} title={t("parentDashboard.noWardsTitle")}>
                  {t("parentDashboard.noWardsDesc")}
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
  const { t } = useTranslation();
  const [result, setResult] = useState<GapReportOut | null>(null);
  const [loadingResult, setLoadingResult] = useState<boolean>(true);
  const [testSummaries, setTestSummaries] = useState<StudentTestResultSummaryOut[]>([]);
  const [loadingTests, setLoadingTests] = useState<boolean>(true);
  const [selectedHistory, setSelectedHistory] = useState<{
    title: string;
    attempts: AssignmentAttemptOut[];
    feedback?: FeedbackOut | null;
  } | null>(null);

  useEffect(() => {
    getChildQuizResult(child.student_unique_number)
      .then((res) => setResult(res))
      .catch((err) => console.log("Child quiz result fetch note:", err.message))
      .finally(() => setLoadingResult(false));

    getChildTestResults(child.student_unique_number)
      .then((res) => setTestSummaries(res))
      .catch((err) => console.log("Child test results fetch note:", err.message))
      .finally(() => setLoadingTests(false));
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
          {t("parentDashboard.linkedDate", { date: new Date(child.created_at).toLocaleDateString() })}
        </p>

        <div className="mt-4 border-t border-[var(--c-line)] pt-4">
          <span className="console-eyebrow">{t("parentDashboard.gapQuizTitle")}</span>

          {loadingResult ? (
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-[var(--c-sunken)]" />
          ) : result === null ? (
            <p className="mt-1.5 text-xs text-text-secondary">{t("parentDashboard.notCompletedYet")}</p>
          ) : (
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="console-num text-2xl font-semibold tracking-[-0.02em] text-text-primary font-[family-name:var(--font-display)]">
                  {result.overall_score !== null ? `${result.overall_score}%` : "—"}
                </span>
                <span className="text-[10px] text-text-tertiary">{t("parentDashboard.overallScore")}</span>
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
                <p className="mt-2 text-xs font-medium text-emerald-500">{t("parentDashboard.noGapsFound")}</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.gaps.slice(0, 3).map((gap) => (
                    <Chip key={gap.topic_code} tone="amber">
                      {gap.subject}: {t("teacherDashboard.classPrefix")} {gap.originating_class}
                    </Chip>
                  ))}
                  {result.gaps.length > 3 && (
                    <span className="self-center text-[10px] text-text-tertiary">
                      +{result.gaps.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Class Tests & Attempt History Section */}
        <div className="mt-4 border-t border-[var(--c-line)] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="console-eyebrow">Class Tests & Quiz History</span>
            <span className="text-[10px] text-brand font-bold">
              {testSummaries.length} Test{testSummaries.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadingTests ? (
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--c-sunken)]" />
          ) : testSummaries.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {testSummaries.map((item) => {
                const asgn = item.assignment;
                const attempts = item.attempts;
                const sub = item.submission;
                const fb = item.teacher_feedback;
                const latestAttempt = attempts[0];
                const scorePercent = sub?.percentage ?? latestAttempt?.percentage;
                const isPassed = sub?.is_passed ?? latestAttempt?.is_passed;

                return (
                  <div
                    key={asgn.id}
                    className="p-2.5 rounded bg-[var(--c-sunken)] border border-[var(--c-line)] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-text-primary">{asgn.title}</div>
                      <div className="text-[10px] text-text-tertiary flex items-center gap-1.5 mt-0.5">
                        <span>{asgn.assignment_type === "pdf_upload" ? "Manual PDF" : "AI Quiz"}</span>
                        <span>• {attempts.length} Attempt{attempts.length === 1 ? "" : "s"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {scorePercent !== null && scorePercent !== undefined ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPassed
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {scorePercent.toFixed(0)}% ({isPassed ? "PASS" : "FAIL"})
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-tertiary italic">Pending</span>
                      )}

                      {attempts.length > 0 && (
                        <button
                          onClick={() =>
                            setSelectedHistory({
                              title: asgn.title,
                              attempts,
                              feedback: fb,
                            })
                          }
                          className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                        >
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-tertiary italic">No class test attempts recorded yet.</p>
          )}
        </div>
      </div>

      {selectedHistory && (
        <AttemptHistoryModal
          assignmentTitle={selectedHistory.title}
          attempts={selectedHistory.attempts}
          teacherFeedback={selectedHistory.feedback}
          onClose={() => setSelectedHistory(null)}
        />
      )}
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
  const { t } = useTranslation();
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
  const { t } = useTranslation();
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

  // Class Modules state (for AI Quiz & Curriculum View)
  const [classModules, setClassModules] = useState<ModuleOut[]>([]);
  const [classChapters, setClassChapters] = useState<ChapterOut[]>([]);
  const [selectedChapterNumbers, setSelectedChapterNumbers] = useState<number[]>([]);
  const [quizSubject, setQuizSubject] = useState<string>("");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [expandedChapterNumber, setExpandedChapterNumber] = useState<number | null>(null);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    if (selectedClass?.subject && selectedClass.subject.toLowerCase() !== "general") {
      set.add(selectedClass.subject);
    }
    for (const m of classModules) {
      if (m.subject && m.subject.trim() && m.subject.toLowerCase() !== "general") {
        set.add(m.subject.trim());
      }
    }
    for (const c of classChapters) {
      if (c.subject && c.subject.trim() && c.subject.toLowerCase() !== "general") {
        set.add(c.subject.trim());
      }
    }
    const list = Array.from(set);
    if (list.length === 0) list.push("General");
    return list;
  }, [selectedClass, classModules, classChapters]);

  const filteredChaptersForQuiz = useMemo(() => {
    const activeSub = quizSubject || (availableSubjects[0] ?? "");
    if (!activeSub || activeSub.toLowerCase() === "general") {
      return classChapters;
    }
    return classChapters.filter(
      (ch) => (ch.subject || "").trim().toLowerCase() === activeSub.trim().toLowerCase()
    );
  }, [classChapters, quizSubject, availableSubjects]);

  const handleToggleModuleChapters = (mod: ModuleOut) => {
    if (expandedModuleId === mod.id) {
      setExpandedModuleId(null);
      setExpandedChapterNumber(null);
    } else {
      setExpandedModuleId(mod.id);
      setExpandedChapterNumber(null);
      if (selectedClass) {
        getTeacherClassChapters(selectedClass.class_number, mod.subject || undefined, mod.id)
          .then((res) => {
            if (res && res.length > 0) {
              setClassChapters((prev) => {
                const map = new Map(prev.map((c) => [`${(c.subject || "").toLowerCase()}-${c.chapter_number}`, c]));
                for (const ch of res) {
                  map.set(`${(ch.subject || "").toLowerCase()}-${ch.chapter_number}`, ch);
                }
                return Array.from(map.values()).sort(
                  (a, b) => (a.subject || "").localeCompare(b.subject || "") || a.chapter_number - b.chapter_number
                );
              });
            }
          })
          .catch((err) => console.log("Fetch module chapters note:", err.message));
      }
    }
  };

  const handleStartQuizForChapter = (mod: ModuleOut, ch: ChapterOut) => {
    const targetSub = ch.subject || mod.subject || (availableSubjects[0] ?? "General");
    setQuizSubject(targetSub);
    setQuizTitle(`${ch.chapter_title} Quiz`);
    setSelectedModuleIds(mod.id ? [mod.id] : []);
    setSelectedChapterNumbers([ch.chapter_number]);
    setQuizDesc(`Adaptive quiz grounded in ${ch.chapter_title} (${targetSub}).`);
    setQuizDeadlineDays("");
    setQuizError(null);
    setShowQuizModal(true);
  };

  const handleStartQuizForModule = (mod: ModuleOut) => {
    const targetSub = mod.subject || (availableSubjects[0] ?? "General");
    setQuizSubject(targetSub);
    setQuizTitle(`${mod.title} Quiz`);
    setSelectedModuleIds(mod.id ? [mod.id] : []);
    const modChs = classChapters.filter(
      (c) =>
        (c.module_id && c.module_id === mod.id) ||
        (c.subject && mod.subject && c.subject.trim().toLowerCase() === mod.subject.trim().toLowerCase())
    );
    setSelectedChapterNumbers(modChs.map((c) => c.chapter_number));
    setQuizDesc(`Adaptive quiz grounded in ${mod.title} (${targetSub}).`);
    setQuizDeadlineDays("");
    setQuizError(null);
    setShowQuizModal(true);
  };

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

  // Quiz Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewQuiz, setPreviewQuiz] = useState<AssignmentQuizPreviewOut | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  const handleViewQuizPreview = async (assignmentId: string) => {
    setLoadingPreview(true);
    setShowPreviewModal(true);
    try {
      const res = await getAssignmentQuizPreview(assignmentId);
      setPreviewQuiz(res);
    } catch (err: any) {
      alert(err.message || "Failed to load AI quiz questions preview.");
      setShowPreviewModal(false);
    } finally {
      setLoadingPreview(false);
    }
  };

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

    // Load Modules for AI Quiz Selection & Curriculum View
    getTeacherClassModules(selectedClass.class_number, selectedClass.section, selectedClass.subject || undefined)
      .then((res) => setClassModules(res))
      .catch((err) => console.log("Fetch class modules note:", err.message));

    // Load Chapters for RAG Quiz Selection
    getTeacherClassChapters(selectedClass.class_number, selectedClass.subject || undefined)
      .then((res) => setClassChapters(res))
      .catch((err) => console.log("Fetch class chapters note:", err.message));

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
    if (
      !selectedClass ||
      !quizTitle.trim() ||
      (selectedModuleIds.length === 0 && selectedChapterNumbers.length === 0)
    ) {
      setQuizError("Please enter a title and select at least one module or chapter.");
      return;
    }

    setIsSubmittingQuiz(true);
    setQuizError(null);
    try {
      await createAiQuizAssignment(selectedClass.class_number, selectedClass.section, {
        title: quizTitle.trim(),
        subject: quizSubject || selectedClass.subject || undefined,
        description: quizDesc.trim() || undefined,
        module_ids: selectedModuleIds,
        chapter_numbers: selectedChapterNumbers,
        deadline_days: quizDeadlineDays !== "" ? Number(quizDeadlineDays) : undefined,
      });
      setShowQuizModal(false);
      setQuizTitle("");
      setQuizDesc("");
      setQuizDeadlineDays("");
      setSelectedModuleIds([]);
      setSelectedChapterNumbers([]);
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
              title={t("teacherDashboard.noClassAssignedTitle")}
              action={
                <div className="max-w-md rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-4 text-xs leading-relaxed text-text-tertiary">
                  {t("teacherDashboard.noClassAssignedHint")}
                </div>
              }
            >
              {t("teacherDashboard.noClassAssignedDesc")}
            </EmptyState>
          </Panel>
        ) : (
          <div className="space-y-6">
            {/* Active Class Switcher (only shown if teacher has multiple classes) */}
            {assignedClasses.length > 1 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="console-eyebrow">{t("teacherDashboard.activeClass")}</span>
                <Segmented
                  idPrefix="teacher-class"
                  value={selectedClass?.id ?? assignedClasses[0].id}
                  onChange={(id) => {
                    const found = assignedClasses.find((c) => c.id === id);
                    if (found) setSelectedClass(found);
                  }}
                  options={assignedClasses.map((c) => ({
                    value: c.id,
                    label: `${t("teacherDashboard.classPrefix")} ${c.label}`,
                  }))}
                />
              </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && selectedClass && (
              <div className="space-y-6">
                {/* ── 1. Teacher Hero — illustration left, greeting right ──── */}
                <TeacherHero
                  teacherName={teacher.name}
                  schoolName={teacher.school_name}
                  branchName={teacher.branch_name}
                  classLabel={selectedClass.label}
                  studentCount={students.length}
                  assignmentCount={assignments.length}
                  moduleCount={classModules.length}
                  classCount={assignedClasses.length}
                  onViewClasses={() => {
                    const classesTab = document.querySelector('[data-tab="classes"]') as HTMLElement;
                    classesTab?.click();
                  }}
                />

                {/* ── 2. Premium Metric Cards Row ─────────────────────────── */}
                <div className="stat-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Students Enrolled */}
                  <div className="group relative overflow-hidden rounded-[22px] border border-sky-200/60 bg-gradient-to-br from-sky-50 via-white to-sky-50/50 p-5 shadow-xs transition-all hover:shadow-md hover:border-sky-300/80 dark:border-sky-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 shadow-xs dark:bg-sky-500/15 dark:text-sky-400">
                        <Users className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-600 dark:text-sky-400">
                        Class {selectedClass.label}
                      </span>
                    </div>
                    <div className="mt-4 text-2xl font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      <AnimatedNumber value={students.length} />
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t("teacherDashboard.enrolledStudents")}
                    </div>
                  </div>

                  {/* Card 2: Active Assignments */}
                  <div className="group relative overflow-hidden rounded-[22px] border border-purple-200/60 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-5 shadow-xs transition-all hover:shadow-md hover:border-purple-300/80 dark:border-purple-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 shadow-xs dark:bg-purple-500/15 dark:text-purple-400">
                        <FileText className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                        {assignments.filter((a) => !a.is_locked).length} Active
                      </span>
                    </div>
                    <div className="mt-4 text-2xl font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      <AnimatedNumber value={assignments.length} />
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t("teacherDashboard.activeAssignments")}
                    </div>
                  </div>

                  {/* Card 3: Curriculum Modules */}
                  <div className="group relative overflow-hidden rounded-[22px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300/80 dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-400">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {moduleSubjectBands.length} Subject{moduleSubjectBands.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-4 text-2xl font-black text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                      <AnimatedNumber value={classModules.length} />
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t("teacherDashboard.curriculumModules")}
                    </div>
                  </div>

                  {/* Card 4: Quick Actions */}
                  <div className="group relative overflow-hidden rounded-[22px] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300/80 dark:border-amber-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-xs dark:bg-amber-500/15 dark:text-amber-400">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                        Quick Actions
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => { setPdfError(null); setShowPdfModal(true); }}
                        className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-xs border border-slate-200/80 transition-all hover:bg-white hover:border-sky-300 cursor-pointer dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700 dark:hover:border-sky-600"
                      >
                        <Upload className="h-3.5 w-3.5 text-sky-500" />
                        Upload PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => { setQuizError(null); setShowQuizModal(true); }}
                        className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-xs border border-slate-200/80 transition-all hover:bg-white hover:border-purple-300 cursor-pointer dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700 dark:hover:border-purple-600"
                      >
                        <Brain className="h-3.5 w-3.5 text-purple-500" />
                        AI Quiz
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── 3. Detailed Charts Row ───────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Chart 1: Assignment Status Donut */}
                  <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Assignment Status</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Class {selectedClass.label} Workload</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{assignments.length} Total</span>
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

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <span>Active vs Locked</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {assignments.filter((a) => !a.is_locked).length} open
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-xs italic text-slate-400">
                        Create a PDF assignment or an AI quiz to see its status here.
                      </div>
                    )}
                  </div>

                  {/* Chart 2: Modules by Subject */}
                  <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Modules by Subject</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Class {selectedClass.label} Curriculum</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {classModules.length} Modules
                      </span>
                    </div>

                    <div className="my-4">
                      {moduleSubjectBands.length > 0 ? (
                        <BarList data={moduleSubjectBands} />
                      ) : (
                        <div className="py-3 text-center text-xs italic text-slate-400">
                          Modules uploaded for this class will be grouped by subject here.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <span>Available for AI Quiz</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {moduleSubjectBands.length} subject{moduleSubjectBands.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── 4. Class Roster — enhanced visual wrapper ────────────── */}
                <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
                          Class {selectedClass.label} Roster
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Students currently enrolled in this section</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                      {students.length} Student{students.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {loadingStudents ? (
                    <Loading />
                  ) : students.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.slice(0, 8).map((s, idx) => {
                        const colors = [
                          "bg-sky-500 text-white",
                          "bg-purple-500 text-white",
                          "bg-emerald-500 text-white",
                          "bg-amber-500 text-white",
                          "bg-rose-500 text-white",
                          "bg-indigo-500 text-white",
                          "bg-teal-500 text-white",
                          "bg-pink-500 text-white",
                        ];
                        return (
                          <div
                            key={s.id}
                            className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          >
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${colors[idx % colors.length]}`}>
                              {(s.full_name || s.unique_number).slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                {s.full_name || s.email}
                              </div>
                              <div className="mt-0.5 font-mono text-[10px] text-slate-400">{s.unique_number}</div>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                              {s.enrollment_type}
                            </span>
                            <span className="hidden text-[11px] text-slate-400 sm:block">
                              {new Date(s.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title={`No students enrolled in Class ${selectedClass.label} yet.`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* TAB: ASSIGNED CLASSES / STUDENTS ROSTER */}
            {activeTab === "classes" && selectedClass && (
              <Panel flush className="overflow-hidden">
                <PanelHead
                  icon={Users}
                  title={`${t("teacherDashboard.studentsEnrolledIn")} ${t("teacherDashboard.classPrefix")} ${selectedClass.label}`}
                  actions={<Chip tone="brand">{students.length} {t("dashboard.students")}</Chip>}
                />

                {loadingStudents ? (
                  <Loading />
                ) : students.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <Th>{t("teacherDashboard.uniqueId")}</Th>
                        <Th>{t("teacherDashboard.studentNameEmail")}</Th>
                        <Th>{t("teacherDashboard.enrollmentMode")}</Th>
                        <Th>{t("teacherDashboard.joinedDate")}</Th>
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
                    title={`${t("teacherDashboard.noStudentsEnrolled")} ${t("teacherDashboard.classPrefix")} ${selectedClass.label}.`}
                  />
                )}
              </Panel>
            )}

            {/* TAB: ASSIGNED CLASSES — learning-module progress for the roster above */}
            {activeTab === "classes" && selectedClass && (
              <ClassLearningProgress
                classNumber={selectedClass.class_number}
                section={selectedClass.section}
                subject={selectedClass.subject}
              />
            )}

            {/* TAB: ASSIGNMENTS & QUIZZES */}
            {activeTab === "assignments" && selectedClass && (
              <div>
                {/* Action Bar */}
                <SectionHead
                  icon={FileText}
                  title={`${t("teacherDashboard.classPrefix")} ${selectedClass.label} ${t("teacherDashboard.assignmentsAndQuizzes")}`}
                  description={t("teacherDashboard.assignmentsDesc")}
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
                        {t("teacherDashboard.uploadPdfAssignmentBtn")}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const defaultSub =
                            selectedClass?.subject && selectedClass.subject.toLowerCase() !== "general"
                              ? selectedClass.subject
                              : (availableSubjects[0] ?? "");
                          setQuizSubject(defaultSub);
                          setQuizTitle("");
                          setQuizDesc("");
                          setSelectedModuleIds([]);
                          setSelectedChapterNumbers([]);
                          setQuizDeadlineDays("");
                          setQuizError(null);
                          setShowQuizModal(true);
                        }}
                        className="text-xs"
                      >
                        <Brain className="mr-1.5 h-3.5 w-3.5" />
                        {t("teacherDashboard.generateAiQuizBtn")}
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
                                {asgn.assignment_type === "pdf_upload" ? t("teacherDashboard.pdfUpload") : t("teacherDashboard.aiQuiz")}
                              </Chip>

                              <Chip tone={asgn.is_locked ? "rose" : "emerald"}>
                                {asgn.is_locked ? t("teacherDashboard.locked") : t("teacherDashboard.active")}
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

                            {asgn.assignment_type === "ai_quiz" ? (
                              <button
                                type="button"
                                onClick={() => handleViewQuizPreview(asgn.id)}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
                              >
                                <Brain className="h-3.5 w-3.5 text-violet-400" />
                                View AI Quiz Questions
                              </button>
                            ) : asgn.file_url ? (
                              <a
                                href={formatPdfUrl(asgn.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                {t("teacherDashboard.viewAssignmentPdf")}
                              </a>
                            ) : null}
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
                                  {t("teacherDashboard.deadline")} {new Date(asgn.deadline_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="block">{t("teacherDashboard.noDeadline")}</span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteAssignment(asgn.id)}
                              className="cursor-pointer rounded-md p-2 text-text-tertiary transition-all hover:bg-rose-500/10 hover:text-rose-500 lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
                              title={t("teacherDashboard.deleteAssignment")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Item>
                      ))}
                    </Stagger>
                  ) : (
                    <EmptyState icon={FileText} title={t("teacherDashboard.noAssignmentsTitle")}>
                      {t("teacherDashboard.noAssignmentsDesc")}
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
                  title={t("teacherDashboard.gradingTitle")}
                  description={t("teacherDashboard.gradingDesc")}
                  actions={
                    assignments.length > 0 ? (
                      <select
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        className={`${inputClass} w-auto font-medium`}
                      >
                        {assignments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.assignment_type === "pdf_upload" ? t("teacherDashboard.pdfUpload") : t("teacherDashboard.aiQuiz")})
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
                          <Th>{t("teacherDashboard.uniqueId")}</Th>
                          <Th>{t("teacherDashboard.attemptStatus")}</Th>
                          <Th>Response PDF</Th>
                          <Th>{t("teacherDashboard.scoreMax")}</Th>
                          <Th>{t("teacherDashboard.lastAttempted")}</Th>
                          <Th className="text-right">{t("teacherDashboard.actions")}</Th>
                        </tr>
                      </thead>
                      <Stagger as="tbody" className="divide-y divide-[var(--c-line)]">
                        {submissions.map((sub) => {
                          const isEditing = editingStudentId === sub.student_id;
                          const isPassed = sub.is_passed ?? (sub.percentage !== null && sub.percentage !== undefined ? sub.percentage >= 60 : null);

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
                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-text-tertiary">
                                    {sub.total_attempts || 1} Attempt{(sub.total_attempts || 1) === 1 ? "" : "s"}
                                  </span>
                                  {isPassed !== null ? (
                                    <Chip tone={isPassed ? "emerald" : "amber"}>
                                      {isPassed ? "PASSED (≥ 60%)" : "FAILED (< 60%)"}
                                    </Chip>
                                  ) : (
                                    <Chip tone="neutral">Submitted</Chip>
                                  )}
                                </div>
                              </Td>
                              <Td>
                                {sub.response_pdf_url ? (
                                  <a
                                    href={formatPdfUrl(sub.response_pdf_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> View PDF
                                  </a>
                                ) : (
                                  <span className="text-xs text-text-tertiary italic">No PDF Upload</span>
                                )}
                              </Td>
                              <Td className="console-num font-semibold text-text-primary">
                                {sub.score !== null ? `${sub.score} / ${sub.max_score}` : t("teacherDashboard.notGraded")}
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
                                  {isEditing ? t("teacherDashboard.close") : t("teacherDashboard.gradeFeedback")}
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
                              <span>{t("teacherDashboard.gradeFeedbackForStudent")}</span>
                            </h4>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <FieldLabel>{t("teacherDashboard.scoreOutOf100")}</FieldLabel>
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
                                <FieldLabel>{t("teacherDashboard.feedbackGuidanceMsg")}</FieldLabel>
                                <textarea
                                  rows={2}
                                  placeholder={t("teacherDashboard.feedbackPlaceholder")}
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
                                {t("teacherDashboard.cancel")}
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={savingScore}
                                onClick={() => handleSaveScoreAndFeedback(editingStudentId)}
                                className="text-xs"
                              >
                                {savingScore ? t("teacherDashboard.saving") : t("teacherDashboard.saveScoreFeedback")}
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
                    title={t("teacherDashboard.noSubmissionsYet")}
                  />
                )}
              </Panel>
            )}

            {/* TAB: CURRICULUM & BOOKS */}
            {activeTab === "curriculum" && selectedClass && (
              <Panel flush className="overflow-hidden">
                <PanelHead
                  icon={BookOpen}
                  title={`${t("teacherDashboard.curriculumModulesFor")} ${t("teacherDashboard.classPrefix")} ${selectedClass.label}`}
                  description="Click on any module or textbook to view all underlying chapters, learning concepts, and launch AI quizzes."
                  actions={
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">
                        {classModules.length} Module(s) &bull; {classChapters.length} Chapter(s)
                      </span>
                    </div>
                  }
                />

                {classModules.length > 0 ? (
                  <div className="divide-y divide-[var(--c-line)]">
                    {classModules.map((mod) => {
                      const isExpanded = expandedModuleId === mod.id;

                      // Get all chapters belonging to this module or matching subject
                      const moduleChapters = classChapters.filter(
                        (ch) =>
                          (ch.module_id && ch.module_id === mod.id) ||
                          (!ch.module_id &&
                            ch.subject &&
                            mod.subject &&
                            ch.subject.trim().toLowerCase() === mod.subject.trim().toLowerCase())
                      );

                      // Fallback: if no direct match, check subject inclusion
                      const effectiveChapters =
                        moduleChapters.length > 0
                          ? moduleChapters
                          : classChapters.filter(
                              (ch) =>
                                ch.subject &&
                                mod.subject &&
                                ch.subject.trim().toLowerCase().includes(mod.subject.trim().toLowerCase())
                            );

                      return (
                        <div key={mod.id} className="transition-colors">
                          {/* Module Header Row / Card */}
                          <div
                            onClick={() => handleToggleModuleChapters(mod)}
                            className={`console-row flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-all ${
                              isExpanded
                                ? "bg-brand/[0.04] border-l-4 border-l-brand"
                                : "hover:bg-[var(--c-sunken)]"
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3.5">
                              <div
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors ${
                                  isExpanded
                                    ? "border-brand/30 bg-brand/10 text-brand"
                                    : "border-[var(--c-line)] bg-[var(--c-sunken)] text-text-tertiary"
                                }`}
                              >
                                <BookOpen className="h-4.5 w-4.5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="truncate text-sm font-semibold text-text-primary font-[family-name:var(--font-display)]">
                                    {mod.title}
                                  </h4>
                                  <Chip tone="brand">{mod.subject || "General"}</Chip>
                                  {mod.source_type === "pdf_upload" && (
                                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[var(--c-sunken)] border border-[var(--c-line)] text-text-tertiary">
                                      PDF Document
                                    </span>
                                  )}
                                  {mod.source_type === "image_upload" && (
                                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                                      OCR Book
                                    </span>
                                  )}
                                  {mod.ncert_book_id && (
                                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                      NCERT Official
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
                                  <span className="inline-flex items-center gap-1 font-medium text-brand">
                                    <Layers className="h-3 w-3" />
                                    {effectiveChapters.length} {effectiveChapters.length === 1 ? "Chapter" : "Chapters"}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{isExpanded ? "Click to collapse" : "Click to view chapters"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              {mod.file_url && (
                                <a
                                  href={formatPdfUrl(mod.file_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-brand hover:border-brand/30 transition-colors"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>{t("teacherDashboard.viewModulePdf")}</span>
                                </a>
                              )}

                              <div
                                className={`grid h-7 w-7 place-items-center rounded-full border border-[var(--c-line)] text-text-tertiary transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 bg-brand text-white border-brand" : "bg-[var(--c-panel)]"
                                }`}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </div>

                          {/* Segregated Chapters Accordion Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden bg-[var(--c-sunken)]/60 border-t border-[var(--c-line)] px-5 py-4"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                                    <Layers className="h-3.5 w-3.5 text-brand" />
                                    <span>Underlying Chapters ({effectiveChapters.length})</span>
                                  </div>
                                  <span className="text-[11px] text-text-tertiary">
                                    RAG-indexed for interactive classroom quiz generation
                                  </span>
                                </div>

                                {effectiveChapters.length > 0 ? (
                                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                                    {effectiveChapters.map((ch) => {
                                      const isChapterExpanded = expandedChapterNumber === ch.chapter_number;
                                      return (
                                        <div
                                          key={`${ch.chapter_number}-${ch.subject}-${ch.chapter_title}`}
                                          className="flex flex-col justify-between rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-4 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                                        >
                                          <div>
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex h-6 items-center rounded-md bg-brand/10 px-2 text-xs font-bold text-brand">
                                                  Ch. {ch.chapter_number}
                                                </span>
                                                <Chip tone="brand">{ch.subject}</Chip>
                                              </div>
                                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                {ch.chunk_count} {ch.chunk_count === 1 ? "Concept Chunk" : "Concept Chunks"}
                                              </span>
                                            </div>

                                            <h5 className="mt-2.5 text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                                              {ch.chapter_title}
                                            </h5>

                                            {ch.sample_content && (
                                              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary line-clamp-3">
                                                {ch.sample_content}
                                              </p>
                                            )}
                                          </div>

                                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--c-line)] pt-3">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedChapterNumber(
                                                  isChapterExpanded ? null : ch.chapter_number
                                                )
                                              }
                                              className="inline-flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                                            >
                                              <FileText className="h-3 w-3" />
                                              {isChapterExpanded ? "Hide Excerpt" : "View Excerpt"}
                                            </button>

                                            <Button
                                              variant="primary"
                                              size="sm"
                                              onClick={() => handleStartQuizForChapter(mod, ch)}
                                              className="text-xs h-7 px-3"
                                            >
                                              <Sparkles className="mr-1 h-3 w-3" />
                                              Create AI Quiz
                                            </Button>
                                          </div>

                                          {/* Expandable full sample / chunk details */}
                                          {isChapterExpanded && ch.sample_content && (
                                            <motion.div
                                              initial={{ opacity: 0, y: -4 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className="mt-3 rounded-lg border border-[var(--c-line)] bg-[var(--c-sunken)] p-3 text-xs leading-relaxed text-text-secondary"
                                            >
                                              <div className="font-semibold text-text-primary mb-1">
                                                Chapter Concept Preview:
                                              </div>
                                              <div className="whitespace-pre-wrap">{ch.sample_content}</div>
                                            </motion.div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed border-[var(--c-line)] bg-[var(--c-panel)] p-6 text-center">
                                    <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand mb-2">
                                      <BookOpen className="h-4 w-4" />
                                    </div>
                                    <h5 className="text-xs font-semibold text-text-primary">
                                      Module Ready for Practice
                                    </h5>
                                    <p className="mt-1 text-[11px] text-text-tertiary max-w-sm mx-auto">
                                      This module contains complete curriculum content for {mod.subject}. You can generate adaptive quizzes or open the PDF directly.
                                    </p>
                                    <div className="mt-3 flex justify-center gap-2">
                                      {mod.file_url && (
                                        <a
                                          href={formatPdfUrl(mod.file_url)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 rounded-md border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-xs font-medium text-text-primary hover:text-brand"
                                        >
                                          <FileText className="h-3.5 w-3.5" />
                                          View PDF
                                        </a>
                                      )}
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleStartQuizForModule(mod)}
                                        className="text-xs h-7"
                                      >
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        Generate AI Quiz
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title={`${t("teacherDashboard.noModulesFoundFor")} ${t("teacherDashboard.classPrefix")} ${selectedClass.label}.`}
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
              title={t("teacherDashboard.uploadPdfModalTitle")}
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
                  <FieldLabel>{t("teacherDashboard.assignmentTitleRequired")}</FieldLabel>
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
                  <FieldLabel>{t("teacherDashboard.descInstructions")}</FieldLabel>
                  <textarea
                    rows={2}
                    placeholder={t("teacherDashboard.instructionsPlaceholder")}
                    value={pdfDesc}
                    onChange={(e) => setPdfDesc(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>{t("teacherDashboard.deadlineDays")}</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    placeholder={t("teacherDashboard.deadlinePlaceholder")}
                    value={pdfDeadlineDays}
                    onChange={(e) =>
                      setPdfDeadlineDays(e.target.value ? Number(e.target.value) : "")
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <FieldLabel>{t("teacherDashboard.selectPdfRequired")}</FieldLabel>
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
                    {t("teacherDashboard.cancel")}
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isSubmittingPdf}>
                    {isSubmittingPdf ? t("teacherDashboard.uploading") : t("teacherDashboard.uploadAssignmentBtn")}
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
              title={t("teacherDashboard.generateAiQuizModalTitle")}
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
                {/* Subject Selector / Tag */}
                <div>
                  <FieldLabel>Subject *</FieldLabel>
                  {availableSubjects.length > 1 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableSubjects.map((sub) => {
                        const isSubSelected =
                          (quizSubject || "").trim().toLowerCase() === sub.trim().toLowerCase();
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              setQuizSubject(sub);
                              setSelectedChapterNumbers([]);
                              setSelectedModuleIds([]);
                            }}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                              isSubSelected
                                ? "bg-brand text-white shadow-sm ring-2 ring-brand/30"
                                : "bg-[var(--c-sunken)] text-text-secondary hover:bg-[var(--c-panel)] hover:text-text-primary border border-[var(--c-line)]"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <Chip tone="brand">{quizSubject || availableSubjects[0] || "General"}</Chip>
                      <span className="text-[11px] text-text-tertiary">
                        Class {selectedClass?.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel>{t("teacherDashboard.quizTitleRequired")}</FieldLabel>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <FieldLabel>
                      {t("teacherDashboard.selectModulesRequired")} ({quizSubject || availableSubjects[0] || "Subject"})
                    </FieldLabel>
                    {filteredChaptersForQuiz.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedChapterNumbers.length === filteredChaptersForQuiz.length) {
                            setSelectedChapterNumbers([]);
                          } else {
                            setSelectedChapterNumbers(
                              filteredChaptersForQuiz.map((c) => c.chapter_number)
                            );
                          }
                        }}
                        className="text-[11px] font-medium text-brand hover:underline cursor-pointer"
                      >
                        {selectedChapterNumbers.length === filteredChaptersForQuiz.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    )}
                  </div>

                  {filteredChaptersForQuiz.length > 0 ? (
                    <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-2.5 text-xs">
                      {filteredChaptersForQuiz.map((ch, idx) => {
                        const isChecked = selectedChapterNumbers.includes(ch.chapter_number);
                        return (
                          <label
                            key={`${ch.subject}-${ch.chapter_number}-${ch.module_id || "seeded"}-${idx}`}
                            className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2.5 transition-all ${
                              isChecked
                                ? "bg-brand/10 border border-brand/30 shadow-xs"
                                : "hover:bg-[var(--c-panel)] border border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedChapterNumbers([
                                    ...selectedChapterNumbers,
                                    ch.chapter_number,
                                  ]);
                                  if (ch.module_id && !selectedModuleIds.includes(ch.module_id)) {
                                    setSelectedModuleIds([...selectedModuleIds, ch.module_id]);
                                  }
                                } else {
                                  setSelectedChapterNumbers(
                                    selectedChapterNumbers.filter((n) => n !== ch.chapter_number)
                                  );
                                }
                              }}
                              className="mt-0.5 rounded border-border-primary text-brand focus:ring-brand"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-5 items-center rounded bg-brand/15 px-1.5 text-[10px] font-bold text-brand">
                                  Ch. {ch.chapter_number}
                                </span>
                                <span className="font-semibold text-text-primary">
                                  {ch.chapter_title}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-text-tertiary">
                                <span>{ch.module_title || "Seeded Textbook"}</span>
                                <span>&bull;</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {ch.chunk_count} RAG chunks
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : classModules.length > 0 ? (
                    <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-1.5 text-xs">
                      {classModules
                        .filter(
                          (m) =>
                            !quizSubject ||
                            (m.subject || "").trim().toLowerCase() ===
                              quizSubject.trim().toLowerCase()
                        )
                        .map((m) => {
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
                      {t("teacherDashboard.noModulesWarning")}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-tertiary">
                    <span>
                      {selectedChapterNumbers.length} chapter(s) selected
                    </span>
                    <span className="italic">
                      Grounded in {quizSubject || "selected"} syllabus
                    </span>
                  </div>
                </div>

                <div>
                  <FieldLabel>{t("teacherDashboard.deadlineDays")}</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    placeholder={t("teacherDashboard.deadlinePlaceholder")}
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
                    {t("teacherDashboard.cancelBtn")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingQuiz || (filteredChaptersForQuiz.length === 0 && classModules.length === 0)}
                  >
                    {isSubmittingQuiz ? t("teacherDashboard.generating") : t("teacherDashboard.generateQuizBtn")}
                  </Button>
                </div>
              </form>
            </Modal>
          )}

          {/* AI Quiz Questions Preview Modal */}
          {showPreviewModal && (
            <Modal
              title={previewQuiz?.title || "AI Quiz Questions Preview"}
              icon={Brain}
              iconTone="violet"
              onClose={() => {
                setShowPreviewModal(false);
                setPreviewQuiz(null);
              }}
            >
              {loadingPreview ? (
                <div className="py-12 flex flex-col items-center gap-3 text-xs text-text-tertiary">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                  <span>Loading AI RAG Quiz Questions...</span>
                </div>
              ) : previewQuiz ? (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-text-secondary">Class & Subject:</span>
                    <Chip tone="brand">Class {previewQuiz.class_number}{previewQuiz.section} &bull; {previewQuiz.subject || "Mathematics"}</Chip>
                    <Chip tone="violet">{previewQuiz.total_questions} RAG Questions</Chip>
                  </div>

                  {previewQuiz.chapters && previewQuiz.chapters.length > 0 && (
                    <div className="text-xs text-text-tertiary bg-[var(--c-sunken)] p-2.5 rounded-md border border-[var(--c-line)]">
                      <span className="font-semibold text-text-secondary">Grounded in Chapters: </span>
                      {previewQuiz.chapters.join(", ")}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {previewQuiz.questions.map((q: any, idx: number) => (
                      <div key={q.id || idx} className="p-3.5 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel)] text-xs space-y-2">
                        <div className="font-semibold text-text-primary flex items-start gap-2">
                          <span className="shrink-0 font-mono text-brand font-bold">Q{idx + 1}.</span>
                          <span>{q.question || q.question_text}</span>
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 pt-1">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isCorrect = (q.correct_option_index !== undefined && oIdx === q.correct_option_index) || opt === q.correct_answer || opt === q.answer;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded border text-xs font-medium transition-colors ${
                                    isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold border-emerald-500/50 shadow-sm"
                                      : "bg-[var(--c-sunken)] border-[var(--c-line)] text-text-secondary"
                                  }`}
                                >
                                  <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                                  {opt}
                                  {isCorrect && <span className="ml-2 text-[10px] text-emerald-400 font-extrabold uppercase">(Correct Answer)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="pl-6 pt-1 text-[11px] text-text-tertiary italic">
                            <span className="font-semibold text-brand">NCERT RAG Context: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[var(--c-line)]">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowPreviewModal(false);
                        setPreviewQuiz(null);
                      }}
                    >
                      Close Preview
                    </Button>
                  </div>
                </div>
              ) : null}
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
  const { t } = useTranslation();
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
          title={t("schoolAdmin.allocation.title")}
          description={t("schoolAdmin.allocation.subtitle")}
          actions={
            <>
              <Segmented
                idPrefix="teacher-alloc-view"
                value={viewMode}
                onChange={(v) => setViewMode(v)}
                options={[
                  { value: "hierarchy", label: t("schoolAdmin.allocation.matrixTab") },
                  { value: "directory", label: t("schoolAdmin.allocation.directoryTab", { count: teachers.length }) },
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
                {t("schoolAdmin.allocation.assignTeacherBtn")}
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
          <EmptyState icon={UserCog} title={t("schoolAdmin.allocation.noTeachers")}>
            {t("schoolAdmin.allocation.noTeachersDesc")}
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
                  <span className="text-xs font-semibold text-text-tertiary">{t("schoolAdmin.allocation.classLabel")}</span>
                  <select
                    value={selectedClassNum}
                    onChange={(e) => setSelectedClassNum(Number(e.target.value))}
                    className={`${inputClass} w-auto py-1.5 font-medium`}
                  >
                    {[1, 2, 3, 4, 5].map((cls) => (
                      <option key={cls} value={cls}>
                        {t("schoolAdmin.allocation.classOption", { cls })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-tertiary">{t("schoolAdmin.allocation.sectionLabel")}</span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={`${inputClass} w-auto py-1.5 font-medium`}
                  >
                    {["A", "B", "C", "D"].map((sec) => (
                      <option key={sec} value={sec}>
                        {t("schoolAdmin.allocation.sectionOption", { sec })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">{t("schoolAdmin.allocation.staffingStatus")}</span>
                <Chip tone={assignedCount === totalCount ? "emerald" : assignedCount > 0 ? "sky" : "amber"}>
                  {t("schoolAdmin.allocation.subjectsAssignedCount", { assigned: assignedCount, total: totalCount })}
                </Chip>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="mt-4 overflow-hidden rounded-[var(--c-radius)] border border-[var(--c-line)]">
              <Table>
                <thead>
                  <tr>
                    <Th>{t("schoolAdmin.allocation.table.subject")}</Th>
                    <Th>{t("schoolAdmin.allocation.table.status")}</Th>
                    <Th>{t("schoolAdmin.allocation.table.assignedTeacher")}</Th>
                    <Th className="text-right">{t("schoolAdmin.allocation.table.action")}</Th>
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
                            {hasTeacher ? t("schoolAdmin.allocation.assigned") : t("schoolAdmin.allocation.unassigned")}
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
                                    ({t("schoolAdmin.allocation.change")})
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
                              <span>{t("schoolAdmin.allocation.selectTeacher")}</span>
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
                                {t("schoolAdmin.allocation.reassign")}
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
                                {t("schoolAdmin.allocation.deassign")}
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
                              {t("schoolAdmin.allocation.assign")}
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
                  placeholder={t("schoolAdmin.allocation.directorySearchPlaceholder")}
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
                  { value: "all", label: `${t("schoolAdmin.allocation.filterAll")} (${directoryCounts.all})` },
                  { value: "unassigned", label: `${t("schoolAdmin.allocation.filterUnassigned")} (${directoryCounts.unassigned})` },
                  { value: "assigned", label: `${t("schoolAdmin.allocation.filterAssigned")} (${directoryCounts.assigned})` },
                  { value: "active", label: `${t("schoolAdmin.allocation.filterActive")} (${directoryCounts.active})` },
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
