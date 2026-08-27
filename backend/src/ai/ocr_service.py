"""
OCR Service — EasyOCR + fpdf2

Pipeline for each image-upload module:
  1. EasyOCR extracts text from every uploaded image (full quality, sorted reading order)
  2. All per-image texts are assembled into a single structured text PDF via fpdf2
  3. The text PDF is uploaded to Cloudinary under decode-sih/ocr-pdfs/{branch}/
  4. Module record is updated:  ocr_status="done", ocr_pdf_url=..., ocr_pdf_public_id=...

The whole pipeline runs in an asyncio background task so the upload endpoint
returns HTTP 201 instantly (~2 s), while OCR finishes quietly in the background.

Why no content is lost:
  - canvas_size=2560 + mag_ratio=1.5  → handles high-res book pages
  - text_threshold=0.5 + low_text=0.3 → low false-negative rate
  - Results sorted by reading order (top→bottom, left→right with row-snapping)
  - Confidence filter ≥ 0.25          → keeps most text, discards pure noise
  - multi_cell(align="J") in fpdf2    → justified text, no line-truncation
"""

from __future__ import annotations

import asyncio
import io
import logging
import uuid
from datetime import datetime
from typing import Optional

import cloudinary
import cloudinary.uploader
import numpy as np
from PIL import Image

from src.core.database import AsyncSessionFactory
from src.models.module import Module, OcrStatus

logger = logging.getLogger(__name__)

# ── EasyOCR lazy singleton ────────────────────────────────────────────────────
# The Reader is expensive to initialise (~30 s, ~1 GB model download on first run).
# We load it once and reuse it for every subsequent request.

_ocr_reader = None
_reader_lock = asyncio.Lock()
_OCR_MODEL_DIR = ".easyocr_models"   # persisted across restarts


def _load_reader_sync():
    """Blocking: load EasyOCR. Called once from a thread-pool worker."""
    import easyocr  # imported lazily so startup is fast when OCR is not used

    return easyocr.Reader(
        lang_list=["en"],
        gpu=False,               # CPU-safe for cloud deployments without GPU
        model_storage_directory=_OCR_MODEL_DIR,
        download_enabled=True,
        verbose=False,
        quantize=True,           # smaller model, faster inference, minimal quality loss
    )


async def _get_reader():
    """Return the shared EasyOCR Reader, loading it lazily (thread-safe)."""
    global _ocr_reader
    async with _reader_lock:
        if _ocr_reader is None:
            logger.info("[OCR] Loading EasyOCR model (first time — ~30 s)…")
            _ocr_reader = await asyncio.to_thread(_load_reader_sync)
            logger.info("[OCR] EasyOCR model ready.")
    return _ocr_reader


# ── Single-image OCR ─────────────────────────────────────────────────────────

def _ocr_one_image_sync(reader, img_bytes: bytes) -> str:
    """
    Run EasyOCR on *img_bytes* and return clean text in reading order.

    Reading-order sort:
      - Snap each bounding-box top-y to the nearest ROW_SNAP pixel bucket.
      - Within the same bucket, sort left-to-right.
    This handles slight vertical misalignments that are common in photographed
    book pages and reconstructs natural reading flow correctly.
    """
    ROW_SNAP = 15   # pixels — boxes within this range treated as same text line

    # Decode image; keep full colour for best OCR accuracy
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_np = np.array(img)

    results = reader.readtext(
        img_np,
        detail=1,           # return (bbox, text, confidence) tuples
        paragraph=False,    # individual text regions — we sort ourselves
        batch_size=8,
        # Detection sensitivity
        text_threshold=0.5,     # lower → catches more faint text
        low_text=0.3,           # character-level confidence floor
        link_threshold=0.4,
        # Image quality aids
        canvas_size=2560,       # supports very high-resolution book scans
        mag_ratio=1.5,          # slight upscale helps with small print
        # Contrast
        contrast_ths=0.1,
        adjust_contrast=0.5,
    )

    if not results:
        return ""

    def _sort_key(result):
        bbox, _text, _conf = result
        # top-y of the bounding box
        top_y = min(pt[1] for pt in bbox)
        left_x = min(pt[0] for pt in bbox)
        # snap to row bucket
        row_bucket = round(top_y / ROW_SNAP)
        return (row_bucket, left_x)

    results_sorted = sorted(results, key=_sort_key)

    # Collect text above confidence floor
    CONF_FLOOR = 0.25
    words: list[str] = []
    for _bbox, text, conf in results_sorted:
        text = text.strip()
        if conf >= CONF_FLOOR and text:
            words.append(text)

    return " ".join(words)


