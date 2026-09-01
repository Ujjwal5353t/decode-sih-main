"use client";

/**
 * TeacherHero — Prestigious hero banner for the Teacher Dashboard.
 * Matches reference design with:
 * 1. School campus background with clean, soft daylight overlay
 * 2. Female educator illustration on left standing flush on bottom edge
 * 3. Greeting, inspiration subtitle, school/branch, dynamic class status, CTA button & stats cards shifted to right
 */

import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const EASE = [0.22, 0.68, 0, 1] as const;

function getGreetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function TeacherHero({
  teacherName,
  schoolName,
  branchName,
  classLabel,
  studentCount = 0,
  assignmentCount = 0,
  moduleCount = 0,
  classCount = 0,
  onViewClasses,
  className,
}: {
  teacherName: string;
  schoolName?: string;
  branchName?: string;
  classLabel?: string;
  studentCount?: number;
  assignmentCount?: number;
  moduleCount?: number;
  classCount?: number;
  onViewClasses?: () => void;
  className?: string;
}) {
  const greeting = getGreetingPrefix();

  const studentHint = classLabel
    ? classLabel.toLowerCase().startsWith("class")
      ? classLabel
      : `Class ${classLabel}`
    : "All Classes";

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
        {/* ── 1. Background: School Campus with Soft Daylight Overlays ─────────────────── */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teacher_school_bg.jpg"
            alt="School Campus Background"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Soft daylight overlays for crisp contrast & high text legibility */}
          <div className="absolute inset-0 bg-white/35 dark:bg-slate-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/80 to-white/50 dark:from-slate-950/30 dark:via-slate-950/85 dark:to-slate-950/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/20 to-transparent dark:from-slate-950/70 dark:via-slate-950/20 dark:to-transparent" />
        </div>

        {/* ── 2. Content Layout: Left Female Teacher + Content Shifted to Right ────────── */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end">
          {/* LEFT: Female Teacher illustration standing flush on bottom edge */}
          <div className="hidden shrink-0 items-end justify-center self-end pl-5 lg:flex xl:pl-8">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
              className="flex items-end"
            >
              <Image
                src="/images/teacher_female_hero.png"
                alt="Female Educator"
                width={320}
                height={460}
                priority
                className="h-[310px] xl:h-[340px] w-auto select-none object-contain object-bottom drop-shadow-[0_10px_22px_rgba(15,23,42,0.12)]"
              />
            </motion.div>
          </div>

          {/* RIGHT / MAIN CONTENT: Greeting, Subtitle, School/Branch, Status, CTA & Cards */}
          <div className="flex flex-1 flex-col justify-center px-6 py-7 sm:px-9 sm:py-8 lg:py-8 lg:pl-6 lg:pr-8">
            {/* Greeting */}
            <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[32px] dark:text-white font-[family-name:var(--font-display)]">
              {greeting}, {teacherName}! 👋
            </h1>

            {/* Inspirational subtitle */}
            <p className="mt-2 text-sm font-semibold text-slate-700 sm:text-base dark:text-slate-200">
              Empower minds. Inspire futures.
            </p>

            {/* School / branch context */}
            {(schoolName || branchName) && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {schoolName && <span>{schoolName}</span>}
                {schoolName && branchName && (
                  <span aria-hidden className="inline-block h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
                )}
                {branchName && (
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    {branchName}
                  </span>
                )}
              </p>
            )}

            {/* Dynamic stats line */}
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              You have{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {classCount} class{classCount !== 1 ? "es" : ""}
              </span>{" "}
              assigned and{" "}
              <span className="font-bold text-sky-600 dark:text-sky-400">
                {assignmentCount} pending task{assignmentCount !== 1 ? "s" : ""}
              </span>.
            </p>

            {/* CTA Button */}
            {onViewClasses && (
              <div className="mt-5">
                <motion.button
                  type="button"
                  onClick={onViewClasses}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="group/cta inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0284c7] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition-colors hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-600/30 dark:bg-sky-500 dark:hover:bg-sky-600"
                >
                  View My Classes
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                </motion.button>
              </div>
            )}

            {/* Stat Facts Strip */}
            <div className="mt-6 flex flex-wrap items-stretch gap-3">
              <TeacherHeroFact
                label="STUDENTS"
                value={studentCount}
                hint={studentHint}
              />
              <TeacherHeroFact
                label="ASSIGNMENTS"
                value={assignmentCount}
                hint="PDF & AI Quizzes"
              />
              <TeacherHeroFact
                label="MODULES"
                value={moduleCount}
                hint="For AI Quiz"
              />
              <TeacherHeroFact
                label="CLASSES"
                value={classCount}
                hint="Across branch"
              />
            </div>
          </div>
        </div>
      </motion.section>
    </MotionConfig>
  );
}

function TeacherHeroFact({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="min-w-[120px] rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-800/70">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold leading-none text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
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
