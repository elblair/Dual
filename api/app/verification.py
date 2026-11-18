"""Sign-up verification codes: make, email, check. Codes are 6 digits, live 10 minutes, allow 5 tries, and only a hash
is stored. Email goes out through Brevo's HTTP API (Render's free plan blocks SMTP)."""

import hashlib
import hmac
import json
import logging
import secrets
import urllib.request
from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import get_settings
from app.logic import DomainError, utcnow
from app.models import EmailCode, User

log = logging.getLogger("dual.email")

CODE_LENGTH = 6
CODE_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_SECONDS = 30
BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def _hash(code: str) -> str:
    return hmac.new(get_settings().jwt_secret.encode(), code.encode(), hashlib.sha256).hexdigest()


def send_email(to_email: str, to_name: str, subject: str, text: str) -> None:
    """Send one email. Tests replace this function. With no BREVO_API_KEY (local runs) the message goes to the log."""
    settings = get_settings()
    if not settings.brevo_api_key:
        log.warning("BREVO_API_KEY is not set, so no email was sent. To %s: %s", to_email, text)
        return
    if not settings.email_from:
        raise DomainError("Email is not set up on the server (EMAIL_FROM is missing).", status=503)
    payload = {
        "sender": {"email": settings.email_from, "name": settings.email_from_name},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "textContent": text,
    }
    req = urllib.request.Request(
        BREVO_URL,
        data=json.dumps(payload).encode(),
        headers={"api-key": settings.brevo_api_key, "content-type": "application/json", "accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            if res.status >= 300:
                raise DomainError("We couldn't send the email. Try again in a minute.", status=502)
    except OSError:
        log.exception("Brevo send failed")
        raise DomainError("We couldn't send the email. Try again in a minute.", status=502)


def send_code(db: Session, user: User, *, enforce_cooldown: bool = True) -> None:
    """Make a fresh code (replacing any earlier one) and email it."""
    if user.email is None:
        raise DomainError("This account has no email address.", status=422)
    now = utcnow()
    row = db.get(EmailCode, user.id)
    if enforce_cooldown and row is not None and (now - row.sent_at).total_seconds() < RESEND_SECONDS:
        raise DomainError("We just sent a code. Give it a few seconds, then try again.", status=429)

    code = f"{secrets.randbelow(10**CODE_LENGTH):0{CODE_LENGTH}d}"
    if row is None:
        row = EmailCode(user_id=user.id)
        db.add(row)
    row.code_hash = _hash(code)
    row.expires_at = now + timedelta(minutes=CODE_MINUTES)
    row.attempts = 0
    row.sent_at = now
    db.commit()

    send_email(
        user.email,
        user.name,
        f"{code} is your Dual code",
        f"Hi {user.name},\n\nYour Dual code is {code}. It works for {CODE_MINUTES} minutes.\n\n"
        "If you didn't sign up for Dual, you can ignore this email.",
    )


def verify_code(db: Session, user: User, code: str) -> None:
    if user.email_verified_at is not None:
        return
    row = db.get(EmailCode, user.id)
    if row is None or row.expires_at < utcnow():
        raise DomainError("That code expired. Tap “Send a new code”.", status=400)
    if row.attempts >= MAX_ATTEMPTS:
        raise DomainError("Too many tries. Tap “Send a new code”.", status=429)
    if not hmac.compare_digest(row.code_hash, _hash(code.strip())):
        row.attempts += 1
        db.commit()
        raise DomainError("That code isn't right. Check the email and try again.", status=400)
    user.email_verified_at = utcnow()
    db.delete(row)
    db.commit()
