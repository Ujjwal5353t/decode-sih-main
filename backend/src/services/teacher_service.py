"""
Teacher service — all business logic for the teacher domain.

Covers:
  - Teacher registration and login (phone-based)
  - Class assignment queries
  - Assignment CRUD (pdf_upload and ai_quiz types)
  - Submission tracking and score entry
  - Teacher feedback (create / update)
  - Student-facing: list assignments, mark submitted, view feedback
"""
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password, verify_password
from src.models.school import School
from src.models.student import Student
from src.models.teacher import (
    Assignment,
    AssignmentSubmission,
    Teacher,
    TeacherClassAssignment,
    TeacherFeedback,
)
from src.schemas.auth import TeacherLoginRequest, TeacherRegisterRequest
from src.schemas.teacher import (
    AssignClassRequest,
    AssignmentCreateQuizRequest,
    AssignmentCreatePdfRequest,
    AssignmentQuizPreviewOut,
    AssignmentUpdateRequest,
)
from src.utils.file_utils import delete_cloudinary_asset

_ASSIGNMENT_PDF_MAX_MB = 5
_ASSIGNMENT_PDF_MAX_BYTES = _ASSIGNMENT_PDF_MAX_MB * 1024 * 1024


def _normalize_subject_key(s: str) -> str:
    """Return a canonical subject key that strips book/series names in parentheses
    and maps common synonyms.  Used for semantic deduplication.
    E.g.  'English (Marigold / Mridang)' -> 'english'
          'Environmental Studies (EVS)'   -> 'evs'
          'Mathematics (Math-Magic)'      -> 'mathematics'
    """
    if not s:
        return ""
    clean = s.lower().strip()
    # Strip everything inside parentheses
    import re
    base = re.sub(r"\s*\([^)]*\)", "", clean).strip()
    # Map synonyms
    if "environmental" in base or "evs" in base:
        return "evs"
    if "mathematics" in base or "math" in base:
        return "mathematics"
    if "english" in base:
        return "english"
    if "hindi" in base:
        return "hindi"
    if "science" in base and "social" not in base:
        return "science"
    if "social" in base:
        return "social studies"
    if "computer" in base:
        return "computer"
    if "art" in base:
        return "art"
    if "urdu" in base:
        return "urdu"
    return base


# ── Auth ───────────────────────────────────────────────────────────────────────

from sqlalchemy import func, or_
from src.services.otp_service import normalize_phone

