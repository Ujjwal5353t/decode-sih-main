"use client";

/**
 * The dashboard hero — generous, asymmetric banner for the School / Admin dashboard.
 *
 * Recreates the exact design from reference:
 * - Large rounded card with soft pale-blue background
 * - Top blue decorative accent bar
 * - Bold greeting & supportive subtitle
 * - Primary blue CTA button + Secondary white CTA button
 * - Subtle geometric floating shapes (rings, dots, dot matrix grid)
 * - Prominently positioned transparent teacher laptop illustration on the right
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
  /** Inline supporting figures, rendered as a divided strip beneath the copy. */
  facts?: ReactNode;
  actions?: ReactNode;
  illustration?: ReactNode;
  className?: string;
  variant?: "default" | "vibrant";
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-blue-100/90 bg-gradient-to-r from-[#EFF6FF] via-[#EBF3FE] to-[#E3EEFD] shadow-[0_10px_30px_rgba(37,99,235,0.06)] dark:border-blue-900/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-850",
        className
      )}
    >
      {/* ── Subtle Geometric & Decorative Accents ───────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top-right dot matrix grid */}
        <div className="absolute top-6 right-8 grid grid-cols-6 gap-2 opacity-25">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-blue-500" />
          ))}
        </div>

        {/* Floating amber outline circle */}
        <div className="absolute top-9 left-[45%] h-5 w-5 rounded-full border-2 border-amber-400 opacity-90" />

        {/* Floating concentric blue target */}
        <div className="absolute top-12 right-[42%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-400 opacity-80">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>

        {/* Floating emerald dot */}
        <div className="absolute top-20 right-[32%] h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-90" />

        {/* Thin vertical decorative accent lines */}
        <div className="absolute top-4 left-[28%] h-12 w-[1.5px] bg-blue-200/50" />
        <div className="absolute top-8 right-[52%] h-14 w-[1.5px] bg-blue-200/40" />

        {/* Soft corner glows */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-400/8 blur-3xl" />
      </div>

      {/* ── Content Grid: Left Copy & Actions + Right Illustration ──────── */}
      <div className="relative z-10 grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_440px] lg:items-end lg:gap-8 lg:p-10">
        <div className="min-w-0 pb-2">
          {/* Small blue decorative accent pill above greeting */}
          <div className="mb-4 h-1.5 w-12 rounded-full bg-[#2563EB]" aria-hidden="true" />

          {eyebrow && <div className="mb-3">{eyebrow}</div>}

          <h1 className="text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-[1.2] tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
            {title}
          </h1>

          {subtitle && (
            <div className="mt-3 max-w-xl text-sm sm:text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              {subtitle}
            </div>
          )}

          {actions && <div className="mt-6 flex flex-wrap items-center gap-3.5">{actions}</div>}

          {facts && (
            <div className="mt-7 flex flex-wrap items-stretch gap-3">
              {facts}
            </div>
          )}
        </div>

        {illustration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
            className="hidden justify-self-end self-end lg:flex items-end"
          >
            {illustration}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/**
 * Fact tile for the hero strip
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
    <div className="min-w-[125px] rounded-2xl border border-white/90 bg-white/90 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-800/70">
      <div className="flex items-center gap-1.5">
        {accent && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div className="console-num mt-1 text-xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
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
