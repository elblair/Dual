"""Test setup. Runs on an in-memory SQLite database, never on Neon: the env vars below are set BEFORE the app is imported,
and a guard refuses to run if the engine is anything but SQLite."""

import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256"
os.environ["CORS_ORIGINS"] = "*"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    assert engine.url.get_backend_name() == "sqlite", "tests must never run against a real database"
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db(client):
    """A direct database session (to read rows or to edit them behind the API's back, like the Neon console)."""
    with SessionLocal() as session:
        yield session


class Player:
    """A signed-in person with helpers, so tests read like the app."""

    def __init__(self, client: TestClient, name: str, email: str):
        self.client = client
        r = client.post("/auth/register", json={"name": name, "email": email, "password": "hunter22"})
        assert r.status_code == 200, r.text
        body = r.json()
        self.me = body["me"]
        self.id = body["me"]["id"]
        self.headers = {"Authorization": f"Bearer {body['token']}"}

    def get(self, url):
        return self.client.get(url, headers=self.headers)

    def post(self, url, json=None):
        return self.client.post(url, headers=self.headers, json=json)

    def duels(self):
        r = self.get("/duels")
        assert r.status_code == 200, r.text
        return r.json()

    def duel(self, duel_id):
        r = self.get(f"/duels/{duel_id}")
        assert r.status_code == 200, r.text
        return r.json()

    def challenge(self, friend=None, hobby="guitar", minutes=20):
        """Start a duel. friend is another Player (invited by name) or None (open invite with a code)."""
        body = {"hobbyId": hobby, "minutes": minutes, "friendId": friend.id if friend else None}
        r = self.post("/duels", body)
        assert r.status_code == 200, r.text
        return r.json()

    def accept(self, duel_id):
        r = self.post(f"/duels/{duel_id}/accept")
        assert r.status_code == 200, r.text
        return r.json()


@pytest.fixture
def make_player(client):
    counter = {"n": 0}

    def make(name="Ari"):
        counter["n"] += 1
        email = f"{name.lower().replace(' ', '.')}.{counter['n']}@example.com"
        return Player(client, name=name, email=email)

    return make


@pytest.fixture
def player(make_player):
    return make_player()


@pytest.fixture
def duo(make_player):
    """Two real accounts: ari (starts duels) and sam (is invited)."""
    return make_player("Ari"), make_player("Sam")


@pytest.fixture
def active_duel(duo):
    """An accepted duel between ari and sam. Returns (ari, sam, duel id)."""
    ari, sam = duo
    duel = ari.challenge(sam)
    sam.accept(duel["id"])
    return ari, sam, duel["id"]


@pytest.fixture(autouse=True)
def no_real_email(monkeypatch):
    """Tests never send email: sign-up codes go to a list instead (the `outbox` fixture in a test can read them)."""
    from app import verification

    monkeypatch.setattr(verification, "send_email", lambda *args, **kwargs: None)