async def extract_text_from_image(img_bytes: bytes) -> str:
    """Async: run OCR on a single image in a thread-pool worker."""
    reader = await _get_reader()
    return await asyncio.to_thread(_ocr_one_image_sync, reader, img_bytes)


# ── Text-PDF builder ─────────────────────────────────────────────────────────

def _sanitize_text(text: str) -> str:
    """
    Make OCR text safe for Helvetica (Latin-1) PDF rendering.

    Three-pass approach — zero encoding errors guaranteed:
      1. NFC normalize (composed Unicode form)
      2. Replace common typographic Unicode chars with readable ASCII equivalents
      3. Encode/decode through Latin-1 with 'replace' — any remaining non-Latin-1
         char is replaced with '?' rather than crashing the PDF build.

    This ensures 100% of extracted text ends up in the PDF with no data loss
    beyond the ? substitution for truly exotic characters that Helvetica cannot render.
    """
    import unicodedata

    # Pass 1: NFC normalize
    text = unicodedata.normalize("NFC", text)

    # Pass 2: Replace common typographic Unicode with ASCII equivalents
    replacements = {
        "\u2014": " - ",  # em-dash
        "\u2013": "-",    # en-dash
        "\u2018": "'",    # left single quotation mark
        "\u2019": "'",    # right single quotation mark
        "\u201c": '"',    # left double quotation mark
        "\u201d": '"',    # right double quotation mark
        "\u2026": "...",  # horizontal ellipsis
        "\u00a0": " ",    # non-breaking space
        "\u2022": "*",    # bullet
        "\u2023": "*",    # triangular bullet
        "\u2043": "-",    # hyphen bullet
        "\u00b7": ".",    # middle dot
        "\u2192": "->",   # right arrow
        "\u2190": "<-",   # left arrow
        "\u00d7": "x",    # multiplication sign
        "\u00f7": "/",    # division sign
        "\u00b0": " deg", # degree sign
        "\u00b2": "2",    # superscript 2
        "\u00b3": "3",    # superscript 3
        "\u2080": "0",    # subscript 0
        "\u2081": "1",    # subscript 1
        "\u2082": "2",    # subscript 2
        "\u2083": "3",    # subscript 3
        "\u2084": "4",    # subscript 4
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)

    # Remove control characters (except newline and tab)
    text = "".join(ch for ch in text if ch >= " " or ch in "\n\t")

    # Pass 3: Final safety net — encode to Latin-1, replacing any remaining
    # unmappable chars with '?' so we never raise FPDFUnicodeEncodingException
    text = text.encode("latin-1", errors="replace").decode("latin-1")

    return text


