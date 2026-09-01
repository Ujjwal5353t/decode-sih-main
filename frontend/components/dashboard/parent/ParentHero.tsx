"use client";

/**
 * ParentHero — Prestigious hero banner for the Parent / Guardian Dashboard.
 * Matches reference design with:
 * 1. Warm, soft daylight home study background with clean white overlays
 * 2. Guardian account badge, personalized welcome greeting, and clear learning subtitle
 * 3. 3 white glass stat fact tiles (Monitored Wards, Progress Tracking, Guardian Feedback)
 * 4. Family illustration on the right side
 */

import { ReactNode } from "react";
import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 0.68, 0, 1] as const;

export function ParentHero({
  eyebrow,
  title,
  subtitle,
  facts,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  facts?: ReactNode;
  className?: string;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={cn(
          "relative overflow-hidden rounded-[32px] border border-sky-100/90 bg-white/40 shadow-[0_10px_32px_rgba(56,189,248,0.08)] dark:border-sky-900/40 dark:bg-slate-900/40 dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)]",
          className
        )}
      >
        {/* ── 1. Background: Warm Home Study with Soft Daylight Overlays ───────── */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/parent_home_bg.jpg"
            alt="Family Study Background"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Soft daylight overlays for crisp text contrast */}
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/20 dark:from-slate-950/80 dark:via-transparent dark:to-slate-950/20" />
        </div>

        {/* ── 2. Content: Left Copy + Right Family Illustration ───────────────── */}
        <div className="relative z-10 grid grid-cols-1 items-end gap-6 px-6 py-7 sm:px-9 sm:py-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:px-10 lg:py-9">
          <div className="min-w-0">
            {eyebrow && <div className="mb-3.5">{eyebrow}</div>}

            <h1 className="text-balance text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[32px] dark:text-white font-[family-name:var(--font-display)]">
              {title}
            </h1>

            {subtitle && (
              <div className="mt-2.5 max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {subtitle}
              </div>
            )}

            {facts && (
              <div className="mt-6 flex flex-wrap items-stretch gap-3.5">
                {facts}
              </div>
            )}
          </div>

          <div className="hidden justify-self-end self-end lg:flex">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
              className="flex items-end"
            >
              <Image
                src="/images/parent_family_hero.png"
                alt="Family Learning Together"
                width={420}
                height={340}
                priority
                className="h-[230px] xl:h-[260px] w-auto select-none object-contain object-bottom drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>
    </MotionConfig>
  );
}

/**
 * Fact tile for the hero strip — matching the clean rounded glass cards in reference
 */
export function ParentHeroFact({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="min-w-[130px] rounded-2xl border border-white/90 bg-white/90 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-colors hover:bg-white dark:border-slate-800/80 dark:bg-slate-800/70 dark:hover:bg-slate-800">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      )}
    </div>
  );
}
