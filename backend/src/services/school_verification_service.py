"""
School registration & verification.

The flow keeps three questions apart and never lets one answer another:

  1. SCHOOL IDENTITY  — does this school exist?      (school_directory)
  2. PERSON IDENTITY  — is this person reachable?    (otp + email code)
  3. AUTHORITY        — may they administer it?      (evaluate_authority)

A School account is only ever created by `activate_claim`, which requires an
approved claim. Nothing else in this module grants access.

Who approves depends on the route:

  FIRST_ADMIN     — a new school registration. Always waits for a Super Admin
                    decision; the authority evaluation is evidence for that
                    reviewer, never an auto-approval.
  OWNER_APPROVAL  — an extra administrator for a school the platform already
                    approved. That school's verified owner decides.
"""

import json
import re
import uuid
from datetime import datetime
from typing import Optional, Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.core.security import hash_password
from src.models.publisher import Publisher, PublisherSubject
from src.models.school import BranchCounter, School
from src.models.school_subject import SchoolClassSubject
from src.models.school_verification import (
    AuthorityStatus,
    ClaimRoute,
    ClaimStatus,
    SchoolAdminClaim,
    SchoolDirectory,
    SchoolVerificationEvent,
    SchoolVerificationStatus,
)
from src.schemas.school_verification import (
    ClassSubjectPublisherItem,
    PublisherWithSubjectsOut,
)
from src.services.email_verification_service import (
    is_email_verified,
    normalize_email,
)
from src.services.otp_service import is_phone_verified, normalize_phone


# Designations that assert head-of-institution authority. Used only to decide
# how much scrutiny a claim needs — never as proof of authority on its own.
HEAD_DESIGNATIONS = {"Principal", "Head Teacher", "School Director"}

ALLOWED_DESIGNATIONS = [
    "Principal",
    "Head Teacher",
    "School Director",
    "School Administrator",
    "Authorized School Representative",
    "Other",
]


# ── Audit ─────────────────────────────────────────────────────────────────────

async def record_event(
    session: AsyncSession,
    claim_id: uuid.UUID,
    event: str,
    detail: Optional[str] = None,
    actor: Optional[str] = None,
) -> None:
    session.add(
        SchoolVerificationEvent(
            claim_id=claim_id, event=event, detail=detail, actor=actor
        )
    )


# ── 1. School identity ────────────────────────────────────────────────────────

async def lookup_by_udise(
    udise_code: str, session: AsyncSession
) -> Optional[SchoolDirectory]:
    code = (udise_code or "").strip().upper()
    if not code:
        return None
    result = await session.execute(
        select(SchoolDirectory).where(
            func.upper(SchoolDirectory.udise_code) == code
        )
    )
    return result.scalar_one_or_none()


async def search_directory(
    session: AsyncSession,
    name: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = 20,
) -> Sequence[SchoolDirectory]:
    """Name/state/district search over the official directory."""
    stmt = select(SchoolDirectory)
    if name and name.strip():
        stmt = stmt.where(SchoolDirectory.school_name.ilike(f"%{name.strip()}%"))  # type: ignore[attr-defined]
    if state and state.strip():
        stmt = stmt.where(SchoolDirectory.state.ilike(f"%{state.strip()}%"))  # type: ignore[attr-defined]
    if district and district.strip():
        stmt = stmt.where(SchoolDirectory.district.ilike(f"%{district.strip()}%"))  # type: ignore[attr-defined]
    stmt = stmt.order_by(SchoolDirectory.school_name).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_verified_owner_school(
    udise_code: str, session: AsyncSession
) -> Optional[School]:
    """The existing School account that already owns this UDISE code, if any."""
    code = (udise_code or "").strip().upper()
    if not code:
        return None
    result = await session.execute(
        select(School).where(
            func.upper(School.udise_code) == code,
            School.verification_status == SchoolVerificationStatus.VERIFIED,
        )
    )
    school = result.scalars().first()
    if school:
        return school

    record = await lookup_by_udise(code, session)
    if record and record.official_email:
        res = await session.execute(
            select(School).where(
                func.lower(School.email) == record.official_email.strip().lower(),
                School.verification_status == SchoolVerificationStatus.VERIFIED,
            )
        )
        return res.scalars().first()
    return None


# ── 3. Authority ──────────────────────────────────────────────────────────────

