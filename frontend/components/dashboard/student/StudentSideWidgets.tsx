"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Gift,
  Award,
} from "lucide-react";
import {
  GamificationSummaryOut,
  StudentProfile,
  ClassLeaderboard,
  getStudentLeaderboard,
} from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { LeaderboardPanel } from "@/components/dashboard/shared/LeaderboardPanel";

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
  const totalXp = summary?.total_xp ?? 0;
  const chest = summary?.chest;

  // ── Live leaderboard ──────────────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboard | null>(null);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbError, setLbError] = useState<string | null>(null);

  useEffect(() => {
    if (student.enrollment_type !== "school" || !student.class_number || !student.section) {
      setLbLoading(false);
      return;
    }
    getStudentLeaderboard()
      .then(setLeaderboard)
      .catch((err) => {
        const msg: string = err?.message ?? String(err);
        // 403 = self-enrolled, 400 = class not set up yet — show a soft message
        if (msg.includes("403") || msg.includes("400")) {
          setLbError("Leaderboard not available yet.");
        } else {
          setLbError("Could not load leaderboard.");
        }
      })
      .finally(() => setLbLoading(false));
  }, [student.enrollment_type, student.class_number, student.section]);

  return (
    <div className="space-y-6">
      {/* ── 1. LEADERBOARD WIDGET ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {lbLoading ? (
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse h-48" />
        ) : lbError ? (
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-sm text-slate-400 text-center">
            {lbError}
          </div>
        ) : leaderboard ? (
          <LeaderboardPanel data={leaderboard} viewerStudentId={student.id} />
        ) : (
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-sm text-slate-400 text-center">
            Leaderboard is only available for school-enrolled students.
          </div>
        )}
      </motion.div>

      {/* ── 2. REWARD / MYSTERY CHEST CARD ────────────────────────────────── */}
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
