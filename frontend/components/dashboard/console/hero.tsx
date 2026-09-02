"use client";

/**
 * Admin / School Dashboard Hero — premium institutional banner.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │  [accent bar]                                        │
 *   │  [eyebrow pill]                         [illustration]│
 *   │  [H1 title]                                          │
 *   │  [subtitle]                                          │
 *   │  [CTA buttons]                                       │
 *   ├──────────────────────────────────────────────────────┤
 *   │  [stat] │ [stat] │ [stat] │ [stat]  ← always 1 row  │
 *   └──────────────────────────────────────────────────────┘
 *
 * Facts are rendered in their own full-width 4-column grid strip so they
 * always stay on a single row on desktop, regardless of copy length.
 */

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "./motion";

export function Hero({
  eyebrow,
  title,
  subtitle,
  facts,
  actions,
  illustration,
  className,
  variant = "default",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** 4 stat tiles — always rendered in a single horizontal row. */
  facts?: ReactNode;
  actions?: ReactNode;
  illustration?: ReactNode;
  className?: string;
  variant?: "default" | "vibrant";
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        // Light: soft pale-blue gradient, clean card
        "relative overflow-hidden rounded-[28px] border border-blue-100/80 bg-gradient-to-br from-[#EEF5FF] via-[#F2F7FF] to-[#E0EDFB]",
        "shadow-[0_8px_32px_rgba(37,99,235,0.07)]",
        // Dark: genuine dark surface — deep navy, no grey-white artifacts
        "dark:border-slate-800 dark:bg-[#0B1628] dark:bg-none dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* ── Decorative Dots + Geometric Accents ───────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top-right dot matrix grid (6 × 4 = 24 dots) — preserved as requested */}
        <div className="absolute top-5 right-7 grid grid-cols-6 gap-[7px] opacity-[0.28] dark:opacity-[0.18]">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-[5px] w-[5px] rounded-full bg-blue-500 dark:bg-blue-400" />
          ))}
        </div>

        {/* Floating amber outline ring */}
        <div className="absolute top-8 left-[43%] h-[22px] w-[22px] rounded-full border-2 border-amber-400 opacity-80 dark:border-amber-500 dark:opacity-60" />

        {/* Floating concentric blue target */}
        <div className="absolute top-[52px] right-[41%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-400/80 dark:border-blue-500/70 opacity-75">
          <div className="h-[7px] w-[7px] rounded-full bg-blue-500 dark:bg-blue-400" />
        </div>

        {/* Floating emerald dot */}
        <div className="absolute top-20 right-[31%] h-[10px] w-[10px] rounded-full bg-emerald-400 opacity-80 dark:opacity-60" />

        {/* Ambient glow — light */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-400/[0.09] blur-3xl dark:bg-blue-600/[0.12]" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-400/[0.07] blur-3xl dark:bg-indigo-700/[0.14]" />
      </div>

      {/* ── Two-column content row: copy (left) + illustration (right) ─────── */}
      <div className="relative z-10 grid grid-cols-1 gap-4 px-6 pt-7 pb-5 sm:px-8 sm:pt-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-6 lg:px-10 lg:pt-9 lg:pb-6">
        {/* Left column: eyebrow / title / subtitle / actions */}
        <div className="min-w-0">
          {/* Blue accent bar */}
          <div className="mb-4 h-[5px] w-10 rounded-full bg-blue-600 dark:bg-blue-500" aria-hidden="true" />

          {eyebrow && (
            <div className="mb-3">
              {eyebrow}
            </div>
          )}

          <h1 className="text-balance text-[1.6rem] font-extrabold leading-[1.2] tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] xl:text-[2.2rem] font-[family-name:var(--font-display)]">
            {title}
          </h1>

          {subtitle && (
            <div className="mt-2.5 max-w-lg text-[0.9rem] leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[0.95rem]">
              {subtitle}
            </div>
          )}

          {actions && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>

        {/* Right column: illustration — bottom-aligned, desktop only */}
        {illustration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
            className="hidden lg:flex items-end justify-end self-end"
          >
            {illustration}
          </motion.div>
        )}
      </div>

      {/* ── Facts strip — full-width, always 4 cols on desktop ────────────── */}
      {facts && (
        <div className="relative z-10 px-6 pb-6 sm:px-8 sm:pb-7 lg:px-10 lg:pb-8">
          {/* Thin separator */}
          <div className="mb-4 h-px w-full bg-blue-200/50 dark:bg-slate-700/70" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts}
          </div>
        </div>
      )}
    </motion.section>
  );
}

/**
 * Stat tile for the hero facts strip.
 * Compact: single-row label + large number + subtle hint.
 * Designed to sit flush in the 4-column grid without wrapping.
 */
export function HeroFact({
  label,
  value,
  hint,
  accent,
  variant = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
  variant?: "default" | "vibrant";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "group flex min-w-0 flex-col rounded-2xl px-4 py-3 transition-all duration-200",
        // Light: white glass card
        "border border-white/80 bg-white/85 shadow-[0_2px_10px_rgba(0,0,0,0.04)] backdrop-blur-md",
        "hover:shadow-[0_4px_16px_rgba(37,99,235,0.10)] hover:border-blue-200/80",
        // Dark: deep slate glass card — no light bleed
        "dark:border-slate-700/60 dark:bg-slate-800/70 dark:shadow-none dark:hover:border-blue-600/50 dark:hover:bg-slate-800/90"
      )}
    >
      <div className="flex items-center gap-1.5">
        {accent && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        )}
        <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {label}
        </span>
      </div>
      <div className="console-num mt-1 text-[1.35rem] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
        {value}
      </div>
      {hint && (
        <div className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      )}
    </motion.div>
  );
}
