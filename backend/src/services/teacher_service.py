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
    AssignmentUpdateRequest,
)
from src.utils.file_utils import delete_cloudinary_asset

_ASSIGNMENT_PDF_MAX_MB = 5
_ASSIGNMENT_PDF_MAX_BYTES = _ASSIGNMENT_PDF_MAX_MB * 1024 * 1024


# ── Auth ───────────────────────────────────────────────────────────────────────

async def register_teacher(data: TeacherRegisterRequest, session: AsyncSession) -> Teacher:
    # Check branch exists
    branch = await session.execute(
        select(School).where(School.branch_name == data.branch_name)
    )
    school = branch.scalar_one_or_none()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"School branch '{data.branch_name}' not found.",
        )

    # Check phone uniqueness
    existing = await session.execute(
        select(Teacher).where(Teacher.phone_number == data.phone_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A teacher with this phone number is already registered.",
        )

    teacher = Teacher(
        name=data.name,
        phone_number=data.phone_number,
        school_name=school.school_name,
        branch_name=data.branch_name,
        password_hash=hash_password(data.password),
    )
    session.add(teacher)
    await session.commit()
    await session.refresh(teacher)
    return teacher


async def login_teacher(data: TeacherLoginRequest, session: AsyncSession) -> Teacher:
    result = await session.execute(
        select(Teacher).where(
            Teacher.phone_number == data.phone_number,
            Teacher.branch_name == data.branch_name,
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
        .order_by(TeacherClassAssignment.class_number, TeacherClassAssignment.section)
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
    _verify_teacher_owns_class(teacher, class_number, section.upper(), session)

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
    asgn = Assignment(
        teacher_id=teacher.id,
        branch_name=teacher.branch_name,
        class_number=class_number,
        section=section.upper(),
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

    # Check not already assigned
    existing = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher_id,
            TeacherClassAssignment.class_number == data.class_number,
            TeacherClassAssignment.section == data.section,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Teacher is already assigned to Class {data.class_number}{data.section}.",
        )

    tca = TeacherClassAssignment(
        teacher_id=teacher_id,
        branch_name=branch_name,
        class_number=data.class_number,
        section=data.section,
    )
    session.add(tca)
    await session.commit()
    await session.refresh(tca)
    return tca


async def deassign_class_from_teacher(
    teacher_id: uuid.UUID,
    branch_name: str,
    class_number: int,
    section: str,
    session: AsyncSession,
) -> None:
    teacher = await session.get(Teacher, teacher_id)
    if not teacher or teacher.branch_name != branch_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found in this branch.",
        )
    result = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher_id,
            TeacherClassAssignment.class_number == class_number,
            TeacherClassAssignment.section == section.upper(),
        )
    )
    tca = result.scalar_one_or_none()
    if not tca:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No assignment found for Class {class_number}{section.upper()}.",
        )
    await session.delete(tca)
    await session.commit()


# ── Private helpers ────────────────────────────────────────────────────────────

def _verify_teacher_owns_class(
    teacher: Teacher, class_number: int, section: str, session: AsyncSession
) -> None:
    """Sync check — async version done separately when needed."""
    pass  # checked at route level via verify_teacher_class_access


async def verify_teacher_class_access(
    teacher: Teacher, class_number: int, section: str, session: AsyncSession
) -> TeacherClassAssignment:
    result = await session.execute(
        select(TeacherClassAssignment).where(
            TeacherClassAssignment.teacher_id == teacher.id,
            TeacherClassAssignment.class_number == class_number,
            TeacherClassAssignment.section == section.upper(),
        )
    )
    tca = result.scalar_one_or_none()
    if not tca:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not assigned to Class {class_number}{section.upper()}.",
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
