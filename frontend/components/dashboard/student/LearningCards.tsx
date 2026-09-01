"use client";

/**
 * Student-facing content cards matching the playful Duolingo / Lingora aesthetic.
 * Includes:
 *   - <ContinueLearningHeroCard>: Horizontal card with monument thumbnail, unit, progress bar & Start button
 *   - <BuildYourSkillsRow>: 4 vibrant rounded cards with PURPLE, RED, GREEN, YELLOW colors
 *   - <PopularSubjectsRow>: Pill chips row with star ratings
 *   - <LearningCard>: The modular lesson card
 *   - <SkillCard>: Subject mastery card with ring
 *   - <StudentSection>: Clean section container with header and action
 */

import { ReactNode } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Play,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 0.68, 0, 1] as const;

export function subjectColor(subject: string | null | undefined): string {
  if (!subject) return "#3B82F6";
  const key = subject.trim().toLowerCase();
  if (key.includes("math")) return "#8B5CF6"; // Purple
  if (key.includes("sci")) return "#10B981"; // Green
  if (key.includes("eng")) return "#F59E0B"; // Yellow
  if (key.includes("hin")) return "#F43F5E"; // Red
  if (key.includes("evs")) return "#10B981"; // Green
  return "#3B82F6";
}

// ── 1. Continue Learning Hero Card (Monument Thumbnail + Progress + Start) ───

/**
 * Automatically associates child-friendly, colorful chapter illustrations
 * based on the chapter title and subject.
 */
export function getChapterIllustration(title?: string, subtitle?: string): string {
  const text = `${title || ""} ${subtitle || ""}`.toLowerCase();

  // Chapter 1: Going to School & EVS themes
  if (
    text.includes("going to school") ||
    text.includes("school") ||
    text.includes("bridge") ||
    text.includes("travel")
  ) {
    return "/images/chapters/going_to_school.jpg";
  }

  // Mathematics & Numbers
  if (
    text.includes("math") ||
    text.includes("number") ||
    text.includes("fraction") ||
    text.includes("shape") ||
    text.includes("addition") ||
    text.includes("pattern")
  ) {
    return "/images/chapters/mathematics.jpg";
  }

  // Science & Body / Nature / Experiments
  if (
    text.includes("science") ||
    text.includes("experiment") ||
    text.includes("body") ||
    text.includes("water") ||
    text.includes("plant") ||
    text.includes("animal") ||
    text.includes("living") ||
    text.includes("ear") ||
    text.includes("nandu")
  ) {
    return "/images/chapters/science.jpg";
  }

  // English & Stories / Poems / Reading
  if (
    text.includes("english") ||
    text.includes("story") ||
    text.includes("poem") ||
    text.includes("read") ||
    text.includes("words") ||
    text.includes("grammar") ||
    text.includes("marigold")
  ) {
    return "/images/chapters/english.jpg";
  }

  // EVS / Environmental Studies fallback
  if (text.includes("evs") || text.includes("environment") || text.includes("community")) {
    return "/images/chapters/going_to_school.jpg";
  }

  // Default colorful friendly educational banner
  return "/images/chapters/going_to_school.jpg";
}

/**
 * Continue-learning row. Every field is required and supplied by the caller
 * from the /student/progress payload — there are deliberately no defaults, so
 * this card can never render an invented title or percentage.
 */
export function ContinueLearningHeroCard({
  title,
  subtitle,
  progressPercent,
  href,
  actionText = "Start",
  thumbnail,
}: {
  title: string;
  subtitle: string;
  progressPercent: number;
  href: string;
  actionText?: string;
  /** Optional decorative image. Omitted defaults to a child-friendly chapter illustration. */
  thumbnail?: string;
}) {
  const resolvedThumbnail = thumbnail || getChapterIllustration(title, subtitle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Left: Thumbnail & Details */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border border-sky-100/60 bg-sky-50 shadow-sm sm:h-24 sm:w-36 dark:border-slate-700/60 dark:bg-slate-800">
          <Image
            src={resolvedThumbnail}
            alt={title}
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-extrabold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
            {title}
          </h4>
          <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>

          {/* Progress Bar & Percentage */}
          <div className="mt-3 flex items-center gap-3 max-w-xs">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-sky-500"
              />
            </div>
            <span className="shrink-0 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Right: Pill Start Button */}
      <div className="shrink-0 sm:self-center">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-sky-500/25 transition-all hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/35 active:scale-95"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          <span>{actionText}</span>
        </Link>
      </div>
    </motion.div>
  );
}

// ── 4. Standard Modular LearningCard ─────────────────────────────────────────

export function LearningCard({
  subject,
  title,
  meta,
  badge,
  action,
  icon: Icon,
  index = 0,
}: {
  subject?: string | null;
  title: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  index?: number;
}) {
  const color = subjectColor(subject);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE, delay: Math.min(index * 0.06, 0.4) }}
      whileHover={{ y: -2 }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4.5 pl-5 shadow-xs transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: color }}
        aria-hidden
      />

      {Icon && (
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-xs"
          style={{ background: `${color}18`, color }}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {subject && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
              style={{ background: `${color}18`, color }}
            >
              {subject}
            </span>
          )}
          {badge}
        </div>
        <h4 className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
          {title}
        </h4>
        {meta && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{meta}</div>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

// ── 5. SkillCard with Mastery Ring ───────────────────────────────────────────

export function SkillCard({
  subject,
  percent,
  caption,
  footnote,
  index = 0,
}: {
  subject: string;
  percent?: number;
  caption?: ReactNode;
  footnote?: ReactNode;
  index?: number;
}) {
  const color = subjectColor(subject);
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasValue = typeof percent === "number" && Number.isFinite(percent);
  const clamped = hasValue ? Math.min(100, Math.max(0, percent)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE, delay: Math.min(index * 0.07, 0.4) }}
      whileHover={{ y: -2 }}
      className="flex items-center gap-4 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {hasValue && (
        <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={stroke}
              fill="none"
              className="text-slate-100 dark:text-slate-800"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              fill="none"
            />
          </svg>
          <span className="absolute text-xs font-black text-slate-900 dark:text-white">
            {clamped}%
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
          {subject}
        </h4>
        {caption && (
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{caption}</div>
        )}
        {footnote && (
          <div className="mt-1 text-[11px] font-bold" style={{ color }}>
            {footnote}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── 6. StudentSection Container ──────────────────────────────────────────────

export function StudentSection({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-sky-500" />}
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
            {title}
          </h3>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
