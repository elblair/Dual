"""Settings from environment variables (and api/.env for local runs)."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Does not override variables that are already set (so tests and Render env vars win over a local .env).
load_dotenv()


@dataclass(frozen=True)
class Settings:
    database_url: str
    jwt_secret: str
    cors_origins: list[str]
    # Brevo (free plan) sends the sign-up codes. Without a key the code is written to the server log instead.
    brevo_api_key: str
    email_from: str
    email_from_name: str


def _normalize_database_url(url: str) -> str:
    """Neon gives 'postgresql://...'; SQLAlchemy needs the psycopg (v3) driver spelled out."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def get_settings() -> Settings:
    raw_url = os.environ.get("DATABASE_URL", "").strip()
    url = _normalize_database_url(raw_url) if raw_url else "sqlite:///./dev.db"

    secret = os.environ.get("JWT_SECRET", "").strip()
    if not secret:
        if not url.startswith("sqlite"):
            raise RuntimeError("JWT_SECRET must be set when DATABASE_URL points at Postgres.")
        secret = "dev-only-secret-change-me-0123456789"  # local SQLite runs only

    origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
    return Settings(
        database_url=url,
        jwt_secret=secret,
        cors_origins=origins or ["*"],
        brevo_api_key=os.environ.get("BREVO_API_KEY", "").strip(),
        email_from=os.environ.get("EMAIL_FROM", "").strip(),
        email_from_name=os.environ.get("EMAIL_FROM_NAME", "Dual").strip() or "Dual",
    )
