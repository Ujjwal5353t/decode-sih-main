"use client";

import { useEffect, useState } from "react";
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
  Brain,
  Award,
  MessageSquare,
  Check,
  X,
  ChevronRight,
  Phone,
  User,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/hooks/useAuth";
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
  getStudentModules,
  getNCERTBooksForClass,
  getAllNCERTBooks,
  uploadNCERTBookPdf,
  createNCERTBook,
  updateNCERTBook,
  deleteNCERTBook,
  detachNCERTBookFile,
  addNCERTModuleToSchool,
  getSchoolClassModules,
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
  assignClassToTeacher,
  deassignClassFromTeacher,
} from "@/lib/api";


function formatPdfUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${apiBase}/files/view-pdf?url=${encodeURIComponent(url)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading, logout, setupClass } = useAuth();

  const [permissions, setPermissions] = useState<RolePermissionsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

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
          const defaultTab =
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
    <div className="min-h-screen bg-background relative flex">
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
        <header className="sticky top-0 z-30 glass border-b border-border-primary px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-[var(--radius-sm)] text-text-secondary hover:text-text-primary hover:bg-surface lg:hidden cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-text-primary truncate">
                  {activePermissionItem?.label || `${role?.toUpperCase()} Dashboard`}
                </h1>
                {activePermissionItem?.badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand/10 text-brand border border-border-brand">
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
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand uppercase tracking-wider">
              {role === "student" && <GraduationCap className="w-3.5 h-3.5" />}
              {role === "school" && <Building2 className="w-3.5 h-3.5" />}
              {role === "parent" && <Users className="w-3.5 h-3.5" />}
              {role === "admin" && <ShieldCheck className="w-3.5 h-3.5" />}
              {role === "teacher" && <BookOpen className="w-3.5 h-3.5" />}
              <span>{permissions?.role_label || `${role} Role`}</span>
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
              className="text-text-secondary hover:text-rose-500 text-xs px-2.5 sm:px-3"
            >
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Dashboard Body with Dynamic View Routing */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {role === "student" && (
            <StudentDashboardView
              student={user as StudentProfile}
              setupClass={setupClass}
              activeTab={activeTab}
            />
          )}
          {role === "school" && (
            <SchoolDashboardView
              school={user as SchoolProfile}
              activeTab={activeTab}
            />
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

  const isSelfEnrolled = student.enrollment_type === "self" || student.branch_name === "SELF";
  const needsSetup = isSelfEnrolled ? student.class_number === null : (student.class_number === null || student.section === null);

  useEffect(() => {
    if (!needsSetup) {
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
    }
  }, [needsSetup, student.class_number, isSelfEnrolled]);

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
      {/* Profile Overview Card */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                Welcome, {student.full_name || `Student #${student.unique_number}`}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-brand/10 text-brand border border-border-brand">
                {student.unique_number}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {isSelfEnrolled ? (
                <span className="font-semibold text-brand">🌟 Self-Educated Student (NCERT Curriculum)</span>
              ) : (
                <span>{student.school_name} — {student.branch_name} ({student.state})</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-surface border border-border-primary text-xs flex items-center gap-2">
              {isSelfEnrolled ? (
                <span className="text-brand font-bold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Self Enrolled
                </span>
              ) : (
                <span className="text-text-primary font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-brand" /> School Enrolled
                </span>
              )}
            </div>

            <div className="px-4 py-2 rounded-[var(--radius-md)] bg-surface border border-border-primary text-xs">
              <span className="text-text-tertiary block">
                {isSelfEnrolled ? "Class" : "Class & Section"}
              </span>
              <span className="font-semibold text-text-primary">
                {student.class_number
                  ? isSelfEnrolled
                    ? `Class ${student.class_number}`
                    : `Class ${student.class_number} - Section ${student.section}`
                  : "Not Configured"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Class Setup Card if Class/Section not set */}
      {needsSetup && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[var(--radius-lg)] p-6 border border-brand/30 bg-brand/5"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-text-primary">
                {isSelfEnrolled ? "Select Your Class" : "Complete Your Class & Section Setup"}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {isSelfEnrolled
                  ? "Select your class (1–5) to view your official NCERT learning curriculum."
                  : "Select your class (1–5) and section to view your assigned school learning modules."}
              </p>

              {errorMsg && (
                <div className="mt-3 p-2.5 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSetupSubmit} className="mt-4 flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(Number(e.target.value))}
                    className="px-3 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
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
                    <label className="block text-xs font-medium text-text-secondary mb-1">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="px-3 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
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
        </motion.div>
      )}

      {/* Student Learning Curriculum View */}
      <div>
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
          /* Self-Enrolled NCERT Curriculum Display */
          ncertBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ncertBooks.map((book) => (
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
          /* School-Enrolled Modules Display */
          modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => (
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
      </div>

      {/* Student Class Assignments & Teacher Feedback */}
      {!isSelfEnrolled && <StudentAssignmentsSection />}
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
  const [localTab, setLocalTab] = useState<"modules" | "ncert" | "teachers">("modules");
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);

  const effectiveTab: "modules" | "ncert" | "teachers" =
    activeTab === "teachers"
      ? "teachers"
      : activeTab === "ncert"
      ? "ncert"
      : activeTab === "modules"
      ? "modules"
      : localTab;

  const fetchModules = () => {
    setLoadingModules(true);
    getSchoolClassModules(selectedClass)
      .then((res) => setModules(res))
      .catch((err) => console.log("School module fetch note:", err.message))
      .finally(() => setLoadingModules(false));
  };

  useEffect(() => {
    if (effectiveTab === "modules") {
      fetchModules();
    }
  }, [selectedClass, effectiveTab]);

  return (
    <div className="space-y-6">
      {/* School Branch Profile Banner */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                {school.school_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand">
                {school.branch_name}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Prefix: <span className="font-mono font-bold text-brand">{school.student_prefix}</span> | {school.email} | {school.state}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-[var(--radius-md)] bg-surface border border-border-primary text-xs">
              <span className="text-text-tertiary block">Registered Branch</span>
              <span className="font-semibold text-text-primary">{school.branch_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* School Admin Section Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 glass rounded-[var(--radius-lg)] border border-border-primary">
        <button
          onClick={() => setLocalTab("modules")}
          className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            effectiveTab === "modules"
              ? "bg-brand text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Class Curriculum & Modules</span>
        </button>

        <button
          onClick={() => setLocalTab("ncert")}
          className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            effectiveTab === "ncert"
              ? "bg-brand text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>NCERT Books & Content Management</span>
        </button>

        <button
          onClick={() => setLocalTab("teachers")}
          className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            effectiveTab === "teachers"
              ? "bg-brand text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Teacher Directory & Assignments</span>
        </button>
      </div>

      {/* TAB 1: MODULES */}
      {effectiveTab === "modules" && (
        <div className="space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                <span>Class Curriculum & Modules</span>
              </h2>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalTab("ncert")}
                  className="text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  Import from NCERT Library
                </Button>

                {/* Class Tabs */}
                <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-[var(--radius-md)]">
                  {[1, 2, 3, 4, 5].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer ${
                        selectedClass === cls
                          ? "bg-surface text-brand shadow-sm"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modules List or Empty State */}
            {loadingModules ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod) => (
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
                        View Module Document
                      </a>
                    ) : (
                      <span className="mt-4 text-xs text-text-tertiary italic">NCERT Module (No File)</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed space-y-3">
                <BookOpen className="w-10 h-10 text-text-tertiary mx-auto opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">
                  No Modules Added for Class {selectedClass}
                </h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Attach NCERT books with uploaded PDF files from the NCERT Library tab to make content available for Class {selectedClass} students & AI quizzes.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setLocalTab("ncert")}
                  className="text-xs mt-2"
                >
                  Go to NCERT Catalogue & Upload PDFs
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NCERT BOOKS MANAGEMENT */}
      {effectiveTab === "ncert" && (
        <NCERTBookManagementPanel onModuleAttached={fetchModules} />
      )}

      {/* TAB 3: TEACHER MANAGEMENT */}
      {effectiveTab === "teachers" && <SchoolTeacherManagement />}
    </div>
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
    <div className="space-y-6">
      {/* Parent Profile Card */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Welcome, {parent.full_name || "Parent"}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Account: {parent.phone_number || parent.email || "Registered Parent"}
            </p>
          </div>

          <div className="px-4 py-2 rounded-[var(--radius-md)] bg-surface border border-border-primary text-xs">
            <span className="text-text-tertiary block">Linked Children</span>
            <span className="font-semibold text-text-primary">{childrenList.length} Child(ren)</span>
          </div>
        </div>
      </div>

      {/* Add Child Link Form */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
        <h2 className="text-sm font-bold text-text-primary mb-1">Link an Additional Child</h2>
        <p className="text-xs text-text-secondary mb-4">
          Enter your child's Unique Student ID (e.g. LKD0001) to link their learning progress.
        </p>

        {linkError && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{linkError}</span>
          </div>
        )}

        <form onSubmit={handleAddChild} className="flex gap-3 max-w-md">
          <input
            type="text"
            placeholder="Unique Student ID (e.g. LKD0001)"
            value={newStudentId}
            onChange={(e) => setNewStudentId(e.target.value.toUpperCase())}
            className="flex-1 px-3.5 py-2 bg-surface text-text-primary text-xs uppercase rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
            required
          />
          <Button type="submit" variant="primary" size="sm" disabled={isLinking}>
            {isLinking ? "Linking..." : "Link Child"}
          </Button>
        </form>
      </div>

      {/* Linked Children List */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand" />
          <span>Your Linked Children</span>
        </h2>

        {loadingChildren ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : childrenList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="glass rounded-[var(--radius-md)] p-5 border border-border-primary flex items-center justify-between"
              >
                <div>
                  <span className="text-xs text-text-tertiary block">Unique Student ID</span>
                  <span className="font-mono font-bold text-sm text-brand">{child.student_unique_number}</span>
                </div>
                <p className="text-xs text-text-tertiary">
                  Linked on {new Date(child.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state if roles/children are not seeded */
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
            <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">No Linked Children Found</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              Link your child using their Unique Student ID above to monitor their academic performance and adaptive learning progress.
            </p>
          </div>
        )}
      </div>
    </div>
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
  const [localTab, setLocalTab] = useState<"ncert" | "overview">("ncert");

  const effectiveTab =
    activeTab === "ncert_master"
      ? "ncert"
      : activeTab === "overview"
      ? "overview"
      : localTab;

  return (
    <div className="space-y-6">
      {/* Admin Profile Overview */}
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

      {/* Admin Sub-tabs */}
      <div className="flex items-center gap-2 p-1.5 glass rounded-[var(--radius-lg)] border border-border-primary">
        <button
          onClick={() => setLocalTab("ncert")}
          className={`px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            effectiveTab === "ncert"
              ? "bg-brand text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>NCERT Books & Content Management</span>
        </button>

        <button
          onClick={() => setLocalTab("overview")}
          className={`px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            effectiveTab === "overview"
              ? "bg-brand text-white shadow-md"
              : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Overview</span>
        </button>
      </div>

      {effectiveTab === "ncert" && <NCERTBookManagementPanel />}

      {effectiveTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary">
            <span className="text-xs text-text-tertiary block">Role Status</span>
            <span className="text-lg font-bold text-text-primary mt-1 block">Active Administrator</span>
            <span className="text-xs text-brand mt-2 inline-block">Pre-seeded DB Account</span>
          </div>

          <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary">
            <span className="text-xs text-text-tertiary block">NCERT Catalogue</span>
            <span className="text-lg font-bold text-text-primary mt-1 block">Classes 1–5 Seeded</span>
            <span className="text-xs text-emerald-500 mt-2 inline-block">Database Active</span>
          </div>

          <div className="glass rounded-[var(--radius-md)] p-5 border border-border-primary">
            <span className="text-xs text-text-tertiary block">API Framework</span>
            <span className="text-lg font-bold text-text-primary mt-1 block">FastAPI + SQLModel</span>
            <span className="text-xs text-sky-500 mt-2 inline-block">JWT Bearer Security</span>
          </div>
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
    <div className="space-y-6">
      {/* Teacher Profile Banner */}
      <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">{teacher.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand">
                Teacher
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              School: <span className="font-semibold text-text-primary">{teacher.school_name}</span> | Branch:{" "}
              <span className="font-mono font-bold text-brand">{teacher.branch_name}</span> | Phone: {teacher.phone_number}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-[var(--radius-md)] bg-surface border border-border-primary text-xs">
              <span className="text-text-tertiary block">Assigned Classes</span>
              <span className="font-semibold text-text-primary">{assignedClasses.length} Class(es)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Unassigned vs Assigned State */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignedClasses.length === 0 ? (
        /* Empty State: No Class Assigned by Admin */
        <div className="glass rounded-[var(--radius-xl)] p-12 text-center border border-border-primary space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">No Class Assigned Yet</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            You can't perform any actions since no class has been assigned to you yet. Please contact your school branch administrator to assign your class (e.g. 4th A).
          </p>
          <div className="p-4 rounded-[var(--radius-md)] bg-surface border border-border-primary max-w-md mx-auto text-xs text-text-tertiary">
            Once assigned, you will be able to view student lists, upload PDF assignments, generate adaptive AI quizzes, and track student progress with feedback.
          </div>
        </div>
      ) : (
        /* Assigned State: Class Tabs + Details */
        <div className="space-y-6">
          {/* Class Selector Bar */}
          <div className="glass rounded-[var(--radius-lg)] p-4 border border-border-primary flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mr-2">
              Your Classes:
            </span>
            {assignedClasses.map((c) => {
              const isSelected = selectedClass?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c)}
                  className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-brand text-white shadow-md"
                      : "bg-surface text-text-secondary hover:text-text-primary border border-border-primary"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Class {c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Class Section */}
          {selectedClass && (
            <div className="space-y-6">
              {/* Class Header & View Tabs */}
              <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      Class {selectedClass.label} Overview
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Class {selectedClass.class_number}, Section {selectedClass.section} • Branch: {teacher.branch_name}
                    </p>
                  </div>

                  {/* Sub-tabs: Students | Assignments | Progress */}
                  <div className="flex items-center gap-1.5 p-1 bg-surface-hover rounded-[var(--radius-md)] border border-border-primary">
                    <button
                      onClick={() => setLocalTab("students")}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        effectiveTab === "students"
                          ? "bg-surface text-brand shadow-sm font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Students ({students.length})</span>
                    </button>

                    <button
                      onClick={() => setLocalTab("assignments")}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        effectiveTab === "assignments"
                          ? "bg-surface text-brand shadow-sm font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Assignments ({assignments.length})</span>
                    </button>

                    <button
                      onClick={() => setLocalTab("progress")}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        effectiveTab === "progress"
                          ? "bg-surface text-brand shadow-sm font-bold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Progress & Scores</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TAB 1: STUDENTS LIST */}
              {effectiveTab === "students" && (
                <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand" />
                    <span>Students Enrolled in Class {selectedClass.label}</span>
                  </h3>

                  {loadingStudents ? (
                    <div className="py-8 flex justify-center">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border-primary text-text-tertiary uppercase font-bold text-[10px]">
                            <th className="py-2.5 px-3">Unique ID</th>
                            <th className="py-2.5 px-3">Email Address</th>
                            <th className="py-2.5 px-3">Enrollment Mode</th>
                            <th className="py-2.5 px-3">Joined Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary/50">
                          {students.map((s) => (
                            <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-brand">{s.unique_number}</td>
                              <td className="py-3 px-3 font-medium text-text-primary">{s.email}</td>
                              <td className="py-3 px-3 capitalize text-text-secondary">{s.enrollment_type}</td>
                              <td className="py-3 px-3 text-text-tertiary">
                                {new Date(s.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-tertiary text-xs">
                      No students enrolled in Class {selectedClass.label} yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ASSIGNMENTS MANAGEMENT */}
              {effectiveTab === "assignments" && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand" />
                      <span>Class {selectedClass.label} Assignments</span>
                    </h3>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfError(null);
                          setShowPdfModal(true);
                        }}
                        className="text-xs"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
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
                        <Brain className="w-3.5 h-3.5 mr-1.5" />
                        Generate AI Quiz from Modules
                      </Button>
                    </div>
                  </div>

                  {/* Assignments List */}
                  {loadingAssignments ? (
                    <div className="py-8 flex justify-center">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : assignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignments.map((asgn) => (
                        <div
                          key={asgn.id}
                          className="glass rounded-[var(--radius-lg)] p-5 border border-border-primary space-y-3 relative group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    asgn.assignment_type === "pdf_upload"
                                      ? "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                                      : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                  }`}
                                >
                                  {asgn.assignment_type === "pdf_upload" ? "PDF Upload" : "AI Quiz"}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    asgn.is_locked
                                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  }`}
                                >
                                  {asgn.is_locked ? "Locked" : "Active"}
                                </span>
                              </div>

                              <h4 className="font-bold text-text-primary text-sm mt-2">{asgn.title}</h4>
                              {asgn.description && (
                                <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                                  {asgn.description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteAssignment(asgn.id)}
                              className="text-text-tertiary hover:text-rose-500 transition-colors p-1.5 rounded hover:bg-rose-500/10 cursor-pointer"
                              title="Delete assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="pt-2 border-t border-border-primary/50 flex items-center justify-between text-xs text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(asgn.created_at).toLocaleDateString()}
                            </span>

                            {asgn.deadline_at ? (
                              <span className="flex items-center gap-1 text-amber-500 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Deadline: {new Date(asgn.deadline_at).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>No Deadline Set</span>
                            )}
                          </div>

                          {asgn.file_url && (
                            <a
                              href={formatPdfUrl(asgn.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline mt-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Assignment PDF
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass rounded-[var(--radius-lg)] p-8 text-center border border-border-primary border-dashed">
                      <FileText className="w-8 h-8 text-text-tertiary mx-auto mb-2 opacity-50" />
                      <h4 className="text-sm font-semibold text-text-primary">No Assignments Created Yet</h4>
                      <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                        Use the buttons above to upload a manual PDF assignment (max 5MB) or generate an adaptive AI quiz from your class modules.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROGRESS & FEEDBACK */}
              {effectiveTab === "progress" && (
                <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Award className="w-4 h-4 text-brand" />
                        <span>Student Progress & Assessment Scores</span>
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Select an assignment to view student scores and give individual feedback.
                      </p>
                    </div>

                    {assignments.length > 0 && (
                      <select
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        className="px-3.5 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none font-medium"
                      >
                        {assignments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.assignment_type === "pdf_upload" ? "PDF" : "AI Quiz"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {feedbackMsg && (
                    <div className="p-3 rounded bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{feedbackMsg}</span>
                    </div>
                  )}

                  {loadingSubmissions ? (
                    <div className="py-8 flex justify-center">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : submissions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border-primary text-text-tertiary uppercase font-bold text-[10px]">
                              <th className="py-2.5 px-3">Student ID</th>
                              <th className="py-2.5 px-3">Attempt Status</th>
                              <th className="py-2.5 px-3">Score / Max</th>
                              <th className="py-2.5 px-3">Last Attempted</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-primary/50">
                            {submissions.map((sub) => {
                              const isEditing = editingStudentId === sub.student_id;
                              return (
                                <tr key={sub.id} className="hover:bg-surface/50 transition-colors">
                                  <td className="py-3 px-3 font-mono font-bold text-brand">
                                    {sub.student_unique_number}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      Attempted
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-bold text-text-primary">
                                    {sub.score !== null ? `${sub.score} / ${sub.max_score}` : "Not Graded"}
                                  </td>
                                  <td className="py-3 px-3 text-text-tertiary">
                                    {new Date(sub.last_attempted_at).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-3 text-right">
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
                                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                      {isEditing ? "Close" : "Grade / Feedback"}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Inline Feedback / Score Form for Selected Student */}
                      {editingStudentId && (
                        <div className="p-4 rounded-[var(--radius-lg)] bg-surface border border-border-brand space-y-4 animate-in fade-in duration-200">
                          <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                            <Edit className="w-4 h-4 text-brand" />
                            <span>Grade & Feedback for Student</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-text-secondary mb-1">
                                Score (Out of 100)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="e.g. 85"
                                value={scoreInput}
                                onChange={(e) => setScoreInput(e.target.value)}
                                className="w-full px-3 py-2 bg-background text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-text-secondary mb-1">
                                Feedback / Guidance Message
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Enter feedback or advice for this student..."
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                className="w-full px-3 py-2 bg-background text-text-primary text-xs rounded border border-border-primary outline-none focus:border-brand"
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
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-tertiary text-xs">
                      No student submissions yet for this assignment.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PDF UPLOAD MODAL */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-[var(--radius-xl)] p-6 max-w-md w-full border border-border-primary space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand" />
                <span>Upload PDF Assignment</span>
              </h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pdfError && (
              <div className="p-3 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePdfAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 1 Worksheet"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students..."
                  value={pdfDesc}
                  onChange={(e) => setPdfDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Deadline (Days Active)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 7 (leave empty for no deadline)"
                  value={pdfDeadlineDays}
                  onChange={(e) => setPdfDeadlineDays(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Select PDF Document (Max 5 MB) *
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
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowPdfModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmittingPdf}>
                  {isSubmittingPdf ? "Uploading..." : "Upload Assignment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI QUIZ GENERATION MODAL */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-[var(--radius-xl)] p-6 max-w-md w-full border border-border-primary space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Generate Adaptive AI Quiz</span>
              </h3>
              <button
                onClick={() => setShowQuizModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizError && (
              <div className="p-3 rounded bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quizError}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuizAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adaptive Math Quiz"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Select Modules / Chapters *
                </label>
                {classModules.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-2 p-2 rounded bg-surface border border-border-primary text-xs">
                    {classModules.map((m) => {
                      const isChecked = selectedModuleIds.includes(m.id);
                      return (
                        <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModuleIds([...selectedModuleIds, m.id]);
                              } else {
                                setSelectedModuleIds(selectedModuleIds.filter((id) => id !== m.id));
                              }
                            }}
                            className="rounded border-border-primary text-brand focus:ring-brand"
                          />
                          <span className="font-medium text-text-primary">{m.title}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded bg-surface text-xs text-text-tertiary italic">
                    No uploaded modules found for this class. Upload modules first in the School dashboard to generate adaptive quizzes.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Deadline (Days Active)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 7 (leave empty for no deadline)"
                  value={quizDeadlineDays}
                  onChange={(e) => setQuizDeadlineDays(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border border-border-primary focus:border-brand outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowQuizModal(false)}>
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
          </div>
        </div>
      )}
    </div>
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

function SchoolTeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [assignClassNum, setAssignClassNum] = useState<number>(4);
  const [assignSec, setAssignSec] = useState<string>("A");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchTeachers = () => {
    setLoading(true);
    getSchoolTeachers()
      .then((res) => setTeachers(res))
      .catch((err) => console.log("Fetch teachers note:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAssign = async (teacherId: string) => {
    setIsAssigning(true);
    setMsg(null);
    try {
      await assignClassToTeacher(teacherId, assignClassNum, assignSec);
      setMsg(`Assigned Class ${assignClassNum}${assignSec} successfully!`);
      setSelectedTeacherId(null);
      fetchTeachers();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to assign class.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeassign = async (teacherId: string, classNum: number, sec: string) => {
    if (!confirm(`De-assign Class ${classNum}${sec} from this teacher?`)) return;
    try {
      await deassignClassFromTeacher(teacherId, classNum, sec);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || "Failed to de-assign class.");
    }
  };

  return (
    <div className="glass rounded-[var(--radius-lg)] p-6 border border-border-primary space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <UserCog className="w-4 h-4 text-brand" />
            <span>Branch Teacher Directory & Class Assignment</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Assign or de-assign class sections (e.g. 4th A) to teachers registered in your branch.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : teachers.length > 0 ? (
        <div className="divide-y divide-border-primary/50">
          {teachers.map((t) => (
            <div key={t.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text-primary">{t.name}</span>
                  <span className="text-xs text-text-tertiary font-mono">({t.phone_number})</span>
                </div>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs text-text-secondary font-medium">Assigned Classes:</span>
                  {t.assigned_classes.length > 0 ? (
                    t.assigned_classes.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand border border-border-brand"
                      >
                        {c.label}
                        <button
                          onClick={() => handleDeassign(t.id, c.class_number, c.section)}
                          className="hover:text-rose-500 cursor-pointer ml-1"
                          title="De-assign class"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-500 font-semibold italic">Unassigned (Empty List)</span>
                  )}
                </div>
              </div>

              <div>
                {selectedTeacherId === t.id ? (
                  <div className="flex items-center gap-2 bg-surface p-2 rounded border border-border-primary">
                    <select
                      value={assignClassNum}
                      onChange={(e) => setAssignClassNum(Number(e.target.value))}
                      className="px-2 py-1 bg-background text-text-primary text-xs rounded border border-border-primary"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          Class {num}
                        </option>
                      ))}
                    </select>

                    <select
                      value={assignSec}
                      onChange={(e) => setAssignSec(e.target.value)}
                      className="px-2 py-1 bg-background text-text-primary text-xs rounded border border-border-primary"
                    >
                      {["A", "B", "C", "D"].map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isAssigning}
                      onClick={() => handleAssign(t.id)}
                      className="text-xs"
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTeacherId(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTeacherId(t.id)}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Assign Class
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-text-tertiary text-xs">
          No teachers registered under this branch yet.
        </div>
      )}
    </div>
  );
}