async def evaluate_authority(
    claim: SchoolAdminClaim,
    record: SchoolDirectory,
    session: AsyncSession,
) -> tuple[str, str]:
    """
    Decide whether this claimant has demonstrated authority over this school.

    Returns (AuthorityStatus, human-readable notes).

    The only thing that establishes authority automatically is control of a
    contact channel the school itself published in the official record. A valid
    UDISE code, a passed OTP, a verified mailbox, a self-selected designation
    and an uploaded document are identity/contact signals — individually and
    together they yield MANUAL_REVIEW, never VERIFIED.
    """
    notes: list[str] = []

    claim_email = normalize_email(claim.official_email)
    claim_phone = normalize_phone(claim.phone_number)
    official_email = normalize_email(record.official_email or "")
    official_phone = normalize_phone(record.official_phone or "")

    # ── Impersonation check ───────────────────────────────────────────────────
    # If these contacts are the published contacts of a *different* school,
    # the claim contradicts the official record.
    conflict = await session.execute(
        select(SchoolDirectory).where(
            SchoolDirectory.id != record.id,
            or_(
                func.lower(SchoolDirectory.official_email) == claim_email,
                SchoolDirectory.official_phone == claim_phone,
            ),
        )
    )
    if conflict.scalars().first():
        notes.append(
            "Contact details are the published contacts of a different school."
        )
        return AuthorityStatus.FAILED, " ".join(notes)

    # ── Strong signal: control of an officially published channel ─────────────
    email_matches = bool(official_email) and claim_email == official_email
    phone_matches = bool(official_phone) and claim_phone == official_phone

    if email_matches:
        notes.append("Verified email matches the school's official email on record.")
    if phone_matches:
        notes.append("Verified phone matches the school's official phone on record.")

    # ── Supporting signals — recorded, never sufficient alone ─────────────────
    if record.head_name and claim.full_name.strip().lower() == record.head_name.strip().lower():
        notes.append("Claimant name matches the head of institution on record.")
    if claim.designation in HEAD_DESIGNATIONS:
        notes.append(f"Claims head-of-institution designation ({claim.designation}).")
    if claim.evidence_url:
        notes.append("Supporting authority document supplied (requires review).")

    if email_matches or phone_matches:
        return AuthorityStatus.VERIFIED, " ".join(notes)

    notes.append(
        "No verified contact matched the official school record — "
        "authority could not be established automatically."
    )
    return AuthorityStatus.MANUAL_REVIEW, " ".join(notes)


# ── 2. Claim creation ─────────────────────────────────────────────────────────

