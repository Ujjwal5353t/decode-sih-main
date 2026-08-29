"use client";

/**
 * Charts for the console dashboards.
 *
 * Every component here takes an explicit array of already-computed values —
 * none of them fetch, aggregate or infer anything. That is deliberate: a
 * chart component that knows how to derive its own numbers is a chart that
 * can quietly invent them. The caller must hand over real data it already
 * has on screen.
 *
 * House style: thin strokes, one accent per series, labels in the same type
 * scale as the surrounding UI, no gridlines unless they aid reading, no
 * legends where a direct label will do.
 */

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "./motion";

export interface BarDatum {
  label: string;
  value: number;
  /** CSS colour. Defaults to the brand accent. */
  color?: string;
  /** Optional right-aligned annotation, e.g. "3 students". */
  caption?: ReactNode;
}

/**
 * Horizontal bars — the honest default for comparing a handful of labelled
 * categories, and it degrades gracefully to any width, unlike vertical bars
 * with rotated labels.
 */
export function BarList({
  data,
  max,
  className,
  valueSuffix = "",
}: {
  data: BarDatum[];
  /** Scale ceiling. Defaults to the largest value present. */
  max?: number;
  className?: string;
  valueSuffix?: string;
}) {
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium text-text-primary">{d.label}</span>
            <span className="flex shrink-0 items-baseline gap-2">
              {d.caption && (
                <span className="text-[11px] text-text-tertiary">{d.caption}</span>
              )}
              <span className="console-num text-xs font-semibold text-text-primary">
                {d.value}
                {valueSuffix}
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--c-sunken)] ring-1 ring-inset ring-[var(--c-line)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (d.value / ceiling) * 100)}%` }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
              className="h-full rounded-full"
              style={{ background: d.color ?? "var(--brand-primary)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/**
 * A segmented ring — proportions of one total, drawn as arcs on a single
 * circle. Used where a stacked bar would be too small to read, e.g. a
 * completion split in a panel header.
 */
export function DonutChart({
  segments,
  size = 128,
  thickness = 14,
  centerLabel,
  centerHint,
  className,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: ReactNode;
  centerHint?: ReactNode;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Walk the segments, accumulating rotation so each arc starts where the
  // previous one ended.
  let sweptFraction = 0;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-sunken)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          segments.map((s, i) => {
            const fraction = s.value / total;
            const offsetFraction = sweptFraction;
            sweptFraction += fraction;
            if (s.value === 0) return null;
            return (
              <motion.circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - fraction) }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.12 }}
                style={{
                  transformOrigin: "center",
                  transform: `rotate(${offsetFraction * 360}deg)`,
                }}
              />
            );
          })}
      </svg>

      {(centerLabel !== undefined || centerHint !== undefined) && (
        <div className="absolute flex flex-col items-center leading-none">
          {centerLabel !== undefined && (
            <span className="console-num text-xl font-semibold tracking-[-0.02em] text-text-primary font-[family-name:var(--font-display)]">
              {centerLabel}
            </span>
          )}
          {centerHint !== undefined && (
            <span className="mt-1 text-[10px] text-text-tertiary">{centerHint}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Direct labels for a DonutChart, so the ring itself needs no callouts. */
export function ChartLegend({
  segments,
  className,
}: {
  segments: Segment[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {segments.map((s) => (
        <li key={s.label} className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="truncate text-xs text-text-secondary">{s.label}</span>
          </span>
          <span className="console-num shrink-0 text-xs font-semibold text-text-primary">
            {s.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A compact distribution strip — one cell per item, coloured by band.
 * Reads a cohort at a glance without needing one row per person, and stays
 * legible from about 20 items up to a few hundred.
 */
export function DistributionStrip({
  cells,
  className,
}: {
  cells: { key: string; color: string; title: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {cells.map((cell, i) => (
        <motion.span
          key={cell.key}
          title={cell.title}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: EASE, delay: Math.min(i * 0.02, 0.6) }}
          className="h-5 w-5 rounded-[3px]"
          style={{ background: cell.color }}
        />
      ))}
    </div>
  );
}
