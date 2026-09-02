import logging
import os
import uuid
from io import BytesIO
from typing import Optional

import httpx
from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.module import Module
from src.models.ncert import NCERTBook
from src.schemas.module import NCERTBookCreateRequest, NCERTBookUpdateRequest
from src.services import chunk_service
from src.utils.file_utils import UPLOADS_DIR, upload_pdf, delete_cloudinary_asset

logger = logging.getLogger(__name__)

# Below this many extracted characters, treat the PDF as having no usable
# text layer (i.e. a scanned/image-only PDF) rather than real content.
_MIN_EXTRACTED_CHARS = 200


async def _extract_pdf_text(file_url: str) -> str:
    """
    Fetch a PDF and extract its plain text via pypdf — same approach as
    scripts/generate_questions.py's `_extract_module_text()` for
    school-uploaded modules.

    `upload_pdf()` (src/utils/file_utils.py) currently saves files to local
    disk under /uploads/... (not actually Cloudinary despite the folder
    naming), so this reads straight from disk for that case — matching the
    pattern chunk_service.get_class_chapters() already uses — and falls back
    to an httpx GET for genuine remote http(s) URLs (e.g. hand-set official
    NCERT download links).
    """
    if not file_url:
        return ""

    pdf_bytes: Optional[bytes] = None

    if file_url.startswith("/uploads/"):
        rel_path = file_url.replace("/uploads/", "")
        disk_path = os.path.join(UPLOADS_DIR, rel_path)
        if os.path.isfile(disk_path):
            with open(disk_path, "rb") as f:
                pdf_bytes = f.read()
    elif file_url.startswith("http://") or file_url.startswith("https://"):
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.get(file_url)
            response.raise_for_status()
            pdf_bytes = response.content

    if not pdf_bytes:
        return ""

    reader = PdfReader(BytesIO(pdf_bytes))
    pages_text = [p.extract_text().strip() for p in reader.pages if p.extract_text()]
    return "\n\n".join(pages_text).strip()


async def _ingest_book_pdf(book: NCERTBook, session: AsyncSession) -> str:
    """
    Extract text from book.file_url and (re-)ingest it into document_chunks
    as branch_name="SELF" book-level "template" chunks (module_id=None,
    ncert_book_id=book.id) — the exact convention seed.py's
    seed_ncert_books() already uses for hand-authored NCERT_CHAPTER_TEXT, and
    which module_service.add_ncert_module() copies from when a school attaches
    this book to one of its classes.

    Runs inline (awaited synchronously as part of the upload request) rather
    than as a fire-and-forget background task: this is a low-frequency,
    single-book admin action (not a hot user-facing path like quiz
    submission), so the simplicity of "the response only says success once
    ingestion actually happened" outweighs the extra latency of chunking one
    textbook's worth of text.

    Returns a short status surfaced to the admin via
    NCERTBookOut.chunk_ingestion_status:
      "ingested"          - chunks created successfully.
      "failed_needs_ocr"  - PDF has no usable text layer (scanned/image-only).
                             OCR is not wired into this path (see module
                             docstring below); document_chunks were NOT
                             created for this book, and this is logged loudly
                             rather than silently doing nothing.
      "error"             - unexpected failure while downloading/parsing the
                             PDF or while chunking/embedding the text.
    """
    try:
        extracted_text = await _extract_pdf_text(book.file_url or "")
    except Exception:
        logger.exception(
            "[NCERT Ingest] Failed to download/parse PDF for book %s (%s)",
            book.id, book.title,
        )
        return "error"

    if len(extracted_text) < _MIN_EXTRACTED_CHARS:
        logger.warning(
            "[NCERT Ingest] Book %s (%s, Class %s %s) extracted only %d "
            "char(s) of text from its PDF — likely a scanned/image-only PDF "
            "with no text layer. OCR would be required to make this book's "
            "content usable for RAG/quiz grounding, but OCR is not currently "
            "wired into the NCERT book upload path. document_chunks were NOT "
            "created for this book — it needs manual follow-up.",
            book.id, book.title, book.class_number, book.subject, len(extracted_text),
        )
        return "failed_needs_ocr"

    try:
        await chunk_service.ingest_module_text(
            session=session,
            branch_name="SELF",
            class_number=book.class_number,
            subject=book.subject,
            text=extracted_text,
            module_id=None,
            ncert_book_id=book.id,
            module_title=book.title,
        )
    except Exception:
        logger.exception(
            "[NCERT Ingest] Failed to chunk/embed extracted text for book %s (%s)",
            book.id, book.title,
        )
        return "error"

    logger.info(
        "[NCERT Ingest] Ingested document chunks for book %s (%s), Class %s %s (%d chars extracted)",
        book.id, book.title, book.class_number, book.subject, len(extracted_text),
    )
    return "ingested"


