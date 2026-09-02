from fastapi import APIRouter

from src.api.routes import (
    admin, auth, contact, files, ncert, parent, quiz, school, school_verification, student, teacher, translation,
)

api_router = APIRouter()

# Each sub-router is included here. The prefixes/tags are defined per-router.
api_router.include_router(auth.router)
api_router.include_router(school.router)
api_router.include_router(student.router)
api_router.include_router(parent.router)
api_router.include_router(admin.router)
api_router.include_router(ncert.router)
api_router.include_router(contact.router)
api_router.include_router(teacher.router)
api_router.include_router(files.router)
api_router.include_router(school_verification.router)
api_router.include_router(quiz.router)
api_router.include_router(translation.router)
