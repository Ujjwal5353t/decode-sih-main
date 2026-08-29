"use client";

/**
 * The sidebar's account control — a coloured identity chip that opens a real
 * menu, replacing the bare "Sign Out" button.
 *
 * Everything in this menu does something. There is no `/settings` or
 * `/profile` route in this app, so rather than link to a dead page, "Your
 * Profile" opens a panel built from the `user` object the dashboard has
 * already fetched, and "Refresh Profile" calls the auth context's real
 * `refreshProfile()`. No new endpoint, no placeholder rows.
 *
 * Interaction contract:
 *   · Opens upward — it lives at the bottom of the rail.
 *   · Closes on outside pointerdown, on Escape, and after any action.
 *   · Escape returns focus to the trigger, so keyboard users aren't dropped
 *     at the top of the document.
 *   · Proper `aria-haspopup` / `aria-expanded` / `role="menu"` wiring.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Home,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  UserCircle,
  X,
} from "lucide-react";
import type { Role } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * One gradient per role, drawn from the brand family. This is the "coloured
 * profile icon" — role is legible at a glance from the rail, without a label.
 */
const ROLE_AVATAR: Record<Role, string> = {
  student: "from-[#0EA5E9] to-[#22D3EE]",
  teacher: "from-[#8B5CF6] to-[#6366F1]",
  school: "from-[#2563EB] to-[#3B82F6]",
  parent: "from-[#F43F5E] to-[#FB7185]",
  admin: "from-[#334155] to-[#64748B]",
};

