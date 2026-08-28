"""
Admin dashboard routes (protected — admin role required).

GET  /admin/me                                   — admin profile

School registration approvals (Registrations → School Requests):
GET  /admin/school-requests                      — every school registration request
POST /admin/school-requests/{claim_id}/approve   — grant School Admin access
POST /admin/school-requests/{claim_id}/reject    — refuse; no access is granted

The requests listed here are the SchoolAdminClaim records produced by the
existing school verification flow — no separate registration store exists.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_admin
from src.models.admin import Admin
from src.models.school_verification import (
    ClaimStatus,
    SchoolAdminClaim,
    SchoolDirectory,
)
from src.schemas.school_verification import (
    ClaimDecisionRequest,
    SchoolRequestListItem,
)
from src.services import school_verification_service as svc

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


class AdminProfile(BaseModel):
    id: uuid.UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/me", response_model=AdminProfile, summary="Get admin profile")
async def get_admin_profile(admin: Admin = Depends(get_current_admin)):
    return AdminProfile.model_validate(admin)


# ── Registrations → School Requests ───────────────────────────────────────────

import json

def _request_out(
    claim: SchoolAdminClaim, record: Optional[SchoolDirectory]
) -> SchoolRequestListItem:
    class_subjects = None
    if claim.class_subjects_json:
        try:
            class_subjects = json.loads(claim.class_subjects_json)
        except Exception:
            class_subjects = None

    return SchoolRequestListItem(
        id=claim.id,
        school_name=record.school_name if record else claim.udise_code,
        udise_code=claim.udise_code,
        state=record.state if record else None,
        district=record.district if record else None,
        board=record.board if record else None,
        management=record.management if record else None,
        full_name=claim.full_name,
        designation=claim.designation,
        official_email=claim.official_email,
        phone_number=claim.phone_number,
        phone_verified=claim.phone_verified,
        email_verified=claim.email_verified,
        authority_status=claim.authority_status,
        authority_notes=claim.authority_notes,
        evidence_url=claim.evidence_url,
        status=claim.status,
        decision_reason=claim.decision_reason,
        reviewed_by=claim.reviewed_by,
        reviewed_at=claim.reviewed_at,
        created_at=claim.created_at,
        class_subjects=class_subjects,
        # Only ever true once approved AND an account exists for the claimant.
        admin_access_granted=(
            claim.status == ClaimStatus.APPROVED and claim.school_id is not None
        ),
    )



@router.get(
    "/school-requests",
    response_model=list[SchoolRequestListItem],
    summary="School registration requests awaiting a platform decision",
)
async def list_school_requests(
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by pending | approved | rejected",
    ),
    _: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    rows = await svc.list_registration_requests(session, status_filter)
    return [_request_out(claim, record) for claim, record in rows]


@router.post(
    "/school-requests/{claim_id}/approve",
    response_model=SchoolRequestListItem,
    summary="Approve a school registration and grant School Admin access",
)
async def approve_school_request(
    claim_id: uuid.UUID,
    data: ClaimDecisionRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    claim = await svc.get_registration_request(claim_id, session)
    await svc.approve_claim(
        session,
        claim,
        actor=f"superadmin:{admin.email}",
        reason=data.reason or "Approved by platform administrator.",
    )
    record = await session.get(SchoolDirectory, claim.directory_id)
    return _request_out(claim, record)


@router.post(
    "/school-requests/{claim_id}/reject",
    response_model=SchoolRequestListItem,
    summary="Reject a school registration — no School Admin access is granted",
)
async def reject_school_request(
    claim_id: uuid.UUID,
    data: ClaimDecisionRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    claim = await svc.get_registration_request(claim_id, session)
    await svc.reject_claim(
        session,
        claim,
        actor=f"superadmin:{admin.email}",
        reason=data.reason or "Rejected by platform administrator.",
    )
    record = await session.get(SchoolDirectory, claim.directory_id)
    return _request_out(claim, record)
