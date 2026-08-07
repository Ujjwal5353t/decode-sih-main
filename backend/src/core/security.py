from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.config import settings

# ── Password hashing ───────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ────────────────────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    role: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a signed JWT.

    Payload fields:
      sub  — user id (str/UUID)
      role — "school" | "student" | "parent" | "admin"
      exp  — UTC expiry (ACCESS_TOKEN_EXPIRE_DAYS from now)
      iat  — issued-at timestamp
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": now,
        "exp": expire,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT. Raises JWTError on failure.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def should_refresh_token(payload: dict[str, Any]) -> bool:
    """
    Return True when the token has less than half its lifetime remaining
    (i.e. < 3.5 days), triggering a sliding-window refresh.
    """
    exp = payload.get("exp")
    if exp is None:
        return False
    expiry = datetime.fromtimestamp(exp, tz=timezone.utc)
    remaining = expiry - datetime.now(timezone.utc)
    half_lifetime = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS / 2)
    return remaining < half_lifetime
