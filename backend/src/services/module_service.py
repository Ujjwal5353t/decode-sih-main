import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional, Sequence

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.ai.ocr_service import run_ocr_background
from src.models.module import Module, OcrStatus, SourceType
from src.models.ncert import NCERTBook
from src.schemas.module import NCERTModuleAddRequest
from src.services.quiz_service import ALL_SUBJECTS
from src.utils.file_utils import (
    delete_cloudinary_asset,
    upload_images_as_pdf,
    upload_pdf,
)


def _normalize_subject(subject: Optional[str]) -> Optional[str]:
    """Validate against the diagnostic quiz's known subject set. Returns None
    (rather than raising) for blank input, since subject is optional at
    upload time — a module without a recognized subject just isn't picked
    up as a source for quiz question generation."""
    if not subject or not subject.strip():
        return None
    normalized = subject.strip()
    matches = [s for s in ALL_SUBJECTS if s.lower() == normalized.lower()]
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown subject '{subject}'. Must be one of: {', '.join(ALL_SUBJECTS)}.",
        )
    return matches[0]


async def get_class_modules(
    branch_name: str,
    class_number: int,
    session: AsyncSession,
    subject: Optional[str] = None,
) -> list[Module]:
    stmt = select(Module).where(
        Module.branch_name == branch_name,
        Module.class_number == class_number,
    )
    if subject and subject.strip() and subject.strip().lower() not in ("general", "all", "none", "null"):
        stmt = stmt.where(Module.subject.ilike(f"%{subject.strip()}%"))  # type: ignore[attr-defined]

    stmt = stmt.order_by(Module.created_at)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def add_pdf_module(
    branch_name: str,
    class_number: int,
    title: str,
    file: UploadFile,
    session: AsyncSession,
    subject: Optional[str] = None,
) -> Module:
    upload = await upload_pdf(file, folder=f"decode-sih/{branch_name}/class-{class_number}")
    module = Module(
        branch_name=branch_name,
        class_number=class_number,
        title=title,
        source_type=SourceType.PDF_UPLOAD,
        file_url=upload["url"],
        cloudinary_public_id=upload["public_id"],
        subject=_normalize_subject(subject),
        # PDF uploads have no raw images — OCR is not applicable
        ocr_status=OcrStatus.NA,
    )
    session.add(module)
    await session.flush()

    # Ingest initial document chunks for RAG & test creation
    from src.services.chunk_service import ingest_module_text
    initial_text = f"Chapter 1: {title}\n\nThis module contains curriculum materials for Class {class_number} {subject}: {title}."
    await ingest_module_text(
        session=session,
        branch_name=branch_name,
        class_number=class_number,
        subject=subject,
        text=initial_text,
        module_id=module.id,
        module_title=title,
    )

    return module


async def add_images_module(
    branch_name: str,
    class_number: int,
    title: str,
    files: Sequence[UploadFile],
    session: AsyncSession,
    subject: Optional[str] = None,
) -> Module:
    upload = await upload_images_as_pdf(
        files, folder=f"decode-sih/{branch_name}/class-{class_number}"
    )
    module = Module(
        branch_name=branch_name,
        class_number=class_number,
        title=title,
        source_type=SourceType.IMAGE_UPLOAD,
        file_url=upload["url"],
        cloudinary_public_id=upload["public_id"],
        subject=_normalize_subject(subject),
        # OCR starts immediately in background; status begins as "pending"
        ocr_status=OcrStatus.PENDING,
    )
    session.add(module)
    await session.flush()   # ensure module.id is assigned before background task reads it

    # Fire-and-forget: OCR runs in background — upload returns 201 immediately
    asyncio.create_task(
        run_ocr_background(
            module_id=module.id,
            title=title,
            class_number=class_number,
            branch_name=branch_name,
            image_bytes_list=upload["image_bytes_list"],
            subject=subject,
        )
    )
    return module


