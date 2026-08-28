"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressTrailProps {
  subjectsInScope: string[];
  currentSubject: string;
  // One entry per question answered so far this attempt, oldest first.
  answerHistory: boolean[];
}

// The diagnostic quiz is adaptive — its total question count isn't known
// ahead of time (branching depends on where each student's gaps are), so
// this can't be a fixed-length progress bar. Instead: a subject row showing
// overall position, plus a trail that grows by one star per question
// actually answered, which stays honest about the adaptive flow while still
// giving a visible sense of forward motion.
export function ProgressTrail({ subjectsInScope, currentSubject, answerHistory }: ProgressTrailProps) {
  const currentIndex = subjectsInScope.indexOf(currentSubject);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {subjectsInScope.map((subject, idx) => {
          const done = idx < currentIndex;
          const active = idx === currentIndex;
          return (
            <div key={subject} className="flex items-center gap-2 flex-1">
              <motion.div
                animate={active ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 transition-colors ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                    ? "bg-brand border-brand text-text-inverse"
                    : "bg-surface border-border-primary text-text-tertiary"
                }`}
                title={subject}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </motion.div>
              {idx < subjectsInScope.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full ${done ? "bg-emerald-500" : "bg-border-primary"}`} />
              )}
            </div>
          );
        })}
      </div>

      {answerHistory.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <AnimatePresence initial={false}>
            {answerHistory.map((correct, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className={`shrink-0 w-2.5 h-2.5 rounded-full ${correct ? "bg-emerald-500" : "bg-amber-400"}`}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
