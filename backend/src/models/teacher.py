"""
Teacher domain models.

Teacher                -- teacher account linked to a school branch
TeacherClassAssignment -- which class sections are assigned to a teacher by school admin
Assignment             -- an assignment created by a teacher for a class section
AssignmentSubmission   -- a student submission/attempt record for an assignment
TeacherFeedback        -- feedback from a teacher on a student submission
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Teacher(SQLModel, table=True):
    """
    One account per phone_number.
    Teachers are linked to a specific school branch.
    They receive class assignments from the school (branch) admin.
    Until assigned a class, they can log in but see an unassigned state.
    """

    __tablename__ = "teachers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=200)
    phone_number: str = Field(unique=True, index=True, max_length=20)
    school_name: str = Field(max_length=200)
    branch_name: str = Field(foreign_key="schools.branch_name", index=True, max_length=120)
    password_hash: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=_utcnow)


class TeacherClassAssignment(SQLModel, table=True):
    """
    Links a teacher to a specific class+section and subject within their branch.
    School admin assigns/de-assigns classes and subjects to teachers.
    Every subject within a class can only have 1 teacher assigned at a time.
    """

    __tablename__ = "teacher_class_assignments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    teacher_id: uuid.UUID = Field(foreign_key="teachers.id", index=True)
    branch_name: str = Field(foreign_key="schools.branch_name", max_length=120)
    class_number: int = Field(ge=1, le=5)
    section: str = Field(max_length=10)
    subject: str = Field(max_length=100, index=True)
    assigned_at: datetime = Field(default_factory=_utcnow)


class Assignment(SQLModel, table=True):
    """
    An assignment created by a teacher for a specific class+section.

    assignment_type:
      pdf_upload -- teacher uploaded a PDF (max 5 MB)
      ai_quiz    -- teacher selected modules; module PDFs shown to students

    module_ids: JSON-encoded list of Module UUID strings (ai_quiz only)
    deadline_at: UTC datetime after which is_locked is enforced
    is_locked:  True when deadline passes; students cannot submit after lock
    """

    __tablename__ = "assignments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    teacher_id: uuid.UUID = Field(foreign_key="teachers.id", index=True)
    branch_name: str = Field(foreign_key="schools.branch_name", max_length=120)
    class_number: int = Field(ge=1, le=5)
    section: str = Field(max_length=10)
    subject: Optional[str] = Field(default=None, max_length=100, index=True)
    title: str = Field(max_length=300)
    description: Optional[str] = Field(default=None, max_length=2000)
    assignment_type: str = Field(max_length=20)

    file_url: Optional[str] = Field(default=None)
    cloudinary_public_id: Optional[str] = Field(default=None)
    module_ids: Optional[str] = Field(default=None)

    deadline_at: Optional[datetime] = Field(default=None)
    is_locked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class AssignmentSubmission(SQLModel, table=True):
    """
    A student submission record for an assignment.
    Score is entered manually by the teacher from the Progress tab.
    """

    __tablename__ = "assignment_submissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    assignment_id: uuid.UUID = Field(foreign_key="assignments.id", index=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    student_unique_number: str = Field(
        foreign_key="students.unique_number", max_length=20, index=True
    )
    score: Optional[float] = Field(default=None)
    max_score: Optional[float] = Field(default=100.0)
    attempted_at: datetime = Field(default_factory=_utcnow)
    last_attempted_at: datetime = Field(default_factory=_utcnow)


class TeacherFeedback(SQLModel, table=True):
    """
    Feedback from a teacher on a specific student submission.
    One record per (assignment_id, student_id) pair -- upserted on update.
    """

    __tablename__ = "teacher_feedbacks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    assignment_id: uuid.UUID = Field(foreign_key="assignments.id", index=True)
    student_id: uuid.UUID = Field(foreign_key="students.id", index=True)
    teacher_id: uuid.UUID = Field(foreign_key="teachers.id", index=True)
    feedback_text: str = Field(max_length=2000)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
