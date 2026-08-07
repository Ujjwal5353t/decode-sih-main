"""
NCERT book catalogue routes (publicly readable — no auth required).
Schools use these to discover available NCERT books before adding them as modules.

GET /ncert/books                       — all books
GET /ncert/books/class/{class_number}  — books for a specific class
GET /ncert/books/{book_id}             — single book detail
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.database import get_session
from src.models.ncert import NCERTBook
from src.schemas.module import NCERTBookOut

router = APIRouter(prefix="/ncert", tags=["NCERT Library"])


@router.get(
    "/books",
    response_model=list[NCERTBookOut],
    summary="Get all pre-loaded NCERT books (optionally filter by class or subject)",
)
async def list_ncert_books(
    class_number: Optional[int] = Query(default=None, ge=1, le=5),
    subject: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    query = select(NCERTBook)
    if class_number is not None:
        query = query.where(NCERTBook.class_number == class_number)
    if subject:
        query = query.where(NCERTBook.subject.ilike(f"%{subject}%"))  # type: ignore[attr-defined]
    query = query.order_by(NCERTBook.class_number, NCERTBook.subject)

    result = await session.execute(query)
    return [NCERTBookOut.model_validate(b) for b in result.scalars().all()]


@router.get(
    "/books/class/{class_number}",
    response_model=list[NCERTBookOut],
    summary="Get all NCERT books for a specific class (1–5)",
)
async def list_ncert_books_for_class(
    class_number: int,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(NCERTBook)
        .where(NCERTBook.class_number == class_number)
        .order_by(NCERTBook.subject)
    )
    return [NCERTBookOut.model_validate(b) for b in result.scalars().all()]


@router.get(
    "/books/{book_id}",
    response_model=NCERTBookOut,
    summary="Get a single NCERT book by ID",
)
async def get_ncert_book(
    book_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    book = await session.get(NCERTBook, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NCERT book not found.")
    return NCERTBookOut.model_validate(book)