/** Up to two letters, skipping "#"-prefixed fallbacks like "Student #LKD0001". */
function initialsOf(name: string): string {
  const words = name
    .replace(/#/g, " ")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w));
  if (words.length === 0) return "VS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Account fields worth showing, per role — every one read straight off the
 * profile the dashboard already holds. Empty values are dropped rather than
 * rendered as blanks or em-dashes.
 */
function profileFields(role: Role, user: Record<string, unknown>): [string, string][] {
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const rows: [string, string][] = [];
  const push = (label: string, value: unknown) => {
    const v = str(value).trim();
    if (v) rows.push([label, v]);
  };

  if (role === "student") {
    push("Student ID", user.unique_number);
    push("Full Name", user.full_name);
    push("Email", user.email);
    push("Phone", user.phone_number);
    push("Class", user.class_number ? `Class ${user.class_number}` : "");
    push("Section", user.section);
    push("Enrollment", user.enrollment_type);
    push("School", user.school_name);
    push("Branch", user.branch_name);
    push("State", user.state);
  } else if (role === "school") {
    push("School Name", user.school_name);
    push("Branch", user.branch_name);
    push("Student Prefix", user.student_prefix);
    push("Email", user.email);
    push("Phone", user.phone_number);
    push("State", user.state);
  } else if (role === "teacher") {
    push("Name", user.name);
    push("Phone", user.phone_number);
    push("School", user.school_name);
    push("Branch", user.branch_name);
    push("Status", user.is_active ? "Active" : "Inactive");
  } else if (role === "parent") {
    push("Full Name", user.full_name);
    push("Email", user.email);
    push("Phone", user.phone_number);
  } else if (role === "admin") {
    push("Email", user.email);
  }

  if (user.created_at) {
    const d = new Date(String(user.created_at));
    if (!Number.isNaN(d.getTime())) {
      rows.push([
        "Member since",
        d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
      ]);
    }
  }
  return rows;
}

export function AccountMenu({
  user,
  role,
  displayName,
  subtitle,
  roleLabel,
  logout,
  isConsole,
}: {
  user: Record<string, unknown> | null;
  role: Role;
  displayName: string;
  subtitle: string;
  roleLabel: string;
  logout: () => void;
  /** Console roles get the flat rail treatment; others keep the softer chrome. */
  isConsole: boolean;
}) {
  const { refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Outside pointerdown + Escape. Bound only while open, so there is no
  // listener sitting on the document for the whole session.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshed(false);
    try {
      await refreshProfile();
      setRefreshed(true);
      window.setTimeout(() => setRefreshed(false), 2200);
    } catch {
      // refreshProfile already handles its own failure state; nothing to add.
    } finally {
      setRefreshing(false);
    }
  };

  const avatarGradient = ROLE_AVATAR[role] ?? ROLE_AVATAR.student;
  const initials = initialsOf(displayName);
  const fields = user ? profileFields(role, user) : [];

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-[var(--c-sunken)] hover:text-text-primary focus-visible:bg-[var(--c-sunken)] focus-visible:text-text-primary cursor-pointer";

  return (
    <>
      <div ref={rootRef} className="relative">
        {/* ── Trigger ─────────────────────────────────────────────────── */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className={cn(
            "group flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2 text-left transition-colors",
            open
              ? "border-brand/30 bg-brand/[0.06]"
              : isConsole
              ? "border-transparent hover:border-[var(--c-line)] hover:bg-[var(--c-sunken)]"
              : "border-transparent hover:bg-surface-hover"
          )}
        >
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white shadow-sm",
              avatarGradient
            )}
          >
            {initials}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-text-primary">
              {displayName}
            </span>
            <span className="block truncate text-[11px] text-text-tertiary">{roleLabel}</span>
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200",
              open && "rotate-180 text-brand"
            )}
          />
        </button>

        {/* ── Menu ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              aria-label="Account options"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.985 }}
              transition={{ duration: 0.16, ease: [0.22, 0.68, 0, 1] }}
              // Opens upward: this sits at the bottom of the rail.
              className="console-panel absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-[var(--c-line)] shadow-[var(--shadow-lg)]"
            >
              {/* Identity header */}
              <div className="flex items-center gap-2.5 border-b border-[var(--c-line)] bg-[var(--c-sunken)] px-3 py-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white shadow-sm",
                    avatarGradient
                  )}
                >
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-text-primary">
                    {displayName}
                  </span>
                  <span className="block truncate text-[11px] text-text-tertiary">
                    {subtitle}
                  </span>
                </span>
              </div>

              <div className="space-y-0.5 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    setShowProfile(true);
                    close();
                  }}
                >
                  <UserCircle className="h-4 w-4 shrink-0 text-brand" />
                  Your Profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  disabled={refreshing}
                  onClick={handleRefresh}
                >
                  {refreshed ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <RefreshCw
                      className={cn(
                        "h-4 w-4 shrink-0 text-text-tertiary",
                        refreshing && "animate-spin text-brand"
                      )}
                    />
                  )}
                  {refreshing ? "Refreshing…" : refreshed ? "Profile updated" : "Refresh Profile"}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className={cn(itemClass, "justify-between")}
                  onClick={toggleTheme}
                >
                  <span className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4 shrink-0 text-text-tertiary" />
                    ) : (
                      <Sun className="h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    Interface Theme
                  </span>
                  <span className="rounded-md border border-[var(--c-line)] bg-[var(--c-sunken)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {theme === "dark" ? "Dark" : "Light"}
                  </span>
                </button>

                <Link href="/" role="menuitem" className={itemClass} onClick={close}>
                  <Home className="h-4 w-4 shrink-0 text-text-tertiary" />
                  Back to Home
                </Link>
              </div>

              <div className="border-t border-[var(--c-line)] p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    logout();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Profile panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your Profile"
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 0.68, 0, 1] }}
              className="console-panel relative w-full max-w-sm overflow-hidden rounded-[18px] shadow-[var(--shadow-lg)]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[var(--c-line)] bg-[var(--c-sunken)] px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
                      avatarGradient
                    )}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                      {displayName}
                    </h3>
                    <p className="truncate text-[11px] text-text-tertiary">{roleLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  aria-label="Close profile"
                  className="cursor-pointer rounded-md p-1 text-text-tertiary transition-colors hover:bg-[var(--c-panel)] hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] divide-y divide-[var(--c-line)] overflow-y-auto px-5">
                {fields.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="shrink-0 text-[11px] text-text-tertiary">{label}</span>
                    <span className="min-w-0 truncate text-right text-xs font-medium capitalize text-text-primary">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--c-line)] px-5 py-3">
                <p className="text-[11px] leading-relaxed text-text-tertiary">
                  Account details are read from your VidyaSetu profile. Contact your
                  administrator to change them.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
