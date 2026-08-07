"""
School dashboard routes (protected — school role required).

GET  /school/me                                  — profile
GET  /school/classes                             — list available classes (1–5)
GET  /school/classes/{class_number}/modules      — modules for a class
POST /school/classes/{class_number}/modules/pdf  — upload PDF module
POST /school/classes/{class_number}/modules/images — upload image(s) → PDF module
POST /school/classes/{class_number}/modules/ncert  — add pre-loaded NCERT book
PUT  /school/classes/{class_number}/modules/{module_id}/replace-pdf    — replace with new PDF
PUT  /school/classes/{class_number}/modules/{module_id}/replace-images — replace with new images
PATCH /school/classes/{class_number}/modules/{module_id}/title         — update title only
DELETE /school/classes/{class_number}/modules/{module_id}              — delete module
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_school
from src.models.school import School
from src.schemas.module import ModuleOut, NCERTModuleAddRequest, UpdateModuleTitleRequest
from src.schemas.school import SchoolProfile
from src.services import module_service

router = APIRouter(prefix="/school", tags=["School Dashboard"])


@router.get("/me", response_model=SchoolProfile, summary="Get school profile")
async def get_school_profile(school: School = Depends(get_current_school)):
    return SchoolProfile.model_validate(school)


@router.get(
    "/classes",
    response_model=list[int],
    summary="List available classes (always 1–5)",
)
async def list_classes(_: School = Depends(get_current_school)):
    return list(range(1, 6))


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
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await module_service.add_pdf_module(
        school.branch_name, class_number, title, file, session
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
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    module = await module_service.add_images_module(
        school.branch_name, class_number, title, files, session
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
