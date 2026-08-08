"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  StudentProfile,
  SchoolProfile,
  ParentProfile,
  AdminProfile,
  ModuleOut,
  NCERTBookOut,
  ChildLinkOut,
  getStudentModules,
  getNCERTBooksForClass,
  getSchoolClassModules,
  getParentChildren,
  addParentChild,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading, logout, setupClass } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && (!user || !role)) {
      router.push("/login");
    }
  }, [loading, user, role, router]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 glass border-b border-border-primary px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
              IncluLearn
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand uppercase tracking-wider">
              {role === "student" && <GraduationCap className="w-3.5 h-3.5" />}
              {role === "school" && <Building2 className="w-3.5 h-3.5" />}
              {role === "parent" && <Users className="w-3.5 h-3.5" />}
              {role === "admin" && <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{role} Dashboard</span>
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
              className="text-text-secondary hover:text-rose-500"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Body based on RBAC */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {role === "student" && <StudentDashboardView student={user as StudentProfile} setupClass={setupClass} />}
        {role === "school" && <SchoolDashboardView school={user as SchoolProfile} />}
        {role === "parent" && <ParentDashboardView parent={user as ParentProfile} />}
        {role === "admin" && <AdminDashboardView admin={user as AdminProfile} />}
      </main>
    </div>
  );
}

// ── Student Dashboard View ───────────────────────────────────────────────────

function StudentDashboardView({
  student,
  setupClass,
}: {
  student: StudentProfile;
  setupClass: (data: { class_number: number; section: string }) => Promise<void>;
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
                Welcome, Student #{student.unique_number}
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
                    <span className="text-xs text-brand font-semibold hover:underline cursor-pointer">
                      Study Book →
                    </span>
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
                      href={mod.file_url}
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
    </div>
  );
}

// ── School Dashboard View ────────────────────────────────────────────────────

function SchoolDashboardView({ school }: { school: SchoolProfile }) {
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);

  useEffect(() => {
    setLoadingModules(true);
    getSchoolClassModules(selectedClass)
      .then((res) => setModules(res))
      .catch((err) => console.log("School module fetch note:", err.message))
      .finally(() => setLoadingModules(false));
  }, [selectedClass]);

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

      {/* Class Selector & Modules Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" />
            <span>Class Curriculum & Modules</span>
          </h2>

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
                    href={mod.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Module Document
                  </a>
                ) : (
                  <span className="mt-4 text-xs text-text-tertiary italic">NCERT Module</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty state if roles/modules are not seeded */
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-border-primary border-dashed">
            <BookOpen className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">
              No Uploaded Modules for Class {selectedClass}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1">
              Modules uploaded by your school branch will appear here. No modules have been added for this class yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Parent Dashboard View ────────────────────────────────────────────────────

function ParentDashboardView({ parent }: { parent: ParentProfile }) {
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
            <h1 className="text-xl font-bold text-text-primary">Parent Portal</h1>
            <p className="text-sm text-text-secondary mt-1">Account: {parent.email}</p>
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
                className="glass rounded-[var(--radius-md)] p-5 border border-border-primary hover:border-brand transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                    ID
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border-primary font-bold text-brand">
                    {child.student_unique_number}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
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

function AdminDashboardView({ admin }: { admin: AdminProfile }) {
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

      {/* Admin Quick Metrics Cards */}
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
    </div>
  );
}