async def register_teacher(data: TeacherRegisterRequest, session: AsyncSession) -> Teacher:
    clean_phone = normalize_phone(data.phone_number)
    clean_branch = data.branch_name.strip()

    # Check branch exists (case-insensitive)
    branch = await session.execute(
        select(School).where(func.lower(School.branch_name) == clean_branch.lower())
    )
    school = branch.scalar_one_or_none()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"School branch '{data.branch_name}' not found. Please select a valid branch.",
        )

    # Check phone uniqueness
    existing = await session.execute(
        select(Teacher).where(
            or_(
                Teacher.phone_number == clean_phone,
                Teacher.phone_number == data.phone_number.strip(),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A teacher with this phone number is already registered.",
        )

    teacher = Teacher(
        name=data.name.strip(),
        phone_number=clean_phone,
        school_name=school.school_name,
        branch_name=school.branch_name,
        password_hash=hash_password(data.password),
    )
    session.add(teacher)
    await session.commit()
    await session.refresh(teacher)
    return teacher


async def login_teacher(data: TeacherLoginRequest, session: AsyncSession) -> Teacher:
    clean_phone = normalize_phone(data.phone_number)
    clean_branch = data.branch_name.strip().lower()

    result = await session.execute(
        select(Teacher).where(
            or_(
                Teacher.phone_number == clean_phone,
                Teacher.phone_number == data.phone_number.strip(),
            ),
            func.lower(Teacher.branch_name) == clean_branch,
        )
    )
    teacher = result.scalar_one_or_none()
    if not teacher or not verify_password(data.password, teacher.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number, branch, or password.",
        )
    return teacher


# ── Class assignments ──────────────────────────────────────────────────────────

async def get_assigned_classes(
    teacher: Teacher, session: AsyncSession
) -> list[TeacherClassAssignment]:
    result = await session.execute(
        select(TeacherClassAssignment)
        .where(TeacherClassAssignment.teacher_id == teacher.id)
        .order_by(
            TeacherClassAssignment.class_number,
            TeacherClassAssignment.section,
            TeacherClassAssignment.subject,
        )
    )
    return list(result.scalars().all())


async def get_class_students(
    branch_name: str, class_number: int, section: str, session: AsyncSession
) -> list[Student]:
    result = await session.execute(
        select(Student).where(
            Student.branch_name == branch_name,
            Student.class_number == class_number,
            Student.section == section,
        ).order_by(Student.unique_number)
    )
    return list(result.scalars().all())


# ── Assignments — teacher creates ─────────────────────────────────────────────

def _deadline_from_days(days: Optional[int]) -> Optional[datetime]:
    if days is None or days < 1:
        return None
    return datetime.utcnow() + timedelta(days=days)


async def create_pdf_assignment(
    teacher: Teacher,
    class_number: int,
    section: str,
    data: AssignmentCreatePdfRequest,
    file: UploadFile,
    session: AsyncSession,
) -> Assignment:
    await verify_teacher_class_access(teacher, class_number, section.upper(), session, subject=data.subject)

    # Validate file type and size
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted for assignment upload.",
        )
    raw = await file.read()
    if len(raw) > _ASSIGNMENT_PDF_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Assignment PDF cannot exceed {_ASSIGNMENT_PDF_MAX_MB} MB.",
        )

    # Save assignment PDF locally for reliable browser viewing
    from src.utils.file_utils import save_local_pdf
    url = save_local_pdf(raw, subfolder="assignments")

    asgn = Assignment(
        teacher_id=teacher.id,
        branch_name=teacher.branch_name,
        class_number=class_number,
        section=section.upper(),
        subject=data.subject.strip() if data.subject else None,
        title=data.title,
        description=data.description,
        assignment_type="pdf_upload",
        file_url=url,
        cloudinary_public_id=url,
        deadline_at=_deadline_from_days(data.deadline_days),
    )
    session.add(asgn)
    await session.commit()
    await session.refresh(asgn)
    return asgn


async def create_quiz_assignment(
    teacher: Teacher,
    class_number: int,
    section: str,
    data: AssignmentCreateQuizRequest,
    session: AsyncSession,
) -> Assignment:
    await verify_teacher_class_access(teacher, class_number, section.upper(), session, subject=data.subject)
    asgn = Assignment(
        teacher_id=teacher.id,
        branch_name=teacher.branch_name,
        class_number=class_number,
        section=section.upper(),
        subject=data.subject.strip() if data.subject else None,
        title=data.title,
        description=data.description,
        assignment_type="ai_quiz",
        module_ids=json.dumps(data.module_ids),
        deadline_at=_deadline_from_days(data.deadline_days),
    )
    session.add(asgn)
    await session.commit()
    await session.refresh(asgn)
    return asgn


async def list_assignments(
    teacher: Teacher,
    class_number: int,
    section: str,
    session: AsyncSession,
) -> list[Assignment]:
    assignments = await _get_class_assignments(
        teacher.branch_name, class_number, section.upper(), session
    )
    # Auto-lock overdue assignments
    now = datetime.utcnow()
    for a in assignments:
        if not a.is_locked and a.deadline_at and a.deadline_at < now:
            a.is_locked = True
            session.add(a)
    await session.commit()
    return assignments


async def update_assignment(
    assignment_id: uuid.UUID,
    teacher: Teacher,
    data: AssignmentUpdateRequest,
    session: AsyncSession,
) -> Assignment:
    asgn = await _get_assignment_or_403(assignment_id, teacher, session)

    if data.title is not None:
        asgn.title = data.title
    if data.description is not None:
        asgn.description = data.description
    if data.deadline_days is not None:
        if data.deadline_days == 0:
            asgn.deadline_at = None
        else:
            asgn.deadline_at = _deadline_from_days(data.deadline_days)
    asgn.updated_at = datetime.utcnow()
    session.add(asgn)
    await session.commit()
    await session.refresh(asgn)
    return asgn


