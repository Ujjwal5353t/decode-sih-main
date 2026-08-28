"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  buildPdfViewUrl,
  deleteSchoolModule,
  getSchoolSubjects,
  replaceSchoolModuleImages,
  updateSchoolModuleTitle,
  uploadSchoolImagesModule,
  uploadSchoolPdfModule,
  type ModuleOut,
  type OcrStatusValue,
} from "@/lib/api";
import {
  isProcessing,
  useModuleProcessing,
} from "@/components/school/ModuleProcessingProvider";
import {
  closePdfDocument,
  extractPdfTextPages,
  openPdfDocument,
  openPdfFile,
  renderPageRangeToImageFiles,
} from "@/lib/pdf";
import { ContentStep } from "./ContentStep";
import { DetailsStep, validateMetadata } from "./DetailsStep";
import { Banner, Panel, Pill, countWords } from "./primitives";
import { ProcessingStep } from "./ProcessingStep";
import { PublishStep, type SaveAction } from "./PublishStep";
import { StepRail, WIZARD_STEPS } from "./StepRail";
import { UploadStep } from "./UploadStep";
import type {
  MetadataErrors,
  ModuleMetadata,
  PipelineStage,
  SelectedSource,
  WizardStepId,
} from "./types";

const OCR_MODEL_LANGUAGE = "English";

function baseStages(): PipelineStage[] {
  return [
    {
      id: "prepare",
      label: "Preparing pages",
      description: "Rendering each page of the PDF into an image the OCR engine can read.",
      status: "pending",
    },
    {
      id: "upload",
      label: "Uploading to the school library",
      description: "Storing the module against this class.",
      status: "pending",
    },
    {
      id: "ocr",
      label: "Extracting text",
      description: "The server runs OCR over every page and builds an extracted-text document.",
      status: "pending",
    },
    {
      id: "collect",
      label: "Collecting results",
      description: "Reading the extracted text back for review.",
      status: "pending",
    },
  ];
}

/**
 * Strip the furniture the OCR pipeline adds to its extracted-text PDF — the
 * cover page, the running header, page footers and the per-image captions —
 * so what is left is the text that was actually read off the pages.
 */
function cleanExtractedPages(
  rawPages: string[],
  headerTitle: string,
  classNumber: number,
  branchName: string
): string[] {
  const header = `${headerTitle} | Class ${classNumber} | ${branchName}`
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  // Page 1 is the generated cover sheet, never source content.
  return rawPages.slice(1).map((page) =>
    page
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (/^Page \d+ \/ \d+$/i.test(trimmed)) return false;
        if (/^Image \d+ of \d+$/i.test(trimmed)) return false;
        if (trimmed.replace(/\s+/g, " ").toLowerCase() === header) return false;
        // Placeholder the pipeline writes when a page yielded nothing.
        if (/^\[?No text could be extracted/i.test(trimmed)) return false;
        if (/^The image may be blank, too blurry/i.test(trimmed)) return false;
        return true;
      })
      .join("\n")
      .trim()
  );
}

