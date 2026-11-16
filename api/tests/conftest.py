"""Test setup. Runs on an in-memory SQLite database, never on Neon: the env vars below are set BEFORE the app is imported,
and a guard refuses to run if the engine is anything but SQLite."""

import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256"
os.environ["DEMO_MODE"] = "true"
os.environ["CORS_ORIGINS"] = "*"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    assert engine.url.get_backend_name() == "sqlite", "tests must never run against a real database"
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(app) as c:  # the lifespan seeds Eleanor and Tanish
        yield c


class Player:
    """A signed-in guest with helpers, so tests read like the app."""

    def __init__(self, client: TestClient, seed_demo: bool = False):
        r = client.post(f"/auth/guest?seed_demo={'true' if seed_demo else 'false'}")
        assert r.status_code == 200, r.text
        body = r.json()
        self.client = client
        self.me = body["me"]
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

    def challenge(self, friend="eleanor", hobby="guitar", minutes=20, code=None):
        body = {"hobbyId": hobby, "minutes": minutes, "friendId": friend}
        if code:
            body["inviteCode"] = code
        r = self.post("/duels", body)
        assert r.status_code == 200, r.text
        return r.json()


@pytest.fixture
def player(client):
    return Player(client)


@pytest.fixture
def make_player(client):
    return lambda seed_demo=False: Player(client, seed_demo=seed_demo)
