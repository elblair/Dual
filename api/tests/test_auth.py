from app.db import SessionLocal
from app.models import User


def test_health(client):
    assert client.get("/health") .json() == {"status": "ok"}


# ---------------------------------------------------------------- guests


def test_guest_is_named_with_the_first_name_they_give(make_player):
    p = make_player(name="Maya")
    assert p.me["isGuest"] is True
    assert p.me["name"] == "Maya"
    assert p.get("/me").json()["id"] == p.me["id"]


def test_a_guest_needs_a_first_name(client):
    assert client.post("/auth/guest", json={"name": ""}).status_code == 422
    assert client.post("/auth/guest", json={"name": "   "}).status_code == 422


def test_requests_without_a_token_are_rejected(client):
    assert client.get("/duels").status_code == 401
    assert client.get("/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


# ---------------------------------------------------------------- registration


def test_register_without_a_session_adds_a_new_user_row(client):
    r = client.post("/auth/register", json={"name": "Sam", "email": "Sam@Example.com", "password": "hunter22"})
    assert r.status_code == 200
    body = r.json()
    assert body["me"]["name"] == "Sam"
    assert body["me"]["email"] == "sam@example.com"
    assert body["me"]["isGuest"] is False

    # The new row is really in the database, with a hashed password (never the plain text).
    with SessionLocal() as db:
        row = db.query(User).filter(User.email == "sam@example.com").one()
        assert row.id == body["me"]["id"]
        assert row.password_hash and row.password_hash != "hunter22"

    # And the token works.
    me = client.get("/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200 and me.json()["name"] == "Sam"


def test_register_with_a_guest_session_upgrades_that_guest_and_keeps_their_duels(player):
    player.challenge("eleanor")
    r = player.post("/auth/register", {"name": "Sam", "email": "sam@example.com", "password": "hunter22"})
    assert r.status_code == 200
    assert r.json()["me"]["id"] == player.me["id"]  # same row, not a new one
    assert r.json()["me"]["isGuest"] is False
    assert len(player.duels()) == 1


def test_register_can_seed_the_demo_duels_for_a_new_user(client):
    r = client.post("/auth/register", json={"name": "Sam", "email": "sam@example.com", "password": "hunter22", "seedDemo": True})
    headers = {"Authorization": f"Bearer {r.json()['token']}"}
    assert len(client.get("/duels", headers=headers).json()) == 2


def test_register_rejects_a_taken_email(client, make_player):
    client.post("/auth/register", json={"name": "A", "email": "a@example.com", "password": "secret1"})

    # From the very first screen (no session)...
    again = client.post("/auth/register", json={"name": "B", "email": "A@example.com", "password": "secret2"})
    assert again.status_code == 409
    assert again.json()["detail"] == "That email already has an account. Try logging in."

    # ...and when upgrading a guest.
    guest = make_player()
    r = guest.post("/auth/register", {"name": "B", "email": "a@example.com", "password": "secret2"})
    assert r.status_code == 409


def test_register_validates_input(client):
    ok = {"name": "Sam", "email": "s@example.com", "password": "hunter22"}
    assert client.post("/auth/register", json={**ok, "email": "nope"}).status_code == 422
    assert client.post("/auth/register", json={**ok, "password": "123"}).status_code == 422
    assert client.post("/auth/register", json={**ok, "name": ""}).status_code == 422
    assert client.post("/auth/register", json={**ok, "name": "   "}).status_code == 422


# ---------------------------------------------------------------- login


def test_login_works_for_the_account_you_registered(client):
    reg = client.post("/auth/register", json={"name": "Sam", "email": "sam@example.com", "password": "hunter22"}).json()

    ok = client.post("/auth/login", json={"email": "SAM@example.com", "password": "hunter22"})
    assert ok.status_code == 200
    assert ok.json()["me"]["id"] == reg["me"]["id"]
    assert ok.json()["me"]["name"] == "Sam"
    assert client.get("/me", headers={"Authorization": f"Bearer {ok.json()['token']}"}).status_code == 200


def test_login_errors_are_clear(client):
    client.post("/auth/register", json={"name": "Sam", "email": "sam@example.com", "password": "hunter22"})

    wrong = client.post("/auth/login", json={"email": "sam@example.com", "password": "nope"})
    assert wrong.status_code == 401
    assert wrong.json()["detail"] == "Wrong password."

    missing = client.post("/auth/login", json={"email": "nobody@example.com", "password": "hunter22"})
    assert missing.status_code == 401
    assert "No account" in missing.json()["detail"]


def test_seeded_friends_cannot_log_in(client):
    r = client.post("/auth/login", json={"email": "eleanor@example.com", "password": "whatever"})
    assert r.status_code == 401
