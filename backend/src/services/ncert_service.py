import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.module import Module
from src.models.ncert import NCERTBook
from src.schemas.module import NCERTBookCreateRequest, NCERTBookUpdateRequest
from src.utils.file_utils import upload_pdf, delete_cloudinary_asset


async def upload_ncert_pdf(
    book_id: uuid.UUID,
    file: UploadFile,
    session: AsyncSession,
) -> NCERTBook:
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
    return book


async def create_ncert_book(
    data: NCERTBookCreateRequest,
    file: Optional[UploadFile],
    session: AsyncSession,
) -> NCERTBook:
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
    return book


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
