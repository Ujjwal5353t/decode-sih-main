"use client";

/**
 * The dashboard hero — the one deliberately generous, asymmetric band at the
 * top of each console dashboard.
 *
 * It exists to break the "wall of equal cards" that every admin template
 * falls into: a wide editorial left column (greeting, context, inline facts)
 * against a narrower illustration on the right, on a tinted ground rather
 * than a white panel. Everything below it returns to the dense, plain
 * surface language, so the hero reads as the page's entry point instead of
 * one more box.
 *
 * The illustration is hidden below `lg` — on a phone it would push the real
 * content off-screen, and it carries no information.
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
  const isVibrant = variant === "vibrant";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={cn(
        "relative overflow-hidden rounded-[20px] border transition-all duration-300",
        isVibrant
          ? "border-blue-500/20 bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-500/10"
          : "console-hero border-[var(--c-line)] bg-[var(--c-panel)]",
        className
      )}
    >
      {/* Subtle background ambient graphic patterns for vibrant banner */}
      {isVibrant && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Glowing radial orb */}
          <div
            className="absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #38BDF8 0%, #818CF8 60%, transparent 80%)" }}
          />
          <div
            className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, #60A5FA 0%, #2563EB 60%, transparent 80%)" }}
          />
          {/* Subtle micro grid / dots */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
      )}

      <div className="relative grid grid-cols-1 gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-8 lg:p-8">
        <div className="min-w-0">
          {eyebrow && (
            <div className={cn("mb-2.5", isVibrant ? "text-blue-100 font-semibold tracking-wide text-xs" : "console-eyebrow")}>
              {eyebrow}
            </div>
          )}

          <h1
            className={cn(
              "text-balance text-[22px] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[28px] font-[family-name:var(--font-display)]",
              isVibrant ? "text-white drop-shadow-xs" : "text-text-primary"
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <div
              className={cn(
                "mt-2.5 max-w-xl text-[13px] leading-relaxed",
                isVibrant ? "text-blue-100/90 font-medium" : "text-text-secondary"
              )}
            >
              {subtitle}
            </div>
          )}

          {actions && <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div>}

          {facts && (
            <div
              className={cn(
                "mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 pt-5",
                isVibrant
                  ? "border-t border-white/15"
                  : "border-t border-[var(--c-line)]"
              )}
            >
              {facts}
            </div>
          )}
        </div>

        {illustration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
            className="hidden justify-self-end lg:block"
          >
            {illustration}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/**
 * One figure inside the hero's fact strip. Larger and quieter-chromed than a
 * <StatRow> tile, because these sit on the tinted hero ground where a
 * bordered card would fight the background.
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
  /** Small colour swatch keyed to a series elsewhere on the page. */
  accent?: string;
  variant?: "default" | "vibrant";
}) {
  const isVibrant = variant === "vibrant";

  return (
    <div
      className={cn(
        "min-w-0 transition-all",
        isVibrant && "rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm shadow-xs"
      )}
    >
      <div className="flex items-center gap-1.5">
        {accent && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        )}
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            isVibrant ? "text-blue-100/90 font-semibold" : "console-eyebrow"
          )}
        >
          {label}
        </span>
      </div>
      <div
        className={cn(
          "console-num mt-1 text-[22px] font-bold leading-none tracking-[-0.02em] font-[family-name:var(--font-display)]",
          isVibrant ? "text-white" : "text-text-primary"
        )}
      >
        {value}
      </div>
      {hint && (
        <div className={cn("mt-1 text-[11px]", isVibrant ? "text-blue-100/75" : "text-text-tertiary")}>
          {hint}
        </div>
      )}
    </div>
  );
}
