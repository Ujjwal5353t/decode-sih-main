"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SchoolRecordOut } from "@/lib/api";
import { Pill } from "../module-upload/primitives";

// Reuse the existing design atoms rather than defining a second set.
export {
  Banner,
  Field,
  Panel,
  PanelHeading,
  Pill,
  SelectInput,
  TextInput,
} from "../module-upload/primitives";

export const DESIGNATIONS = [
  "Principal",
  "Head Teacher",
  "School Director",
  "School Administrator",
  "Authorized School Representative",
  "Other",
];

export type RegStepId =
  | "find"
  | "confirm"
  | "claim"
  | "curriculum"
  | "verify"
  | "result";

export const REG_STEPS: { id: RegStepId; label: string; hint: string }[] = [
  { id: "find", label: "Find School", hint: "UDISE or name" },
  { id: "confirm", label: "Confirm", hint: "Official record" },
  { id: "claim", label: "Admin Details", hint: "Your identity" },
  { id: "curriculum", label: "Subjects & Books", hint: "Class-wise publishers" },
  { id: "verify", label: "Verify", hint: "Phone & email OTP" },
  { id: "result", label: "Status", hint: "Approval & access" },
];


/** Horizontal progress rail, matching the module-upload wizard's language. */
export function RegStepRail({ current }: { current: RegStepId }) {
  const currentIndex = REG_STEPS.findIndex((s) => s.id === current);

  return (
    <nav
      aria-label="Registration progress"
      className="glass rounded-[var(--radius-lg)] border border-border-primary p-3 sm:p-4"
    >
      <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {REG_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-md)]",
                  isActive && "bg-surface shadow-sm"
                )}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-300"
                  style={{
                    background: isDone
                      ? "var(--brand-primary)"
                      : isActive
                        ? "var(--bg-surface)"
                        : "var(--bg-muted)",
                    border: `1px solid ${
                      isDone || isActive
                        ? "var(--brand-primary)"
                        : "var(--border-primary)"
                    }`,
                    color: isDone
                      ? "#FFFFFF"
                      : isActive
                        ? "var(--brand-primary)"
                        : "var(--text-tertiary)",
                    boxShadow: isActive ? "0 0 0 3px var(--border-brand)" : "none",
                  }}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </span>
                <span className="hidden sm:block min-w-0">
                  <span
                    className={cn(
                      "block text-xs font-bold leading-tight font-[family-name:var(--font-display)]",
                      isDone
                        ? "text-brand"
                        : isActive
                          ? "text-text-primary"
                          : "text-text-tertiary"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block text-[10px] leading-tight text-text-tertiary">
                    {step.hint}
                  </span>
                </span>
              </div>
              {index < REG_STEPS.length - 1 && (
                <span className="relative block w-5 sm:w-10 h-px bg-border-primary overflow-hidden rounded-full">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-brand"
                    initial={false}
                    animate={{ width: index < currentIndex ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The official record confirmation card. */
export function SchoolRecordCard({
  record,
  compact,
}: {
  record: SchoolRecordOut;
  compact?: boolean;
}) {
  const rows: [string, string][] = [
    ["UDISE Code", record.udise_code],
    ["State", record.state],
    ["District", record.district],
    ["Management", record.management],
  ];
  if (record.board) rows.push(["Board", record.board]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-brand)] bg-brand/5 p-5">
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <Pill tone="emerald">
            <Check className="w-3 h-3" /> School found
          </Pill>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-text-primary font-[family-name:var(--font-display)] break-words">
            {record.school_name}
          </h3>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Official school record
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 py-2 border-b border-border-primary/50 last:border-b-0 sm:last:border-b sm:[&:nth-last-child(-n+1)]:border-b-0"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary shrink-0">
              {label}
            </dt>
            <dd className="text-xs font-medium text-text-primary text-right break-words min-w-0">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Verification checklist ────────────────────────────────────────────────────

export type CheckState = "done" | "pending" | "failed" | "idle" | "busy";

const checkStyles: Record<
  CheckState,
  { Icon: React.ComponentType<{ className?: string }>; cls: string; label: string }
> = {
  done: { Icon: Check, cls: "text-emerald-500", label: "Verified" },
  pending: { Icon: Clock, cls: "text-amber-500", label: "Pending review" },
  failed: { Icon: X, cls: "text-rose-500", label: "Failed" },
  busy: { Icon: Loader2, cls: "text-brand animate-spin", label: "Checking" },
  idle: { Icon: AlertCircle, cls: "text-text-tertiary", label: "Not started" },
};

/**
 * The three questions the flow keeps separate: school identity, person
 * identity, and administrative authority.
 */
export function VerificationChecklist({
  items,
}: {
  items: { label: string; state: CheckState; note?: string }[];
}) {
  return (
    <ul className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 divide-y divide-border-primary/50">
      {items.map((item) => {
        const { Icon, cls, label } = checkStyles[item.state];
        return (
          <li key={item.label} className="flex items-start gap-3 px-4 py-3">
            <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", cls)} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary">{item.label}</p>
              {item.note && (
                <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                  {item.note}
                </p>
              )}
            </div>
            <span className={cn("text-[11px] font-semibold shrink-0", cls)}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Reassurance that a designation claim is not treated as authority. */
export function AuthorityNotice() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 p-3.5 flex items-start gap-2.5">
      <ShieldCheck className="w-4 h-4 text-text-tertiary shrink-0 mt-px" />
      <p className="text-[11px] text-text-secondary leading-relaxed">
        Your designation is recorded as a claim, not as proof of authority. We
        verify your identity and then check your authority against the school&apos;s
        official record before granting any administrator access.
      </p>
    </div>
  );
}
