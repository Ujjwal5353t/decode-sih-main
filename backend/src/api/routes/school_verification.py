"""
School Registration & Verification.

GET  /school-verification/lookup                  — official record by UDISE code
GET  /school-verification/search                  — official record by name/state/district
POST /school-verification/email/send              — send email verification code
POST /school-verification/email/verify            — verify email code
POST /school-verification/claims                  — submit an administrator claim
GET  /school-verification/claims/{id}             — claim status (drives the status screen)
POST /school-verification/claims/{id}/evidence    — attach supporting authority document
POST /school-verification/claims/{id}/activate    — exchange an approved claim for a token
GET  /school-verification/owner/requests          — verified owner's pending requests
POST /school-verification/owner/requests/{id}/approve
POST /school-verification/owner/requests/{id}/reject

Phone verification reuses the existing OTP endpoints (POST /auth/otp/send,
POST /auth/otp/verify) — no second OTP system is introduced here.
"""

import json
import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_school
from src.core.security import create_access_token
from src.models.school import School
from src.models.school_verification import (
    AuthorityStatus,
    ClaimRoute,
    ClaimStatus,
    SchoolAdminClaim,
    SchoolDirectory,
)
from src.schemas.school_verification import (
    ClaimCreatedResponse,
    ClaimDecisionRequest,
    ClaimStatusOut,
    ClaimTokenResponse,
    ClassSubjectPublisherItem,
    CreateClaimRequest,
    EmailVerificationResponse,
    OwnerClaimListItem,
    PublisherWithSubjectsOut,
    SchoolRecordOut,
    SendEmailCodeRequest,
    VerifyEmailCodeRequest,
)

from src.services import school_verification_service as svc
from src.services.email_verification_service import (
    generate_and_send_email_code,
    verify_email_code,
)
from src.utils.file_utils import upload_pdf

router = APIRouter(prefix="/school-verification", tags=["School Verification"])


# ── Step 1 & 2: school identity ───────────────────────────────────────────────

@router.get(
    "/lookup",
    response_model=SchoolRecordOut,
    summary="Look up the official school record by UDISE code",
)
async def lookup_school(
    udise_code: str = Query(..., min_length=3, max_length=20),
    session: AsyncSession = Depends(get_session),
):
    record = await svc.lookup_by_udise(udise_code, session)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this UDISE code. Check the code or search by name.",
        )
    return SchoolRecordOut.model_validate(record)


@router.get(
    "/search",
    response_model=list[SchoolRecordOut],
    summary="Search the official school directory by name, state and district",
)
async def search_schools(
    name: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    if not any([name, state, district]):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide a school name, state or district to search.",
        )
    records = await svc.search_directory(
        session, name=name, state=state, district=district
    )
    return [SchoolRecordOut.model_validate(r) for r in records]


# ── Step 5: email verification ────────────────────────────────────────────────

@router.post(
    "/email/send",
    response_model=EmailVerificationResponse,
    summary="Send an email verification code (printed to the server console)",
)
async def send_email_code(data: SendEmailCodeRequest):
    generate_and_send_email_code(str(data.email))
    return EmailVerificationResponse(
        status="sent",
        message=f"Verification code sent to {data.email}. Check your backend server console for the code!",
        email=str(data.email),
    )


@router.post(
    "/email/verify",
    response_model=EmailVerificationResponse,
    summary="Verify an email verification code",
)
async def verify_email(data: VerifyEmailCodeRequest):
    if not verify_email_code(str(data.email), data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check the backend console.",
        )
    return EmailVerificationResponse(
        status="verified",
        message="Email verified successfully.",
        email=str(data.email),
        verified=True,
    )


# ── Publishers ────────────────────────────────────────────────────────────────

@router.get(
    "/publishers",
    response_model=list[PublisherWithSubjectsOut],
    summary="List all publishers with their available subjects",
)
async def list_publishers(
    session: AsyncSession = Depends(get_session),
):
    return await svc.get_all_publishers_with_subjects(session)


# ── Serialisation helper ──────────────────────────────────────────────────────

async def _claim_out(
    claim: SchoolAdminClaim, session: AsyncSession
) -> ClaimStatusOut:
    record = await session.get(SchoolDirectory, claim.directory_id)

    class_subjects = None
    if claim.class_subjects_json:
        try:
            class_subjects = [
                ClassSubjectPublisherItem(**item)
                for item in json.loads(claim.class_subjects_json)
            ]
        except Exception:
            class_subjects = None

    return ClaimStatusOut(
        id=claim.id,
        udise_code=claim.udise_code,
        school_name=record.school_name if record else claim.udise_code,
        full_name=claim.full_name,
        designation=claim.designation,
        official_email=claim.official_email,
        phone_number=claim.phone_number,
        school_identity_verified=record is not None,
        phone_verified=claim.phone_verified,
        email_verified=claim.email_verified,
        authority_status=claim.authority_status,
        route=claim.route,
        status=claim.status,
        authority_notes=claim.authority_notes,
        decision_reason=claim.decision_reason,
        evidence_url=claim.evidence_url,
        class_subjects=class_subjects,
        created_at=claim.created_at,
        # The single source of truth for "may this person use the dashboard".
        admin_access_granted=(
            claim.status == ClaimStatus.APPROVED and claim.school_id is not None
        ),
    )


