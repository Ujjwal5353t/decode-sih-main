"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Images,
  Layers,
  Loader2,
  ScanText,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  closePdfDocument,
  openPdfFile,
  readPdfTitle,
  renderPageToDataUrl,
} from "@/lib/pdf";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_TYPES,
  Banner,
  ClassSelector,
  Field,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  Panel,
  PanelHeading,
  Pill,
  TextInput,
  formatBytes,
} from "./primitives";
import type { SelectedSource } from "./types";

/** Pages pre-selected for extraction — OCR runs on CPU, so keep the default modest. */
const DEFAULT_OCR_PAGE_LIMIT = 10;
/** Above this many pages a warning is shown about processing time. */
const SLOW_OCR_PAGE_COUNT = 20;

function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function UploadStep({
  classNumber,
  onClassChange,
  source,
  onSourceChange,
  runOcr,
  onRunOcrChange,
  pageRange,
  onPageRangeChange,
  workingTitle,
  onWorkingTitleChange,
  onCancel,
  onContinue,
}: {
  classNumber: number;
  onClassChange: (next: number) => void;
  source: SelectedSource | null;
  onSourceChange: (next: SelectedSource | null) => void;
  runOcr: boolean;
  onRunOcrChange: (next: boolean) => void;
  pageRange: { from: number; to: number };
  onPageRangeChange: (next: { from: number; to: number }) => void;
  workingTitle: string;
  onWorkingTitleChange: (next: string) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragDepth = useRef(0);

  const readFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setError(null);

      const oversized = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
      if (oversized) {
        setError(
          `"${oversized.name}" is ${formatBytes(oversized.size)} — the server accepts files up to ${MAX_FILE_SIZE_MB} MB.`
        );
        return;
      }

      const pdfs = files.filter((f) => f.type === "application/pdf");
      const images = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));

      if (pdfs.length === 0 && images.length === 0) {
        setError(
          "Unsupported file type. Upload a PDF, or JPEG/PNG/WEBP images of the book pages."
        );
        return;
      }
      if (pdfs.length > 0 && images.length > 0) {
        setError("Upload either a PDF or page images — not both at once.");
        return;
      }
      if (pdfs.length > 1) {
        setError("Only one PDF can be uploaded per module.");
        return;
      }

      // ── Page images ─────────────────────────────────────────────────────────
      if (images.length > 0) {
        const sorted = [...images].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true })
        );
        const previewUrl = URL.createObjectURL(sorted[0]);
        const suggestedTitle = titleFromFileName(sorted[0].name);
        onSourceChange({
          kind: "images",
          pdfFile: null,
          imageFiles: sorted,
          pageCount: sorted.length,
          totalBytes: sorted.reduce((sum, f) => sum + f.size, 0),
          previewUrl,
          suggestedTitle,
        });
        onPageRangeChange({ from: 1, to: sorted.length });
        onWorkingTitleChange(suggestedTitle);
        return;
      }

      // ── PDF ─────────────────────────────────────────────────────────────────
      const pdfFile = pdfs[0];
      setIsReading(true);
      try {
        const doc = await openPdfFile(pdfFile);
        const [previewUrl, embeddedTitle] = await Promise.all([
          renderPageToDataUrl(doc, 1).catch(() => null),
          readPdfTitle(doc),
        ]);
        const pageCount = doc.numPages;
        await closePdfDocument(doc);

        const suggestedTitle = embeddedTitle || titleFromFileName(pdfFile.name);
        onSourceChange({
          kind: "pdf",
          pdfFile,
          imageFiles: [],
          pageCount,
          totalBytes: pdfFile.size,
          previewUrl,
          suggestedTitle,
        });
        onPageRangeChange({
          from: 1,
          to: Math.min(pageCount, DEFAULT_OCR_PAGE_LIMIT),
        });
        onWorkingTitleChange(suggestedTitle);
      } catch {
        setError(
          "This PDF could not be opened. It may be corrupted or password protected."
        );
      } finally {
        setIsReading(false);
      }
    },
    [onPageRangeChange, onSourceChange, onWorkingTitleChange]
  );

  // Release the object URL created for an image preview.
  useEffect(() => {
    const url = source?.kind === "images" ? source.previewUrl : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [source]);

  const clearSelection = () => {
    onSourceChange(null);
    onWorkingTitleChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectedPageCount = source
    ? source.kind === "images"
      ? source.pageCount
      : Math.max(0, pageRange.to - pageRange.from + 1)
    : 0;

  const rangeInvalid =
    source?.kind === "pdf" &&
    runOcr &&
    (pageRange.from < 1 ||
      pageRange.to > source.pageCount ||
      pageRange.from > pageRange.to);

  const canContinue =
    Boolean(source) && !isReading && !rangeInvalid && workingTitle.trim().length > 0;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={UploadCloud}
          title="Upload module content"
          description="Add a textbook, chapter or worksheet as a PDF. Scanned page images work too — either way the file becomes a module in the class library."
          action={<Pill tone="neutral">Step 1 of 5</Pill>}
        />

        <div className="space-y-5">
          <Field
            label="Class"
            required
            hint="Modules are published into a single class library."
          >
            <ClassSelector
              value={classNumber}
              onChange={onClassChange}
              disabled={Boolean(source)}
            />
          </Field>

          {error && <Banner tone="error">{error}</Banner>}

          <AnimatePresence mode="wait" initial={false}>
            {!source ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    dragDepth.current += 1;
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    dragDepth.current -= 1;
                    if (dragDepth.current <= 0) {
                      dragDepth.current = 0;
                      setIsDragging(false);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    dragDepth.current = 0;
                    setIsDragging(false);
                    if (e.dataTransfer.files?.length) {
                      void readFiles(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag and drop a PDF here, or browse for a file"
                  className={cn(
                    "relative rounded-[var(--radius-xl)] border border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 overflow-hidden",
                    isDragging
                      ? "border-brand bg-brand/5 shadow-[var(--shadow-brand)]"
                      : "border-border-primary bg-surface/40 hover:border-brand hover:bg-surface-hover/60"
                  )}
                >
                  <motion.div
                    animate={
                      isDragging ? { scale: 1.06, y: -4 } : { scale: 1, y: 0 }
                    }
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="w-14 h-14 rounded-[var(--radius-lg)] mx-auto flex items-center justify-center mb-4"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {isReading ? (
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    ) : (
                      <UploadCloud className="w-7 h-7 text-white" />
                    )}
                  </motion.div>

                  <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)]">
                    {isReading
                      ? "Reading your document…"
                      : isDragging
                        ? "Drop to add this file"
                        : "Drag & drop your PDF here"}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 max-w-md mx-auto">
                    or browse from your device. PDF up to {MAX_FILE_SIZE_MB} MB, or
                    JPEG / PNG / WEBP scans of the pages.
                  </p>

                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    className="text-xs mt-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Browse files
                  </Button>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={["application/pdf", ...ACCEPTED_IMAGE_TYPES].join(",")}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void readFiles(e.target.files);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* File details */}
                <div className="rounded-[var(--radius-lg)] border border-border-primary bg-surface/60 p-4 flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32 h-40 sm:h-40 shrink-0 rounded-[var(--radius-md)] overflow-hidden border border-border-primary bg-surface-hover flex items-center justify-center">
                    {source.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={source.previewUrl}
                        alt="First page preview"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <FileText className="w-8 h-8 text-text-tertiary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Pill tone={source.kind === "pdf" ? "brand" : "violet"}>
                          {source.kind === "pdf" ? (
                            <>
                              <FileText className="w-3 h-3" /> PDF
                            </>
                          ) : (
                            <>
                              <Images className="w-3 h-3" /> Page images
                            </>
                          )}
                        </Pill>
                        <Pill tone="neutral">
                          <Layers className="w-3 h-3" />
                          {source.pageCount} {source.pageCount === 1 ? "page" : "pages"}
                        </Pill>
                        <Pill tone="neutral">{formatBytes(source.totalBytes)}</Pill>
                      </div>

                      <p className="text-xs font-semibold text-text-primary truncate">
                        {source.kind === "pdf"
                          ? source.pdfFile?.name
                          : `${source.imageFiles.length} images selected`}
                      </p>
                      {source.kind === "images" && (
                        <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                          {source.imageFiles.map((f) => f.name).join(", ")}
                        </p>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-tertiary hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove and choose another file
                      </button>
                    </div>
                  </div>
                </div>

                <Field
                  label="Working title"
                  required
                  htmlFor="module-working-title"
                  hint="You can refine this later — it is the title the module is saved with."
                  error={
                    workingTitle.trim().length === 0
                      ? "A title is required before uploading."
                      : undefined
                  }
                >
                  <TextInput
                    id="module-working-title"
                    value={workingTitle}
                    maxLength={300}
                    invalid={workingTitle.trim().length === 0}
                    onChange={(e) => onWorkingTitleChange(e.target.value)}
                    placeholder="e.g. Math Magic — Chapter 3"
                  />
                </Field>

                {/* OCR options */}
                <div className="rounded-[var(--radius-lg)] border border-border-primary bg-surface/60 p-4 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={runOcr}
                      onChange={(e) => onRunOcrChange(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[var(--brand-primary)] cursor-pointer"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-text-primary font-[family-name:var(--font-display)]">
                        <ScanText className="w-3.5 h-3.5 text-brand" />
                        Extract text with OCR
                      </span>
                      <span className="block text-[11px] text-text-secondary mt-1 leading-relaxed">
                        {source.kind === "pdf"
                          ? "Pages are rendered in your browser and sent to the server's OCR pipeline, which returns a clean extracted-text document for AI quiz generation."
                          : "The server runs OCR over the uploaded pages and returns a clean extracted-text document for AI quiz generation."}
                      </span>
                    </span>
                  </label>

                  {runOcr && source.kind === "pdf" && source.pageCount > 1 && (
                    <div className="pl-7 space-y-3">
                      <div className="grid grid-cols-2 gap-3 max-w-xs">
                        <Field label="From page">
                          <TextInput
                            type="number"
                            min={1}
                            max={source.pageCount}
                            value={pageRange.from}
                            invalid={rangeInvalid}
                            onChange={(e) =>
                              onPageRangeChange({
                                ...pageRange,
                                from: Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                        <Field label="To page">
                          <TextInput
                            type="number"
                            min={1}
                            max={source.pageCount}
                            value={pageRange.to}
                            invalid={rangeInvalid}
                            onChange={(e) =>
                              onPageRangeChange({
                                ...pageRange,
                                to: Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                      </div>

                      {rangeInvalid ? (
                        <Banner tone="error">
                          Choose a page range between 1 and {source.pageCount}, with
                          the first page before the last.
                        </Banner>
                      ) : selectedPageCount > SLOW_OCR_PAGE_COUNT ? (
                        <Banner tone="warning" title="Large extraction">
                          {selectedPageCount} pages will be processed. OCR runs on the
                          server at roughly 10–60 seconds per page, so this can take a
                          while — consider extracting one chapter at a time.
                        </Banner>
                      ) : (
                        <p className="text-[11px] text-text-tertiary">
                          {selectedPageCount} of {source.pageCount} pages will be sent
                          for text extraction.
                        </p>
                      )}
                    </div>
                  )}

                  {!runOcr && (
                    <Banner tone="info">
                      The file will be stored and shared with the class, but no text
                      will be extracted — AI quiz generation needs extracted text.
                    </Banner>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Panel>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
        >
          {runOcr ? "Upload & extract text" : "Upload module"}
          <UploadCloud className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
