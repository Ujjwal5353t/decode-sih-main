"use client";

/**
 * Surface language for the Admin / Teacher / Parent console.
 *
 * Rules this set encodes, so the three dashboards stay consistent without
 * anyone having to remember them:
 *
 *   · One radius (10px) and one hairline border everywhere. No mixed corners.
 *   · Solid surfaces, one faint shadow. No blur, no gradient fills, no glow.
 *   · Blue is for state — active, selected, linked, focused — not decoration.
 *     Status colour (emerald / amber / rose) only ever means status.
 *   · Related figures live inside one panel divided by rules, rather than in
 *     a row of identical floating cards.
 *   · Numbers are tabular so columns of figures line up.
 *
 * Nothing here fetches, transforms or owns data — these are presentation
 * shells the dashboards pour their existing content into.
 */

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE, QUICK } from "./motion";

export type Tone = "neutral" | "brand" | "emerald" | "amber" | "rose" | "violet" | "sky";

// Accent colours come from the design-system variables rather than fixed
// Tailwind shades, so every tone stays legible when the theme flips — the
// tokens already carry a lighter value for dark mode.
const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-text-secondary",
  brand: "text-brand",
  emerald: "text-[var(--accent-emerald)]",
  amber: "text-[var(--accent-amber)]",
  rose: "text-[var(--accent-rose)]",
  violet: "text-[var(--accent-violet)]",
  sky: "text-[var(--accent-sky)]",
};

const CHIP_TONE: Record<Tone, string> = {
  neutral: "text-text-secondary bg-[var(--c-sunken)] border-[var(--c-line)]",
  brand: "text-brand bg-brand/8 border-brand/25",
  emerald: "text-[var(--accent-emerald)] bg-emerald-500/10 border-emerald-500/25",
  amber: "text-[var(--accent-amber)] bg-amber-500/10 border-amber-500/25",
  rose: "text-[var(--accent-rose)] bg-rose-500/10 border-rose-500/25",
  violet: "text-[var(--accent-violet)] bg-violet-500/10 border-violet-500/25",
  sky: "text-[var(--accent-sky)] bg-sky-500/10 border-sky-500/25",
};

const METER_TONE: Record<Tone, string> = {
  neutral: "bg-text-tertiary",
  brand: "bg-brand",
  emerald: "bg-[var(--accent-emerald)]",
  amber: "bg-[var(--accent-amber)]",
  rose: "bg-[var(--accent-rose)]",
  violet: "bg-[var(--accent-violet)]",
  sky: "bg-[var(--accent-sky)]",
};

// ── Structure ─────────────────────────────────────────────────────────────────

/** The one container. Everything that needs an edge uses this. */
export function Panel({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  /** Drop the inner padding — for panels whose first child is a table or list. */
  flush?: boolean;
}) {
  return (
    <div className={cn("console-panel", flush ? "" : "p-5", className)}>{children}</div>
  );
}

/**
 * A panel's title bar: label on the left, actions on the right, hairline
 * underneath. Kept visually quieter than a page title so the hierarchy of
 * "page > section > panel" stays readable.
 */
export function PanelHead({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--c-line)] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />}
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * The top of a tab. Sits directly on the page background rather than inside a
 * card, so the page reads as a document with sections instead of a wall of
 * boxes.
 */
export function SectionHead({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-text-primary font-[family-name:var(--font-display)]">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-brand" />}
          <span className="truncate">{title}</span>
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Account identity block that opens each dashboard: a monogram built from
 * data already on screen, the name, inline meta, and an optional pair of
 * facts pinned right.
 */
export function IdentityBar({
  monogram,
  title,
  badge,
  meta,
  aside,
  icon: Icon,
}: {
  monogram?: string;
  title: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Panel className="p-0" flush>
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--c-radius)] border border-brand/20 bg-brand/8 text-brand"
          >
            {monogram ? (
              <span className="text-sm font-bold tracking-tight font-[family-name:var(--font-display)]">
                {monogram}
              </span>
            ) : Icon ? (
              <Icon className="h-5 w-5" />
            ) : null}
          </motion.div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-[-0.015em] text-text-primary font-[family-name:var(--font-display)]">
                {title}
              </h1>
              {badge}
            </div>
            {meta && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                {meta}
              </div>
            )}
          </div>
        </div>

        {aside && <div className="flex shrink-0 flex-wrap items-center gap-6">{aside}</div>}
      </div>
    </Panel>
  );
}

/** Hairline separator between inline meta items — presentation, not text. */
export function MetaDot() {
  return (
    <span aria-hidden className="inline-block h-3 w-px shrink-0 bg-[var(--c-line-strong)]" />
  );
}

