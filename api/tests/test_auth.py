from app.models import Duel, User


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_a_fresh_database_has_no_data(client, db):
    """Nothing is seeded on startup: no friends, no demo duels."""
    assert db.query(User).count() == 0
    assert db.query(Duel).count() == 0


# ---------------------------------------------------------------- no guests


def test_there_is_no_guest_sign_in(client):
    """Every user signs up or logs in: the old first-name-only endpoint is gone."""
    assert client.post("/auth/guest", json={"name": "Maya"}).status_code in (404, 405)
    assert "isGuest" not in client.post(
        "/auth/register", json={"name": "Maya", "email": "maya@example.com", "password": "hunter22"}
    ).json()["me"]


def test_a_new_account_starts_with_no_duels(player):
    assert player.duels() == []


def test_requests_without_a_token_are_rejected(client):
    assert client.get("/duels").status_code == 401
    assert client.get("/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


# ---------------------------------------------------------------- registration


def test_register_without_a_session_adds_a_new_user_row(client, db):
    r = client.post("/auth/register", json={"name": "Sam", "email": "Sam@Example.com", "password": "hunter22"})
    assert r.status_code == 200
    body = r.json()
    assert body["me"]["name"] == "Sam"
    assert body["me"]["email"] == "sam@example.com"

    row = db.query(User).filter(User.email == "sam@example.com").one()
    assert row.id == body["me"]["id"]
    assert row.password_hash and row.password_hash != "hunter22"  # a bcrypt hash, never the password
    assert db.query(Duel).count() == 0  # and no duels are created for a new account

    me = client.get("/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200 and me.json()["name"] == "Sam"


def test_register_ignores_any_session_and_always_adds_a_new_row(player, db):
    """No "upgrade a guest": signing up while holding a token still creates a separate account."""
    r = player.post("/auth/register", {"name": "Sam", "email": "sam@example.com", "password": "hunter22"})
    assert r.status_code == 200
    assert r.json()["me"]["id"] != player.id
    assert db.query(User).count() == 2


def test_register_rejects_a_taken_email(client, make_player):
    client.post("/auth/register", json={"name": "A", "email": "a@example.com", "password": "secret1"})
    again = client.post("/auth/register", json={"name": "B", "email": "A@example.com", "password": "secret2"})
    assert again.status_code == 409
    assert again.json()["detail"] == "That email already has an account. Try logging in."

    other = make_player()
    assert other.post("/auth/register", {"name": "B", "email": "a@example.com", "password": "secret2"}).status_code == 409


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
    assert client.get("/me", headers={"Authorization": f"Bearer {ok.json()['token']}"}).status_code == 200


def test_login_errors_are_clear(client):
    client.post("/auth/register", json={"name": "Sam", "email": "sam@example.com", "password": "hunter22"})
    wrong = client.post("/auth/login", json={"email": "sam@example.com", "password": "nope"})
    assert wrong.status_code == 401 and wrong.json()["detail"] == "Wrong password."
    missing = client.post("/auth/login", json={"email": "nobody@example.com", "password": "hunter22"})
    assert missing.status_code == 401 and "No account" in missing.json()["detail"]
