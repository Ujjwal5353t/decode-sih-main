"""
Import all SQLModel table models here so that SQLModel.metadata
is fully populated when create_all() is called at startup.
"""
from src.models.contact import ContactInquiry  # noqa: F401
from src.models.admin import Admin  # noqa: F401
from src.models.module import Module  # noqa: F401
from src.models.ncert import NCERTBook  # noqa: F401
from src.models.parent import Parent, ParentChildLink  # noqa: F401
from src.models.publisher import Publisher, PublisherSubject  # noqa: F401
from src.models.school import BranchCounter, School  # noqa: F401
from src.models.school_subject import SchoolClassSubject  # noqa: F401
from src.models.school_verification import (  # noqa: F401
    SchoolAdminClaim,
    SchoolDirectory,
    SchoolVerificationEvent,
)
from src.models.student import Student  # noqa: F401
from src.models.teacher import (  # noqa: F401
    Teacher,
    TeacherClassAssignment,
    Assignment,
    AssignmentSubmission,
    TeacherFeedback,
)
from src.models.chunk import DocumentChunk  # noqa: F401

