"""
File upload utilities.

All uploaded PDFs and converted image-PDFs are stored in Cloudinary.
Cloudinary is used because:
  - Render has an ephemeral filesystem (files vanish on restart)
  - Cloudinary's free tier (25 GB storage / 25 GB bandwidth) is sufficient
  - Files are served via CDN, so PDF load times are fast for students

Environment variables required:
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
"""
import io
import uuid
from typing import Sequence

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from src.core.config import settings

# Configure Cloudinary once at import time
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

_ALLOWED_PDF_TYPES = {"application/pdf"}
_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
_MAX_FILE_SIZE_MB = 50
_MAX_FILE_SIZE_BYTES = _MAX_FILE_SIZE_MB * 1024 * 1024


def _check_size(data: bytes) -> None:
    if len(data) > _MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {_MAX_FILE_SIZE_MB} MB limit.",
        )


async def upload_pdf(file: UploadFile, folder: str = "decode-sih/modules") -> dict:
    """
    Validate and upload a PDF file to Cloudinary.

    Returns:
        {"url": str, "public_id": str}
    """
    if file.content_type not in _ALLOWED_PDF_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted for direct upload.",
        )

    data = await file.read()
    _check_size(data)

    public_id = f"{folder}/{uuid.uuid4()}"
    result = cloudinary.uploader.upload(
        data,
        public_id=public_id,
        resource_type="raw",   # PDFs must use resource_type="raw"
        overwrite=False,
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_images_as_pdf(
    files: Sequence[UploadFile],
    folder: str = "decode-sih/modules",
) -> dict:
    """
    Accept one or more image files, merge them into a single PDF,
    and upload the resulting PDF to Cloudinary.

    Returns:
        {"url": str, "public_id": str}
    """
    import img2pdf
    from PIL import Image

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image file is required.",
        )

    image_bytes_list: list[bytes] = []

    for file in files:
        if file.content_type not in _ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' is not a supported image type "
                       f"(JPEG/PNG/WEBP only).",
            )
        raw = await file.read()
        _check_size(raw)

        # Ensure the image is valid and convert to RGB JPEG for img2pdf compatibility
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        image_bytes_list.append(buf.getvalue())

    # Merge all images into one PDF in memory
    pdf_bytes = img2pdf.convert(image_bytes_list)

    public_id = f"{folder}/{uuid.uuid4()}"
    result = cloudinary.uploader.upload(
        pdf_bytes,
        public_id=public_id,
        resource_type="raw",
        overwrite=False,
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


def delete_cloudinary_asset(public_id: str) -> None:
    """
    Delete an asset from Cloudinary by its public_id.
    Called when a module is deleted or replaced.
    Silent on 'not found' (idempotent).
    """
    try:
        cloudinary.uploader.destroy(public_id, resource_type="raw")
    except Exception:
        pass  # Log but don't raise — deletion failure shouldn't block the user
