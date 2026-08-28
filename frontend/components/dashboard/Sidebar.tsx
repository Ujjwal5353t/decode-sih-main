"use client";

import Link from "next/link";
import Image from "next/image";
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
  LogOut,
  X,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Sparkle,
} from "lucide-react";
import { Role, RolePermissionsResponse, DashboardPermissionItem } from "@/lib/api";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/Button";

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
  // The console surface language applies to the School Admin, Teacher and
  // Parent dashboards. Student and Super Admin fall through to the original
  // styling on every branch below, so their sidebar is byte-for-byte what it
  // rendered before.
  const isConsole = role === "school" || role === "teacher" || role === "parent";

  // Extract user display name & details based on role
  const getUserDisplayName = () => {
    if (!user) return "User";
    if (role === "student") return user.full_name || `Student #${user.unique_number}`;
    if (role === "teacher") return user.name || "Teacher";
    if (role === "school") return user.school_name || "School Admin";
    if (role === "parent") return user.full_name || "Parent";
    if (role === "admin") return "Super Administrator";
    return "Account";
  };

  const getUserSubtitle = () => {
    if (!user) return "";
    if (role === "student") return user.branch_name === "SELF" ? "Self-Educated (NCERT)" : user.branch_name;
    if (role === "teacher") return `${user.branch_name} Branch`;
    if (role === "school") return `${user.branch_name} (${user.student_prefix})`;
    if (role === "parent") return user.phone_number || user.email || "Guardian";
    if (role === "admin") return "System Operations";
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,0.68,0,1)] lg:translate-x-0 ${
          isConsole
            ? "w-72 border-r border-[var(--c-line)] bg-[var(--c-panel)]"
            : "w-72 bg-surface/95 backdrop-blur-md border-r border-border-primary"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between ${
            isConsole
              ? "border-b border-[var(--c-line)] px-5 py-4"
              : "p-5 border-b border-border-primary/60"
          }`}
        >
          <Link
            href="/"
            className="flex items-center group py-0.5"
            aria-label="VidyaSetu — Go to home"
          >
            <Image
              src="/vidyasetu-logo.png"
              alt="VidyaSetu — Inclusive Education"
              width={280}
              height={84}
              className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              priority
            />
          </Link>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-primary hover:bg-surface-hover lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div
          className={
            isConsole
              ? "border-b border-[var(--c-line)] px-5 py-4"
              : "p-4 mx-3 my-3 rounded-[var(--radius-lg)] bg-surface-hover/80 border border-border-primary/70"
          }
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex shrink-0 items-center justify-center ${
                isConsole
                  ? "h-9 w-9 rounded-[var(--c-radius)] border border-brand/20 bg-brand/10 text-brand"
                  : "w-10 h-10 rounded-[var(--radius-md)] shadow-sm"
              }`}
              style={isConsole ? undefined : { background: "var(--gradient-brand)" }}
            >
              {role === "student" && <GraduationCap className="h-5 w-5 text-white" />}
              {role === "teacher" && <UserCog className={isConsole ? "h-[18px] w-[18px]" : "w-5 h-5 text-white"} />}
              {role === "school" && <Building2 className={isConsole ? "h-[18px] w-[18px]" : "w-5 h-5 text-white"} />}
              {role === "parent" && <Users className={isConsole ? "h-[18px] w-[18px]" : "w-5 h-5 text-white"} />}
              {role === "admin" && <ShieldCheck className="h-5 w-5 text-white" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-text-primary truncate">
                {getUserDisplayName()}
              </div>
              <div className="text-[11px] text-text-secondary truncate mt-0.5">
                {getUserSubtitle()}
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-brand/10 text-brand border border-border-brand">
                {permissions?.role_label || `${role} Role`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section (Fetched from RBAC Backend Schema) */}
        <div
          className={`flex-1 overflow-y-auto ${
            isConsole ? "space-y-6 px-3 py-4" : "px-3 py-2 space-y-4"
          }`}
        >
          {categories.map((cat) => {
            const items = navigationItems.filter((i) => (i.category || "Main") === cat);

            return (
              <div key={cat} className={isConsole ? "space-y-0.5" : "space-y-1"}>
                <div
                  className={
                    isConsole
                      ? "px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.09em] text-text-tertiary"
                      : "px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary"
                  }
                >
                  {cat}
                </div>

                {items.map((item: DashboardPermissionItem) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive = activeTab === item.id;

                  if (isConsole) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`group relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--c-radius)] px-3 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-brand/8 font-semibold text-brand"
                            : "text-text-secondary hover:bg-[var(--c-sunken)] hover:text-text-primary"
                        }`}
                      >
                        {/* One indicator that slides between items, rather than
                            every item cross-fading its own background. */}
                        {isActive && (
                          <motion.span
                            layoutId="console-nav-indicator"
                            transition={{ type: "spring", stiffness: 520, damping: 40 }}
                            className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-brand"
                          />
                        )}

                        <div className="flex min-w-0 items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-brand"
                                : "text-text-tertiary group-hover:text-text-secondary"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.badge && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? "bg-brand/12 text-brand"
                                  : "bg-[var(--c-sunken)] text-text-tertiary"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-brand/70" />}
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
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all cursor-pointer group ${
                        isActive
                          ? "bg-brand text-white shadow-sm font-bold"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-text-tertiary group-hover:text-brand"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-brand/10 text-brand border border-border-brand"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 opacity-60 ${
                            isActive ? "text-white" : "text-text-tertiary"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          className={
            isConsole
              ? "space-y-3 border-t border-[var(--c-line)] px-5 py-4"
              : "p-4 border-t border-border-primary/60 space-y-3 bg-surface/40"
          }
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Interface Theme</span>
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-xs font-semibold text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2 text-rose-500" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
