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
import random
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
    AssignmentAttempt,
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
    AssignmentQuizPreviewOut,
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
    
    mod_ids_str = json.dumps(data.module_ids) if data.module_ids else None
    chap_nums_str = json.dumps(data.chapter_numbers) if data.chapter_numbers else None

    asgn = Assignment(
        teacher_id=teacher.id,
        branch_name=teacher.branch_name,
        class_number=class_number,
        section=section.upper(),
        subject=data.subject.strip() if data.subject else None,
        title=data.title,
        description=data.description,
        assignment_type="ai_quiz",
        module_ids=mod_ids_str,
        chapter_numbers=chap_nums_str,
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

async def get_student_assignments(
    student: Student, session: AsyncSession, include_expired: bool = False
) -> list[Assignment]:
    if student.class_number is None or student.section is None:
        return []
    return await _get_class_assignments(
        student.branch_name, student.class_number, student.section, session, include_expired=include_expired
    )


async def get_assignment_quiz_for_student(
    assignment_id: uuid.UUID,
    student: Student,
    session: AsyncSession,
) -> AssignmentQuizPreviewOut:
    asgn = await session.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    if asgn.is_locked or (asgn.deadline_at and asgn.deadline_at < datetime.utcnow()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This assignment has expired and is no longer available.",
        )

    # Check student's previous attempts to identify weak topics for adaptive question selection
    attempts_stmt = select(AssignmentAttempt).where(
        AssignmentAttempt.assignment_id == assignment_id,
        AssignmentAttempt.student_id == student.id,
    ).order_by(AssignmentAttempt.attempt_number.desc())
    res = await session.execute(attempts_stmt)
    past_attempts = list(res.scalars().all())

    attempt_count = len(past_attempts) + 1
    rng_seed = f"{student.id}_{assignment_id}_{attempt_count}"
    rng = random.Random(rng_seed)

    weak_chapters = []
    past_wrong_texts = set()
    if past_attempts:
        latest = past_attempts[0]
        if latest.answers_json:
            try:
                prev_answers = json.loads(latest.answers_json)
                for ans in prev_answers:
                    if not ans.get("is_correct", False):
                        if ans.get("chapter_title"):
                            weak_chapters.append(ans.get("chapter_title"))
                        if ans.get("question_text"):
                            past_wrong_texts.add(ans.get("question_text"))
            except Exception:
                pass

    chapter_nums = []
    if getattr(asgn, "chapter_numbers", None):
        try:
            chapter_nums = json.loads(asgn.chapter_numbers)
        except Exception:
            pass

    from src.models.chunk import DocumentChunk
    from src.ai.rag_quiz_generator import generate_rag_quiz_questions

    stmt = select(DocumentChunk).where(
        (DocumentChunk.branch_name == student.branch_name) | (DocumentChunk.branch_name == "SELF"),
        DocumentChunk.class_number == asgn.class_number,
    )
    if chapter_nums:
        stmt = stmt.where(DocumentChunk.chapter_number.in_(chapter_nums))
    if asgn.subject and asgn.subject.strip().lower() not in ("general", "all", "none", ""):
        stmt = stmt.where(DocumentChunk.subject.ilike(f"%{asgn.subject.strip()}%"))

    res = await session.execute(stmt.order_by(DocumentChunk.chapter_number, DocumentChunk.chunk_index))
    chunks = list(res.scalars().all())

    if not chunks:
        fb_stmt = select(DocumentChunk).where(
            (DocumentChunk.branch_name == student.branch_name) | (DocumentChunk.branch_name == "SELF"),
            DocumentChunk.class_number == asgn.class_number,
        ).limit(20)
        res_fb = await session.execute(fb_stmt)
        chunks = list(res_fb.scalars().all())

    # Request a larger candidate pool of questions
    questions = generate_rag_quiz_questions(chunks, count=12)

    # If retaking after failure, prioritize questions student got wrong previously or shuffle
    if attempt_count > 1:
        if past_wrong_texts:
            questions.sort(key=lambda q: 0 if q.question_text in past_wrong_texts else (1 if q.chapter_title in set(weak_chapters) else 2))
        else:
            rng.shuffle(questions)

    # Shuffle options A, B, C, D for every question dynamically per attempt
    final_questions = []
    for i, q in enumerate(questions[:8], 1):
        if q.options and len(q.options) >= 2:
            correct_text = q.options[q.correct_option_index] if 0 <= q.correct_option_index < len(q.options) else q.correct_answer
            shuffled_options = list(q.options)
            rng.shuffle(shuffled_options)
            
            new_correct_idx = 0
            for opt_idx, opt_str in enumerate(shuffled_options):
                if opt_str == correct_text:
                    new_correct_idx = opt_idx
                    break

            q.options = shuffled_options
            q.correct_option_index = new_correct_idx
            q.correct_answer = correct_text

        q.question_number = i
        final_questions.append(q)

    questions = final_questions

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


async def submit_student_quiz_attempt(
    assignment_id: uuid.UUID,
    student: Student,
    answers: list,
    session: AsyncSession,
) -> dict:
    asgn = await session.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    if asgn.is_locked or (asgn.deadline_at and asgn.deadline_at < datetime.utcnow()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This assignment deadline has passed. Quiz submissions are closed.",
        )

    total_q = len(answers)
    if total_q == 0:
        raise HTTPException(status_code=400, detail="No answers provided.")

    correct_q = 0
    formatted_answers = []
    for a in answers:
        is_corr = (a.selected_option_index == a.correct_option_index)
        if is_corr:
            correct_q += 1
        formatted_answers.append({
            "question_id": a.question_id,
            "question_text": a.question_text,
            "selected_option_index": a.selected_option_index,
            "correct_option_index": a.correct_option_index,
            "is_correct": is_corr,
            "chapter_title": a.chapter_title or "",
            "explanation": a.explanation or "",
        })

    max_score = 100.0
    percentage = (correct_q / total_q) * 100.0
    score = (correct_q / total_q) * max_score
    pass_thresh = asgn.pass_percentage or 60.0
    is_passed = percentage >= pass_thresh
    status_str = "passed" if is_passed else "failed"

    attempts_stmt = select(AssignmentAttempt).where(
        AssignmentAttempt.assignment_id == assignment_id,
        AssignmentAttempt.student_id == student.id,
    )
    res = await session.execute(attempts_stmt)
    existing_attempts = list(res.scalars().all())
    next_attempt_num = len(existing_attempts) + 1

    attempt = AssignmentAttempt(
        assignment_id=assignment_id,
        student_id=student.id,
        student_unique_number=student.unique_number,
        attempt_number=next_attempt_num,
        score=score,
        max_score=max_score,
        percentage=percentage,
        is_passed=is_passed,
        status=status_str,
        answers_json=json.dumps(formatted_answers),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    session.add(attempt)
    await session.commit()
    await session.refresh(attempt)

    # Update or create AssignmentSubmission summary
    sub_stmt = select(AssignmentSubmission).where(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == student.id,
    )
    sub_res = await session.execute(sub_stmt)
    sub = sub_res.scalar_one_or_none()
    if not sub:
        sub = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            score=score,
            max_score=max_score,
            percentage=percentage,
            is_passed=is_passed,
            total_attempts=next_attempt_num,
            status=status_str,
            attempted_at=datetime.utcnow(),
            last_attempted_at=datetime.utcnow(),
        )
    else:
        if is_passed or (sub.percentage and sub.percentage >= pass_thresh):
            sub.is_passed = True
            sub.status = "passed"
        else:
            sub.is_passed = False
            sub.status = "failed"

        if sub.score is None or score >= sub.score:
            sub.score = score
            sub.percentage = percentage

        sub.total_attempts = max(sub.total_attempts, next_attempt_num)
        sub.last_attempted_at = datetime.utcnow()

    session.add(sub)
    await session.commit()
    await session.refresh(sub)

    # Trigger background AI advice generation
    from src.ai.quiz_advice_service import generate_quiz_attempt_advice
    try:
        await generate_quiz_attempt_advice(attempt.id, session)
        await session.refresh(attempt)
    except Exception:
        pass

    # Record learning event so XP, points, and activity streaks update on dashboards
    try:
        from src.models.learning import LearningEvent, LearningEventType
        from src.services.learning_progress_service import module_key_for
        sub_subject = asgn.subject or "General"
        sub_class_num = asgn.class_number or student.class_number or 1
        m_key = module_key_for(sub_subject, sub_class_num)
        ev = LearningEvent(
            client_event_id=f"asgn_attempt:{attempt.id}",
            student_id=student.id,
            event_type=LearningEventType.QUIZ_COMPLETED.value,
            module_key=m_key,
            subject=sub_subject,
            class_number=sub_class_num,
            occurred_at=attempt.completed_at or datetime.utcnow(),
            received_at=datetime.utcnow(),
            detail={
                "assignment_id": str(assignment_id),
                "attempt_number": next_attempt_num,
                "score": score,
                "percentage": percentage,
                "is_passed": is_passed,
                "title": asgn.title,
            },
        )
        session.add(ev)
        await session.commit()
    except Exception:
        pass

    msg = "Quiz passed successfully! Excellent work." if is_passed else f"Quiz result: {percentage:.1f}%. Below {pass_thresh:.0f}% pass mark. You can re-attempt with adapted questions!"

    from src.schemas.teacher import AssignmentAttemptOut
    return {
        "attempt": AssignmentAttemptOut.model_validate(attempt),
        "score": score,
        "max_score": max_score,
        "percentage": percentage,
        "is_passed": is_passed,
        "status": status_str,
        "ai_feedback": attempt.ai_feedback,
        "message": msg,
    }


async def upload_student_response_pdf(
    assignment_id: uuid.UUID,
    student: Student,
    file: UploadFile,
    session: AsyncSession,
) -> AssignmentSubmission:
    asgn = await session.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
    if asgn.is_locked or (asgn.deadline_at and asgn.deadline_at < datetime.utcnow()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This assignment deadline has passed. File uploads are locked.",
        )

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed for response upload.")

    raw = await file.read()
    if len(raw) > _ASSIGNMENT_PDF_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Response PDF cannot exceed {_ASSIGNMENT_PDF_MAX_MB} MB.")

    from src.utils.file_utils import save_local_pdf
    pdf_url = save_local_pdf(raw, subfolder="student_responses")

    attempts_stmt = select(AssignmentAttempt).where(
        AssignmentAttempt.assignment_id == assignment_id,
        AssignmentAttempt.student_id == student.id,
    )
    res = await session.execute(attempts_stmt)
    existing_attempts = list(res.scalars().all())
    next_attempt_num = len(existing_attempts) + 1

    attempt = AssignmentAttempt(
        assignment_id=assignment_id,
        student_id=student.id,
        student_unique_number=student.unique_number,
        attempt_number=next_attempt_num,
        status="submitted",
        response_pdf_url=pdf_url,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    session.add(attempt)

    sub_stmt = select(AssignmentSubmission).where(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == student.id,
    )
    sub_res = await session.execute(sub_stmt)
    sub = sub_res.scalar_one_or_none()
    if not sub:
        sub = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            student_unique_number=student.unique_number,
            total_attempts=next_attempt_num,
            status="submitted",
            response_pdf_url=pdf_url,
            attempted_at=datetime.utcnow(),
            last_attempted_at=datetime.utcnow(),
        )
    else:
        sub.total_attempts = next_attempt_num
        sub.status = "submitted"
        sub.response_pdf_url = pdf_url
        sub.last_attempted_at = datetime.utcnow()

    session.add(sub)
    await session.commit()
    await session.refresh(sub)
    return sub


async def get_student_assignment_attempts(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    session: AsyncSession,
) -> list[AssignmentAttempt]:
    stmt = select(AssignmentAttempt).where(
        AssignmentAttempt.assignment_id == assignment_id,
        AssignmentAttempt.student_id == student_id,
    ).order_by(AssignmentAttempt.attempt_number.desc())
    res = await session.execute(stmt)
    return list(res.scalars().all())


async def get_student_all_test_results(
    student: Student,
    session: AsyncSession,
) -> list[dict]:
    if student.class_number is None or student.section is None:
        return []

    assignments = await _get_class_assignments(
        student.branch_name, student.class_number, student.section, session, include_expired=True
    )

    results = []
    for asgn in assignments:
        sub_stmt = select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == asgn.id,
            AssignmentSubmission.student_id == student.id,
        )
        sub_res = await session.execute(sub_stmt)
        sub = sub_res.scalar_one_or_none()

        attempts = await get_student_assignment_attempts(asgn.id, student.id, session)
        fb = await get_feedback(asgn.id, student.id, session)

        results.append({
            "assignment": asgn,
            "submission": sub,
            "attempts": attempts,
            "teacher_feedback": fb,
        })
    return results


