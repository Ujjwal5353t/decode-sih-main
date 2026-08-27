"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Plus,
  ScanText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Banner, Panel, PanelHeading, Pill } from "./primitives";
import type { PipelineStage } from "./types";

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;
}

function StageIcon({ status }: { status: PipelineStage["status"] }) {
  if (status === "done") return <Check className="w-4 h-4" />;
  if (status === "active") return <Loader2 className="w-4 h-4 animate-spin" />;
  if (status === "failed") return <AlertCircle className="w-4 h-4" />;
  if (status === "skipped") return <Minus className="w-4 h-4" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-current" />;
}

const stageColors: Record<
  PipelineStage["status"],
  { bg: string; border: string; fg: string }
> = {
  pending: {
    bg: "var(--bg-muted)",
    border: "var(--border-primary)",
    fg: "var(--text-tertiary)",
  },
  active: {
    bg: "var(--bg-surface)",
    border: "var(--brand-primary)",
    fg: "var(--brand-primary)",
  },
  done: {
    bg: "var(--brand-primary)",
    border: "var(--brand-primary)",
    fg: "#FFFFFF",
  },
  failed: {
    bg: "var(--bg-surface)",
    border: "var(--accent-rose)",
    fg: "var(--accent-rose)",
  },
  skipped: {
    bg: "var(--bg-muted)",
    border: "var(--border-primary)",
    fg: "var(--text-tertiary)",
  },
};

export function ProcessingStep({
  stages,
  elapsedSeconds,
  statusMessage,
  error,
  canRetry,
  onRetry,
  onStartOver,
  onContinueAnyway,
  isBackgroundable,
  onRunInBackground,
  onUploadAnother,
}: {
  stages: PipelineStage[];
  elapsedSeconds: number;
  statusMessage: string | null;
  error: string | null;
  /** False when there are no rendered pages left to re-submit. */
  canRetry: boolean;
  onRetry: () => void;
  onStartOver: () => void;
  /** Offered once the module exists, so a failed extraction is not a dead end. */
  onContinueAnyway?: () => void;
  /** True once the module is stored and extraction is running server-side. */
  isBackgroundable?: boolean;
  onRunInBackground?: () => void;
  onUploadAnother?: () => void;
}) {
  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={ScanText}
          title="Processing your module"
          description="The pages are uploaded to the school library and the server's OCR pipeline extracts their text. This runs in the background — watch it here, or carry on with other work."
          action={<Pill tone="neutral">Step 2 of 5</Pill>}
        />

        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-primary/50">
          <div className="flex items-center gap-2">
            {error ? (
              <Pill tone="rose">
                <AlertCircle className="w-3 h-3" /> Failed
              </Pill>
            ) : (
              <Pill tone="brand">
                <Loader2 className="w-3 h-3 animate-spin" /> In progress
              </Pill>
            )}
            {statusMessage && (
              <span className="text-xs text-text-secondary hidden sm:inline">
                {statusMessage}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-text-tertiary tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        <ol className="space-y-0">
          {stages.map((stage, index) => {
            const colors = stageColors[stage.status];
            const isLast = index === stages.length - 1;

            return (
              <li key={stage.id} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <motion.span
                    initial={false}
                    animate={{
                      scale: stage.status === "active" ? 1.06 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.fg,
                      boxShadow:
                        stage.status === "active"
                          ? "0 0 0 3px var(--border-brand)"
                          : "none",
                    }}
                  >
                    <StageIcon status={stage.status} />
                  </motion.span>
                  {!isLast && (
                    <span className="relative w-px flex-1 min-h-8 my-1 bg-border-primary overflow-hidden rounded-full">
                      <motion.span
                        className="absolute inset-x-0 top-0 bg-brand"
                        initial={false}
                        animate={{
                          height: stage.status === "done" ? "100%" : "0%",
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </span>
                  )}
                </div>

                <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
                  <p
                    className={cn(
                      "text-xs font-bold font-[family-name:var(--font-display)] leading-tight",
                      stage.status === "done"
                        ? "text-brand"
                        : stage.status === "active"
                          ? "text-text-primary"
                          : stage.status === "failed"
                            ? "text-rose-500"
                            : "text-text-tertiary"
                    )}
                  >
                    {stage.label}
                    {stage.status === "skipped" && (
                      <span className="ml-2 font-normal text-[10px] uppercase tracking-wide">
                        Skipped
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-text-tertiary leading-relaxed mt-0.5">
                    {stage.detail || stage.description}
                  </p>

                  {typeof stage.percent === "number" &&
                    stage.status === "active" && (
                      <div className="mt-2 h-1.5 w-full max-w-sm rounded-full bg-surface-hover overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "var(--gradient-brand)" }}
                          initial={false}
                          animate={{ width: `${Math.min(100, stage.percent)}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    )}

                  {stage.status === "active" && stage.percent === undefined && (
                    <div className="mt-2 h-1.5 w-full max-w-sm rounded-full bg-surface-hover overflow-hidden">
                      <motion.div
                        className="h-full w-1/3 rounded-full"
                        style={{ background: "var(--gradient-brand)" }}
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mt-5">
            <Banner tone="error" title="Processing stopped">
              {error}
            </Banner>
          </div>
        )}

        {!error && isBackgroundable && (
          <div className="mt-5">
            <Banner tone="info" title="You do not have to wait here">
              The module is already saved and text extraction is running on the
              server. Leave this page whenever you like — its status keeps updating
              on the Modules list, and you can start another upload straight away.
            </Banner>
          </div>
        )}
      </Panel>

      {!error && isBackgroundable && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onUploadAnother ? (
            <Button variant="ghost" size="sm" type="button" onClick={onUploadAnother}>
              <Plus className="w-4 h-4 mr-1.5" />
              Upload another module
            </Button>
          ) : (
            <span />
          )}
          {onRunInBackground && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onRunInBackground}
            >
              Continue in background
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button variant="ghost" size="sm" type="button" onClick={onStartOver}>
            Start over
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            {onContinueAnyway && (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={onContinueAnyway}
              >
                Continue without text
              </Button>
            )}
            {canRetry && (
              <Button variant="primary" size="sm" type="button" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