export function ModuleUploadWizard({
  initialClass,
  initialSubject,
  branchName,
  replaceModuleId,
  onExit,
}: {
  initialClass: number;
  initialSubject?: string;
  branchName: string;
  /**
   * Set when the admin chose "Retry Extraction" on a failed module. The upload
   * then goes through replace-images on that module — the retry path the backend
   * documents — instead of creating a second module for the same book.
   */
  replaceModuleId?: string;
  onExit: (classNumber: number) => void;
}) {
  const { watch, unwatch, jobFor } = useModuleProcessing();

  // ── Step 1 state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStepId>("upload");
  const [furthest, setFurthest] = useState<WizardStepId>("upload");
  const [classNumber, setClassNumber] = useState(initialClass);
  const [source, setSource] = useState<SelectedSource | null>(null);
  const [workingTitle, setWorkingTitle] = useState("");
  const [runOcr, setRunOcr] = useState(true);
  const [pageRange, setPageRange] = useState({ from: 1, to: 1 });

  // ── Pipeline state ──────────────────────────────────────────────────────────
  const [stages, setStages] = useState<PipelineStage[]>(baseStages);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [localStatusMessage, setStatusMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Result state ────────────────────────────────────────────────────────────
  const [module, setModule] = useState<ModuleOut | null>(null);
  const [localOcrStatus, setOcrStatus] = useState<OcrStatusValue | null>(null);
  const [localOcrPdfUrl, setOcrPdfUrl] = useState<string | null>(null);
  /** Progress of reading the extracted-text document back for review. */
  const [collectState, setCollectState] = useState<{
    status: PipelineStage["status"] | "idle";
    detail?: string;
  }>({ status: "idle" });
  const [pages, setPages] = useState<string[]>([]);
  const [renderedImages, setRenderedImages] = useState<File[]>([]);
  const [schoolSubjects, setSchoolSubjects] = useState<string[]>([]);

  // ── Metadata state ──────────────────────────────────────────────────────────
  const [meta, setMeta] = useState<ModuleMetadata>({
    title: "",
    classNumber: initialClass,
    subject: initialSubject || "",
    language: OCR_MODEL_LANGUAGE,
    chapter: "",
    description: "",
  });

  useEffect(() => {
    getSchoolSubjects(classNumber)
      .then((list) => {
        setSchoolSubjects(list.map((s) => s.subject));
      })
      .catch(() => {});
  }, [classNumber]);

  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<SaveAction | null>(null);
  const [publishedModule, setPublishedModule] = useState<ModuleOut | null>(null);

  // Guards against state updates after the wizard unmounts mid-pipeline.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);


  const advanceTo = useCallback((next: WizardStepId) => {
    setStep(next);
    setFurthest((prev) => {
      const prevIndex = WIZARD_STEPS.findIndex((s) => s.id === prev);
      const nextIndex = WIZARD_STEPS.findIndex((s) => s.id === next);
      return nextIndex > prevIndex ? next : prev;
    });
  }, []);

  const patchStage = useCallback(
    (id: PipelineStage["id"], patch: Partial<PipelineStage>) => {
      setStages((prev) =>
        prev.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage))
      );
    },
    []
  );

  const errors: MetadataErrors = useMemo(
    () => (showErrors ? validateMetadata(meta) : {}),
    [meta, showErrors]
  );

  const extractedWords = useMemo(
    () => countWords(pages.join("\n")),
    [pages]
  );

  // ── Background OCR tracking ─────────────────────────────────────────────────
  // Polling lives in ModuleProcessingProvider, mounted in the dashboard layout,
  // so the server-side extraction keeps being tracked even after this wizard
  // unmounts. Here we only react to whatever the provider last reported.
  const job = module ? jobFor(module.id) : undefined;
  /** Module whose extracted text has already been pulled, so it happens once. */
  const collectedRef = useRef<string | null>(null);

  const collectExtractedText = useCallback(
    async (pdfUrl: string, title: string, cls: number) => {
      const viewUrl = buildPdfViewUrl(pdfUrl);
      if (!viewUrl) throw new Error("The extracted-text document has no address.");

      const response = await fetch(viewUrl);
      if (!response.ok) {
        throw new Error("The extracted-text document could not be downloaded.");
      }
      const buffer = await response.arrayBuffer();
      const doc = await openPdfDocument(buffer);
      const rawPages = await extractPdfTextPages(doc);
      await closePdfDocument(doc);

      return cleanExtractedPages(rawPages, title, cls, branchName);
    },
    [branchName]
  );

  /**
   * The provider owns the OCR status, so the ocr/collect rows are derived from
   * it at render time rather than copied into state. The effect below is left
   * with a single job: fetching the extracted text once it exists.
   */
  const displayStages = useMemo<PipelineStage[]>(() => {
    if (!job) return stages;

    return stages.map((stage) => {
      if (stage.id === "ocr") {
        if (isProcessing(job.status)) {
          return {
            ...stage,
            status: "active",
            detail:
              job.status === "processing"
                ? "Reading the pages — this takes 10–60 seconds per page."
                : "Queued on the server. The first extraction after a restart also loads the OCR model, which can add a few minutes.",
          };
        }
        if (job.status === "failed" || !job.ocrPdfUrl) {
          return { ...stage, status: "failed", detail: job.message ?? undefined };
        }
        return { ...stage, status: "done", detail: "Extraction complete." };
      }

      if (stage.id === "collect") {
        if (job.status === "failed" || (!isProcessing(job.status) && !job.ocrPdfUrl)) {
          return { ...stage, status: "skipped" };
        }
        if (collectState.status !== "idle") {
          return {
            ...stage,
            status: collectState.status,
            detail: collectState.detail,
          };
        }
      }

      return stage;
    });
  }, [collectState, job, stages]);

  const ocrStatus: OcrStatusValue | null = job?.status ?? localOcrStatus;
  const statusMessage = job?.message ?? localStatusMessage;
  const ocrPdfUrl = job?.ocrPdfUrl ?? localOcrPdfUrl;

  const effectiveError =
    pipelineError ??
    (job && job.status === "failed"
      ? job.message ||
        "The server could not extract text from these pages. You can try again with sharper scans."
      : null);

  // Elapsed timer, live only while the pipeline is running.
  useEffect(() => {
    if (step !== "extract" || effectiveError) return;
    const timer = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [step, effectiveError]);

  // Side effect only: pull the extracted text back once, when it is ready.
  useEffect(() => {
    if (!module || !job) return;
    if (isProcessing(job.status) || job.status === "failed" || !job.ocrPdfUrl) return;
    if (collectedRef.current === module.id) return;

    collectedRef.current = module.id;
    let cancelled = false;

    setCollectState({ status: "active", detail: undefined });

    collectExtractedText(job.ocrPdfUrl, module.title, module.class_number)
      .then((extracted) => {
        if (cancelled || !aliveRef.current) return;
        setPages(extracted);
        setCollectState({
          status: "done",
          detail: `${countWords(extracted.join("\n")).toLocaleString()} words read back.`,
        });
        // Only jump forward if the admin is still watching this step.
        setStep((current) => (current === "extract" ? "content" : current));
        setFurthest((prev) => (prev === "extract" ? "content" : prev));
      })
      .catch((err: unknown) => {
        if (cancelled || !aliveRef.current) return;
        collectedRef.current = null;
        setCollectState({ status: "failed", detail: undefined });
        setPipelineError(
          err instanceof Error
            ? err.message
            : "The extracted text could not be downloaded."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [collectExtractedText, job, module]);

  // ── Pipeline ────────────────────────────────────────────────────────────────

  const runPipeline = useCallback(
    async (options: { replaceModuleId?: string } = {}) => {
      if (!source) return;

      const title = workingTitle.trim();
      const cls = classNumber;
      const wantsOcr = runOcr;

      setPipelineError(null);
      setStatusMessage(null);
      setCollectState({ status: "idle" });
      setElapsedSeconds(0);
      setStages(baseStages());
      advanceTo("extract");

      try {
        // ── Prepare ─────────────────────────────────────────────────────────
        let imageFiles: File[] = [];

        if (!wantsOcr && source.kind === "pdf") {
          patchStage("prepare", { status: "skipped" });
        } else if (source.kind === "images") {
          imageFiles = source.imageFiles;
          patchStage("prepare", {
            status: "done",
            detail: `${imageFiles.length} ${imageFiles.length === 1 ? "image" : "images"} ready.`,
          });
        } else {
          patchStage("prepare", { status: "active", percent: 0 });
          const doc = await openPdfFile(source.pdfFile!);
          const from = Math.max(1, Math.min(pageRange.from, doc.numPages));
          const to = Math.max(from, Math.min(pageRange.to, doc.numPages));
          imageFiles = await renderPageRangeToImageFiles(
            doc,
            from,
            to,
            "module",
            (completed, total) => {
              if (!aliveRef.current) return;
              patchStage("prepare", {
                detail: `Page ${completed} of ${total}`,
                percent: Math.round((completed / total) * 100),
              });
            }
          );
          await closePdfDocument(doc);
          patchStage("prepare", {
            status: "done",
            percent: 100,
            detail: `${imageFiles.length} ${imageFiles.length === 1 ? "page" : "pages"} rendered.`,
          });
        }

        if (!aliveRef.current) return;
        setRenderedImages(imageFiles);

        // ── Upload ──────────────────────────────────────────────────────────
        patchStage("upload", { status: "active", percent: 0 });
        const onProgress = (percent: number) => {
          if (!aliveRef.current) return;
          patchStage("upload", { percent, detail: `${percent}% uploaded` });
        };

        let created: ModuleOut;
        if (options.replaceModuleId) {
          created = await replaceSchoolModuleImages(
            cls,
            options.replaceModuleId,
            imageFiles,
            title,
            onProgress
          );
        } else if (wantsOcr || source.kind === "images") {
          created = await uploadSchoolImagesModule(cls, title, imageFiles, onProgress, meta.subject || undefined);
        } else {
          created = await uploadSchoolPdfModule(cls, title, source.pdfFile!, onProgress, meta.subject || undefined);
        }


        if (!aliveRef.current) return;
        setModule(created);
        patchStage("upload", {
          status: "done",
          percent: 100,
          detail: "Stored in the class library.",
        });

        // ── OCR ─────────────────────────────────────────────────────────────
        const initialStatus = created.ocr_status ?? "na";
        setOcrStatus(initialStatus);

        if (initialStatus === "na") {
          patchStage("ocr", {
            status: "skipped",
            detail: "Text extraction does not run for direct document uploads.",
          });
          patchStage("collect", { status: "skipped" });
          setPages([]);
          advanceTo("content");
          return;
        }

        // Extraction already runs server-side. Register the module with the
        // provider and stop awaiting it here, so the admin is free to leave.
        collectedRef.current = null;
        watch(created, cls);
        patchStage("ocr", { status: "active" });
      } catch (err) {
        if (!aliveRef.current) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong while processing.";
        setPipelineError(message);
        setStages((prev) => {
          const activeIndex = prev.findIndex((s) => s.status === "active");
          if (activeIndex === -1) return prev;
          return prev.map((stage, index) =>
            index === activeIndex ? { ...stage, status: "failed" } : stage
          );
        });
      }
    },
    [
      advanceTo,
      watch,
      classNumber,
      pageRange.from,
      pageRange.to,
      patchStage,
      runOcr,
      source,
      workingTitle,
    ]
  );

  // ── Actions ─────────────────────────────────────────────────────────────────

  const startUpload = () => {
    setMeta((prev) => ({
      ...prev,
      title: workingTitle.trim(),
      classNumber,
    }));
    void runPipeline(replaceModuleId ? { replaceModuleId } : {});
  };

  // Replacing a module's pages needs pages to send; a fresh attempt only needs a file.
  const canRetryPipeline = module ? renderedImages.length > 0 : Boolean(source);

  const retryPipeline = () => {
    // Once a module exists, re-running goes through replace-images — the retry
    // path the backend documents for a failed extraction.
    void runPipeline(module ? { replaceModuleId: module.id } : {});
  };

  const startOver = () => {
    // The module (if any) stays in the library and keeps extracting; only this
    // wizard resets. Deliberately does not unwatch, so its status stays tracked.
    setModule(null);
    setOcrStatus(null);
    setOcrPdfUrl(null);
    setCollectState({ status: "idle" });
    setPages([]);
    setRenderedImages([]);
    setPipelineError(null);
    setStatusMessage(null);
    setStages(baseStages());
    setSource(null);
    setWorkingTitle("");
    collectedRef.current = null;
    setShowErrors(false);
    setSaveError(null);
    setMeta({
      title: "",
      classNumber,
      subject: "",
      language: OCR_MODEL_LANGUAGE,
      chapter: "",
      description: "",
    });
    setFurthest("upload");
    setStep("upload");
  };

  const goToDetails = () => {
    setMeta((prev) => ({ ...prev, classNumber }));
    advanceTo("details");
  };

  const goToPublish = () => {
    setShowErrors(true);
    const validation = validateMetadata(meta);
    if (Object.keys(validation).length > 0) return;
    advanceTo("publish");
  };

  const persistTitle = useCallback(async () => {
    if (!module) throw new Error("The module is no longer available.");
    const title = meta.title.trim();
    if (title === module.title) return module;
    return updateSchoolModuleTitle(classNumber, module.id, title);
  }, [classNumber, meta.title, module]);

  const handleSave = async (action: Exclude<SaveAction, "discard">) => {
    setShowErrors(true);
    const validation = validateMetadata(meta);
    if (action === "publish" && Object.keys(validation).length > 0) return;
    if (validation.title) return;

    setSaveError(null);
    setBusyAction(action);
    try {
      const saved = await persistTitle();
      // NOTE — integration point: subject, language, chapter and description are
      // collected above but the module API exposes no fields for them yet. When
      // the backend adds them, persist them here alongside the title.
      if (!aliveRef.current) return;
      if (action === "publish") {
        setPublishedModule(saved ?? module);
      } else {
        onExit(classNumber);
      }
    } catch (err) {
      if (!aliveRef.current) return;
      setSaveError(
        err instanceof Error ? err.message : "The module could not be saved."
      );
    } finally {
      if (aliveRef.current) setBusyAction(null);
    }
  };

  const handleDiscard = async () => {
    if (!module) {
      onExit(classNumber);
      return;
    }
    const confirmed = window.confirm(
      `Discard "${module.title}"? The uploaded file will be removed from the Class ${classNumber} library.`
    );
    if (!confirmed) return;

    setSaveError(null);
    setBusyAction("discard");
    try {
      await deleteSchoolModule(classNumber, module.id);
      unwatch(module.id);
      if (aliveRef.current) onExit(classNumber);
    } catch (err) {
      if (!aliveRef.current) return;
      setSaveError(
        err instanceof Error ? err.message : "The module could not be removed."
      );
      setBusyAction(null);
    }
  };

  // ── Published confirmation ──────────────────────────────────────────────────

  if (publishedModule) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Panel className="text-center py-12">
          <div
            className="w-14 h-14 rounded-[var(--radius-lg)] mx-auto flex items-center justify-center mb-5"
            style={{ background: "var(--gradient-emerald)" }}
          >
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
            Module published
          </h2>
          <p className="text-xs text-text-secondary mt-2 max-w-md mx-auto">
            <span className="font-semibold text-text-primary">
              {publishedModule.title}
            </span>{" "}
            is now part of the Class {classNumber} library and available to teachers
            and students.
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Pill tone="brand">Class {classNumber}</Pill>
            {ocrStatus === "done" && (
              <Pill tone="emerald">
                <Sparkles className="w-3 h-3" />
                {extractedWords.toLocaleString()} words extracted
              </Pill>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setPublishedModule(null);
                setShowErrors(false);
                setMeta({
                  title: "",
                  classNumber,
                  subject: "",
                  language: OCR_MODEL_LANGUAGE,
                  chapter: "",
                  description: "",
                });
                startOver();
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Upload another module
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => onExit(classNumber)}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Back to modules
            </Button>
          </div>
        </Panel>
      </motion.div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────

  const sourceName =
    source?.kind === "pdf"
      ? (source.pdfFile?.name ?? "Document")
      : `${source?.imageFiles.length ?? 0} page images`;

  return (
    <div className="space-y-6">
      {replaceModuleId && step === "upload" && (
        <Banner tone="info" title="Retrying text extraction">
          Choose the pages again — they replace the existing module’s content and
          start a fresh extraction, rather than creating a duplicate module.
        </Banner>
      )}

      <StepRail
        current={step}
        furthest={furthest}
        locked={module ? ["upload", "extract"] : []}
        onSelect={setStep}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {step === "upload" && (
            <UploadStep
              classNumber={classNumber}
              onClassChange={setClassNumber}
              source={source}
              onSourceChange={setSource}
              runOcr={runOcr}
              onRunOcrChange={setRunOcr}
              pageRange={pageRange}
              onPageRangeChange={setPageRange}
              workingTitle={workingTitle}
              onWorkingTitleChange={setWorkingTitle}
              onCancel={() => onExit(classNumber)}
              onContinue={startUpload}
            />
          )}

          {step === "extract" && (
            <ProcessingStep
              stages={displayStages}
              elapsedSeconds={elapsedSeconds}
              statusMessage={statusMessage}
              error={effectiveError}
              canRetry={canRetryPipeline}
              onRetry={retryPipeline}
              onStartOver={startOver}
              onContinueAnyway={
                module ? () => advanceTo("content") : undefined
              }
              isBackgroundable={Boolean(module) && isProcessing(ocrStatus)}
              onRunInBackground={() => onExit(classNumber)}
              onUploadAnother={startOver}
            />
          )}

          {step === "content" && (
            <ContentStep
              pages={pages}
              onPagesChange={setPages}
              ocrStatus={ocrStatus}
              ocrPdfUrl={ocrPdfUrl}
              sourceFileUrl={module?.file_url ?? null}
              canRetry={Boolean(module) && renderedImages.length > 0}
              onRetry={retryPipeline}
              onBack={() => setStep("extract")}
              onContinue={goToDetails}
            />
          )}

          {step === "details" && (
            <DetailsStep
              meta={meta}
              errors={errors}
              subjectSuggestions={schoolSubjects}
              onChange={(patch) => setMeta((prev) => ({ ...prev, ...patch }))}
              ocrLanguageNotice={
                ocrStatus !== "na" &&
                ocrStatus !== null &&
                meta.language !== OCR_MODEL_LANGUAGE
              }
              onBack={() => setStep("content")}
              onContinue={goToPublish}
            />
          )}


          {step === "publish" && (
            <PublishStep
              meta={meta}
              errors={errors}
              sourceKind={source?.kind ?? "pdf"}
              sourceName={sourceName}
              sourceBytes={source?.totalBytes ?? 0}
              pageCount={renderedImages.length || source?.pageCount || 0}
              extractedWords={extractedWords}
              ocrStatus={ocrStatus}
              error={saveError}
              busyAction={busyAction}
              onBack={() => setStep("details")}
              onCancel={handleDiscard}
              onSaveDraft={() => void handleSave("draft")}
              onPublish={() => void handleSave("publish")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
