"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Flame } from "lucide-react";

interface StreakPointsBarProps {
  points: number;
  streak: number;
}

// Client-side motivational counters shown during the quiz. Deliberately
// separate from the backend's distance-weighted mastery score (subject_scores)
// — this is a "how does it feel to play" number, not the diagnostic result.
export function StreakPointsBar({ points, streak }: StreakPointsBarProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        key={`points-${points}`}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold"
      >
        <Star className="w-3.5 h-3.5 fill-current" />
        <span>{points}</span>
      </motion.div>

      <AnimatePresence>
        {streak >= 2 && (
          <motion.div
            key={`streak-${streak}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-bold"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streak}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