def _build_text_pdf_sync(
    title: str,
    class_number: int,
    branch_name: str,
    page_texts: list[str],
) -> bytes:
    """
    Build a clean, fully-formatted text PDF from OCR-extracted page texts.

    Strategy: _sanitize_text() converts all non-Latin-1 Unicode characters to
    ASCII-safe equivalents so we can use Helvetica (always available, cross-platform).
    """
    from fpdf import FPDF

    MARGIN = 20
    LINE_HEIGHT = 7
    HEADER_H = 9
    BODY_SIZE = 11
    SMALL_SIZE = 9

    # Sanitize all text upfront — converts Unicode to ASCII-safe equivalents
    safe_title = _sanitize_text(title)
    safe_branch = _sanitize_text(branch_name)
    safe_texts = [_sanitize_text(t) for t in page_texts]

    class _PDF(FPDF):
        def header(self):
            if self.page_no() > 1:
                self.set_y(10)
                self.set_font("Helvetica", "I", SMALL_SIZE - 1)
                self.set_text_color(160, 160, 160)
                self.cell(
                    0, 6,
                    f"{safe_title}  |  Class {class_number}  |  {safe_branch}",
                    align="R",
                )
                self.set_y(22)  # Position cursor for content

        def footer(self):
            self.set_y(-13)
            self.set_font("Helvetica", "I", SMALL_SIZE - 1)
            self.set_text_color(160, 160, 160)
            self.cell(0, 6, f"Page {self.page_no()} / {{nb}}", align="C")

    pdf = _PDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(MARGIN, 25, MARGIN)

    # ── Cover page ────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(25, 25, 25)
    pdf.multi_cell(0, 12, "OCR Extracted Content", align="C")

    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 17)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 10, safe_title, align="C")

    pdf.ln(2)
    pdf.set_font("Helvetica", "", BODY_SIZE)
    pdf.set_text_color(90, 90, 90)
    pdf.cell(0, 8, f"Class {class_number}   |   Branch: {safe_branch}",
             align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.cell(0, 7, f"Extracted on: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}",
             align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, f"Source images: {len(safe_texts)}",
             align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(MARGIN, pdf.get_y(), 210 - MARGIN, pdf.get_y())
    pdf.ln(6)

    pdf.set_font("Helvetica", "I", SMALL_SIZE)
    pdf.set_text_color(130, 130, 130)
    pdf.multi_cell(
        0, 6,
        (
            "This document was automatically generated by the Decode-SIH OCR pipeline.\n"
            "Text was extracted from scanned book-page images uploaded by the school.\n"
            "Intended for AI-powered assessment generation (RAG pipeline).\n"
            "Do not edit - regenerate by re-uploading the source images."
        ),
        align="C",
    )

    # Content summary
    pdf.ln(10)
    pdf.set_font("Helvetica", "B", SMALL_SIZE + 1)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 7, "Content Summary", align="L", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", SMALL_SIZE)
    pdf.set_text_color(80, 80, 80)
    for idx, text in enumerate(safe_texts, start=1):
        wc = len(text.split()) if text.strip() else 0
        pdf.cell(
            0, 6,
            f"  Image {idx:>2}:  {wc:>5} words   {len(text):>6} chars",
            align="L", new_x="LMARGIN", new_y="NEXT",
        )

    # ── Content pages ─────────────────────────────────────────────────────────
    for pg_idx, text in enumerate(safe_texts, start=1):
        pdf.add_page()

        # Shaded image header bar
        pdf.set_fill_color(240, 240, 240)
        pdf.set_font("Helvetica", "B", SMALL_SIZE + 1)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(
            0, HEADER_H,
            f"  Image {pg_idx} of {len(safe_texts)}",
            align="L", fill=True, new_x="LMARGIN", new_y="NEXT",
        )
        pdf.ln(4)

        # Body text
        pdf.set_font("Helvetica", "", BODY_SIZE)
        pdf.set_text_color(20, 20, 20)

        if text.strip():
            # Split into lines/paragraphs preserving natural reading structure
            lines = [line.strip() for line in text.split("\n") if line.strip()]
            if not lines:
                lines = [p.strip() for p in text.split("  ") if p.strip()]
            
            current_para = []
            for line in lines:
                current_para.append(line)
                # Flush paragraph on blank/punct termination or long string
                if len(" ".join(current_para)) > 120 or line.endswith((".", ":", "?", "!")):
                    para_str = " ".join(current_para)
                    pdf.multi_cell(0, LINE_HEIGHT, para_str, align="J")
                    pdf.ln(2)
                    current_para = []
            if current_para:
                para_str = " ".join(current_para)
                pdf.multi_cell(0, LINE_HEIGHT, para_str, align="J")
                pdf.ln(2)
        else:
            pdf.set_font("Helvetica", "I", BODY_SIZE)
            pdf.set_text_color(160, 160, 160)
            pdf.multi_cell(
                0, LINE_HEIGHT,
                "[No text could be extracted from this image.\n"
                " The image may be blank, too blurry, or contain only graphics.]",
                align="C",
            )
        pdf.ln(4)


    return bytes(pdf.output())


async def build_text_pdf(
    title: str,
    class_number: int,
    branch_name: str,
    page_texts: list[str],
) -> bytes:
    """Async wrapper: build text PDF in a thread-pool worker."""
    return await asyncio.to_thread(
        _build_text_pdf_sync, title, class_number, branch_name, page_texts
    )


# ── Cloudinary upload (text PDF) ─────────────────────────────────────────────

def _upload_ocr_pdf_sync(pdf_bytes: bytes, branch_name: str) -> dict:
    """Upload the OCR text PDF to Cloudinary. Returns {url, public_id}."""
    public_id = f"decode-sih/ocr-pdfs/{branch_name}/{uuid.uuid4()}"
    result = cloudinary.uploader.upload(
        pdf_bytes,
        public_id=public_id,
        resource_type="raw",   # PDFs must use resource_type="raw" in Cloudinary
        overwrite=False,
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_ocr_pdf_to_cloudinary(pdf_bytes: bytes, branch_name: str) -> dict:
    """Async wrapper for Cloudinary upload."""
    return await asyncio.to_thread(_upload_ocr_pdf_sync, pdf_bytes, branch_name)


# ── Background task orchestrator ─────────────────────────────────────────────

async def run_ocr_background(
    module_id: uuid.UUID,
    title: str,
    class_number: int,
    branch_name: str,
    image_bytes_list: list[bytes],
    subject: str = "General",
) -> None:
    """
    Full OCR pipeline — runs as an asyncio background task.

    Steps:
      1. Open own DB session (the request session is closed after 201 is sent)
      2. Set ocr_status = "processing"
      3. OCR each image — collect text per image
      4. Build formatted text PDF
      5. Upload text PDF to Cloudinary
      6. Ingest text into chapter chunks for RAG
      7. Save ocr_pdf_url + ocr_pdf_public_id, set ocr_status = "done"

    On any exception the module is marked ocr_status = "failed" so the school
    can retry via POST /school/classes/{n}/modules/{id}/ocr/retry.
    """
    logger.info(
        "[OCR] Starting background OCR for module %s (%d image(s))",
        module_id,
        len(image_bytes_list),
    )

    # ── Step 1-2: Mark as processing ─────────────────────────────────────────
    try:
        async with AsyncSessionFactory() as session:
            module = await session.get(Module, module_id)
            if not module:
                logger.error("[OCR] Module %s not found — aborting.", module_id)
                return
            module.ocr_status = OcrStatus.PROCESSING
            session.add(module)
            await session.commit()
    except Exception as exc:
        logger.error("[OCR] Could not set processing status for %s: %s", module_id, exc)
        return

    # ── Step 3: OCR every image ───────────────────────────────────────────────
    page_texts: list[str] = []
    try:
        for idx, img_bytes in enumerate(image_bytes_list, start=1):
            logger.info(
                "[OCR] Processing image %d/%d for module %s",
                idx, len(image_bytes_list), module_id,
            )
            text = await extract_text_from_image(img_bytes)
            page_texts.append(text)
            word_count = len(text.split()) if text.strip() else 0
            logger.info(
                "[OCR] Image %d — extracted %d words (%d chars)",
                idx, word_count, len(text),
            )
    except Exception as exc:
        logger.error("[OCR] OCR failed on image for module %s: %s", module_id, exc, exc_info=True)
        await _mark_failed(module_id)
        return

    # ── Step 4: Build text PDF ────────────────────────────────────────────────
    try:
        logger.info("[OCR] Building text PDF for module %s…", module_id)
        pdf_bytes = await build_text_pdf(title, class_number, branch_name, page_texts)
        logger.info(
            "[OCR] Text PDF built — %.1f KB", len(pdf_bytes) / 1024
        )
    except Exception as exc:
        logger.error("[OCR] PDF build failed for module %s: %s", module_id, exc, exc_info=True)
        await _mark_failed(module_id)
        return

    # ── Step 5: Upload to Cloudinary ──────────────────────────────────────────
    try:
        logger.info("[OCR] Uploading OCR PDF to Cloudinary for module %s…", module_id)
        upload_result = await upload_ocr_pdf_to_cloudinary(pdf_bytes, branch_name)
        logger.info("[OCR] Uploaded → %s", upload_result["url"])
    except Exception as exc:
        logger.error("[OCR] Cloudinary upload failed for module %s: %s", module_id, exc, exc_info=True)
        await _mark_failed(module_id)
        return

    # ── Step 6: Ingest OCR text into chapter chunks ───────────────────────────
    try:
        from src.services.chunk_service import ingest_module_text
        full_ocr_text = "\n\n".join(t for t in page_texts if t.strip())
        async with AsyncSessionFactory() as session:
            mod = await session.get(Module, module_id)
            effective_subject = mod.subject if mod and mod.subject else subject
            await ingest_module_text(
                session=session,
                branch_name=branch_name,
                class_number=class_number,
                subject=effective_subject,
                text=full_ocr_text or f"Chapter 1: {title}\n\n{title}",
                module_id=module_id,
                module_title=title,
            )
        logger.info("[OCR] Document chunks ingested for module %s", module_id)
    except Exception as exc:
        logger.warning("[OCR] Could not chunk OCR text for module %s: %s", module_id, exc)

    # ── Step 7: Persist results ───────────────────────────────────────────────
    try:
        async with AsyncSessionFactory() as session:
            module = await session.get(Module, module_id)
            if not module:
                logger.error("[OCR] Module %s disappeared before saving results.", module_id)
                return
            module.ocr_status = OcrStatus.DONE
            module.ocr_pdf_url = upload_result["url"]
            module.ocr_pdf_public_id = upload_result["public_id"]
            session.add(module)
            await session.commit()
        logger.info(
            "[OCR] ✅ Module %s OCR complete. PDF: %s", module_id, upload_result["url"]
        )
    except Exception as exc:
        logger.error("[OCR] Failed to persist OCR results for %s: %s", module_id, exc, exc_info=True)
        await _mark_failed(module_id)


async def _mark_failed(module_id: uuid.UUID) -> None:
    """Helper: set ocr_status = "failed" in a fresh session."""
    try:
        async with AsyncSessionFactory() as session:
            module = await session.get(Module, module_id)
            if module:
                module.ocr_status = OcrStatus.FAILED
                session.add(module)
                await session.commit()
        logger.warning("[OCR] Module %s marked as failed.", module_id)
    except Exception as exc:
        logger.error("[OCR] Could not mark module %s as failed: %s", module_id, exc)
