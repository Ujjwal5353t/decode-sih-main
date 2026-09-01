"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  UserCog,
  GraduationCap,
  Building2,
  Sparkles,
  Brain,
  Award,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  X,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Sparkle,
  Bell,
} from "lucide-react";
import { Role, RolePermissionsResponse, DashboardPermissionItem } from "@/lib/api";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

// Map backend icon string names to Lucide-React icons
const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  UserCog,
  GraduationCap,
  Building2,
  Sparkles,
  Brain,
  Award,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  Sliders,
};

interface SidebarProps {
  permissions: RolePermissionsResponse | null;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  user: any;
  role: Role;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  logout: () => void;
}

export function DashboardSidebar({
  permissions,
  activeTab,
  onSelectTab,
  user,
  role,
  isMobileOpen,
  onCloseMobile,
  logout,
}: SidebarProps) {
  const { t } = useTranslation();
  // The console surface language applies to the School Admin, Teacher and
  // Parent dashboards. Student and Super Admin fall through to the original
  // styling on every branch below, so their sidebar is byte-for-byte what it
  // rendered before.
  const isConsole = role === "school" || role === "teacher" || role === "parent";
  const isStudent = role === "student";

  // Extract user display name & details based on role
  const getUserDisplayName = () => {
    if (!user) return "User";
    if (role === "student") return user.full_name || `${t("sidebar.roleLabels.student")} #${user.unique_number}`;
    if (role === "teacher") return user.name || t("sidebar.roleLabels.teacher");
    if (role === "school") return user.school_name || t("sidebar.roleLabels.school");
    if (role === "parent") return user.full_name || t("sidebar.roleLabels.parent");
    if (role === "admin") return t("sidebar.roleLabels.admin");
    return t("sidebar.roleLabels.fallback");
  };

  // Dynamic label helpers using i18n
  const navItemKeyMap: Record<string, string> = {
    overview: "dashboard.nav.overview",
    modules: "dashboard.nav.learningModules",
    assignments: "dashboard.nav.classAssignments",
    practice: "dashboard.nav.practiceQuizzes",
    quizzes: "dashboard.nav.practiceQuizzes",
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
  };

  const getNavItemLabel = (item: DashboardPermissionItem) => {
    if (role === "student" && item.id === "overview") {
      return t("dashboard.nav.studentOverview");
    }
    const key = navItemKeyMap[item.id];
    if (key) {
      const translated = t(key as any);
      if (translated && translated !== key) return translated;
    }
    return item.label;
  };

  const getCategoryLabel = (cat: string) => {
    const key = `dashboard.categories.${cat.toLowerCase()}`;
    const translated = t(key as any);
    return translated && translated !== key ? translated : cat;
  };

  const getRoleBadgeLabel = () => {
    const key = `dashboard.topbar.roles.${role}`;
    const translated = t(key as any);
    return translated && translated !== key ? translated : (permissions?.role_label || `${role} Role`);
  };

  const getUserSubtitle = () => {
    if (!user) return "";
    if (role === "student") return user.branch_name === "SELF" ? t("sidebar.subtitles.selfEducated") : user.branch_name;
    if (role === "teacher") return t("sidebar.subtitles.branch", { name: user.branch_name });
    if (role === "school") return `${user.branch_name} (${user.student_prefix})`;
    if (role === "parent") return user.phone_number || user.email || t("sidebar.subtitles.guardian");
    if (role === "admin") return t("sidebar.subtitles.systemOps");
    return "";
  };

  const navigationItems = permissions?.navigation || [
    {
      id: "overview",
      label: "Overview",
      description: "Main dashboard summary",
      icon: "LayoutDashboard",
      category: "Main",
      is_default: true,
    },
  ];

  // Group items by category if available
  const categories = Array.from(new Set(navigationItems.map((item) => item.category || "Main")));

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,0.68,0,1)] lg:translate-x-0 ${
          isConsole
            ? "w-72 border-r border-[var(--c-line)] bg-[var(--c-panel)] shadow-2xs"
            : "w-72 bg-surface/95 backdrop-blur-md border-r border-border-primary"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header — the student rail runs taller so the logo can be the
            same lockup and size the public site's navbar uses. */}
        <div
          className={`flex shrink-0 items-center justify-between border-b ${
            isStudent ? "h-[104px] px-4" : "h-[76px] px-5"
          } ${isConsole ? "border-[var(--c-line)]" : "border-border-primary/60"}`}
        >
          {/* Same component and size the public navbar uses, so the brand is
              identical across the site rather than a dashboard-only variant. */}
          <BrandLogo size={isStudent ? "md" : "sm"} priority />

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-[var(--c-sunken)] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card — hidden for students: the same name, school and role
            are already available from the account menu at the foot of the rail,
            and the learner view wants the space for navigation. */}
        <div
          className={
            isStudent
              ? "hidden"
              : isConsole
              ? "border-b border-[var(--c-line)] px-4 py-3.5"
              : "p-4 mx-3 my-3 rounded-[var(--radius-lg)] bg-surface-hover/80 border border-border-primary/70"
          }
        >
          <div className="flex items-center gap-3">
            {role === "parent" ? (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-150 font-bold text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-200">
                {(getUserDisplayName().slice(0, 1) || "P").toUpperCase()}
              </div>
            ) : (
              <div
                className={`flex shrink-0 items-center justify-center ${
                  isConsole
                    ? "h-9 w-9 rounded-xl border border-brand/20 bg-brand/10 text-brand shadow-2xs"
                    : "w-10 h-10 rounded-[var(--radius-md)] shadow-sm"
                }`}
                style={isConsole ? undefined : { background: "var(--gradient-brand)" }}
              >
                {role === "student" && <GraduationCap className="h-5 w-5 text-white" />}
                {role === "teacher" && <UserCog className={isConsole ? "h-[18px] w-[18px]" : "w-5 h-5 text-white"} />}
                {role === "school" && <Building2 className={isConsole ? "h-[18px] w-[18px]" : "w-5 h-5 text-white"} />}
                {role === "admin" && <ShieldCheck className="h-5 w-5 text-white" />}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-text-primary truncate">
                {getUserDisplayName()}
              </div>
              <div className="text-[11px] text-text-secondary truncate mt-0.5">
                {role === "parent" ? "Parent / Guardian" : getUserSubtitle()}
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-sky-500/10 text-sky-600 border border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400">
                {role === "parent" ? "PARENT DASHBOARD" : getRoleBadgeLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section (Fetched from RBAC Backend Schema) */}
        <div
          className={`flex-1 overflow-y-auto ${
            isConsole ? "space-y-5 px-3 py-3.5" : "px-3 py-2 space-y-4"
          }`}
        >
          {categories.map((cat) => {
            const items = navigationItems.filter((i) => (i.category || "Main") === cat);

            return (
              <div key={cat} className={isConsole ? "space-y-1" : "space-y-1"}>
                <div
                  className={
                    isConsole
                      ? "px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-text-tertiary"
                      : "px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary"
                  }
                >
                  {getCategoryLabel(cat)}
                </div>

                {items.map((item: DashboardPermissionItem) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive = activeTab === item.id;
                  const itemLabel = getNavItemLabel(item);

                  if (isStudent) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                          isActive
                            ? "bg-brand/10 text-brand"
                            : "text-text-secondary hover:bg-[var(--c-sunken)] hover:text-text-primary"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
                            isActive
                              ? "bg-brand text-white shadow-sm shadow-brand/30"
                              : "bg-[var(--c-sunken)] text-text-tertiary group-hover:text-brand"
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="truncate">{itemLabel}</span>
                        {item.badge && (
                          <span className="ml-auto shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-brand">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  }

                  if (isConsole) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`group relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-brand text-white font-bold shadow-md shadow-brand/20"
                            : "text-text-secondary hover:bg-[var(--c-sunken)] hover:text-text-primary"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-text-tertiary group-hover:text-brand"
                            }`}
                          />
                          <span className="truncate">{itemLabel}</span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.badge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-brand/10 text-brand border border-brand/20"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight
                            className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 ${
                              isActive ? "text-white/80" : "text-text-tertiary opacity-40"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-brand text-white shadow-[var(--shadow-brand)]"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-white" : "text-text-tertiary"
                          }`}
                        />
                        <span className="truncate">{itemLabel}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-brand/10 text-brand"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Institution Context Card (School Admin) */}
        {role === "school" && user && (
          <div className="px-3 pb-2">
            <div className="rounded-xl border border-[var(--c-line)] bg-[var(--c-sunken)] p-3 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Branch Prefix
                </span>
                <span className="font-mono text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded-md">
                  {user.student_prefix}
                </span>
              </div>
              <div className="text-[11px] font-medium text-text-secondary truncate">
                {user.school_name || "VidyaSetu Institution"}
              </div>
            </div>
          </div>
        )}

        {/* Parent Stay Connected Card */}
        {role === "parent" && (
          <div className="px-3 pb-3">
            <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Stay Connected
                  </h4>
                  <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                    Enable notifications to never miss an update
                  </p>
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-sky-600 shadow-2xs dark:bg-slate-800 dark:text-sky-400">
                  <Bell className="h-4 w-4" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && "Notification" in window) {
                    Notification.requestPermission();
                  }
                }}
                className="mt-3 w-full rounded-xl bg-[#0284c7] py-2 text-center text-xs font-bold text-white shadow-sm shadow-sky-500/20 transition-all hover:bg-sky-700 active:scale-95 cursor-pointer"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        )}

        {/* Student Scholar Perks Card (Lingora Plus matching design) */}
        {isStudent && (
          <div className="px-3 pb-3">
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-50 p-3.5 shadow-xs dark:border-amber-900/40 dark:from-slate-900 dark:via-sky-950/20 dark:to-indigo-950/30">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-400/20 text-sm">
                  👑
                </span>
                <span>VidyaSetu Scholar</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                Unlock all NCERT modules, adaptive AI quizzes &amp; badges.
              </p>
              <button
                type="button"
                onClick={() => onSelectTab("modules")}
                className="mt-2.5 w-full rounded-xl bg-sky-500 py-1.5 text-center text-xs font-bold text-white shadow-sm shadow-sky-500/20 transition-all hover:bg-sky-600 active:scale-95 cursor-pointer"
              >
                Explore Modules
              </button>
            </div>
          </div>
        )}

        {/* Footer — account control. Sign Out now lives inside this menu
            alongside the profile panel, theme and home link. */}
        <div
          className={
            isConsole
              ? "border-t border-[var(--c-line)] px-3 py-3"
              : "p-3 border-t border-border-primary/60 bg-surface/40"
          }
        >
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-semibold text-text-secondary">{t("languageSwitcher.label")}</span>
            <LanguageSwitcher placement="up" />
          </div>

          <AccountMenu
            user={user}
            role={role}
            displayName={getUserDisplayName()}
            subtitle={getUserSubtitle()}
            roleLabel={permissions?.role_label || `${role} Role`}
            logout={logout}
            isConsole={isConsole}
          />
        </div>
      </aside>
    </>
  );
}