async def create_claim(
    session: AsyncSession,
    *,
    udise_code: str,
    full_name: str,
    designation: str,
    official_email: str,
    phone_number: str,
    password: str,
    class_subjects: Optional[list[ClassSubjectPublisherItem]] = None,
) -> tuple[SchoolAdminClaim, SchoolDirectory, Optional[School]]:
    """
    Create an administrator claim.

    Requires that both contact channels were already verified in this session —
    the claim cannot be created on unverified identity.
    """
    record = await lookup_by_udise(udise_code, session)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this UDISE code. Search for your school first.",
        )

    if designation not in ALLOWED_DESIGNATIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please choose one of the listed designations.",
        )

    if not is_phone_verified(phone_number):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your phone number before submitting the claim.",
        )
    if not is_email_verified(official_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your official school email before submitting the claim.",
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters.",
        )

    # ── Save any new publishers and subjects to the database ──────────────────
    class_subjects_json: Optional[str] = None
    if class_subjects:
        class_subjects_data = []
        for item in class_subjects:
            pub_name = (item.publisher_name or "").strip()
            if not pub_name:
                continue

            valid_subjects = [s.strip() for s in item.subjects if s and s.strip()]

            # Check / insert publisher
            try:
                pub_res = await session.execute(
                    select(Publisher).where(func.lower(Publisher.name) == pub_name.lower())
                )
                pub = pub_res.scalar_one_or_none()
                if not pub:
                    pub = Publisher(name=pub_name)
                    session.add(pub)
                    await session.flush()

                # Check / insert subjects under this publisher
                for sub_name in valid_subjects:
                    sub_res = await session.execute(
                        select(PublisherSubject).where(
                            PublisherSubject.publisher_id == pub.id,
                            func.lower(PublisherSubject.subject_name) == sub_name.lower(),
                        )
                    )
                    if not sub_res.scalar_one_or_none():
                        session.add(
                            PublisherSubject(
                                publisher_id=pub.id,
                                subject_name=sub_name,
                            )
                        )
            except Exception as pub_err:
                print(f"[create_claim] publisher persistence notice: {pub_err}")

            if valid_subjects:
                class_subjects_data.append({
                    "class_number": item.class_number,
                    "publisher_name": pub_name,
                    "subjects": valid_subjects,
                })

        if class_subjects_data:
            class_subjects_json = json.dumps(class_subjects_data)

    # ── Existing school protection ────────────────────────────────────────────
    owner_school = await get_verified_owner_school(record.udise_code, session)
    route = ClaimRoute.OWNER_APPROVAL if owner_school else ClaimRoute.FIRST_ADMIN


    # Never let the same person queue duplicate claims for the same school.
    duplicate = await session.execute(
        select(SchoolAdminClaim).where(
            SchoolAdminClaim.udise_code == record.udise_code,
            func.lower(SchoolAdminClaim.official_email) == normalize_email(official_email),
            SchoolAdminClaim.status == ClaimStatus.PENDING,
        )
    )
    if duplicate.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending request for this school.",
        )

    claim = SchoolAdminClaim(
        udise_code=record.udise_code,
        directory_id=record.id,
        school_id=owner_school.id if owner_school else None,
        full_name=full_name.strip(),
        designation=designation,
        official_email=normalize_email(official_email),
        phone_number=normalize_phone(phone_number),
        phone_verified=True,
        email_verified=True,
        password_hash=hash_password(password),
        class_subjects_json=class_subjects_json,
        route=route,
        status=ClaimStatus.PENDING,
    )


    # Authority is only evaluated on the first-admin path. When a verified owner
    # exists, that owner is the authority and decides directly.
    if route == ClaimRoute.FIRST_ADMIN:
        authority_status, notes = await evaluate_authority(claim, record, session)
        claim.authority_status = authority_status
        claim.authority_notes = notes
    else:
        claim.authority_status = AuthorityStatus.UNVERIFIED
        claim.authority_notes = "Pending approval by the school's verified owner."

    session.add(claim)
    await session.flush()

    await record_event(
        session, claim.id, "claim_created",
        f"route={route}; authority={claim.authority_status}", claim.official_email,
    )

    # A first-admin claim is NEVER activated automatically, however strong the
    # authority signals are. Every new school registration waits for a Super
    # Admin decision — the authority evaluation above is the evidence they read,
    # not a substitute for their approval.
    if route == ClaimRoute.FIRST_ADMIN:
        await record_event(
            session, claim.id, "awaiting_superadmin_review",
            f"authority={claim.authority_status}",
        )

    return claim, record, owner_school


# ── Decisions ─────────────────────────────────────────────────────────────────

async def approve_claim(
    session: AsyncSession,
    claim: SchoolAdminClaim,
    *,
    actor: str,
    reason: Optional[str] = None,
) -> SchoolAdminClaim:
    """Approve a claim and activate the administrator account."""
    if claim.status == ClaimStatus.APPROVED:
        return claim
    if claim.status == ClaimStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been rejected.",
        )

    claim.status = ClaimStatus.APPROVED
    claim.reviewed_by = actor
    claim.reviewed_at = datetime.utcnow()
    claim.decision_reason = reason
    claim.updated_at = datetime.utcnow()
    session.add(claim)

    await activate_claim(session, claim)
    await record_event(session, claim.id, "claim_approved", reason, actor)
    return claim


async def reject_claim(
    session: AsyncSession,
    claim: SchoolAdminClaim,
    *,
    actor: str,
    reason: Optional[str] = None,
) -> SchoolAdminClaim:
    if claim.status == ClaimStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been approved.",
        )

    claim.status = ClaimStatus.REJECTED
    claim.authority_status = AuthorityStatus.FAILED
    claim.reviewed_by = actor
    claim.reviewed_at = datetime.utcnow()
    claim.decision_reason = reason
    claim.updated_at = datetime.utcnow()
    session.add(claim)

    await record_event(session, claim.id, "claim_rejected", reason, actor)
    return claim


# ── Activation ────────────────────────────────────────────────────────────────

