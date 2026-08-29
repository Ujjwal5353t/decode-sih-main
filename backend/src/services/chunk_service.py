import json
import uuid
from typing import Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, delete

from src.ai.chunking import (
    calculate_cosine_similarity,
    extract_chapters_and_chunks,
    generate_text_embedding,
)
from src.models.chunk import DocumentChunk
from src.models.module import Module
from src.schemas.chunk import ChapterOut, RAGSearchResult


async def ingest_module_text(
    session: AsyncSession,
    branch_name: str,
    class_number: int,
    subject: str,
    text: str,
    module_id: Optional[uuid.UUID] = None,
    ncert_book_id: Optional[uuid.UUID] = None,
    module_title: str = "Class Module",
) -> list[DocumentChunk]:
    """
    Chunk and save text content for a module/book in database.
    Replaces existing chunks for the module if present.
    """
    text = text.strip()
    if not text:
        return []

    clean_subject = (subject and subject.strip()) or "General"

    # If module_id specified, delete existing chunks first for idempotency
    if module_id:
        await session.execute(
            delete(DocumentChunk).where(DocumentChunk.module_id == module_id)
        )

    chunks_data = extract_chapters_and_chunks(
        full_text=text,
        default_module_title=module_title,
    )

    created_chunks: list[DocumentChunk] = []

    for c_data in chunks_data:
        embedding_json = (
            json.dumps(c_data["embedding"]) if c_data.get("embedding") else None
        )

        chunk = DocumentChunk(
            module_id=module_id,
            ncert_book_id=ncert_book_id,
            branch_name=branch_name,
            class_number=class_number,
            subject=clean_subject,
            chapter_number=c_data["chapter_number"],
            chapter_title=c_data["chapter_title"],
            chunk_index=c_data["chunk_index"],
            content=c_data["content"],
            token_count=c_data["token_count"],
            char_count=c_data["char_count"],
            start_char=c_data.get("start_char", 0),
            end_char=c_data.get("end_char", len(c_data["content"])),
            embedding=embedding_json,
        )
        session.add(chunk)
        created_chunks.append(chunk)

    await session.commit()
    return created_chunks


async def get_class_chapters(
    session: AsyncSession,
    branch_name: str,
    class_number: int,
    subject: Optional[str] = None,
) -> list[ChapterOut]:
    """
    Get all distinct chapters available for a branch, class, and subject.
    Auto-ingests missing module chunks so every seeded module displays its chapters.
    """
    from src.models.ncert import NCERTBook
    from src.db.ncert_content import NCERT_CHAPTER_TEXT

    # Clean subject filter (ignore generic placeholders like 'General', 'all', '')
    filter_subject = (
        subject.strip()
        if (subject and subject.strip() and subject.strip().lower() not in ("general", "all", "none", "null"))
        else None
    )

    # 1. Fetch all modules created by school admin for this branch & class
    mod_stmt = select(Module).where(
        Module.branch_name == branch_name,
        Module.class_number == class_number,
    )
    if filter_subject:
        mod_stmt = mod_stmt.where(Module.subject.ilike(f"%{filter_subject}%"))  # type: ignore[attr-defined]

    mod_res = await session.execute(mod_stmt)
    branch_modules = list(mod_res.scalars().all())

    # 2. Auto-ingest chunks for any branch module that does not have chunks yet
    for mod in branch_modules:
        chk_check = await session.execute(
            select(DocumentChunk).where(DocumentChunk.module_id == mod.id).limit(1)
        )
        if not chk_check.scalar_one_or_none():
            # Module has no chunks yet — generate them now
            full_text = None
            if mod.ncert_book_id:
                ncert_book = await session.get(NCERTBook, mod.ncert_book_id)
                if ncert_book:
                    full_text = NCERT_CHAPTER_TEXT.get((ncert_book.subject, ncert_book.class_number))
                    if not full_text:
                        full_text = f"Chapter 1: {ncert_book.title}\n\n{ncert_book.description or ncert_book.title}"

            if not full_text:
                full_text = f"Chapter 1: {mod.title}\n\n{mod.title}"

            mod_sub = mod.subject or filter_subject or "General"
            await ingest_module_text(
                session=session,
                branch_name=branch_name,
                class_number=class_number,
                subject=mod_sub,
                text=full_text,
                module_id=mod.id,
                ncert_book_id=mod.ncert_book_id,
                module_title=mod.title,
            )

    # 3. Query all document chunks for this branch & class
    branch_mod_ids = [m.id for m in branch_modules]

    query = select(DocumentChunk).where(
        (DocumentChunk.branch_name == branch_name)
        | (DocumentChunk.branch_name == "SELF")
        | (DocumentChunk.module_id.in_(branch_mod_ids) if branch_mod_ids else False)  # type: ignore[arg-type]
    ).where(
        DocumentChunk.class_number == class_number
    )

    if filter_subject:
        query = query.where(DocumentChunk.subject.ilike(f"%{filter_subject}%"))  # type: ignore[attr-defined]

    query = query.order_by(DocumentChunk.chapter_number, DocumentChunk.chunk_index)
    result = await session.execute(query)
    all_chunks = list(result.scalars().all())

    if not all_chunks:
        return []

    # Group by (chapter_number, chapter_title, module_id, subject)
    chapters_map: dict[tuple, list[DocumentChunk]] = {}
    for chunk in all_chunks:
        key = (chunk.chapter_number, chunk.chapter_title, chunk.module_id, chunk.subject)
        if key not in chapters_map:
            chapters_map[key] = []
        chapters_map[key].append(chunk)

    # Fetch module titles in batch
    module_ids = {c.module_id for c in all_chunks if c.module_id}
    module_titles: dict[uuid.UUID, str] = {}
    if module_ids:
        mod_query = await session.execute(select(Module).where(Module.id.in_(module_ids)))  # type: ignore[attr-defined]
        for mod in mod_query.scalars().all():
            module_titles[mod.id] = mod.title

    chapter_outs: list[ChapterOut] = []
    for (ch_num, ch_title, mod_id, ch_sub), ch_chunks in chapters_map.items():
        sample = ch_chunks[0].content[:160] + "..." if len(ch_chunks[0].content) > 160 else ch_chunks[0].content
        mod_title = module_titles.get(mod_id, "Seeded Textbook") if mod_id else "Seeded Textbook"

        chapter_outs.append(
            ChapterOut(
                chapter_number=ch_num,
                chapter_title=ch_title,
                subject=ch_sub,
                class_number=class_number,
                module_id=mod_id,
                module_title=mod_title,
                chunk_count=len(ch_chunks),
                sample_content=sample,
            )
        )

    chapter_outs.sort(key=lambda x: (x.chapter_number, x.subject))
    return chapter_outs