async def delete_assignment(
    assignment_id: uuid.UUID, teacher: Teacher, session: AsyncSession
) -> None:
    asgn = await _get_assignment_or_403(assignment_id, teacher, session)
    if asgn.cloudinary_public_id:
        delete_cloudinary_asset(asgn.cloudinary_public_id)
    await session.delete(asgn)
    await session.commit()


# ── Submissions / Progress ─────────────────────────────────────────────────────

async def get_submissions(
    assignment_id: uuid.UUID, teacher: Teacher, session: AsyncSession
) -> list[AssignmentSubmission]:
    # Verify teacher owns the assignment
    await _get_assignment_or_403(assignment_id, teacher, session)
    result = await session.execute(
        select(AssignmentSubmission)
        .where(AssignmentSubmission.assignment_id == assignment_id)
        .order_by(AssignmentSubmission.last_attempted_at.desc())
    )
    return list(result.scalars().all())


async def set_submission_score(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    score: float,
    max_score: float,
    teacher: Teacher,
    session: AsyncSession,
) -> AssignmentSubmission:
    await _get_assignment_or_403(assignment_id, teacher, session)
    result = await session.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student_id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submission found for this student on this assignment.",
        )
    sub.score = score
    sub.max_score = max_score
    sub.last_attempted_at = datetime.utcnow()
    session.add(sub)
    await session.commit()
    await session.refresh(sub)
    return sub


# ── Feedback ───────────────────────────────────────────────────────────────────

async def create_or_update_feedback(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    teacher: Teacher,
    feedback_text: str,
    session: AsyncSession,
) -> TeacherFeedback:
    await _get_assignment_or_403(assignment_id, teacher, session)

    result = await session.execute(
        select(TeacherFeedback).where(
            TeacherFeedback.assignment_id == assignment_id,
            TeacherFeedback.student_id == student_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.feedback_text = feedback_text
        existing.teacher_id = teacher.id
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return existing

    fb = TeacherFeedback(
        assignment_id=assignment_id,
        student_id=student_id,
        teacher_id=teacher.id,
        feedback_text=feedback_text,
    )
    session.add(fb)
    await session.commit()
    await session.refresh(fb)
    return fb


async def get_feedback(
    assignment_id: uuid.UUID, student_id: uuid.UUID, session: AsyncSession
) -> Optional[TeacherFeedback]:
    result = await session.execute(
        select(TeacherFeedback).where(
            TeacherFeedback.assignment_id == assignment_id,
            TeacherFeedback.student_id == student_id,
        )
    )
    return result.scalar_one_or_none()


# ── Student-facing ─────────────────────────────────────────────────────────────

async def get_student_assignments(student: Student, session: AsyncSession) -> list[Assignment]:
    if student.class_number is None or student.section is None:
        return []
    assignments = await _get_class_assignments(
        student.branch_name, student.class_number, student.section, session
    )
    # Auto-lock overdue
    now = datetime.utcnow()
    for a in assignments:
        if not a.is_locked and a.deadline_at and a.deadline_at < now:
            a.is_locked = True
            session.add(a)
    await session.commit()
    return assignments


async def student_submit(
    assignment_id: uuid.UUID, student: Student, session: AsyncSession
) -> AssignmentSubmission:
    asgn = await session.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    # Auto-lock check
    if not asgn.is_locked and asgn.deadline_at and asgn.deadline_at < datetime.utcnow():
        asgn.is_locked = True
        session.add(asgn)
    if asgn.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This assignment is locked. The deadline has passed.",
        )

    result = await session.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == student.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.last_attempted_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return existing

    sub = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=student.id,
        student_unique_number=student.unique_number,
    )
    session.add(sub)
    await session.commit()
    await session.refresh(sub)
    return sub


# ── School admin — teacher management ─────────────────────────────────────────

async def list_branch_teachers(branch_name: str, session: AsyncSession) -> list[Teacher]:
    result = await session.execute(
        select(Teacher)
        .where(Teacher.branch_name == branch_name)
        .order_by(Teacher.name)
    )
    return list(result.scalars().all())


