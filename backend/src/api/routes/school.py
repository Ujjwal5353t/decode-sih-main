"""
School dashboard routes (protected — school role required).

GET  /school/me                                  — profile
GET  /school/classes                             — list available classes (1–5)
GET  /school/subject-setup                       — class-wise subject options + current selection
PUT  /school/subject-setup                       — save the subjects this school teaches
GET  /school/classes/{class_number}/modules      — modules for a class
POST /school/classes/{class_number}/modules/pdf  — upload PDF module
POST /school/classes/{class_number}/modules/images — upload image(s) → PDF module
POST /school/classes/{class_number}/modules/ncert  — add pre-loaded NCERT book
PUT  /school/classes/{class_number}/modules/{module_id}/replace-pdf    — replace with new PDF
PUT  /school/classes/{class_number}/modules/{module_id}/replace-images — replace with new images
PATCH /school/classes/{class_number}/modules/{module_id}/title         — update title only
DELETE /school/classes/{class_number}/modules/{module_id}              — delete module

Teacher management (school admin):
GET  /school/teachers                                         — list teachers in this branch
POST /school/teachers/{teacher_id}/assign-class               — assign a class+section
DELETE /school/teachers/{teacher_id}/assign-class/{class_number}/{section} — de-assign
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_school
from src.models.module import Module, OcrStatus
from src.models.school import School
from src.models.school_subject import SchoolClassSubject
from src.schemas.module import ModuleOut, NCERTModuleAddRequest, UpdateModuleTitleRequest
from src.schemas.school import SchoolProfile
from src.schemas.school_subject import (
    ClassSubjectOptions,
    SchoolSubjectDetail,
    SubjectSetupOut,
    SubjectSetupRequest,
)
from src.schemas.teacher import AssignClassRequest, TeacherClassOut, TeacherListItem
from src.services import module_service, school_subject_service, teacher_service

router = APIRouter(prefix="/school", tags=["School Dashboard"])


class OcrStatusOut(BaseModel):
    """Lightweight response for OCR polling — avoids returning full module."""
    module_id: uuid.UUID
    ocr_status: str
    ocr_pdf_url: Optional[str] = None
    message: str

    model_config = {"from_attributes": False}


@router.get("/me", response_model=SchoolProfile, summary="Get school profile")
async def get_school_profile(school: School = Depends(get_current_school)):
    return SchoolProfile.model_validate(school)


@router.get(
    "/classes",
    response_model=list[int],
    summary="List available classes (always 1–5)",
)
async def list_classes(_: School = Depends(get_current_school)):
    return list(school_subject_service.SUPPORTED_CLASSES)


@router.get(
    "/subjects",
    response_model=list[SchoolSubjectDetail],
    summary="Get all configured class-wise subjects and publishers for this school",
)
async def get_school_subjects(
    class_number: Optional[int] = None,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(SchoolClassSubject).where(SchoolClassSubject.school_id == school.id)
    if class_number is not None:
        stmt = stmt.where(SchoolClassSubject.class_number == class_number)
    stmt = stmt.order_by(SchoolClassSubject.class_number, SchoolClassSubject.subject)
    res = await session.execute(stmt)
    return res.scalars().all()


# ── First-run setup: which subjects this school teaches, per class ────────────

@router.get(
    "/subject-setup",
    response_model=SubjectSetupOut,
    summary="Class-wise subject options and this school's current selection",
)
async def get_subject_setup(
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    catalog = await school_subject_service.get_catalog(session)
    selected = await school_subject_service.get_selection(school, session)

    return SubjectSetupOut(
        completed=school_subject_service.is_complete(school),
        configured_at=school.subjects_configured_at,
        classes=[
            ClassSubjectOptions(
                class_number=class_number,
                class_label=school_subject_service.class_label(class_number),
                subject_count=len(subjects),
                subjects=subjects,
                selected=selected.get(class_number, []),
            )
            for class_number, subjects in catalog.items()
        ],
    )


@router.put(
    "/subject-setup",
    response_model=SubjectSetupOut,
    summary="Save the subjects this school teaches for each class",
)
async def save_subject_setup(
    data: SubjectSetupRequest,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    await school_subject_service.save_selection(
        school,
        [(entry.class_number, entry.subjects) for entry in data.classes],
        session,
    )
    await session.flush()
    return await get_subject_setup(school=school, session=session)


@router.get(
    "/classes/{class_number}/modules",
    response_model=list[ModuleOut],
    summary="Get all modules uploaded for a specific class",
)
async def get_class_modules(
    class_number: int,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    return await module_service.get_class_modules(school.branch_name, class_number, session)


@router.post(
    "/classes/{class_number}/modules/pdf",
    response_model=ModuleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF as a new module",
)
async def upload_pdf_module(
    class_number: int,
    title: Annotated[str, Form()],
    file: Annotated[UploadFile, File(description="PDF file (max 50 MB)")],
    subject: Annotated[Optional[str], Form()] = "General",
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    eff_subject = subject or "General"
    module = await module_service.add_pdf_module(
        school.branch_name, class_number, title, file, session, subject=eff_subject
    )
    return ModuleOut.model_validate(module)


@router.post(
    "/classes/{class_number}/modules/images",
    response_model=ModuleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload one or more images — they are merged into a single PDF module",
)
async def upload_images_module(
    class_number: int,
    title: Annotated[str, Form()],
    files: Annotated[list[UploadFile], File(description="JPEG/PNG images (max 50 MB each)")],
    subject: Annotated[Optional[str], Form()] = "General",
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    eff_subject = subject or "General"
    module = await module_service.add_images_module(
        school.branch_name, class_number, title, files, session, subject=eff_subject
    )
    return ModuleOut.model_validate(module)


@router.post(
    "/classes/{class_number}/modules/ncert",
    response_model=ModuleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a pre-loaded NCERT book as a module for this class",
)
async def add_ncert_module(
    class_number: int,
    data: NCERTModuleAddRequest,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await module_service.add_ncert_module(
        school.branch_name, class_number, data, session
    )
    return ModuleOut.model_validate(module)


@router.put(
    "/classes/{class_number}/modules/{module_id}/replace-pdf",
    response_model=ModuleOut,
    summary="Replace an existing module with a new PDF file",
)
async def replace_module_with_pdf(
    class_number: int,
    module_id: uuid.UUID,
    file: Annotated[UploadFile, File(description="Replacement PDF (max 50 MB)")],
    title: Annotated[Optional[str], Form()] = None,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await module_service.replace_module_pdf(
        module_id, school.branch_name, title, file, session
    )
    return ModuleOut.model_validate(module)


@router.put(
    "/classes/{class_number}/modules/{module_id}/replace-images",
    response_model=ModuleOut,
    summary="Replace an existing module with new images (merged into PDF)",
)
async def replace_module_with_images(
    class_number: int,
    module_id: uuid.UUID,
    files: Annotated[list[UploadFile], File(description="Replacement images")],
    title: Annotated[Optional[str], Form()] = None,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await module_service.replace_module_images(
        module_id, school.branch_name, title, files, session
    )
    return ModuleOut.model_validate(module)


@router.patch(
    "/classes/{class_number}/modules/{module_id}/title",
    response_model=ModuleOut,
    summary="Update only the title of a module",
)
async def update_module_title(
    class_number: int,
    module_id: uuid.UUID,
    data: UpdateModuleTitleRequest,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await module_service.update_module_title(
        module_id, school.branch_name, data.title, session
    )
    return ModuleOut.model_validate(module)


@router.delete(
    "/classes/{class_number}/modules/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a module (also removes file from Cloudinary)",
)
async def delete_module(
    class_number: int,
    module_id: uuid.UUID,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    await module_service.delete_module(module_id, school.branch_name, session)


# ── OCR Status & Retry ─────────────────────────────────────────────────────────


@router.get(
    "/classes/{class_number}/modules/{module_id}/ocr",
    response_model=OcrStatusOut,
    summary="Poll OCR extraction status for an image-upload module",
    description=(
        "Returns the current OCR status and, once complete, the Cloudinary URL "
        "of the extracted-text PDF. Poll this endpoint every 2-5 seconds after "
        "uploading images. Status values: pending | processing | done | failed | na."
    ),
)
async def get_module_ocr_status(
    class_number: int,
    module_id: uuid.UUID,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
) -> OcrStatusOut:
    module = await session.get(Module, module_id)
    if not module or module.branch_name != school.branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found.",
        )

    status_messages = {
        OcrStatus.PENDING: "OCR is queued and will start shortly.",
        OcrStatus.PROCESSING: "EasyOCR is extracting text — this may take 10–60 seconds.",
        OcrStatus.DONE: "OCR complete. Text PDF is ready in Cloudinary.",
        OcrStatus.FAILED: "OCR failed. Use the /retry endpoint to re-trigger.",
        OcrStatus.NA: "OCR is not applicable for this module type (PDF upload or NCERT).",
    }

    return OcrStatusOut(
        module_id=module.id,
        ocr_status=module.ocr_status,
        ocr_pdf_url=module.ocr_pdf_url,
        message=status_messages.get(module.ocr_status, "Unknown status."),
    )


@router.post(
    "/classes/{class_number}/modules/{module_id}/ocr/retry",
    response_model=OcrStatusOut,
    summary="Re-trigger OCR extraction for a failed image-upload module",
    description=(
        "Only valid for image_upload modules with ocr_status=\"failed\". "
        "Re-downloads the original visual PDF from Cloudinary is NOT supported "
        "(original raw images are no longer available). Instead, re-upload the "
        "images using the replace-images endpoint to get fresh OCR."
    ),
)
async def retry_module_ocr(
    class_number: int,
    module_id: uuid.UUID,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
) -> OcrStatusOut:
    from src.ai.ocr_service import run_ocr_background
    import asyncio

    module = await session.get(Module, module_id)
    if not module or module.branch_name != school.branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found.",
        )
    if module.source_type != "image_upload":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OCR retry is only valid for image-upload modules.",
        )
    if module.ocr_status not in (OcrStatus.FAILED, OcrStatus.PENDING):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot retry OCR — current status is '{module.ocr_status}'. "
                "Retry is only allowed when status is 'failed' or 'pending'. "
                "To re-extract with new images, use the replace-images endpoint."
            ),
        )

    # Note: raw image bytes are not stored — the retry endpoint informs the
    # school to re-upload via replace-images if they need fresh text extraction.
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            "Raw image bytes are not retained after upload for privacy/storage reasons. "
            "To re-run OCR, please use PUT /school/classes/{class_number}/modules/{module_id}/replace-images "
            "to re-upload the images. This will automatically trigger fresh OCR."
        ),
    )


# ── Chunk Ingestion & Inspection ──────────────────────────────────────────────

from src.schemas.chunk import ChunkOut, ModuleIngestRequest
from src.services import chunk_service


@router.post(
    "/classes/{class_number}/modules/{module_id}/ingest",
    response_model=list[ChunkOut],
    summary="Ingest custom or updated text content for a module into document chunks",
)
async def ingest_module_chunks(
    class_number: int,
    module_id: uuid.UUID,
    data: Optional[ModuleIngestRequest] = None,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await session.get(Module, module_id)
    if not module or module.branch_name != school.branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found.",
        )

    text_to_ingest = (data.text if data and data.text else None) or f"Chapter 1: {module.title}\n\n{module.title}"
    effective_subject = (data.subject if data and data.subject else None) or module.subject

    if data and data.subject:
        module.subject = data.subject
        session.add(module)

    chunks = await chunk_service.ingest_module_text(
        session=session,
        branch_name=school.branch_name,
        class_number=class_number,
        subject=effective_subject,
        text=text_to_ingest,
        module_id=module.id,
        module_title=module.title,
    )
    return [ChunkOut.model_validate(c) for c in chunks]


@router.get(
    "/classes/{class_number}/modules/{module_id}/chunks",
    response_model=list[ChunkOut],
    summary="Get all chunks formed for a specific module",
)
async def get_module_chunks(
    class_number: int,
    module_id: uuid.UUID,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    from sqlmodel import select
    from src.models.chunk import DocumentChunk

    module = await session.get(Module, module_id)
    if not module or module.branch_name != school.branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found.",
        )

    res = await session.execute(
        select(DocumentChunk)
        .where(DocumentChunk.module_id == module_id)
        .order_by(DocumentChunk.chapter_number, DocumentChunk.chunk_index)
    )
    chunks = list(res.scalars().all())
    return [ChunkOut.model_validate(c) for c in chunks]


# ── Teacher management (school admin) ─────────────────────────────────────────

@router.get(
    "/teachers",
    response_model=list[TeacherListItem],
    summary="List all teachers registered in this school branch",
)
async def list_teachers(
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    teachers = await teacher_service.list_branch_teachers(school.branch_name, session)
    result = []
    for t in teachers:
        classes = await teacher_service.get_assigned_classes(t, session)
        class_outs = [
            TeacherClassOut(
                id=c.id,
                class_number=c.class_number,
                section=c.section,
                label=f"{c.class_number}{c.section}",
                assigned_at=c.assigned_at,
            )
            for c in classes
        ]
        result.append(
            TeacherListItem(
                id=t.id,
                name=t.name,
                phone_number=t.phone_number,
                is_active=t.is_active,
                assigned_classes=class_outs,
                created_at=t.created_at,
            )
        )
    return result


@router.post(
    "/teachers/{teacher_id}/assign-class",
    response_model=TeacherClassOut,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a class section to a teacher",
)
async def assign_class_to_teacher(
    teacher_id: uuid.UUID,
    data: AssignClassRequest,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    tca = await teacher_service.assign_class_to_teacher(
        teacher_id, school.branch_name, data, session
    )
    return TeacherClassOut(
        id=tca.id,
        class_number=tca.class_number,
        section=tca.section,
        label=f"{tca.class_number}{tca.section}",
        assigned_at=tca.assigned_at,
    )


@router.delete(
    "/teachers/{teacher_id}/assign-class/{class_number}/{section}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a class section assignment from a teacher",
)
async def deassign_class_from_teacher(
    teacher_id: uuid.UUID,
    class_number: int,
    section: str,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    await teacher_service.deassign_class_from_teacher(
        teacher_id, school.branch_name, class_number, section, session
    )
