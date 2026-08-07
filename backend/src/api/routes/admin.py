"""
Admin dashboard routes (protected — admin role required).

GET  /admin/me  — admin profile

Note: Admin tasks beyond login are TBD and will be added in future sprints.
This stub ensures the role and protected endpoint pattern is already wired up.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.core.dependencies import get_current_admin
from src.models.admin import Admin

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


class AdminProfile(BaseModel):
    id: uuid.UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/me", response_model=AdminProfile, summary="Get admin profile")
async def get_admin_profile(admin: Admin = Depends(get_current_admin)):
    return AdminProfile.model_validate(admin)
