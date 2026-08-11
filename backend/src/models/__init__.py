"""
Import all SQLModel table models here so that SQLModel.metadata
is fully populated when create_all() is called at startup.
"""
from src.models.contact import ContactInquiry  # noqa: F401
from src.models.admin import Admin  # noqa: F401
from src.models.module import Module  # noqa: F401
from src.models.ncert import NCERTBook  # noqa: F401
from src.models.parent import Parent, ParentChildLink  # noqa: F401
from src.models.school import BranchCounter, School  # noqa: F401
from src.models.student import Student  # noqa: F401