# ── Step 3-6: claims ──────────────────────────────────────────────────────────

@router.post(
    "/claims",
    response_model=ClaimCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an administrator claim for a school",
)
async def create_claim(
    data: CreateClaimRequest,
    session: AsyncSession = Depends(get_session),
):
    claim, record, owner_school = await svc.create_claim(
        session,
        udise_code=data.udise_code,
        full_name=data.full_name,
        designation=data.designation,
        official_email=str(data.official_email),
        phone_number=data.phone_number,
        password=data.password,
        class_subjects=data.class_subjects,
    )


    if owner_school:
        message = (
            f"{record.school_name} already has a verified administrator. "
            "Your request has been sent to them for approval."
        )
    elif claim.authority_status == AuthorityStatus.VERIFIED:
        message = (
            "Your authority matched the official school record. Your registration "
            "is now with the VidyaSetu team for final approval."
        )
    elif claim.authority_status == AuthorityStatus.FAILED:
        message = "We could not verify your authority to administer this school."
    else:
        message = (
            "Your school has been identified. Your registration has been sent to "
            "the VidyaSetu team for approval."
        )

    return ClaimCreatedResponse(
        claim=await _claim_out(claim, session), message=message
    )


@router.get(
    "/claims/{claim_id}",
    response_model=ClaimStatusOut,
    summary="Current status of a verification request",
)
async def get_claim(
    claim_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    claim = await svc.get_claim_or_404(claim_id, session)
    return await _claim_out(claim, session)


@router.post(
    "/claims/{claim_id}/evidence",
    response_model=ClaimStatusOut,
    summary="Attach a supporting authority document (never auto-approves)",
)
async def upload_evidence(
    claim_id: uuid.UUID,
    file: Annotated[UploadFile, File(description="Authority document (PDF, max 50 MB)")],
    session: AsyncSession = Depends(get_session),
):
    claim = await svc.get_claim_or_404(claim_id, session)
    if claim.status != ClaimStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been decided.",
        )

    upload = await upload_pdf(file, folder="decode-sih/school-authority")
    claim.evidence_url = upload["url"]
    # Evidence moves the claim into human review — it never approves it.
    claim.authority_status = AuthorityStatus.MANUAL_REVIEW
    claim.authority_notes = (
        (claim.authority_notes or "") + " Supporting document submitted for review."
    ).strip()
    session.add(claim)
    await svc.record_event(
        session, claim.id, "evidence_uploaded", upload["url"], claim.official_email
    )
    return await _claim_out(claim, session)


@router.post(
    "/claims/{claim_id}/activate",
    response_model=ClaimTokenResponse,
    summary="Exchange an approved claim for a School Admin session",
)
async def activate_claim(
    claim_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    claim = await svc.get_claim_or_404(claim_id, session)

    if claim.status == ClaimStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request was rejected. School admin access has not been granted.",
        )
    if claim.status != ClaimStatus.APPROVED or claim.school_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your authority is still being verified. School admin access is not available yet.",
        )

    school = await session.get(School, claim.school_id)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="School account not found."
        )

    token = create_access_token(
        subject=str(school.id),
        role="school",
        extra_claims={"branch": school.branch_name},
    )
    return ClaimTokenResponse(access_token=token)


# ── Path A: the existing verified owner decides ───────────────────────────────

@router.get(
    "/owner/requests",
    response_model=list[OwnerClaimListItem],
    summary="Administrator requests awaiting this school owner's decision",
)
async def list_owner_requests(
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    claims = await svc.list_claims_for_school(school, session)
    return [
        OwnerClaimListItem(
            id=c.id,
            full_name=c.full_name,
            designation=c.designation,
            official_email=c.official_email,
            phone_number=c.phone_number,
            school_name=school.school_name,
            status=c.status,
            created_at=c.created_at,
        )
        for c in claims
    ]


async def _owner_claim_or_404(
    claim_id: uuid.UUID, school: School, session: AsyncSession
) -> SchoolAdminClaim:
    claim = await svc.get_claim_or_404(claim_id, session)
    if (
        claim.route != ClaimRoute.OWNER_APPROVAL
        or not school.udise_code
        or claim.udise_code.upper() != school.udise_code.upper()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request does not belong to your school.",
        )
    return claim


@router.post(
    "/owner/requests/{claim_id}/approve",
    response_model=ClaimStatusOut,
    summary="Approve an administrator request for your school",
)
async def approve_request(
    claim_id: uuid.UUID,
    data: ClaimDecisionRequest,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    claim = await _owner_claim_or_404(claim_id, school, session)
    await svc.approve_claim(
        session, claim, actor=f"owner:{school.id}", reason=data.reason
    )
    return await _claim_out(claim, session)


@router.post(
    "/owner/requests/{claim_id}/reject",
    response_model=ClaimStatusOut,
    summary="Reject an administrator request for your school",
)
async def reject_request(
    claim_id: uuid.UUID,
    data: ClaimDecisionRequest,
    school: School = Depends(get_current_school),
    session: AsyncSession = Depends(get_session),
):
    claim = await _owner_claim_or_404(claim_id, school, session)
    await svc.reject_claim(
        session, claim, actor=f"owner:{school.id}", reason=data.reason
    )
    return await _claim_out(claim, session)