async def upload_ncert_pdf(
    book_id: uuid.UUID,
    file: UploadFile,
    session: AsyncSession,
) -> tuple[NCERTBook, str]:
    book = await session.get(NCERTBook, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NCERT book not found.",
        )

    upload = await upload_pdf(file, folder=f"decode-sih/ncert/class-{book.class_number}")
    book.file_url = upload["url"]
    session.add(book)

    # Synchronize all existing school modules that reference this NCERT book
    modules_result = await session.execute(
        select(Module).where(Module.ncert_book_id == book_id)
    )
    linked_modules = modules_result.scalars().all()
    for mod in linked_modules:
        mod.file_url = book.file_url
        session.add(mod)

    await session.commit()
    await session.refresh(book)

    # Extract & chunk the PDF text now so RAG grounding / quiz generation have
    # real content the moment this book's PDF is attached, instead of the
    # file_url sitting there with zero document_chunks until someone
    # separately triggers ingestion. NCERTBook is a SQLModel *table* model
    # (pydantic-backed), so it rejects arbitrary attribute assignment —
    # the status is returned alongside the book instead of stashed on it.
    ingestion_status = await _ingest_book_pdf(book, session)

    return book, ingestion_status


async def create_ncert_book(
    data: NCERTBookCreateRequest,
    file: Optional[UploadFile],
    session: AsyncSession,
) -> tuple[NCERTBook, Optional[str]]:
    file_url = None
    if file:
        upload = await upload_pdf(file, folder=f"decode-sih/ncert/class-{data.class_number}")
        file_url = upload["url"]

    book = NCERTBook(
        class_number=data.class_number,
        subject=data.subject,
        title=data.title,
        description=data.description,
        file_url=file_url,
    )
    session.add(book)
    await session.commit()
    await session.refresh(book)

    ingestion_status: Optional[str] = None
    if file_url:
        ingestion_status = await _ingest_book_pdf(book, session)

    return book, ingestion_status


async def update_ncert_book(
    book_id: uuid.UUID,
    data: NCERTBookUpdateRequest,
    session: AsyncSession,
) -> NCERTBook:
    book = await session.get(NCERTBook, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NCERT book not found.",
        )

    if data.class_number is not None:
        book.class_number = data.class_number
    if data.subject is not None:
        book.subject = data.subject
    if data.title is not None:
        book.title = data.title
    if data.description is not None:
        book.description = data.description

    session.add(book)
    await session.commit()
    await session.refresh(book)
    return book


async def detach_ncert_file(
    book_id: uuid.UUID,
    session: AsyncSession,
) -> NCERTBook:
    book = await session.get(NCERTBook, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NCERT book not found.",
        )

    book.file_url = None
    session.add(book)
    await session.commit()
    await session.refresh(book)
    return book


async def delete_ncert_book(
    book_id: uuid.UUID,
    session: AsyncSession,
) -> None:
    book = await session.get(NCERTBook, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NCERT book not found.",
        )

    await session.delete(book)
    await session.commit()
