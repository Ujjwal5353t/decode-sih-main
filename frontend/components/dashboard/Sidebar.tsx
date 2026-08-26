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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface/95 backdrop-blur-md border-r border-border-primary flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-border-primary/60 flex items-center justify-between">
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
        <div className="p-4 mx-3 my-3 rounded-[var(--radius-lg)] bg-surface-hover/80 border border-border-primary/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: "var(--gradient-brand)" }}
            >
              {role === "student" && <GraduationCap className="w-5 h-5 text-white" />}
              {role === "teacher" && <UserCog className="w-5 h-5 text-white" />}
              {role === "school" && <Building2 className="w-5 h-5 text-white" />}
              {role === "parent" && <Users className="w-5 h-5 text-white" />}
              {role === "admin" && <ShieldCheck className="w-5 h-5 text-white" />}
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
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {categories.map((cat) => {
            const items = navigationItems.filter((i) => (i.category || "Main") === cat);

            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                  {cat}
                </div>

                {items.map((item: DashboardPermissionItem) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive = activeTab === item.id;

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
        <div className="p-4 border-t border-border-primary/60 space-y-3 bg-surface/40">
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
