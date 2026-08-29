"""
Teacher dashboard routes (protected -- teacher role required).

GET  /teacher/me
GET  /teacher/classes
GET  /teacher/classes/{class_number}/{section}/students
GET  /teacher/classes/{class_number}/{section}/progress
GET  /teacher/classes/{class_number}/{section}/modules
GET  /teacher/classes/{class_number}/{section}/assignments
POST /teacher/classes/{class_number}/{section}/assignments/upload-pdf   (multipart)
POST /teacher/classes/{class_number}/{section}/assignments/ai-quiz
PATCH /teacher/assignments/{assignment_id}
DELETE /teacher/assignments/{assignment_id}
GET  /teacher/assignments/{assignment_id}/submissions
PATCH /teacher/assignments/{assignment_id}/submissions/{student_id}/score
POST /teacher/assignments/{assignment_id}/students/{student_id}/feedback
GET  /teacher/assignments/{assignment_id}/students/{student_id}/feedback
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_teacher
from src.models.teacher import Teacher
from src.schemas.teacher import (
    AssignmentCreateQuizRequest,
    AssignmentOut,
    AssignmentUpdateRequest,
    AssignmentQuizPreviewOut,
    FeedbackOut,
    FeedbackRequest,
    SetScoreRequest,
    SubmissionOut,
    TeacherClassOut,
    TeacherProfile,
)
from src.schemas.learning import ClassProgressOut
from src.schemas.student import StudentProfile
from src.schemas.module import ModuleOut
from src.schemas.chunk import ChapterOut, ChunkOut, RAGChunkSearchRequest, RAGSearchResult
from src.services import (
    teacher_service,
    module_service,
    chunk_service,
    learning_progress_service,
)

router = APIRouter(prefix="/teacher", tags=["Teacher Dashboard"])


# ── Profile ────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=TeacherProfile, summary="Get teacher profile")
async def get_teacher_profile(teacher: Teacher = Depends(get_current_teacher)):
    return TeacherProfile.model_validate(teacher)


# ── Assigned classes ───────────────────────────────────────────────────────────

@router.get(
    "/classes",
    response_model=list[TeacherClassOut],
    summary="List classes and subjects assigned to this teacher",
)
async def get_teacher_classes(
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    assignments = await teacher_service.get_assigned_classes(teacher, session)
    return [
        TeacherClassOut(
            id=a.id,
            teacher_id=a.teacher_id,
            class_number=a.class_number,
            section=a.section,
            subject=a.subject,
            label=f"{a.class_number}{a.section} • {a.subject}",
            assigned_at=a.assigned_at,
        )
        for a in assignments
    ]


@router.get(
    "/classes/{class_number}/{section}/students",
    response_model=list[StudentProfile],
    summary="List students in a class section",
)
async def get_class_students(
    class_number: int,
    section: str,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    await teacher_service.verify_teacher_class_access(teacher, class_number, section, session)
    students = await teacher_service.get_class_students(
        teacher.branch_name, class_number, section.upper(), session
    )
    return [StudentProfile.model_validate(s) for s in students]


@router.get(
    "/classes/{class_number}/{section}/progress",
    response_model=ClassProgressOut,
    summary="Learning-module progress for every student in a class section",
)
async def get_class_learning_progress(
    class_number: int,
    section: str,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    """
    Scoped twice over, both times from the token rather than the URL: the
    teacher must hold an assignment for this class+section, and the roster is
    read from their own branch. A class number the teacher is not assigned to
    is a 403 even if it exists, so student ids never have to be trusted from
    the frontend.
    """
    await teacher_service.verify_teacher_class_access(teacher, class_number, section, session)
    students = await teacher_service.get_class_students(
        teacher.branch_name, class_number, section.upper(), session
    )
    return await learning_progress_service.get_class_progress(
        students, class_number, section, session
    )


@router.get(
    "/classes/{class_number}/{section}/modules",
    response_model=list[ModuleOut],
    summary="List modules for a class (same as school view)",
)
async def get_class_modules(
    class_number: int,
    section: str,
    subject: Optional[str] = None,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    tca = await teacher_service.verify_teacher_class_access(teacher, class_number, section, session, subject=subject)
    target_subject = subject or (tca.subject if tca and tca.subject and tca.subject.lower() != "general" else None)
    return await module_service.get_class_modules(teacher.branch_name, class_number, session, subject=target_subject)


@router.get(
    "/classes/{class_number}/chapters",
    response_model=list[ChapterOut],
    summary="Get chapter breakdown for a class & subject seeded by branch admin",
    description="Subject teachers view their class chapters when creating tests or quizzes.",
)
async def get_class_chapters(
    class_number: int,
    subject: Optional[str] = None,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    return await chunk_service.get_class_chapters(
        session=session,
        branch_name=teacher.branch_name,
        class_number=class_number,
        subject=subject,
    )


@router.get(
    "/classes/{class_number}/chapters/{chapter_number}/chunks",
    response_model=list[ChunkOut],
    summary="Get all chunks for a specific chapter of a class & subject",
)
async def get_chapter_chunks(
    class_number: int,
    chapter_number: int,
    subject: Optional[str] = None,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    chunks = await chunk_service.get_chapter_chunks(
        session=session,
        branch_name=teacher.branch_name,
        class_number=class_number,
        chapter_number=chapter_number,
        subject=subject,
    )
    return [ChunkOut.model_validate(c) for c in chunks]


@router.post(
    "/rag/search-chunks",
    response_model=list[RAGSearchResult],
    summary="Search RAG chunks for quiz question generation",
    description="Filters chunks by teacher branch, class number, subject, and optional chapter numbers.",
)
async def search_rag_chunks(
    data: RAGChunkSearchRequest,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    return await chunk_service.search_chunks_for_rag(
        session=session,
        branch_name=teacher.branch_name,
        class_number=data.class_number,
        subject=data.subject,
        query=data.query,
        chapter_numbers=data.chapter_numbers,
        top_k=data.top_k,
    )


# ── Assignments ────────────────────────────────────────────────────────────────

@router.get(
    "/classes/{class_number}/{section}/assignments",
    response_model=list[AssignmentOut],
    summary="List assignments for a class section",
)
async def list_assignments(
    class_number: int,
    section: str,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    await teacher_service.verify_teacher_class_access(teacher, class_number, section, session)
    assignments = await teacher_service.list_assignments(teacher, class_number, section, session)
    return [AssignmentOut.model_validate(a) for a in assignments]


@router.post(
    "/classes/{class_number}/{section}/assignments/upload-pdf",
    response_model=AssignmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new PDF assignment (max 5 MB)",
)
async def create_pdf_assignment(
    class_number: int,
    section: str,
    title: Annotated[str, Form()],
    file: Annotated[UploadFile, File(description="PDF file (max 5 MB)")],
    subject: Annotated[Optional[str], Form()] = None,
    description: Annotated[Optional[str], Form()] = None,
    deadline_days: Annotated[Optional[int], Form()] = None,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    await teacher_service.verify_teacher_class_access(teacher, class_number, section, session, subject=subject)

    from src.schemas.teacher import AssignmentCreatePdfRequest
    data = AssignmentCreatePdfRequest(
        title=title,
        subject=subject,
        description=description,
        deadline_days=deadline_days,
    )
    asgn = await teacher_service.create_pdf_assignment(
        teacher, class_number, section, data, file, session
    )
    return AssignmentOut.model_validate(asgn)


@router.post(
    "/classes/{class_number}/{section}/assignments/ai-quiz",
    response_model=AssignmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create an AI quiz assignment from selected modules",
)
async def create_quiz_assignment(
    class_number: int,
    section: str,
    data: AssignmentCreateQuizRequest,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    await teacher_service.verify_teacher_class_access(teacher, class_number, section, session, subject=data.subject)
    asgn = await teacher_service.create_quiz_assignment(teacher, class_number, section, data, session)
    return AssignmentOut.model_validate(asgn)


@router.patch(
    "/assignments/{assignment_id}",
    response_model=AssignmentOut,
    summary="Update assignment title, description, or deadline",
)
async def update_assignment(
    assignment_id: uuid.UUID,
    data: AssignmentUpdateRequest,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    asgn = await teacher_service.update_assignment(assignment_id, teacher, data, session)
    return AssignmentOut.model_validate(asgn)


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an assignment (also removes Cloudinary file)",
)
async def delete_assignment(
    assignment_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    await teacher_service.delete_assignment(assignment_id, teacher, session)


@router.get(
    "/assignments/{assignment_id}/quiz-preview",
    response_model=AssignmentQuizPreviewOut,
    summary="Preview RAG-generated quiz questions for an AI quiz assignment",
)
async def preview_assignment_quiz(
    assignment_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    return await teacher_service.get_assignment_quiz_preview(assignment_id, teacher, session)


# ── Progress / Submissions ─────────────────────────────────────────────────────

@router.get(
    "/assignments/{assignment_id}/submissions",
    response_model=list[SubmissionOut],
    summary="List all student submissions for an assignment",
)
async def get_submissions(
    assignment_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    from sqlmodel import select
    from src.models.student import Student

    submissions = await teacher_service.get_submissions(assignment_id, teacher, session)
    result = []
    for sub in submissions:
        student = await session.get(Student, sub.student_id)
        out = SubmissionOut(
            id=sub.id,
            student_id=sub.student_id,
            student_unique_number=sub.student_unique_number,
            student_name=None,
            student_email=student.email if student else None,
            score=sub.score,
            max_score=sub.max_score,
            attempted_at=sub.attempted_at,
            last_attempted_at=sub.last_attempted_at,
        )
        result.append(out)
    return result


@router.patch(
    "/assignments/{assignment_id}/submissions/{student_id}/score",
    response_model=SubmissionOut,
    summary="Enter or update a student score for a submission",
)
async def set_score(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    data: SetScoreRequest,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    from src.models.student import Student
    sub = await teacher_service.set_submission_score(
        assignment_id, student_id, data.score, data.max_score, teacher, session
    )
    student = await session.get(Student, sub.student_id)
    return SubmissionOut(
        id=sub.id,
        student_id=sub.student_id,
        student_unique_number=sub.student_unique_number,
        student_name=None,
        student_email=student.email if student else None,
        score=sub.score,
        max_score=sub.max_score,
        attempted_at=sub.attempted_at,
        last_attempted_at=sub.last_attempted_at,
    )


# ── Feedback ───────────────────────────────────────────────────────────────────

@router.post(
    "/assignments/{assignment_id}/students/{student_id}/feedback",
    response_model=FeedbackOut,
    summary="Create or update feedback for a student on an assignment",
)
async def post_feedback(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    data: FeedbackRequest,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    fb = await teacher_service.create_or_update_feedback(
        assignment_id, student_id, teacher, data.feedback_text, session
    )
    return FeedbackOut.model_validate(fb)


@router.get(
    "/assignments/{assignment_id}/students/{student_id}/feedback",
    response_model=Optional[FeedbackOut],
    summary="Get teacher feedback for a student on an assignment",
)
async def get_feedback(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    teacher: Teacher = Depends(get_current_teacher),
    session: AsyncSession = Depends(get_session),
):
    fb = await teacher_service.get_feedback(assignment_id, student_id, session)
    if not fb:
        return None
    return FeedbackOut.model_validate(fb)