def _slugify_prefix(name: str) -> str:
    """Initials of the school name, e.g. 'ABC Public School' -> 'APS'."""
    words = [w for w in re.split(r"[^A-Za-z]+", name) if w]
    letters = "".join(w[0] for w in words).upper()[:10]
    if len(letters) < 2:
        letters = (letters + "SCH")[:3]
    return letters


async def _unique_branch_name(record: SchoolDirectory, session: AsyncSession) -> str:
    base = f"{record.school_name} — {record.district}".strip()
    candidate = base[:120]
    n = 2
    while True:
        exists = await session.execute(
            select(School).where(func.lower(School.branch_name) == candidate.lower())
        )
        if not exists.scalar_one_or_none():
            return candidate
        suffix = f" ({n})"
        candidate = f"{base[:120 - len(suffix)]}{suffix}"
        n += 1


async def _unique_prefix(record: SchoolDirectory, session: AsyncSession) -> str:
    base = _slugify_prefix(record.school_name)
    candidate = base
    n = 1
    while True:
        exists = await session.execute(
            select(School).where(func.upper(School.student_prefix) == candidate.upper())
        )
        if not exists.scalar_one_or_none():
            return candidate
        n += 1
        suffix = str(n)
        candidate = f"{base[: max(2, 10 - len(suffix))]}{suffix}"


async def activate_claim(session: AsyncSession, claim: SchoolAdminClaim) -> School:
    """
    Turn an approved claim into a usable School account.

    Never creates a second school for a UDISE code that already has one — an
    approved second administrator is attached to the existing account.
    """
    if claim.status != ClaimStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request has not been approved.",
        )

    record = await session.get(SchoolDirectory, claim.directory_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Official school record is no longer available.",
        )

    # Existing school protection — reuse, never duplicate.
    query_conditions = [func.upper(School.udise_code) == record.udise_code.upper()]
    if claim.official_email:
        query_conditions.append(func.lower(School.email) == claim.official_email.strip().lower())
    if record.official_email:
        query_conditions.append(func.lower(School.email) == record.official_email.strip().lower())

    existing = await session.execute(
        select(School).where(or_(*query_conditions))
    )
    school = existing.scalars().first()

    if school:
        school.verification_status = SchoolVerificationStatus.VERIFIED
        if not school.udise_code and record.udise_code:
            school.udise_code = record.udise_code
        if not school.district and record.district:
            school.district = record.district
        if not school.board and record.board:
            school.board = record.board
        if not school.management and record.management:
            school.management = record.management
        if school.owner_claim_id is None:
            school.owner_claim_id = claim.id
            if claim.password_hash:
                school.password_hash = claim.password_hash
        if claim.phone_number and not school.phone_number:
            school.phone_number = claim.phone_number

        session.add(school)
        claim.school_id = school.id
        session.add(claim)

        counter_res = await session.execute(
            select(BranchCounter).where(BranchCounter.branch_name == school.branch_name)
        )
        if not counter_res.scalar_one_or_none():
            session.add(BranchCounter(branch_name=school.branch_name, last_counter=0))

        await record_event(
            session, claim.id, "admin_attached_to_existing_school", str(school.id)
        )
        return school

    school = School(
        school_name=record.school_name,
        branch_name=await _unique_branch_name(record, session),
        student_prefix=await _unique_prefix(record, session),
        email=claim.official_email,
        phone_number=claim.phone_number,
        password_hash=claim.password_hash,
        state=record.state,
        verification_status=SchoolVerificationStatus.VERIFIED,
        udise_code=record.udise_code,
        district=record.district,
        board=record.board,
        management=record.management,
        owner_claim_id=claim.id,
    )
    session.add(school)
    await session.flush()

    session.add(BranchCounter(branch_name=school.branch_name, last_counter=0))

    claim.school_id = school.id
    session.add(claim)

    # ── Populate class subjects from claim if present ─────────────────────────
    if claim.class_subjects_json:
        try:
            entries = json.loads(claim.class_subjects_json)
            for entry in entries:
                class_num = entry.get("class_number")
                pub_name = entry.get("publisher_name")
                for sub in entry.get("subjects", []):
                    # Check if already exists for this school
                    ex_sub = await session.execute(
                        select(SchoolClassSubject).where(
                            SchoolClassSubject.school_id == school.id,
                            SchoolClassSubject.class_number == class_num,
                            func.lower(SchoolClassSubject.subject) == sub.strip().lower(),
                        )
                    )
                    if not ex_sub.scalar_one_or_none():
                        session.add(
                            SchoolClassSubject(
                                school_id=school.id,
                                class_number=class_num,
                                subject=sub.strip(),
                                publisher_name=pub_name,
                            )
                        )
            school.subjects_configured_at = datetime.utcnow()
            session.add(school)
            await record_event(
                session, claim.id, "subjects_configured_from_claim", str(school.id)
            )
        except Exception as e:
            print(f"[activate_claim] Warning: could not parse class_subjects_json: {e}")

    await record_event(session, claim.id, "school_account_created", str(school.id))
    return school