async def assign_class_to_teacher(
    teacher_id: uuid.UUID,
    branch_name: str,
    data: AssignClassRequest,
    session: AsyncSession,
) -> TeacherClassAssignment:
    # Teacher must belong to same branch
    teacher = await session.get(Teacher, teacher_id)
    if not teacher or teacher.branch_name != branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found in this branch.",
        )

    clean_sec = data.section.strip().upper()
    clean_subj = data.subject.strip()
    if not clean_subj:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Subject is required. A teacher cannot be assigned to a class without a subject.",
        )

    target_key = _normalize_subject_key(clean_subj)

    # Edge Case / Core Rule: A single subject in a class section can ONLY have 1 teacher assigned at a time.
    # Fetch ALL assignments for this class+section in this branch and use semantic matching.
    all_existing_result = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.branch_name == branch_name,
            TeacherClassAssignment.class_number == data.class_number,
            TeacherClassAssignment.section == clean_sec,
        )
    )
    all_existing = all_existing_result.scalars().all()
    for existing_assignment in all_existing:
        existing_key = _normalize_subject_key(existing_assignment.subject or "")
        if existing_key and target_key and existing_key == target_key:
            if existing_assignment.teacher_id == teacher_id:
                # Same teacher already has this subject — upgrade the subject name to the new canonical form
                existing_assignment.subject = clean_subj
                session.add(existing_assignment)
                await session.commit()
                await session.refresh(existing_assignment)
                return existing_assignment
            else:
                assigned_teacher = await session.get(Teacher, existing_assignment.teacher_id)
                teacher_name = assigned_teacher.name if assigned_teacher else "another teacher"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Class {data.class_number}{clean_sec} for '{clean_subj}' is already assigned to {teacher_name}. Only 1 teacher can be assigned per subject in a class.",
                )

    # If the teacher already has a legacy 'General' placeholder for this class section, upgrade it
    legacy_general = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher_id,
            TeacherClassAssignment.branch_name == branch_name,
            TeacherClassAssignment.class_number == data.class_number,
            TeacherClassAssignment.section == clean_sec,
            func.lower(TeacherClassAssignment.subject) == "general",
        )
    )
    general_rec = legacy_general.scalar_one_or_none()
    if general_rec:
        general_rec.subject = clean_subj
        session.add(general_rec)
        await session.commit()
        await session.refresh(general_rec)
        return general_rec

    tca = TeacherClassAssignment(
        teacher_id=teacher_id,
        branch_name=branch_name,
        class_number=data.class_number,
        section=clean_sec,
        subject=clean_subj,
    )
    session.add(tca)
    await session.commit()
    await session.refresh(tca)
    return tca


async def deassign_class_from_teacher(
    teacher_id: uuid.UUID,
    branch_name: str,
    class_number: Optional[int] = None,
    section: Optional[str] = None,
    subject: Optional[str] = None,
    assignment_id: Optional[uuid.UUID] = None,
    session: AsyncSession = None,
) -> None:
    teacher = await session.get(Teacher, teacher_id)
    if not teacher or teacher.branch_name != branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found in this branch.",
        )

    if assignment_id:
        tca = await session.get(TeacherClassAssignment, assignment_id)
        if not tca or tca.teacher_id != teacher_id or tca.branch_name != branch_name:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class assignment not found.",
            )
        await session.delete(tca)
        await session.commit()
        return

    stmt = select(TeacherClassAssignment).where(
        TeacherClassAssignment.teacher_id == teacher_id,
        TeacherClassAssignment.branch_name == branch_name,
    )
    if class_number is not None:
        stmt = stmt.where(TeacherClassAssignment.class_number == class_number)
    if section:
        stmt = stmt.where(TeacherClassAssignment.section == section.strip().upper())
    if subject:
        stmt = stmt.where(func.lower(TeacherClassAssignment.subject) == subject.strip().lower())

    result = await session.execute(stmt)
    assignments = list(result.scalars().all())
    if not assignments:
        sec_str = section.strip().upper() if section else ""
        subj_str = f" for {subject}" if subject else ""
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No assignment found for Class {class_number}{sec_str}{subj_str}.",
        )

    for a in assignments:
        await session.delete(a)
    await session.commit()


