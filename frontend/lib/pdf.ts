/**
 * Browser-side PDF helpers built on pdf.js.
 *
 * Used by the School Admin "Upload Module" flow to
 *   - read page counts / render a preview of the PDF being uploaded,
 *   - rasterise pages into images for the backend OCR pipeline
 *     (`POST /school/classes/{n}/modules/images` expects page images), and
 *   - read the text back out of the extracted-text PDF the OCR pipeline
 *     returns, so it can be reviewed before publishing.
 *
 * pdf.js is imported lazily so it only ships to routes that actually use it.
 */

import type { PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";

export type PdfDocument = PDFDocumentProxy;

/** Longest edge, in CSS pixels, of a page rasterised for OCR. */
const OCR_PAGE_WIDTH = 1700;
/** JPEG quality used for rasterised pages — high enough for reliable OCR. */
const OCR_PAGE_QUALITY = 0.92;

let pdfjsModule: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsModule) {
    pdfjsModule = import("pdfjs-dist")
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        return pdfjs;
      })
      .catch((err) => {
        // Allow a later attempt to retry the import instead of caching failure.
        pdfjsModule = null;
        throw err;
      });
  }
  return pdfjsModule;
}

/**
 * Open a PDF from raw bytes.
 *
 * pdf.js takes ownership of the buffer it is given, so a copy is handed over
 * and the caller keeps its own bytes intact.
 */
export async function openPdfDocument(data: ArrayBuffer): Promise<PdfDocument> {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({ data: data.slice(0) }).promise;
}

/**
 * Release a document and its worker resources.
 * `PDFDocumentProxy` has no `destroy()` of its own — teardown lives on the
 * loading task that produced it.
 */
export async function closePdfDocument(doc: PdfDocument): Promise<void> {
  try {
    await doc.loadingTask.destroy();
  } catch {
    // A document that already failed or was torn down needs no further cleanup.
  }
}

/** Open a PDF straight from a `File` picked in the browser. */
export async function openPdfFile(file: File): Promise<PdfDocument> {
  return openPdfDocument(await file.arrayBuffer());
}

async function renderPage(
  doc: PdfDocument,
  pageNumber: number,
  targetWidth: number
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser could not create a canvas to render the PDF.");
  }
  // Book pages are usually white; painting the ground avoids grey artefacts
  // around transparent regions once the page is flattened to JPEG.
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvas, viewport }).promise;
  page.cleanup();
  return canvas;
}

/** Render one page to a data URL — used for the upload preview thumbnail. */
export async function renderPageToDataUrl(
  doc: PdfDocument,
  pageNumber: number,
  width = 560
): Promise<string> {
  const canvas = await renderPage(doc, pageNumber, width);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/** Render one page to a JPEG `File`, ready to post to the OCR endpoint. */
export async function renderPageToImageFile(
  doc: PdfDocument,
  pageNumber: number,
  baseName: string
): Promise<File> {
  const canvas = await renderPage(doc, pageNumber, OCR_PAGE_WIDTH);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", OCR_PAGE_QUALITY)
  );
  if (!blob) {
    throw new Error(`Could not convert page ${pageNumber} into an image.`);
  }
  const paddedPage = String(pageNumber).padStart(3, "0");
  return new File([blob], `${baseName}-page-${paddedPage}.jpg`, {
    type: "image/jpeg",
  });
}

/**
 * Rasterise a range of pages (inclusive, 1-based) into image files.
 * `onProgress` reports pages completed so the UI can show real progress.
 */
export async function renderPageRangeToImageFiles(
  doc: PdfDocument,
  fromPage: number,
  toPage: number,
  baseName: string,
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> {
  const total = toPage - fromPage + 1;
  const files: File[] = [];
  for (let pageNumber = fromPage; pageNumber <= toPage; pageNumber++) {
    files.push(await renderPageToImageFile(doc, pageNumber, baseName));
    onProgress?.(files.length, total);
  }
  return files;
}

/** Read the text of every page. Page order is preserved. */
export async function extractPdfTextPages(doc: PdfDocument): Promise<string[]> {
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    let text = "";
    for (const item of content.items) {
      const textItem = item as TextItem;
      if (typeof textItem.str !== "string") continue;
      text += textItem.str;
      if (textItem.hasEOL) text += "\n";
    }
    page.cleanup();

    pages.push(text.replace(/[ \t]+\n/g, "\n").trim());
  }

  return pages;
}

/** Best-effort document title from the PDF's own metadata. */
export async function readPdfTitle(doc: PdfDocument): Promise<string | null> {
  try {
    const { info } = (await doc.getMetadata()) as { info?: { Title?: string } };
    const title = info?.Title?.trim();
    return title ? title : null;
  } catch {
    return null;
  }
}
