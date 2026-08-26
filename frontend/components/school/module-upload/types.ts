/** Shared types for the School Admin "Upload Module" flow. */

export type WizardStepId = "upload" | "extract" | "content" | "details" | "publish";

/**
 * Which module endpoint the upload will use.
 *  - "pdf"    → POST /school/classes/{n}/modules/pdf     (stores the PDF as-is)
 *  - "images" → POST /school/classes/{n}/modules/images  (runs the OCR pipeline)
 */
export type SourceKind = "pdf" | "images";

export interface SelectedSource {
  kind: SourceKind;
  /** The chosen PDF, when kind === "pdf". */
  pdfFile: File | null;
  /** Page images, when kind === "images". */
  imageFiles: File[];
  /** Pages in the PDF, or the number of images chosen. */
  pageCount: number;
  totalBytes: number;
  /** Data URL of the first page/image, used for the preview card. */
  previewUrl: string | null;
  /** Title suggested from PDF metadata or the file name. */
  suggestedTitle: string;
}

export interface ModuleMetadata {
  title: string;
  classNumber: number;
  subject: string;
  language: string;
  chapter: string;
  description: string;
}

export type MetadataErrors = Partial<Record<keyof ModuleMetadata, string>>;

export type PipelineStageId = "prepare" | "upload" | "ocr" | "collect";

export type PipelineStageStatus =
  | "pending"
  | "active"
  | "done"
  | "failed"
  | "skipped";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  description: string;
  status: PipelineStageStatus;
  /** Live sub-status, e.g. "Page 3 of 8". */
  detail?: string;
  /** 0–100 when the stage can report real progress. */
  percent?: number;
}