async def get_chapter_chunks(
    session: AsyncSession,
    branch_name: str,
    class_number: int,
    chapter_number: int,
    subject: Optional[str] = None,
) -> list[DocumentChunk]:
    """Get all ordered chunks for a specific chapter."""
    query = select(DocumentChunk).where(
        (DocumentChunk.branch_name == branch_name) | (DocumentChunk.branch_name == "SELF")
    ).where(
        DocumentChunk.class_number == class_number,
        DocumentChunk.chapter_number == chapter_number,
    )

    if subject and subject.strip():
        query = query.where(DocumentChunk.subject.ilike(f"%{subject.strip()}%"))  # type: ignore[attr-defined]

    query = query.order_by(DocumentChunk.chunk_index)
    result = await session.execute(query)
    return list(result.scalars().all())


async def search_chunks_for_rag(
    session: AsyncSession,
    branch_name: str,
    class_number: int,
    subject: str,
    query: str,
    chapter_numbers: Optional[list[int]] = None,
    top_k: int = 5,
) -> list[RAGSearchResult]:
    """
    Search chunks for RAG quiz & question generation.
    Filters by branch, class, subject, and optional chapter_numbers.
    """
    stmt = select(DocumentChunk).where(
        (DocumentChunk.branch_name == branch_name) | (DocumentChunk.branch_name == "SELF")
    ).where(
        DocumentChunk.class_number == class_number,
        DocumentChunk.subject.ilike(f"%{subject.strip()}%"),  # type: ignore[attr-defined]
    )

    if chapter_numbers:
        stmt = stmt.where(DocumentChunk.chapter_number.in_(chapter_numbers))  # type: ignore[attr-defined]

    result = await session.execute(stmt)
    chunks = list(result.scalars().all())

    if not chunks:
        return []

    query_vec = generate_text_embedding(query)
    query_terms = [t.lower() for t in query.split() if len(t) > 2]

    scored_results: list[tuple[float, DocumentChunk]] = []

    for chunk in chunks:
        # Vector similarity score
        chunk_vec = json.loads(chunk.embedding) if chunk.embedding else []
        cos_sim = calculate_cosine_similarity(query_vec, chunk_vec) if chunk_vec else 0.0

        # Keyword matching score
        content_lower = chunk.content.lower()
        keyword_hits = sum(1 for term in query_terms if term in content_lower)
        kw_score = (keyword_hits / len(query_terms)) if query_terms else 0.0

        # Title match bonus
        title_bonus = 0.2 if any(term in chunk.chapter_title.lower() for term in query_terms) else 0.0

        # Combined hybrid score (0.0 to 1.0+)
        hybrid_score = round(0.5 * cos_sim + 0.4 * kw_score + title_bonus, 4)

        if hybrid_score > 0.05 or not query_terms:
            scored_results.append((hybrid_score, chunk))

    scored_results.sort(key=lambda x: x[0], reverse=True)
    top_matches = scored_results[:top_k]

    return [
        RAGSearchResult(
            chunk_id=chunk.id,
            chapter_number=chunk.chapter_number,
            chapter_title=chunk.chapter_title,
            subject=chunk.subject,
            content=chunk.content,
            score=score,
            module_id=chunk.module_id,
        )
        for score, chunk in top_matches
    ]
