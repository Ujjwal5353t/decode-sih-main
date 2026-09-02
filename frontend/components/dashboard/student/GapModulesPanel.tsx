"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getLearningModules, LearningModuleOut } from "@/lib/api";

/**
 * Gap-driven remediation modules — the crux of the exact earlier-class
 * chapter a student's diagnostic quiz traced a gap back to, plus a short
 * retention quiz. Distinct from the generic curriculum/module listing
 * elsewhere on this tab: every card here maps 1:1 to one open
 * StudentTopicGap, and completing (passing) its quiz makes the card
 * disappear on the next load, since the gap is then resolved server-side.
 *
 * The actual review — the full-screen crux slideshow and quiz — lives at
 * its own route (/dashboard/learning-modules/[gapId]), matching how
 * /dashboard/learn/[lessonId] is a dedicated full-screen page rather than
 * an inline panel. This component is just the entry-point list.
 */
export function GapModulesPanel() {
  const [modules, setModules] = useState<LearningModuleOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    getLearningModules()
      .then(setModules)
      .catch((err) => setError(err.message || "Failed to load learning modules."));
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Target className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">Close Your Gaps</h2>
          <p className="text-xs text-text-secondary">
            Focused reviews built from exactly what your diagnostic quiz found — the crux of
            each earlier-class chapter, then a quick check.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-rose-500/10 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {modules === null && !error ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : modules && modules.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center border border-emerald-500/25 bg-emerald-500/[0.04]">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-text-primary">No open gaps right now</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Every topic your diagnostic quiz flagged has been reviewed and passed. New gaps
            will appear here if a future check-in finds one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules?.map((m) => (
            <ModuleCard key={m.gap_id} module={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ module: m }: { module: LearningModuleOut }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[var(--radius-md)] border border-border-primary overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">
            {m.subject}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600">
            From Class {m.origin_class}
          </span>
        </div>
        <h3 className="text-sm font-bold text-text-primary">{m.topic_name}</h3>
        {m.chapter_title && (
          <p className="text-[11px] text-text-tertiary mt-0.5">{m.chapter_title}</p>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span>{expanded ? "Hide the crux" : "Show the crux"}</span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-1.5 overflow-hidden"
            >
              {m.crux_points.length === 0 ? (
                <li className="text-xs text-text-tertiary italic">
                  No summary available yet for this topic.
                </li>
              ) : (
                m.crux_points.slice(0, 2).map((point, i) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-brand/30 line-clamp-2">
                    {point}
                  </li>
                ))
              )}
              {m.crux_points.length > 2 && (
                <li className="text-[11px] text-text-tertiary italic pl-3">
                  +{m.crux_points.length - 2} more in the full review…
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>

        <div className="mt-4 pt-3 border-t border-border-primary/50">
          <Link href={`/dashboard/learning-modules/${m.gap_id}`} className="block">
            <Button variant="primary" size="sm" className="w-full justify-center">
              <Sparkles className="w-3.5 h-3.5" />
              {m.quiz_available ? "Start Review" : "Review the Crux"}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