// ── Figures ───────────────────────────────────────────────────────────────────

export interface StatDef {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: Tone;
  icon?: LucideIcon;
}

/**
 * A row of related figures inside a single panel, divided by rules — not a
 * grid of separate cards. Reads as one instrument panel, and stacks to rows
 * on small screens.
 */
export function StatRow({ stats, className }: { stats: StatDef[]; className?: string }) {
  return (
    <Panel flush className={cn("overflow-hidden", className)}>
      <div className="grid grid-cols-1 divide-y divide-[var(--c-line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: index * 0.05 }}
            className="min-w-0 px-5 py-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="console-eyebrow">{stat.label}</span>
              {stat.icon && <stat.icon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />}
            </div>
            <div className="console-num mt-1.5 truncate text-[19px] font-semibold leading-tight tracking-[-0.02em] text-text-primary font-[family-name:var(--font-display)]">
              {stat.value}
            </div>
            {stat.hint && (
              <div className={cn("mt-1 truncate text-[11px]", TONE_TEXT[stat.hintTone ?? "neutral"])}>
                {stat.hint}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

/** Horizontal progress meter. Grows on mount, then stays still. */
export function Meter({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-sunken)] ring-1 ring-inset ring-[var(--c-line)]",
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.55, ease: EASE }}
        className={cn("h-full rounded-full", METER_TONE[tone])}
      />
    </div>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────────

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]",
        CHIP_TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Monospace identifier — student numbers, prefixes, phone numbers. */
export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded border border-[var(--c-line)] bg-[var(--c-sunken)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-brand",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Label/value pair, aligned as a definition row. */
export function Field({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1.5", className)}>
      <span className="shrink-0 text-[11px] text-text-tertiary">{label}</span>
      <span className="min-w-0 truncate text-right text-xs font-medium text-text-primary">
        {children}
      </span>
    </div>
  );
}

/** Compact fact pinned to the right of an IdentityBar. */
export function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="console-eyebrow">{label}</div>
      <div className="console-num mt-1 truncate text-sm font-semibold text-text-primary font-[family-name:var(--font-display)]">
        {children}
      </div>
    </div>
  );
}

// ── States ────────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent",
        className
      )}
    />
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14">
      <Spinner />
      {label && <p className="text-xs text-text-tertiary">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-full border border-[var(--c-line)] bg-[var(--c-sunken)]">
          <Icon className="h-4 w-4 text-text-tertiary" />
        </div>
      )}
      <h3 className="text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
        {title}
      </h3>
      {children && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-text-secondary">{children}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Inline message — success, error or note. */
export function Notice({
  tone = "brand",
  icon: Icon,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={QUICK}
      className={cn(
        "flex items-center gap-2 rounded-[var(--c-radius)] border px-3.5 py-2.5 text-xs font-medium",
        CHIP_TONE[tone]
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="min-w-0">{children}</span>
    </motion.div>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────

/**
 * Segmented control with a single shared pill that slides between options
 * (framer-motion layoutId). One moving element, not five cross-fading ones.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  idPrefix,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Unique per instance so two controls on one page don't share a pill. */
  idPrefix: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-sunken)] p-1",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative cursor-pointer rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors",
              isActive ? "text-white" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`${idPrefix}-segmented`}
                transition={{ type: "spring", stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-[6px] bg-brand"
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Text/number/select field styling, shared by every console form. */
export const inputClass =
  "w-full rounded-[var(--c-radius)] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2 text-xs text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand focus:ring-2 focus:ring-brand/15";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold text-text-secondary">{children}</label>
  );
}

// ── Tables ────────────────────────────────────────────────────────────────────

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full min-w-[560px] text-left text-xs", className)}>{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-[var(--c-line)] bg-[var(--c-sunken)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.06em] text-text-tertiary",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

// ── Overlay ───────────────────────────────────────────────────────────────────

/**
 * Modal shell. Close affordances stay exactly where each caller already had
 * them (the header button and the form's own Cancel) — the backdrop is
 * presentation only, so no new way to dismiss is introduced.
 */
export function Modal({
  title,
  icon: Icon,
  iconTone = "brand",
  onClose,
  children,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  iconTone?: Tone;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={QUICK}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.24, ease: EASE }}
        className="console-panel relative w-full max-w-md overflow-hidden shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--c-line)] px-5 py-3.5">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-text-primary font-[family-name:var(--font-display)]">
            {Icon && <Icon className={cn("h-4 w-4", TONE_TEXT[iconTone])} />}
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-text-tertiary transition-colors hover:bg-[var(--c-sunken)] hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </motion.div>
    </div>
  );
}