async def get_all_publishers_with_subjects(
    session: AsyncSession,
) -> list[PublisherWithSubjectsOut]:
    """Return all publishers with their registered subjects."""
    from src.db.seed import PUBLISHER_SEED

    try:
        pub_res = await session.execute(
            text("SELECT id, name FROM publishers ORDER BY name;")
        )
        publishers = pub_res.fetchall()

        sub_res = await session.execute(
            text("SELECT publisher_id, subject_name FROM publisher_subjects ORDER BY subject_name;")
        )
        subjects = sub_res.fetchall()

        sub_map: dict[str, list[str]] = {}
        for pid, sname in subjects:
            sub_map.setdefault(str(pid), []).append(sname)

        if publishers:
            return [
                PublisherWithSubjectsOut(
                    id=p[0],
                    name=p[1],
                    subjects=sub_map.get(str(p[0]), []),
                )
                for p in publishers
            ]
    except Exception as e:
        print(f"[get_all_publishers_with_subjects] fallback: {e}")
        try:
            await session.rollback()
        except Exception:
            pass

    # Fallback to standard publishers list
    return [
        PublisherWithSubjectsOut(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, p["name"]),
            name=p["name"],
            subjects=p["subjects"],
        )
        for p in PUBLISHER_SEED
    ]







async def get_claim_or_404(
    claim_id: uuid.UUID, session: AsyncSession
) -> SchoolAdminClaim:
    claim = await session.get(SchoolAdminClaim, claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request not found.",
        )
    return claim


async def list_claims_for_school(
    school: School, session: AsyncSession
) -> Sequence[SchoolAdminClaim]:
    """Pending administrator requests the verified owner needs to decide on."""
    if not school.udise_code:
        return []
    result = await session.execute(
        select(SchoolAdminClaim)
        .where(
            func.upper(SchoolAdminClaim.udise_code) == school.udise_code.upper(),
            SchoolAdminClaim.route == ClaimRoute.OWNER_APPROVAL,
        )
        .order_by(SchoolAdminClaim.created_at.desc())  # type: ignore[attr-defined]
    )
    return list(result.scalars().all())


# ── Path B: the Super Admin decides on new school registrations ───────────────

async def list_registration_requests(
    session: AsyncSession,
    status_filter: Optional[str] = None,
) -> list[tuple[SchoolAdminClaim, Optional[SchoolDirectory]]]:
    """
    Every school-registration request, newest first, paired with its official
    directory record so the reviewer sees the school's own published identity
    rather than only what the claimant typed.

    Owner-approval claims are excluded: those add an administrator to a school
    the platform has already approved, and the school's own owner decides them.
    """
    stmt = (
        select(SchoolAdminClaim, SchoolDirectory)
        .join(
            SchoolDirectory,
            SchoolDirectory.id == SchoolAdminClaim.directory_id,  # type: ignore[arg-type]
            isouter=True,
        )
        .where(SchoolAdminClaim.route == ClaimRoute.FIRST_ADMIN)
        .order_by(SchoolAdminClaim.created_at.desc())  # type: ignore[attr-defined]
    )
    if status_filter:
        stmt = stmt.where(SchoolAdminClaim.status == status_filter)

    result = await session.execute(stmt)
    return [(row[0], row[1]) for row in result.all()]


async def get_registration_request(
    claim_id: uuid.UUID, session: AsyncSession
) -> SchoolAdminClaim:
    """A claim the Super Admin is allowed to decide on."""
    claim = await get_claim_or_404(claim_id, session)
    if claim.route != ClaimRoute.FIRST_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This request adds an administrator to an already-approved "
                "school and is decided by that school's owner."
            ),
        )
    return claim
