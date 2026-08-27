import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel

from src.ai.chunking import (
    extract_chapters_and_chunks,
    generate_text_embedding,
    calculate_cosine_similarity,
    split_text_recursive,
)
from src.models import (
    School,
    Teacher,
    TeacherClassAssignment,
    Module,
    DocumentChunk,
)
from src.models.module import SourceType, OcrStatus
from src.services.chunk_service import (
    ingest_module_text,
    get_class_chapters,
    get_chapter_chunks,
    search_chunks_for_rag,
)


def test_chunking_engine_splitting_and_overlap():
    """Verify recursive character text splitting and overlap logic."""
    sample_text = (
        "In Assam, children use bamboo and rope bridges to cross river streams and reach school. " * 10
    )
    chunks = split_text_recursive(sample_text, chunk_size=400, overlap=80)
    
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk["content"]) <= 450  # within target limit
        assert chunk["token_count"] > 0
        assert "start_char" in chunk
        assert "end_char" in chunk

    # Test vector embedding generation
    vec1 = generate_text_embedding("bamboo bridge in Assam")
    vec2 = generate_text_embedding("bamboo and rope bridge for school children")
    vec3 = generate_text_embedding("quantum physics and black holes")

    sim_relevant = calculate_cosine_similarity(vec1, vec2)
    sim_irrelevant = calculate_cosine_similarity(vec1, vec3)

    assert sim_relevant > sim_irrelevant
    assert sim_relevant > 0.3


def test_chapter_extraction():
    """Verify chapter structure extraction from multi-chapter document text."""
    book_text = (
        "Chapter 1: Going to School\n"
        "In Assam children use bamboo bridges. In Kerala children use Vallam boat.\n\n"
        "Chapter 2: Ear to Ear\n"
        "Animals with visible ears give birth to live young ones. Animals with hidden ear holes lay eggs.\n\n"
        "Chapter 3: A Day with Nandu\n"
        "Elephants live in female-led herds. Nandu is a baby elephant who loves playing in mud."
    )

    extracted = extract_chapters_and_chunks(book_text, default_module_title="EVS Book", chunk_size=300, overlap=50)
    
    chapter_numbers = {c["chapter_number"] for c in extracted}
    assert chapter_numbers == {1, 2, 3}

    ch1_chunks = [c for c in extracted if c["chapter_number"] == 1]
    assert len(ch1_chunks) >= 1
    assert "Going to School" in ch1_chunks[0]["chapter_title"]
    assert "Assam" in ch1_chunks[0]["content"] or "bamboo" in ch1_chunks[0]["content"]


async def test_db_chunking_ingestion_and_teacher_retrieval():
    """Test full database lifecycle: ingestion, branch+subject isolation, chapter lookup, and RAG search."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Seed test schools/branches
        school_a = School(
            school_name="LPS Karkarduma",
            branch_name="LPS_KARKARDUMA",
            student_prefix="LKD",
            email="admin@lkd.edu",
            password_hash="hash",
            state="Delhi",
        )
        school_b = School(
            school_name="LPS Vasundhara",
            branch_name="LPS_VASUNDHARA",
            student_prefix="LVS",
            email="admin@lvs.edu",
            password_hash="hash",
            state="UP",
        )
        session.add_all([school_a, school_b])
        await session.commit()

        # Add Module for Branch A - Class 4 EVS
        mod_evs = Module(
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="EVS",
            title="Looking Around Class 4 EVS",
            source_type=SourceType.PDF_UPLOAD,
            file_url="https://res.cloudinary.com/demo/sample.pdf",
            ocr_status=OcrStatus.NA,
        )
        # Add Module for Branch A - Class 4 Mathematics
        mod_math = Module(
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="Mathematics",
            title="Math Magic Class 4",
            source_type=SourceType.PDF_UPLOAD,
            file_url="https://res.cloudinary.com/demo/sample2.pdf",
            ocr_status=OcrStatus.NA,
        )
        session.add_all([mod_evs, mod_math])
        await session.commit()

        # Ingest EVS content
        evs_content = (
            "Chapter 1: Going to School\n"
            "In Assam children cross bamboo and rope bridges to reach school.\n\n"
            "Chapter 2: Ear to Ear\n"
            "Animals with visible ears give birth to live babies."
        )
        await ingest_module_text(
            session=session,
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="EVS",
            text=evs_content,
            module_id=mod_evs.id,
            module_title=mod_evs.title,
        )

        # Ingest Math content
        math_content = (
            "Chapter 1: Building with Bricks\n"
            "Bricks have 6 faces, 12 edges, and 8 corners. Arch brick designs in Murshidabad.\n\n"
            "Chapter 2: Long and Short\n"
            "Measuring tape is used to measure height in centimeters and meters."
        )
        await ingest_module_text(
            session=session,
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="Mathematics",
            text=math_content,
            module_id=mod_math.id,
            module_title=mod_math.title,
        )

        # 1. Test Chapter Lookup for EVS teacher of Class 4
        evs_chapters = await get_class_chapters(
            session=session,
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="EVS",
        )
        assert len(evs_chapters) == 2
        assert evs_chapters[0].chapter_number == 1
        assert "Going to School" in evs_chapters[0].chapter_title
        assert evs_chapters[0].subject == "EVS"
        assert evs_chapters[1].chapter_number == 2
        assert "Ear to Ear" in evs_chapters[1].chapter_title

        # 2. Test Chapter Lookup for Math teacher of Class 4
        math_chapters = await get_class_chapters(
            session=session,
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="Mathematics",
        )
        assert len(math_chapters) == 2
        assert math_chapters[0].chapter_number == 1
        assert "Building with Bricks" in math_chapters[0].chapter_title

        # 3. Test Chapter Chunks lookup
        ch1_chunks = await get_chapter_chunks(
            session=session,
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            chapter_number=1,
            subject="EVS",
        )
        assert len(ch1_chunks) >= 1
        assert "bamboo" in ch1_chunks[0].content

        # 4. Test Branch Isolation (Branch B querying Class 4 EVS gets 0 chunks)
        branch_b_chapters = await get_class_chapters(
            session=session,
            branch_name="LPS_VASUNDHARA",
            class_number=4,
            subject="EVS",
        )
        assert len(branch_b_chapters) == 0

        # 5. Test RAG Search for quiz generation
        rag_results = await search_chunks_for_rag(
            session=session,
            branch_name="LPS_KARKARDUMA",
            class_number=4,
            subject="EVS",
            query="bamboo bridge in Assam",
            top_k=3,
        )
        assert len(rag_results) > 0
        assert rag_results[0].chapter_number == 1
        assert "bamboo" in rag_results[0].content.lower()
        assert rag_results[0].score > 0.2

    await engine.dispose()
    print("[SUCCESS] All chunking, chapter extraction, branch isolation & RAG search tests passed successfully!")


if __name__ == "__main__":
    print("[test] Running unit test 1: splitting & overlap...")
    test_chunking_engine_splitting_and_overlap()
    print("[test] Running unit test 2: chapter extraction...")
    test_chapter_extraction()
    print("[test] Running integration test 3: database ingestion & RAG retrieval...")
    asyncio.run(test_db_chunking_ingestion_and_teacher_retrieval())
    print("[test] [SUCCESS] TEST SUITE COMPLETED WITHOUT ERRORS!")