async def add_ncert_module(
    branch_name: str,
    class_number: int,
    data: NCERTModuleAddRequest,
    session: AsyncSession,
) -> Module:
    # Validate NCERT book exists
    ncert_book = await session.get(NCERTBook, data.ncert_book_id)
    if not ncert_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NCERT book not found.",
        )
    if ncert_book.class_number != class_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This NCERT book is for Class {ncert_book.class_number}, "
                   f"not Class {class_number}.",
        )

    module = Module(
        branch_name=branch_name,
        class_number=class_number,
        title=data.title or ncert_book.title,
        source_type=SourceType.NCERT,
        file_url=ncert_book.file_url or "",
        ncert_book_id=ncert_book.id,
        # Auto-filled from the book — an NCERT-sourced module's content is
        # already fully covered by the generic curriculum question bank, so
        # it never needs its own module-grounded generation, but subject is
        # still recorded for consistency/display.
        subject=ncert_book.subject,
        # NCERT books already have structured text — OCR not applicable
        ocr_status=OcrStatus.NA,
    )
    session.add(module)
    await session.flush()

    # Link/copy NCERT template chunks to this branch's module chunks
    from src.models.chunk import DocumentChunk
    from src.services.chunk_service import ingest_module_text

    # Copy any existing global template chunks for this NCERT book into branch chunks
    ncert_chunks_res = await session.execute(
        select(DocumentChunk).where(DocumentChunk.ncert_book_id == ncert_book.id)
    )
    ncert_chunks = list(ncert_chunks_res.scalars().all())

    if ncert_chunks:
        for template_chunk in ncert_chunks:
            # Create a branch-specific chunk copy linked to module
            branch_chunk = DocumentChunk(
                module_id=module.id,
                ncert_book_id=ncert_book.id,
                branch_name=branch_name,
                class_number=class_number,
                subject=ncert_book.subject,
                chapter_number=template_chunk.chapter_number,
                chapter_title=template_chunk.chapter_title,
                chunk_index=template_chunk.chunk_index,
                content=template_chunk.content,
                token_count=template_chunk.token_count,
                char_count=template_chunk.char_count,
                start_char=template_chunk.start_char,
                end_char=template_chunk.end_char,
                embedding=template_chunk.embedding,
            )
            session.add(branch_chunk)
    else:
        # Fallback: ingest initial text for the NCERT module
        book_desc = ncert_book.description or ncert_book.title
        initial_text = f"Chapter 1: Overview\n\n{book_desc}"
        await ingest_module_text(
            session=session,
            branch_name=branch_name,
            class_number=class_number,
            subject=ncert_book.subject,
            text=initial_text,
            module_id=module.id,
            ncert_book_id=ncert_book.id,
            module_title=module.title,
        )

    return module


async def replace_module_pdf(
    module_id: uuid.UUID,
    branch_name: str,
    new_title: str | None,
    file: UploadFile,
    session: AsyncSession,
) -> Module:
    module = await _get_module_or_404(module_id, branch_name, session)

    # Delete old Cloudinary asset if it exists
    if module.cloudinary_public_id:
        delete_cloudinary_asset(module.cloudinary_public_id)

    upload = await upload_pdf(
        file, folder=f"decode-sih/{branch_name}/class-{module.class_number}"
    )
    module.file_url = upload["url"]
    module.cloudinary_public_id = upload["public_id"]
    module.source_type = SourceType.PDF_UPLOAD
    module.ncert_book_id = None
    if new_title:
        module.title = new_title
    module.updated_at = datetime.utcnow()

    session.add(module)
    return module


async def replace_module_images(
    module_id: uuid.UUID,
    branch_name: str,
    new_title: str | None,
    files: Sequence[UploadFile],
    session: AsyncSession,
) -> Module:
    module = await _get_module_or_404(module_id, branch_name, session)

    # Clean up old visual PDF from Cloudinary
    if module.cloudinary_public_id:
        delete_cloudinary_asset(module.cloudinary_public_id)
    # Clean up old OCR text PDF from Cloudinary
    if module.ocr_pdf_public_id:
        delete_cloudinary_asset(module.ocr_pdf_public_id)

    upload = await upload_images_as_pdf(
        files, folder=f"decode-sih/{branch_name}/class-{module.class_number}"
    )
    effective_title = new_title or module.title
    module.file_url = upload["url"]
    module.cloudinary_public_id = upload["public_id"]
    module.source_type = SourceType.IMAGE_UPLOAD
    module.ncert_book_id = None
    module.title = effective_title
    module.updated_at = datetime.utcnow()
    # Reset OCR — new images need fresh extraction
    module.ocr_status = OcrStatus.PENDING
    module.ocr_pdf_url = None
    module.ocr_pdf_public_id = None

    session.add(module)
    await session.flush()

    # Fire fresh OCR for the replacement images
    asyncio.create_task(
        run_ocr_background(
            module_id=module.id,
            title=effective_title,
            class_number=module.class_number,
            branch_name=branch_name,
            image_bytes_list=upload["image_bytes_list"],
        )
    )
    return module


async def update_module_title(
    module_id: uuid.UUID,
    branch_name: str,
    new_title: str,
    session: AsyncSession,
) -> Module:
    module = await _get_module_or_404(module_id, branch_name, session)
    module.title = new_title
    module.updated_at = datetime.utcnow()
    session.add(module)
    return module


async def delete_module(
    module_id: uuid.UUID, branch_name: str, session: AsyncSession
) -> None:
    module = await _get_module_or_404(module_id, branch_name, session)

    # Clean up both Cloudinary assets (visual PDF + OCR text PDF)
    if module.cloudinary_public_id:
        delete_cloudinary_asset(module.cloudinary_public_id)
    if module.ocr_pdf_public_id:
        delete_cloudinary_asset(module.ocr_pdf_public_id)

    await session.delete(module)


# ── Internal helper ────────────────────────────────────────────────────────────

async def _get_module_or_404(
    module_id: uuid.UUID, branch_name: str, session: AsyncSession
) -> Module:
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found.",
        )
    if module.branch_name != branch_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this module.",
        )
    return module
