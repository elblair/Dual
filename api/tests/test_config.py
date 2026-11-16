import pytest
from sqlalchemy import create_engine

from app.config import _normalize_database_url, get_settings


@pytest.mark.parametrize(
    "given, expected",
    [
        ("postgresql://u:p@ep-1.neon.tech/db?sslmode=require", "postgresql+psycopg://u:p@ep-1.neon.tech/db?sslmode=require"),
        ("postgres://u:p@ep-1.neon.tech/db", "postgresql+psycopg://u:p@ep-1.neon.tech/db"),
        ("postgresql+psycopg://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("sqlite:///./dev.db", "sqlite:///./dev.db"),
    ],
)
def test_neon_urls_are_normalized_for_psycopg(given, expected):
    assert _normalize_database_url(given) == expected


def test_a_neon_url_builds_a_postgres_engine_without_connecting():
    engine = create_engine(_normalize_database_url("postgresql://u:p@ep-1.neon.tech/db?sslmode=require"))
    assert engine.url.get_backend_name() == "postgresql"
    assert engine.url.get_driver_name() == "psycopg"


def test_postgres_requires_a_jwt_secret(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@h/db")
    monkeypatch.setenv("JWT_SECRET", "")
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        get_settings()


def test_cors_origins_are_split(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:8081, https://dual.example.com")
    assert get_settings().cors_origins == ["http://localhost:8081", "https://dual.example.com"]
