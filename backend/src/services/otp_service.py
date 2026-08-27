import random
import time
from typing import Any, Dict

# In-memory storage for OTPs: clean_phone -> {"otp": str, "expires_at": float, "verified": bool}
_otp_store: Dict[str, Dict[str, Any]] = {}


def normalize_phone(phone: str) -> str:
    """Normalize phone number by stripping whitespace, dashes, and extra chars."""
    if not phone:
        return ""
    cleaned = "".join(ch for ch in phone.strip() if ch.isdigit() or ch == "+")
    return cleaned


def generate_and_send_otp(phone_number: str) -> str:
    """
    Generate a 6-digit OTP, store it in memory, and print it to the terminal console
    for the Hackathon MVP demonstration.
    """
    clean_phone = normalize_phone(phone_number)
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = time.time() + 600  # Valid for 10 minutes

    _otp_store[clean_phone] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "verified": False,
    }

    # ASCII-safe terminal output for hackathon MVP demo (compatible with all Windows & Linux consoles)
    terminal_output = f"""
======================================================================
>> [VIDYASETU DUMMY OTP VERIFICATION SERVICE - HACKATHON MVP] <<
   Mobile Number : {phone_number} (Normalized: {clean_phone})
   OTP Code      : >>> {otp_code} <<<
   Valid For     : 10 Minutes
   Action        : Copy and paste this OTP into the web interface!
======================================================================
"""
    try:
        print(terminal_output, flush=True)
    except Exception:
        # Fallback in case of any encoding constraint
        print(f"[OTP SERVICE] Phone: {phone_number} | OTP: {otp_code}", flush=True)

    return otp_code


def verify_otp_code(phone_number: str, otp_code: str) -> bool:
    """Validate the OTP code for the given phone number."""
    clean_phone = normalize_phone(phone_number)
    record = _otp_store.get(clean_phone)
    if not record:
        return False

    if time.time() > record["expires_at"]:
        return False

    if record["otp"].strip() == otp_code.strip():
        record["verified"] = True
        return True

    return False


def is_phone_verified(phone_number: str) -> bool:
    """Check if the phone number has been verified."""
    clean_phone = normalize_phone(phone_number)
    record = _otp_store.get(clean_phone)
    if not record:
        return False
    return record.get("verified", False)
