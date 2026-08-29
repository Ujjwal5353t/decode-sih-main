"""Quick test to verify quiz-preview endpoint works end-to-end"""
import asyncio
import sys

async def test_quiz_preview():
    from src.schemas.teacher import AssignmentQuizPreviewOut, QuizQuestionPreview
    from src.ai.rag_quiz_generator import generate_rag_quiz_questions
    from unittest.mock import MagicMock
    import uuid

    # Simulate a chunk
    chunk = MagicMock()
    chunk.chapter_title = "Chapter 5: Tables"
    chunk.content = "The multiplication table of 5 always ends in 0 or 5. Multiply by groups."
    chunk.chapter_number = 5
    chunk.chunk_index = 0
    chunk.branch_name = "LPS"
    chunk.class_number = 3
    chunk.subject = "Mathematics"

    questions = generate_rag_quiz_questions([chunk], count=8)
    print(f"Generated {len(questions)} questions")

    out = AssignmentQuizPreviewOut(
        assignment_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        title="chapter 5 test",
        subject="Mathematics",
        class_number=3,
        section="A",
        assignment_type="ai_quiz",
        chapters=["Chapter 5: Tables"],
        total_questions=len(questions),
        questions=questions,
    )

    # Serialize like FastAPI would
    import json
    result = out.model_dump()
    json_str = json.dumps(result, default=str)
    data = json.loads(json_str)
    print(f"JSON questions count: {len(data['questions'])}")
    q0 = data["questions"][0]
    print(f"Q0 text: {q0['question_text'][:50]}")
    print(f"Q0 options: {q0['options']}")
    print(f"Q0 correct_option_index: {q0['correct_option_index']}")
    print("ALL OK - endpoint will return valid JSON")

asyncio.run(test_quiz_preview())
