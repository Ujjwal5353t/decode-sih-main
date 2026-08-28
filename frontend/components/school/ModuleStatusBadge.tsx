"use client";

import { AlertCircle, CheckCircle, FileText, Loader2 } from "lucide-react";
import type { OcrStatusValue } from "@/lib/api";
import { Pill } from "./module-upload/primitives";

/** Client-side state that exists before the module reaches the server. */
export type ModuleDisplayStatus = OcrStatusValue | "uploading";

const statusMap: Record<
  ModuleDisplayStatus,
  {
    label: string;
    tone: "brand" | "amber" | "emerald" | "rose" | "neutral";
    Icon: React.ComponentType<{ className?: string }>;
    spin?: boolean;
  }
> = {
  uploading: { label: "Uploading", tone: "brand", Icon: Loader2, spin: true },
  pending: { label: "Processing", tone: "amber", Icon: Loader2, spin: true },
  processing: { label: "Processing", tone: "amber", Icon: Loader2, spin: true },
  done: { label: "Ready", tone: "emerald", Icon: CheckCircle },
  failed: { label: "OCR Failed", tone: "rose", Icon: AlertCircle },
  na: { label: "Document only", tone: "neutral", Icon: FileText },
};

export function ModuleStatusBadge({
  status,
  title,
}: {
  status: ModuleDisplayStatus;
  title?: string;
}) {
  const { label, tone, Icon, spin } = statusMap[status] ?? statusMap.na;
  return (
    <span title={title}>
      <Pill tone={tone}>
        <Icon className={`w-3 h-3 ${spin ? "animate-spin" : ""}`} />
        {label}
      </Pill>
    </span>
  );
}
