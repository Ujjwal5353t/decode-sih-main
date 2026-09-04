"use client";

/**
 * LeaderboardPanel - shared across student, teacher, and parent dashboards.
 *
 * Student / parent view  : top_entries <= 10; my_entry always shown.
 *                          If the caller is outside the top 10, their row is
 *                          shown below a divider so they always know
 *                          their rank without seeing everyone else's position.
 * Teacher view           : showAll=true -> all students listed, no cap, scrollable.
 *                          my_entry is null in this mode.
 */

import React, { useState } from "react";
import type { ClassLeaderboard, LeaderboardEntry } from "@/lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function rankIcon(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function GrowthChip({ rate }: { rate: number }) {
  if (rate === 0) return null;
  const isPositive = rate > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isPositive
          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      }`}
    >
      {isPositive ? "▲" : "▼"} {Math.abs(rate).toFixed(1)}%
    </span>
  );
}

function MasteryBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    clamped >= 75
      ? "bg-green-500"
      : clamped >= 50
      ? "bg-yellow-400"
      : "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">
        {clamped}%
      </span>
    </div>
  );
}

// ── row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  entry: LeaderboardEntry;
  highlight?: boolean;
  showGrowth?: boolean;
}

function LeaderboardRow({ entry, highlight = false, showGrowth = true }: RowProps) {
  const hasTests = entry.avg_test_score > 0 || entry.holistic_mastery_percent > 0;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        highlight
          ? "bg-indigo-50 border border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-600"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      {/* Rank */}
      <div className="w-10 text-center text-sm font-bold text-gray-500 dark:text-gray-400 shrink-0">
        {rankIcon(entry.rank)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
          {entry.full_name}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{entry.unique_number}</p>
      </div>

      {/* Mastery bar or "No tests yet" */}
      {hasTests ? (
        <div className="flex flex-col items-end gap-1">
          <MasteryBar value={entry.holistic_mastery_percent} />
          {showGrowth && <GrowthChip rate={entry.consecutive_growth_rate} />}
        </div>
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No tests yet</span>
      )}
    </div>
  );
}

// ── panel ─────────────────────────────────────────────────────────────────────

export interface LeaderboardPanelProps {
  data: ClassLeaderboard;
  /** Teacher mode — all students shown, scrollable, no personal rank highlight. */
  showAll?: boolean;
  title?: string;
  /** student_id of the viewer — highlights their row in teacher mode. */
  viewerStudentId?: string;
}

export function LeaderboardPanel({
  data,
  showAll = false,
  title,
  viewerStudentId,
}: LeaderboardPanelProps) {
  const { top_entries, my_entry, total_students, class_number, section } = data;
  const [showGrowth, setShowGrowth] = useState(true);

  const myEntryInTop = my_entry
    ? top_entries.some((e) => e.student_id === my_entry.student_id)
    : false;

  const showMyRankSeparately = my_entry && !myEntryInTop && !showAll;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {title ?? "🏆 Class Leaderboard"}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Class {class_number} · Section {section.toUpperCase()} · {total_students} students
          </p>
        </div>
        {showAll && (
          <button
            onClick={() => setShowGrowth((v) => !v)}
            className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 font-medium"
          >
            {showGrowth ? "Hide growth" : "Show growth"}
          </button>
        )}
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 dark:bg-gray-800/60 text-xs font-medium text-gray-400 dark:text-gray-500">
        <div className="w-10 text-center">Rank</div>
        <div className="flex-1">Student</div>
        <div className="text-right">{showGrowth ? "Mastery & Growth" : "Mastery"}</div>
      </div>

      {/* Entries */}
      <div
        className={`divide-y divide-gray-50 dark:divide-gray-800 ${
          showAll ? "max-h-[520px] overflow-y-auto" : ""
        }`}
      >
        {top_entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No students found in this class yet.
          </div>
        ) : (
          top_entries.map((entry) => (
            <LeaderboardRow
              key={entry.student_id}
              entry={entry}
              highlight={
                (my_entry != null && entry.student_id === my_entry.student_id) ||
                (viewerStudentId !== undefined && entry.student_id === viewerStudentId)
              }
              showGrowth={showGrowth}
            />
          ))
        )}
      </div>

      {/* Caller outside top 10 — show separator + personal row */}
      {showMyRankSeparately && my_entry && (
        <>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 font-medium">
              Your Rank
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="px-1 pb-2">
            <LeaderboardRow entry={my_entry} highlight showGrowth={showGrowth} />
          </div>
        </>
      )}

      {/* Footer */}
      {!showAll && total_students > 10 && !showMyRankSeparately && (
        <div className="px-4 py-2 border-t border-gray-50 dark:border-gray-800 text-xs text-center text-gray-400 dark:text-gray-500">
          Showing top 10 of {total_students} students
        </div>
      )}
    </div>
  );
}