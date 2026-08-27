"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getModuleOcrStatus, type ModuleOut, type OcrStatusValue } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Tracks School Admin modules whose text extraction is still running.
 *
 * The extraction itself is a backend concern — `POST .../modules/images` starts
 * an asyncio task server-side and `GET .../modules/{id}/ocr` reports on it. This
 * provider is only the client-side watcher for those jobs, and it deliberately
 * lives above the dashboard routes (see app/dashboard/layout.tsx) so polling
 * survives navigating between the modules list and the upload wizard.
 *
 * The watch list is mirrored into localStorage so a full reload — or coming back
 * to the dashboard later — resumes tracking. Status itself is never cached as
 * truth: it is always whatever the backend last reported.
 */

const STORAGE_KEY = "vidyasetu.ocr-jobs.v1";
const POLL_INTERVAL_MS = 3000;
/** Terminal jobs are dropped from the watch list after this long. */
const TERMINAL_RETENTION_MS = 30 * 60_000;

export interface OcrJob {
  moduleId: string;
  classNumber: number;
  title: string;
  status: OcrStatusValue;
  message: string | null;
  ocrPdfUrl: string | null;
  startedAt: number;
  updatedAt: number;
  /** Set when the status request itself failed, not when OCR failed. */
  pollError: string | null;
}

/**
 * True while a module has no final extraction result yet. Accepts the
 * client-only "uploading" state so list and dialog code can use one predicate.
 */
export function isProcessing(
  status: OcrStatusValue | "uploading" | null | undefined
): boolean {
  return status === "pending" || status === "processing" || status === "uploading";
}

interface ModuleProcessingContextValue {
  jobs: OcrJob[];
  /** Jobs still awaiting a result. */
  activeJobs: OcrJob[];
  jobFor: (moduleId: string) => OcrJob | undefined;
  /** Start tracking a module that has just been uploaded. */
  watch: (module: ModuleOut, classNumber: number) => void;
  /** Stop tracking — used after deletion or once a result has been consumed. */
  unwatch: (moduleId: string) => void;
  /**
   * Increments whenever a job reaches a terminal state, so module lists can
   * refetch without each of them running their own poller.
   */
  completionNonce: number;
}

const ModuleProcessingContext = createContext<
  ModuleProcessingContextValue | undefined
>(undefined);

function readStoredJobs(): OcrJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return (parsed as OcrJob[]).filter(
      (job) =>
        job &&
        typeof job.moduleId === "string" &&
        typeof job.classNumber === "number" &&
        (isProcessing(job.status) || now - job.updatedAt < TERMINAL_RETENTION_MS)
    );
  } catch {
    return [];
  }
}

function writeStoredJobs(jobs: OcrJob[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Private mode or a full quota — tracking degrades to this session only.
  }
}

export function ModuleProcessingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  // Rehydrated on the first client render so returning to the dashboard — or a
  // full reload — picks up extractions that were still running. On the server
  // this yields an empty list, and the provider renders no DOM of its own.
  const [jobs, setJobs] = useState<OcrJob[]>(readStoredJobs);
  const [completionNonce, setCompletionNonce] = useState(0);
  const jobsRef = useRef<OcrJob[]>([]);
  const pollingRef = useRef(false);

  // Kept in a ref so the polling interval always sees the latest list without
  // being torn down and recreated on every status change.
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    if (role !== "school") return;
    writeStoredJobs(jobs);
  }, [jobs, role]);

  const watch = useCallback((module: ModuleOut, classNumber: number) => {
    const now = Date.now();
    setJobs((prev) => {
      const existing = prev.find((j) => j.moduleId === module.id);
      const next: OcrJob = {
        moduleId: module.id,
        classNumber,
        title: module.title,
        status: module.ocr_status ?? "na",
        message: null,
        ocrPdfUrl: module.ocr_pdf_url ?? null,
        startedAt: existing?.startedAt ?? now,
        updatedAt: now,
        pollError: null,
      };
      return existing
        ? prev.map((j) => (j.moduleId === module.id ? next : j))
        : [...prev, next];
    });
  }, []);

  const unwatch = useCallback((moduleId: string) => {
    setJobs((prev) => prev.filter((j) => j.moduleId !== moduleId));
  }, []);

  // ── Polling ────────────────────────────────────────────────────────────────
  // One interval for all jobs; each job is requested independently so several
  // modules can extract concurrently without waiting on each other.
  useEffect(() => {
    if (role !== "school") return;

    const tick = async () => {
      const pending = jobsRef.current.filter((j) => isProcessing(j.status));
      if (pending.length === 0 || pollingRef.current) return;

      pollingRef.current = true;
      try {
        const results = await Promise.allSettled(
          pending.map(async (job) => ({
            job,
            status: await getModuleOcrStatus(job.classNumber, job.moduleId),
          }))
        );

        let anyCompleted = false;

        setJobs((prev) => {
          let next = prev;

          for (let i = 0; i < results.length; i++) {
            const outcome = results[i];
            const target = pending[i];

            if (outcome.status === "rejected") {
              const message =
                outcome.reason instanceof Error
                  ? outcome.reason.message
                  : "Could not reach the server.";
              // A deleted module 404s — stop tracking it rather than retrying forever.
              if (/not found/i.test(message)) {
                next = next.filter((j) => j.moduleId !== target.moduleId);
              } else {
                next = next.map((j) =>
                  j.moduleId === target.moduleId ? { ...j, pollError: message } : j
                );
              }
              continue;
            }

            const { ocr_status, message, ocr_pdf_url } = outcome.value.status;
            if (!isProcessing(ocr_status)) anyCompleted = true;

            next = next.map((j) =>
              j.moduleId === target.moduleId
                ? {
                    ...j,
                    status: ocr_status,
                    message,
                    ocrPdfUrl: ocr_pdf_url,
                    updatedAt: Date.now(),
                    pollError: null,
                  }
                : j
            );
          }

          return next;
        });

        if (anyCompleted) setCompletionNonce((n) => n + 1);
      } finally {
        pollingRef.current = false;
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [role]);

  const value = useMemo<ModuleProcessingContextValue>(() => {
    const jobFor = (moduleId: string) => jobs.find((j) => j.moduleId === moduleId);
    return {
      jobs,
      activeJobs: jobs.filter((j) => isProcessing(j.status)),
      jobFor,
      watch,
      unwatch,
      completionNonce,
    };
  }, [completionNonce, jobs, unwatch, watch]);

  return (
    <ModuleProcessingContext.Provider value={value}>
      {children}
    </ModuleProcessingContext.Provider>
  );
}

export function useModuleProcessing(): ModuleProcessingContextValue {
  const context = useContext(ModuleProcessingContext);
  if (!context) {
    throw new Error(
      "useModuleProcessing must be used within a ModuleProcessingProvider"
    );
  }
  return context;
}