# ── Private helpers ────────────────────────────────────────────────────────────

def _verify_teacher_owns_class(
    teacher: Teacher, class_number: int, section: str, session: AsyncSession
) -> None:
    """Sync check — async version done separately when needed."""
    pass  # checked at route level via verify_teacher_class_access


async def verify_teacher_class_access(
    teacher: Teacher,
    class_number: int,
    section: str,
    session: AsyncSession,
    subject: Optional[str] = None,
) -> TeacherClassAssignment:
    stmt = select(TeacherClassAssignment).where(
        TeacherClassAssignment.teacher_id == teacher.id,
        TeacherClassAssignment.class_number == class_number,
        TeacherClassAssignment.section == section.upper(),
    )
    if subject:
        stmt = stmt.where(func.lower(TeacherClassAssignment.subject) == subject.strip().lower())

    result = await session.execute(stmt)
    tca = result.scalars().first()
    if not tca:
        sub_msg = f" for '{subject}'" if subject else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not assigned to Class {class_number}{section.upper()}{sub_msg}.",
        )
    return tca


async def _get_assignment_or_403(
    assignment_id: uuid.UUID, teacher: Teacher, session: AsyncSession
) -> Assignment:
    asgn = await session.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    if asgn.teacher_id != teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this assignment.",
        )
    return asgn


async def _get_class_assignments(
    branch_name: str, class_number: int, section: str, session: AsyncSession
) -> list[Assignment]:
    result = await session.execute(
        select(Assignment).where(
            Assignment.branch_name == branch_name,
            Assignment.class_number == class_number,
            Assignment.section == section,
        ).order_by(Assignment.created_at.desc())
    )
    return list(result.scalars().all())


async def get_assignment_quiz_preview(
    assignment_id: uuid.UUID, teacher: Teacher, session: AsyncSession
) -> AssignmentQuizPreviewOut:
    asgn = await _get_assignment_or_403(assignment_id, teacher, session)

    chapter_nums = []
    if hasattr(asgn, "chapter_numbers") and asgn.chapter_numbers:
        try:
            chapter_nums = json.loads(asgn.chapter_numbers)
        except Exception:
            pass

    from src.models.chunk import DocumentChunk
    from src.ai.rag_quiz_generator import generate_rag_quiz_questions

    stmt = select(DocumentChunk).where(
        (DocumentChunk.branch_name == teacher.branch_name) | (DocumentChunk.branch_name == "SELF"),
        DocumentChunk.class_number == asgn.class_number,
    )
    if chapter_nums:
        stmt = stmt.where(DocumentChunk.chapter_number.in_(chapter_nums))
    if asgn.subject and asgn.subject.strip().lower() not in ("general", "all", "none", ""):
        stmt = stmt.where(DocumentChunk.subject.ilike(f"%{asgn.subject.strip()}%"))

    stmt = stmt.order_by(DocumentChunk.chapter_number, DocumentChunk.chunk_index)
    res = await session.execute(stmt)
    chunks = list(res.scalars().all())

    if not chunks:
        fb_stmt = select(DocumentChunk).where(
            (DocumentChunk.branch_name == teacher.branch_name) | (DocumentChunk.branch_name == "SELF"),
            DocumentChunk.class_number == asgn.class_number,
        ).limit(20)
        res_fb = await session.execute(fb_stmt)
        chunks = list(res_fb.scalars().all())

    questions = generate_rag_quiz_questions(chunks, count=8)

    chapter_titles = list(dict.fromkeys([c.chapter_title for c in chunks if c.chapter_title]))
    if not chapter_titles:
        chapter_titles = [f"Chapter {n}" for n in chapter_nums] if chapter_nums else ["General Chapter Overview"]

    return AssignmentQuizPreviewOut(
        assignment_id=asgn.id,
        title=asgn.title,
        subject=asgn.subject,
        class_number=asgn.class_number,
        section=asgn.section,
        assignment_type=asgn.assignment_type,
        chapters=chapter_titles,
        total_questions=len(questions),
        questions=questions,
    )
