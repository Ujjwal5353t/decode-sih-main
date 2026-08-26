"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Shared vocabulary ─────────────────────────────────────────────────────────

/** Classes the School Dashboard supports — matches GET /school/classes. */
export const CLASS_OPTIONS = [1, 2, 3, 4, 5] as const;

/** Subjects seeded in the NCERT catalogue — suggestions, not a fixed list. */
export const SUBJECT_SUGGESTIONS = [
  "Mathematics",
  "English",
  "Hindi",
  "EVS",
  "Science",
  "Social Studies",
  "General Knowledge",
];

export const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
  "Assamese",
  "Urdu",
];

/** Backend limit — `_MAX_FILE_SIZE_MB` in src/utils/file_utils.py. */
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Image types the images endpoint accepts — `_ALLOWED_IMAGE_TYPES`. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass rounded-[var(--radius-lg)] border border-border-primary p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeading({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 font-[family-name:var(--font-display)]">
          <Icon className="w-5 h-5 text-brand" />
          <span>{title}</span>
        </h2>
        {description && (
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "neutral" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand/10 text-brand border-[var(--border-brand)]",
    neutral: "bg-surface text-text-secondary border-border-primary",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    violet: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Feedback ──────────────────────────────────────────────────────────────────

type BannerTone = "error" | "success" | "info" | "warning";

const bannerStyles: Record<
  BannerTone,
  { wrap: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  error: { wrap: "bg-rose-500/10 text-rose-500", Icon: AlertCircle },
  success: { wrap: "bg-emerald-500/10 text-emerald-500", Icon: Check },
  info: { wrap: "bg-brand/10 text-brand", Icon: Info },
  warning: { wrap: "bg-amber-500/10 text-amber-500", Icon: TriangleAlert },
};

export function Banner({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: BannerTone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { wrap, Icon } = bannerStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "p-3 rounded-[var(--radius-md)] text-xs flex items-start gap-2.5",
        wrap
      )}
      role={tone === "error" ? "alert" : undefined}
    >
      <Icon className="w-4 h-4 shrink-0 mt-px" />
      <div className="flex-1 min-w-0 space-y-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

// ── Form fields ───────────────────────────────────────────────────────────────

const controlClasses =
  "w-full px-3 py-2 bg-surface text-text-primary text-xs rounded-[var(--radius-md)] border outline-none transition-colors placeholder:text-text-tertiary disabled:opacity-60";

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-text-secondary mb-1"
      >
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-text-tertiary">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        controlClasses,
        invalid
          ? "border-rose-500/60 focus:border-rose-500"
          : "border-border-primary focus:border-brand",
        className
      )}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        controlClasses,
        "resize-y leading-relaxed",
        invalid
          ? "border-rose-500/60 focus:border-rose-500"
          : "border-border-primary focus:border-brand",
        className
      )}
    />
  );
}

export function SelectInput({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(
        controlClasses,
        "cursor-pointer",
        invalid
          ? "border-rose-500/60 focus:border-rose-500"
          : "border-border-primary focus:border-brand",
        className
      )}
    >
      {children}
    </select>
  );
}

/** Compact class picker matching the segmented control used on the dashboard. */
export function ClassSelector({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-[var(--radius-md)] w-fit">
      {CLASS_OPTIONS.map((cls) => (
        <button
          key={cls}
          type="button"
          disabled={disabled}
          onClick={() => onChange(cls)}
          className={cn(
            "px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            value === cls
              ? "bg-surface text-brand shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          Class {cls}
        </button>
      ))}
    </div>
  );
}

/** Labelled read-only value used in the review summary. */
export function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border-primary/50 last:border-b-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-xs text-right break-words min-w-0",
          muted ? "text-text-tertiary italic" : "text-text-primary font-medium"
        )}
      >
        {value}
      </span>
    </div>
  );
}
