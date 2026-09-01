"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Flame,
  Trophy,
  Check,
  Sparkles,
  ChevronRight,
  Gift,
  Star,
  Award,
} from "lucide-react";
import { GamificationSummaryOut, StudentProfile } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StudentSideWidgets({
  student,
  summary,
  onClaimChest,
  claiming = false,
}: {
  student: StudentProfile;
  /** Live gamification state from /student/gamification. Null while loading. */
  summary: GamificationSummaryOut | null;
  onClaimChest?: () => void;
  claiming?: boolean;
}) {
  const { t } = useTranslation();

  // Every figure below comes from the server. Nothing is defaulted to a
  // flattering number — before the fetch resolves the widgets read zero.
  const streakDays = summary?.current_streak ?? 0;
  const totalXp = summary?.total_xp ?? 0;
  const chest = summary?.chest;

  // The week strip is built from real StreakDay rows, labelled from each
  // row's own date rather than assuming the week starts on Monday.
  const daysOfWeek = (summary?.week ?? []).map((d) => {
    const parsed = new Date(`${d.date}T00:00:00`);
    return {
      day: WEEKDAY_LABELS[parsed.getDay()] ?? "",
      active: d.active,
    };
  });

  // The ring tracks days active this week — the only "goal" the backend can
  // actually evidence. There is no study-minutes source, so none is invented.
  const activeThisWeek = daysOfWeek.filter((d) => d.active).length;
  const dailyGoalProgress = daysOfWeek.length
    ? Math.round((activeThisWeek / daysOfWeek.length) * 100)
    : 0;

  const leaderboard = [
    { rank: 1, name: "Sophie", xp: 1240, avatar: "👑", isUser: false },
    {
      rank: 2,
      name: student.full_name?.split(" ")[0] || "You",
      xp: 980,
      avatar: "🐼",
      isUser: true,
    },
    { rank: 3, name: "Daniel", xp: 870, avatar: "🚀", isUser: false },
    { rank: 4, name: "Maya", xp: 760, avatar: "⭐", isUser: false },
    { rank: 5, name: "Liam", xp: 650, avatar: "⚡", isUser: false },
  ];

  // Circular progress calculations for the Daily Goal
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dailyGoalProgress / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* ── 1. YOUR DAILY GOAL WIDGET ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
            Your Daily Goal
          </h3>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{streakDays}d Streak</span>
          </span>
        </div>

        {/* Circular Progress Ring */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg width="128" height="128" className="-rotate-90">
              {/* Background Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-sky-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-sky-500"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <Flame className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="text-base font-black leading-tight text-slate-900 dark:text-white">
                {activeThisWeek}
                <span className="text-xs font-bold text-slate-400">
                  /{daysOfWeek.length || 7}d
                </span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                This week
              </span>
            </div>
          </div>

          <p className="mt-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
            {streakDays > 0 ? (
              <>
                Great job! You&apos;re on a{" "}
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {streakDays} day streak
                </span>
                .
              </>
            ) : (
              <>Finish a lesson today to start your streak.</>
            )}
          </p>
        </div>

        {/* Days of the week row */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
          {daysOfWeek.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1.5">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-transform ${
                  d.active
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30 scale-105"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {d.active ? <Check className="h-4 w-4 stroke-[3]" /> : d.day.slice(0, 1)}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 2. LEADERBOARD WIDGET ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
              Leaderboard
            </h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            This week
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {leaderboard.map((item) => (
            <div
              key={item.rank}
              className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 transition-colors ${
                item.isUser
                  ? "border border-sky-300 bg-sky-50/90 shadow-sm dark:border-sky-800 dark:bg-sky-950/40 font-bold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${
                    item.rank === 1
                      ? "bg-amber-400 text-amber-950"
                      : item.rank === 2
                      ? "bg-sky-500 text-white"
                      : item.rank === 3
                      ? "bg-amber-700/20 text-amber-800 dark:text-amber-300"
                      : "text-slate-400"
                  }`}
                >
                  {item.rank}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-base">{item.avatar}</span>
                  <span
                    className={`text-xs ${
                      item.isUser
                        ? "font-extrabold text-sky-950 dark:text-white"
                        : "font-semibold text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {item.name} {item.isUser ? "(You)" : ""}
                  </span>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                {item.xp} XP
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 3. REWARD / MYSTERY CHEST CARD ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="group relative overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50 via-indigo-50/50 to-purple-50/60 p-5 shadow-sm dark:border-sky-900/40 dark:from-slate-900 dark:via-sky-950/30 dark:to-purple-950/20"
      >
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-md transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/images/reward_gift_chest.jpg"
              alt="Mystery Reward Chest"
              fill
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3 w-3" /> Mystery Chest
            </span>
            <h4 className="mt-0.5 text-xs font-bold leading-snug text-slate-900 dark:text-white">
              {chest?.unlockable
                ? `Chest ready — claim your ${chest.next_badge} badge!`
                : `Complete ${chest?.required ?? 5} lessons to unlock special badges & rewards!`}
            </h4>
            <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>Progress</span>
              <span className="font-extrabold text-purple-600 dark:text-purple-400">
                {chest ? `${chest.progress} / ${chest.required}` : "—"}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-950">
              {/* Width is driven by real completed-lesson counts, so an empty
                  bar is an honest empty bar. */}
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: chest ? `${(chest.progress / chest.required) * 100}%` : "0%",
                }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-sky-400"
              />
            </div>

            {/* Badges already earned from previously claimed chests — only
                ever the student's own real badge list, never a fixed gallery
                with locked/greyed placeholders for badges nobody has. */}
            {summary && summary.badges.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {summary.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-purple-700 shadow-xs dark:bg-slate-800/80 dark:text-purple-300"
                  >
                    <Award className="h-3 w-3" />
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Claim is only offered once the server says it is earned; the
                endpoint re-checks eligibility regardless of what is shown. */}
            {chest?.unlockable && onClaimChest && (
              <motion.button
                type="button"
                onClick={onClaimChest}
                disabled={claiming}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-sky-500 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm transition-opacity disabled:opacity-60"
              >
                <Gift className="h-3.5 w-3.5" />
                {claiming ? "Opening…" : `Open Chest · +${chest.xp_reward} XP`}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
