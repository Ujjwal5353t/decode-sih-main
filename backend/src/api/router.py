from fastapi import APIRouter

from src.api.routes import admin, auth, ncert, parent, school, student

api_router = APIRouter()

# Each sub-router is included here. The prefixes/tags are defined per-router.
api_router.include_router(auth.router)
api_router.include_router(school.router)
api_router.include_router(student.router)
api_router.include_router(parent.router)
api_router.include_router(admin.router)
api_router.include_router(ncert.router)
