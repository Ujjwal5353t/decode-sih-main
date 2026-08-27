"""
Email verification — deliberately mirrors src/services/otp_service.py.

The project has no mail provider configured, and its existing phone
verification (otp_service) prints codes to the server console for the MVP.
This module follows that same convention so both channels behave identically:
a real code is generated, stored with an expiry and genuinely checked — only
delivery is console-based.

Swapping in a real provider means changing `_deliver()` and nothing else.
"""

import random
import time
from typing import Any, Dict

# In-memory storage: clean_email -> {"code": str, "expires_at": float, "verified": bool}
_email_store: Dict[str, Dict[str, Any]] = {}

_CODE_TTL_SECONDS = 600  # 10 minutes, matching the OTP service


def normalize_email(email: str) -> str:
    """Lowercase and trim so lookups are stable."""
    if not email:
        return ""
    return email.strip().lower()


def _deliver(email: str, clean_email: str, code: str) -> None:
    """Console delivery for the MVP — the single place a real mailer would go."""
    terminal_output = f"""
======================================================================
>> [VIDYASETU EMAIL VERIFICATION SERVICE - HACKATHON MVP] <<
   Email Address : {email} (Normalized: {clean_email})
   Verify Code   : >>> {code} <<<
   Valid For     : 10 Minutes
   Action        : Copy and paste this code into the web interface!
======================================================================
"""
    try:
        print(terminal_output, flush=True)
    except Exception:
        print(f"[EMAIL SERVICE] Email: {email} | Code: {code}", flush=True)


def generate_and_send_email_code(email: str) -> str:
    """Generate a 6-digit verification code and deliver it."""
    clean_email = normalize_email(email)
    code = f"{random.randint(100000, 999999)}"

    _email_store[clean_email] = {
        "code": code,
        "expires_at": time.time() + _CODE_TTL_SECONDS,
        "verified": False,
    }

    _deliver(email, clean_email, code)
    return code


def verify_email_code(email: str, code: str) -> bool:
    """Validate the code for the given email address."""
    clean_email = normalize_email(email)
    record = _email_store.get(clean_email)
    if not record:
        return False

    if time.time() > record["expires_at"]:
        return False

    if record["code"].strip() == code.strip():
        record["verified"] = True
        return True

    return False


def is_email_verified(email: str) -> bool:
    """Check whether this address completed verification in the current session."""
    clean_email = normalize_email(email)
    record = _email_store.get(clean_email)
    if not record:
        return False
    return record.get("verified", False)
