"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { ModuleUploadWizard } from "@/components/school/module-upload/ModuleUploadWizard";
import { CLASS_OPTIONS } from "@/components/school/module-upload/primitives";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { getRolePermissions, type RolePermissionsResponse, type SchoolProfile } from "@/lib/api";

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-secondary">{message}</p>
      </div>
    </div>
  );
}

function ModuleUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading, logout } = useAuth();
  const { t, language } = useTranslation();
  const [permissions, setPermissions] = useState<RolePermissionsResponse | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Only a signed-in school branch admin can upload class modules.
  useEffect(() => {
    if (loading) return;
    if (!user || !role) {
      router.push("/login");
    } else if (role !== "school") {
      router.push("/dashboard");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (role) {
      getRolePermissions(role, language)
        .then((res) => setPermissions(res))
        .catch((err) => console.log("Fetch permissions note:", err.message));
    }
  }, [role, language]);

  if (loading || !user || role !== "school" || !permissions) {
    return <LoadingScreen message={t("dashboard.common.loading")} />;
  }

  const school = user as SchoolProfile;
  const requestedClass = Number(searchParams.get("class"));
  const requestedSubject = searchParams.get("subject") || undefined;
  const initialClass = CLASS_OPTIONS.includes(
    requestedClass as (typeof CLASS_OPTIONS)[number]
  )
    ? requestedClass
    : CLASS_OPTIONS[0];

  return (
    <div className="min-h-screen bg-background relative flex console">
      {/* Left Dynamic RBAC Permissions Sidebar */}
      <DashboardSidebar
        permissions={permissions}
        activeTab="modules"
        onSelectTab={(tabId) => {
          router.push(`/dashboard?tab=${tabId}`);
        }}
        user={user}
        role={role}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        logout={logout}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 sm:px-6">
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
                <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-text-primary font-[family-name:var(--font-display)]">
                  {t("dashboard.nav.curriculum")}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand/10 text-brand border border-border-brand">
                  {t("dashboard.student.class")} {initialClass}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-border-brand text-xs font-semibold text-brand uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>{permissions?.role_label || `${school.branch_name} (${school.student_prefix})`}</span>
            </div>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard?tab=modules")}
              className="text-text-secondary hover:text-text-primary text-xs px-2.5 sm:px-3"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t("dashboard.modules")}</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div>
            <nav className="flex items-center gap-1.5 text-[11px] text-text-tertiary mb-2">
              <Link href="/dashboard" className="hover:text-brand transition-colors">
                {t("nav.dashboard")}
              </Link>
              <span>/</span>
              <Link href="/dashboard" className="hover:text-brand transition-colors">
                {t("dashboard.nav.curriculum")}
              </Link>
              <span>/</span>
              <span className="text-text-secondary font-semibold">{t("school.uploadSyllabus")}</span>
            </nav>

            <h2 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
              {t("school.uploadSyllabus")}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {school.school_name} — {school.branch_name}
            </p>
          </div>

          <ModuleUploadWizard
            initialClass={initialClass}
            initialSubject={requestedSubject}
            branchName={school.branch_name}
            replaceModuleId={searchParams.get("replace") ?? undefined}
            onExit={() => router.push("/dashboard")}
          />
        </main>
      </div>
    </div>
  );
}

export default function ModuleUploadPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading module upload..." />}>
      <ModuleUploadContent />
    </Suspense>
  );
}
