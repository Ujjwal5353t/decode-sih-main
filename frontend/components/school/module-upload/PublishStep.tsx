"use client";

import { CheckCircle, ClipboardCheck, Loader2, Rocket, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OcrStatusValue } from "@/lib/api";
import {
  Banner,
  Panel,
  PanelHeading,
  Pill,
  SummaryRow,
  formatBytes,
} from "./primitives";
import type { MetadataErrors, ModuleMetadata, SourceKind } from "./types";

export type SaveAction = "draft" | "publish" | "discard";

const ocrStatusLabels: Record<OcrStatusValue, { label: string; tone: "emerald" | "amber" | "rose" | "neutral" }> = {
  done: { label: "Text extracted", tone: "emerald" },
  processing: { label: "Extracting", tone: "amber" },
  pending: { label: "Queued", tone: "amber" },
  failed: { label: "Extraction failed", tone: "rose" },
  na: { label: "No extraction", tone: "neutral" },
};

export function PublishStep({
  meta,
  errors,
  sourceKind,
  sourceName,
  sourceBytes,
  pageCount,
  extractedWords,
  ocrStatus,
  error,
  busyAction,
  onBack,
  onCancel,
  onSaveDraft,
  onPublish,
}: {
  meta: ModuleMetadata;
  errors: MetadataErrors;
  sourceKind: SourceKind;
  sourceName: string;
  sourceBytes: number;
  pageCount: number;
  extractedWords: number;
  ocrStatus: OcrStatusValue | null;
  error: string | null;
  busyAction: SaveAction | null;
  onBack: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const errorList = Object.values(errors).filter(Boolean) as string[];
  const hasErrors = errorList.length > 0;
  const busy = busyAction !== null;
  const statusInfo = ocrStatus ? ocrStatusLabels[ocrStatus] : null;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={ClipboardCheck}
          title="Review & publish"
          description="Check everything reads correctly. Publishing makes the module available to this class in the dashboard, and to teachers building assignments."
          action={<Pill tone="neutral">Step 5 of 5</Pill>}
        />

        {hasErrors && (
          <div className="mb-5">
            <Banner tone="error" title="Fix these before publishing">
              <ul className="list-disc pl-4 space-y-0.5">
                {errorList.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Banner>
          </div>
        )}

        {error && (
          <div className="mb-5">
            <Banner tone="error" title="Could not save the module">
              {error}
            </Banner>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2 font-[family-name:var(--font-display)]">
              Module
            </p>
            <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-4 py-1">
              <SummaryRow label="Title" value={meta.title.trim() || "—"} />
              <SummaryRow label="Class" value={`Class ${meta.classNumber}`} />
              <SummaryRow
                label="Subject"
                value={meta.subject.trim() || "Not set"}
                muted={!meta.subject.trim()}
              />
              <SummaryRow label="Language" value={meta.language} />
              <SummaryRow
                label="Chapter"
                value={meta.chapter.trim() || "Not set"}
                muted={!meta.chapter.trim()}
              />
              <SummaryRow
                label="Description"
                value={meta.description.trim() || "Not set"}
                muted={!meta.description.trim()}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2 font-[family-name:var(--font-display)]">
              Source & extraction
            </p>
            <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-4 py-1">
              <SummaryRow
                label="Source"
                value={sourceKind === "pdf" ? "PDF document" : "Page images"}
              />
              <SummaryRow label="File" value={sourceName} />
              <SummaryRow label="Size" value={formatBytes(sourceBytes)} />
              <SummaryRow
                label="Pages"
                value={`${pageCount} ${pageCount === 1 ? "page" : "pages"}`}
              />
              <SummaryRow
                label="Extraction"
                value={
                  statusInfo ? (
                    <Pill tone={statusInfo.tone}>{statusInfo.label}</Pill>
                  ) : (
                    "—"
                  )
                }
              />
              <SummaryRow
                label="Extracted text"
                value={
                  extractedWords > 0
                    ? `${extractedWords.toLocaleString()} words`
                    : "None"
                }
                muted={extractedWords === 0}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-brand)] bg-brand/5 p-3.5 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-px" />
          <p className="text-[11px] text-text-secondary leading-relaxed">
            The file is already stored in the Class {meta.classNumber} library.
            Publishing saves your final title to the module record.{" "}
            <span className="font-semibold text-text-primary">Save draft</span> keeps
            the module as it is so you can finish the details later, and{" "}
            <span className="font-semibold text-text-primary">Cancel</span> removes the
            uploaded module entirely.
          </p>
        </div>
      </Panel>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={busy}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="text-text-secondary hover:text-rose-500"
          >
            {busyAction === "discard" ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Discarding…
              </>
            ) : (
              "Cancel"
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={busy}
            onClick={onSaveDraft}
          >
            {busyAction === "draft" ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Save draft
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={busy || hasErrors}
            onClick={onPublish}
          >
            {busyAction === "publish" ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Publishing…
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-1.5" /> Publish module
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
