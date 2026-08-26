"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteSchoolModule, type ModuleOut } from "@/lib/api";
import { Banner } from "./module-upload/primitives";

/**
 * Confirmation before permanently removing a module.
 *
 * Deletion goes through `DELETE /school/classes/{n}/modules/{id}`, which also
 * clears the stored file and the extracted-text document. There is no cancel
 * endpoint for an extraction already running, so when a processing module is
 * removed the backend job simply finds no record on its next database write and
 * stops — the dialog says so rather than implying a clean cancellation.
 */
export function DeleteModuleDialog({
  module,
  classNumber,
  isProcessing,
  onClose,
  onDeleted,
}: {
  module: ModuleOut;
  classNumber: number;
  isProcessing: boolean;
  onClose: () => void;
  onDeleted: (moduleId: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape closes, but never mid-request.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDeleting, onClose]);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteSchoolModule(classNumber, module.id);
      onDeleted(module.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The module could not be deleted. Please try again."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-module-title"
    >
      <div className="glass rounded-[var(--radius-xl)] p-6 max-w-md w-full border border-border-primary space-y-4">
        <div className="flex items-center justify-between">
          <h3
            id="delete-module-title"
            className="text-base font-bold text-text-primary flex items-center gap-2 font-[family-name:var(--font-display)]"
          >
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Delete this module?</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
            className="text-text-tertiary hover:text-text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          This will permanently remove the uploaded module and its extracted
          content.
        </p>

        <div className="rounded-[var(--radius-md)] border border-border-primary bg-surface/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
            Module
          </p>
          <p className="text-sm font-bold text-text-primary break-words mt-0.5">
            {module.title}
          </p>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Class {module.class_number}
          </p>
        </div>

        {isProcessing && (
          <Banner tone="warning" title="Text extraction is still running">
            Deleting now stops this module from ever becoming available — the
            server-side extraction ends on its own once the module is gone.
          </Banner>
        )}

        {error && (
          <div
            className="p-3 rounded-[var(--radius-md)] bg-rose-500/10 text-rose-500 text-xs flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="!bg-none bg-rose-500 hover:bg-rose-600 shadow-[0_4px_24px_rgba(244,63,94,0.25)]"
            style={{ background: "var(--accent-rose)" }}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete module
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
