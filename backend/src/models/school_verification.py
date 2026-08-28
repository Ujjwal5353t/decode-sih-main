"""
School identity, person identity and administrative authority.

Three separate concerns, deliberately kept apart:

  SchoolDirectory   — "does this school exist?"   (official record, read-only)
  SchoolAdminClaim  — "who is asking, and are they who they say?" (+ authority)
  School            — the actual account, only created once a claim is approved

A claim carries its own phone/email verification flags and a separate
authority decision. Passing identity checks never implies authority.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()  # naive UTC — matches TIMESTAMP WITHOUT TIME ZONE


class SchoolVerificationStatus(str, Enum):
    """Lifecycle of a School *account*."""

    PENDING = "pending"     # identified, awaiting an approved administrator
    VERIFIED = "verified"   # has an approved owner — full School Admin access
    REJECTED = "rejected"   # claim refused; no access


class ClaimStatus(str, Enum):
    """Lifecycle of an administrator claim."""

    PENDING = "pending"     # awaiting owner approval or manual review
    APPROVED = "approved"
    REJECTED = "rejected"


class AuthorityStatus(str, Enum):
    """
    Outcome of the authority check — kept separate from ClaimStatus because
    identity can be fully verified while authority is still unproven.
    """

    UNVERIFIED = "unverified"        # not yet evaluated
    VERIFIED = "verified"            # matched official school contact details
    MANUAL_REVIEW = "manual_review"  # evidence inconclusive — needs a human
    FAILED = "failed"                # contradicted the official record


class ClaimRoute(str, Enum):
    """Which branch of the flow this claim is on."""

    FIRST_ADMIN = "first_admin"      # no verified owner yet
    OWNER_APPROVAL = "owner_approval"  # school already has a verified owner


class SchoolDirectory(SQLModel, table=True):
    """
    Official school records used to answer "does this school exist?".

    This is the isolated integration point for an official directory. It is
    seeded with sample records today; swapping in a real UDISE/board feed means
    replacing how rows get here, not how the rest of the flow reads them.
    """

    __tablename__ = "school_directory"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    udise_code: str = Field(unique=True, index=True, max_length=20)
    school_name: str = Field(index=True, max_length=300)
    state: str = Field(index=True, max_length=100)
    district: str = Field(index=True, max_length=120)
    management: str = Field(max_length=120)          # e.g. "Private Unaided"
    board: Optional[str] = Field(default=None, max_length=60)  # CBSE / ICSE / State

    # Authoritative contact details. Never returned to the browser in full —
    # they are the evidence the authority check compares a claim against.
    official_email: Optional[str] = Field(default=None, max_length=255)
    official_phone: Optional[str] = Field(default=None, max_length=20)
    head_name: Optional[str] = Field(default=None, max_length=150)

    created_at: datetime = Field(default_factory=_utcnow)


class SchoolAdminClaim(SQLModel, table=True):
    """
    One person's request to administer one school.

    Holds person-identity signals (phone/email verification) and the authority
    decision separately, so neither can be mistaken for the other.
    """

    __tablename__ = "school_admin_claims"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # ── School identity ───────────────────────────────────────────────────────
    udise_code: str = Field(index=True, max_length=20)
    directory_id: uuid.UUID = Field(foreign_key="school_directory.id", index=True)
    # Set once an account exists for this school (either pre-existing or created
    # on approval). Null while the first admin is still being verified.
    school_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="schools.id", index=True
    )

    # ── Person identity ───────────────────────────────────────────────────────
    full_name: str = Field(max_length=150)
    designation: str = Field(max_length=60)
    official_email: str = Field(index=True, max_length=255)
    phone_number: str = Field(index=True, max_length=20)

    phone_verified: bool = Field(default=False)
    email_verified: bool = Field(default=False)

    # Password chosen at claim time; only ever turned into an account on approval.
    password_hash: str

    # ── Authority ─────────────────────────────────────────────────────────────
    route: str = Field(default=ClaimRoute.FIRST_ADMIN, max_length=20)
    authority_status: str = Field(default=AuthorityStatus.UNVERIFIED, max_length=20)
    # Human-readable trail of which signals matched — shown to reviewers.
    authority_notes: Optional[str] = Field(default=None, max_length=1000)
    evidence_url: Optional[str] = Field(default=None, max_length=500)

    # Class-wise subjects and publishers submitted during registration
    class_subjects_json: Optional[str] = Field(default=None)

    # ── Decision ──────────────────────────────────────────────────────────────
    status: str = Field(default=ClaimStatus.PENDING, index=True, max_length=20)
    decision_reason: Optional[str] = Field(default=None, max_length=500)
    reviewed_by: Optional[str] = Field(default=None, max_length=255)
    reviewed_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class SchoolVerificationEvent(SQLModel, table=True):
    """
    Append-only audit trail. Every state change on a claim writes one row so a
    reviewer can reconstruct exactly which signals led to a decision.
    """

    __tablename__ = "school_verification_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    claim_id: uuid.UUID = Field(foreign_key="school_admin_claims.id", index=True)
    event: str = Field(max_length=60)          # e.g. "claim_created", "phone_verified"
    detail: Optional[str] = Field(default=None, max_length=1000)
    actor: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=_utcnow)