async def student_submit(
    assignment_id: uuid.UUID, student: Student, session: AsyncSession
) -> AssignmentSubmission:
    asgn = await session.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")
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
    result = await session.execute(stmt)
    assignments = list(result.scalars().all())
    if not assignments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not assigned to Class {class_number}{section.upper()}.",
        )

    if subject and subject.strip().lower() not in ("general", "all", "none", "null", ""):
        match = next(
            (
                a for a in assignments
                if a.subject and (a.subject.strip().lower() == subject.strip().lower() or a.subject.strip().lower() == "general")
            ),
            None,
        )
        if not match:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are not assigned to Class {class_number}{section.upper()} for '{subject}'.",
            )
        return match

    return assignments[0]


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
    branch_name: str,
    class_number: int,
    section: str,
    session: AsyncSession,
    include_expired: bool = False,
) -> list[Assignment]:
    result = await session.execute(
        select(Assignment)
        .where(
            Assignment.branch_name == branch_name,
            Assignment.class_number == class_number,
            Assignment.section == section.upper(),
        )
        .order_by(Assignment.created_at.desc())
    )
    assignments = list(result.scalars().all())

    now = datetime.utcnow()
    valid_assignments = []
    for a in assignments:
        is_expired = False
        if a.deadline_at and a.deadline_at < now:
            is_expired = True
            if not a.is_locked:
                a.is_locked = True
                session.add(a)

        if include_expired or not is_expired:
            valid_assignments.append(a)

    await session.commit()
    return valid_assignments



async def get_assignment_quiz_preview(
    assignment_id: uuid.UUID,
    teacher: Teacher,
    session: AsyncSession,
) -> AssignmentQuizPreviewOut:
    asgn = await _get_assignment_or_403(assignment_id, teacher, session)

    chapter_nums = []
    if getattr(asgn, "chapter_numbers", None):
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
