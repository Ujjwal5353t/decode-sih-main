"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  ScanText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildPdfViewUrl, type OcrStatusValue } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Banner, Panel, PanelHeading, Pill, TextArea, countWords } from "./primitives";

const ALL_PAGES = -1;

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
        {label}
      </p>
      <p className="text-sm font-bold text-text-primary tabular-nums font-[family-name:var(--font-display)]">
        {value}
      </p>
    </div>
  );
}

export function ContentStep({
  pages,
  onPagesChange,
  ocrStatus,
  ocrPdfUrl,
  sourceFileUrl,
  canRetry,
  onRetry,
  onBack,
  onContinue,
}: {
  pages: string[];
  onPagesChange: (next: string[]) => void;
  ocrStatus: OcrStatusValue | null;
  ocrPdfUrl: string | null;
  sourceFileUrl: string | null;
  canRetry: boolean;
  onRetry: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Guard against the page list shrinking after a re-run of the extraction.
  const activePage =
    selectedPage === ALL_PAGES || selectedPage < pages.length ? selectedPage : 0;
  const setActivePage = setSelectedPage;

  const combined = useMemo(
    () => pages.map((text) => text.trim()).filter(Boolean).join("\n\n"),
    [pages]
  );

  const stats = useMemo(
    () => ({
      pages: pages.length,
      words: countWords(combined),
      characters: combined.length,
      emptyPages: pages.filter((p) => !p.trim()).length,
    }),
    [combined, pages]
  );

  const isEmpty = stats.words === 0;
  const wasSkipped = ocrStatus === "na" || ocrStatus === null;

  const updatePage = (index: number, value: string) => {
    if (index < 0 || index >= pages.length) return;
    const next = [...pages];
    next[index] = value;
    onPagesChange(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combined);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([combined], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "extracted-text.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const ocrPdfViewUrl = buildPdfViewUrl(ocrPdfUrl);
  const sourceViewUrl = buildPdfViewUrl(sourceFileUrl);

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeading
          icon={ScanText}
          title="Extracted content"
          description="Review what the OCR pipeline read from the pages. Corrections you make here are carried into the review summary before publishing."
          action={<Pill tone="neutral">Step 3 of 5</Pill>}
        />

        {wasSkipped ? (
          <Banner tone="info" title="Text extraction was skipped">
            This module was stored as a document without running OCR, so there is no
            extracted text to review. The file is still available to the class.
          </Banner>
        ) : isEmpty ? (
          <Banner
            tone="warning"
            title="No readable text was found"
            action={
              canRetry ? (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="text-xs"
                  onClick={onRetry}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Re-run OCR
                </Button>
              ) : undefined
            }
          >
            The pages may be blank, too blurry, handwritten, or contain only
            illustrations. You can re-run extraction, upload sharper scans, or continue
            and publish the document as-is.
          </Banner>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile label="Pages" value={stats.pages} />
              <StatTile label="Words" value={stats.words.toLocaleString()} />
              <StatTile label="Characters" value={stats.characters.toLocaleString()} />
              <StatTile label="Empty pages" value={stats.emptyPages} />
            </div>

            {stats.emptyPages > 0 && (
              <Banner tone="warning">
                {stats.emptyPages} of {stats.pages} pages came back empty — those pages
                were most likely images or too faint to read.
              </Banner>
            )}

            {pages.length > 1 && (
              <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-[var(--radius-md)] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivePage(ALL_PAGES)}
                  className={cn(
                    "px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer shrink-0",
                    activePage === ALL_PAGES
                      ? "bg-surface text-brand shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  All pages
                  <span className="ml-1.5 font-normal text-[10px] opacity-70">
                    read-only
                  </span>
                </button>
                {pages.map((page, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActivePage(index)}
                    className={cn(
                      "px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all cursor-pointer shrink-0",
                      activePage === index
                        ? "bg-surface text-brand shadow-sm"
                        : "text-text-secondary hover:text-text-primary",
                      !page.trim() && activePage !== index && "opacity-50"
                    )}
                  >
                    Page {index + 1}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <TextArea
                  rows={16}
                  spellCheck
                  aria-label={
                    activePage === ALL_PAGES
                      ? "Extracted text, all pages"
                      : `Extracted text, page ${activePage + 1}`
                  }
                  className="font-mono text-[11px]"
                  readOnly={activePage === ALL_PAGES}
                  value={activePage === ALL_PAGES ? combined : (pages[activePage] ?? "")}
                  onChange={(e) => updatePage(activePage, e.target.value)}
                />
                {activePage === ALL_PAGES && pages.length > 1 && (
                  <p className="mt-1 text-[11px] text-text-tertiary">
                    This is the whole document end to end. Pick a page tab to correct
                    the text.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy text
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="text-xs"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download .txt
              </Button>
              {canRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-xs"
                  onClick={onRetry}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-run OCR
                </Button>
              )}
            </div>
          </div>
        )}

        {(ocrPdfViewUrl || sourceViewUrl) && (
          <div className="mt-5 pt-4 border-t border-border-primary/50 flex flex-wrap items-center gap-4">
            {sourceViewUrl && (
              <a
                href={sourceViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                Open uploaded document
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {ocrPdfViewUrl && (
              <a
                href={ocrPdfViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand font-semibold hover:underline"
              >
                <ScanText className="w-3.5 h-3.5" />
                Open extracted-text document
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </Panel>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={onContinue}>
          Continue to details
        </Button>
      </div>
    </div>
  );
}
