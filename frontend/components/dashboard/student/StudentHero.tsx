"use client";

/**
 * Student Hero Component — Playful Cartoon Panda Learning Banner
 * Uses the user-provided cute panda illustration with green backpack.
 * No animations — static, clean, and fast.
 */

import { ReactNode } from "react";
import Image from "next/image";
import { MascotMood } from "@/components/quiz/Mascot";
import { cn } from "@/lib/utils";

export function StudentHero({
  eyebrow,
  title,
  subtitle,
  actions,
  facts,
  mascotMood,
  topBadge,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  facts?: ReactNode;
  mascotMood?: MascotMood;
  topBadge?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-[32px] border border-sky-200/70 shadow-[0_12px_36px_rgba(56,189,248,0.14)] dark:border-sky-900/40 dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* ── Background Landscape ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/panda_learning_bg.jpg"
          alt="Learning Adventure Landscape"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Soft daylight gradient overlay for readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-950/95 dark:via-slate-950/80 dark:to-transparent lg:w-[68%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent dark:from-slate-950/60 dark:via-transparent dark:to-transparent" />
      </div>

      {/* ── Floating Top-Right Badge ────────────────────────────────────────── */}
      {topBadge && (
        <div className="absolute top-5 right-6 z-20 hidden sm:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-1.5 text-xs font-bold text-slate-800 shadow-md backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/85 dark:text-slate-200">
            {topBadge}
          </div>
        </div>
      )}

      {/* ── Foreground Content Grid ─────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-1 items-end gap-6 p-6 pb-0 sm:p-8 sm:pb-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-4 lg:p-10 lg:pb-0">
        <div className="min-w-0 max-w-2xl self-center pb-6 sm:pb-8 lg:pb-10">
          {eyebrow && <div className="mb-3">{eyebrow}</div>}

          <h1 className="text-balance text-2xl font-black leading-[1.18] tracking-tight text-slate-900 sm:text-[36px] dark:text-white font-[family-name:var(--font-display)]">
            {title}
          </h1>

          {subtitle && (
            <div className="mt-2.5 text-sm font-medium leading-relaxed text-slate-700 sm:text-base dark:text-slate-200">
              {subtitle}
            </div>
          )}

          {actions && (
            <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>
          )}

          {facts && (
            <div className="mt-7 flex flex-wrap items-stretch gap-2.5 sm:gap-3">{facts}</div>
          )}
        </div>

        {/* ── Cute Panda Mascot (static, bigger, touching the bottom) ────────── */}
        <div className="relative flex items-end justify-center self-end lg:justify-end">
          <Image
            src="/images/panda_mascot.png"
            alt="Cute Panda with Backpack"
            width={324}
            height={388}
            priority
            className="relative z-10 h-[280px] w-auto select-none object-contain drop-shadow-[0_12px_24px_rgba(15,23,42,0.18)] sm:h-[320px] lg:h-[340px]"
          />
        </div>
      </div>
    </section>
  );
}

/** A soft translucent stat tile for the hero strip. */
export function StudentHeroFact({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="min-w-[130px] rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[0_3px_12px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/85 dark:hover:bg-slate-900">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="console-num mt-1 text-[20px] font-black leading-none tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">{hint}</div>}
    </div>
  );
}
