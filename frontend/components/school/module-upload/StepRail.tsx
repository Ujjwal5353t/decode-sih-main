"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStepId } from "./types";

export interface RailStep {
  id: WizardStepId;
  label: string;
  hint: string;
}

export const WIZARD_STEPS: RailStep[] = [
  { id: "upload", label: "Upload", hint: "Choose the PDF" },
  { id: "extract", label: "Extract", hint: "OCR processing" },
  { id: "content", label: "Content", hint: "Review the text" },
  { id: "details", label: "Details", hint: "Module metadata" },
  { id: "publish", label: "Publish", hint: "Confirm & save" },
];

/**
 * Horizontal progress rail across the top of the wizard.
 * Completed steps are clickable so the admin can jump back to edit.
 */
export function StepRail({
  current,
  furthest,
  locked = [],
  onSelect,
}: {
  current: WizardStepId;
  /** Highest step reached so far — everything up to it can be revisited. */
  furthest: WizardStepId;
  /** Steps that can no longer be revisited, e.g. once the file is uploaded. */
  locked?: WizardStepId[];
  onSelect: (step: WizardStepId) => void;
}) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === current);
  const furthestIndex = WIZARD_STEPS.findIndex((s) => s.id === furthest);

  return (
    <nav
      aria-label="Upload progress"
      className="glass rounded-[var(--radius-lg)] border border-border-primary p-3 sm:p-4"
    >
      <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {WIZARD_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;
          const canVisit =
            index <= furthestIndex &&
            index !== currentIndex &&
            !locked.includes(step.id);

          return (
            <li key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                disabled={!canVisit}
                onClick={() => canVisit && onSelect(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-md)] transition-all text-left",
                  canVisit
                    ? "cursor-pointer hover:bg-surface-hover"
                    : "cursor-default",
                  isActive && "bg-surface shadow-sm"
                )}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-300"
                  style={{
                    background: isDone
                      ? "var(--brand-primary)"
                      : isActive
                        ? "var(--bg-surface)"
                        : "var(--bg-muted)",
                    border: `1px solid ${
                      isDone || isActive
                        ? "var(--brand-primary)"
                        : "var(--border-primary)"
                    }`,
                    color: isDone
                      ? "#FFFFFF"
                      : isActive
                        ? "var(--brand-primary)"
                        : "var(--text-tertiary)",
                    boxShadow: isActive ? "0 0 0 3px var(--border-brand)" : "none",
                  }}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </span>

                <span className="hidden sm:block min-w-0">
                  <span
                    className={cn(
                      "block text-xs font-bold leading-tight font-[family-name:var(--font-display)]",
                      isDone
                        ? "text-brand"
                        : isActive
                          ? "text-text-primary"
                          : "text-text-tertiary"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block text-[10px] leading-tight text-text-tertiary">
                    {step.hint}
                  </span>
                </span>
              </button>

              {index < WIZARD_STEPS.length - 1 && (
                <span className="relative block w-5 sm:w-10 h-px bg-border-primary overflow-hidden rounded-full">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-brand"
                    initial={false}
                    animate={{ width: index < currentIndex ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
