"""The endpoints behind the graded screens: the Database screen (GET /demo/db), the Groups list, and the code lookup."""

import json


def register(client, name="Sam", email="sam@example.com", password="hunter22", seed=False):
    r = client.post("/auth/register", json={"name": name, "email": email, "password": password, "seedDemo": seed})
    assert r.status_code == 200, r.text
    return r.json()["me"], {"Authorization": f"Bearer {r.json()['token']}"}


# ---------------------------------------------------------------- GET /demo/db


def test_demo_db_lists_the_newest_users_first_with_their_emails(client):
    register(client, "First", "first@example.com")
    register(client, "Second", "second@example.com")
    _, headers = register(client, "Third", "third@example.com")

    body = client.get("/demo/db", headers=headers).json()
    names = [u["name"] for u in body["users"]]
    assert names[:3] == ["Third", "Second", "First"]  # newest first
    assert body["users"][0]["email"] == "third@example.com"
    assert body["users"][0]["createdAt"].endswith("Z")
    assert body["userCount"] == 5  # 3 people + the seeded Eleanor and Tanish
    assert {u["name"] for u in body["users"]} >= {"Eleanor", "Tanish"}
    assert body["database"] == {"engine": "sqlite", "host": "local file"}


def test_demo_db_never_exposes_password_hashes(client):
    _, headers = register(client, "Sam", "sam@example.com", "a-very-secret-password")
    raw = client.get("/demo/db", headers=headers).text
    assert "password" not in raw.lower()
    assert "a-very-secret-password" not in raw
    assert "$2b$" not in raw  # the bcrypt prefix
    for user in json.loads(raw)["users"]:
        assert set(user) == {"id", "name", "email", "isGuest", "isSeeded", "createdAt"}


def test_demo_db_lists_duels_newest_first_with_players_status_and_score(client):
    me, headers = register(client, "Sam", "sam@example.com", seed=True)  # Guitar vs Eleanor, Running vs Tanish
    new = client.post("/duels", headers=headers, json={"hobbyId": "coding", "minutes": 30, "friendId": "tanish"}).json()

    duels = client.get("/demo/db", headers=headers).json()["duels"]
    assert [d["hobbyId"] for d in duels] == ["coding", "guitar", "running"]
    assert duels[0]["id"] == new["id"]
    assert duels[0]["creator"] == "Sam" and duels[0]["opponent"] == "Tanish"
    assert duels[0]["status"] == "active" and duels[0]["score"] == "0 – 0"
    assert duels[0]["goal"] == "30 min a day"
    guitar = duels[1]
    # Eleanor's confirmed days plus the check-in that is still waiting for OK are all rows in the table.
    assert guitar["opponent"] == "Eleanor" and guitar["score"] == "4 – 5"
    assert duels[2]["score"] == "5 – 6"


def test_demo_db_shows_a_pending_invite_with_the_invited_name(client):
    _, headers = register(client)
    client.post("/duels", headers=headers, json={"hobbyId": "guitar", "minutes": 20, "friendId": "ben"})
    duel = client.get("/demo/db", headers=headers).json()["duels"][0]
    assert duel["status"] == "pending" and duel["opponent"] == "Ben"


def test_demo_db_reflects_a_row_edited_directly_in_the_database(client):
    """The graded demo: edit a duel in Neon, refresh the app, see the change."""
    from app.db import SessionLocal
    from app.models import Duel

    _, headers = register(client, seed=True)
    first = client.get("/demo/db", headers=headers).json()["duels"][0]  # Guitar vs Eleanor (newest)
    assert first["goal"] == "20 min a day"
    with SessionLocal() as db:
        db.get(Duel, int(first["id"])).minutes = 45
        db.commit()
    assert client.get("/demo/db", headers=headers).json()["duels"][0]["goal"] == "45 min a day"
    # ...and the normal duel endpoints agree.
    assert client.get(f"/duels/{first['id']}", headers=headers).json()["minutes"] == 45


def test_demo_db_needs_demo_mode_and_a_token(client, monkeypatch):
    _, headers = register(client)
    assert client.get("/demo/db").status_code == 401
    monkeypatch.setenv("DEMO_MODE", "false")
    assert client.get("/demo/db", headers=headers).status_code == 404


# ---------------------------------------------------------------- Groups list


def test_leaderboard_ranks_people_in_my_duels_by_minutes(client):
    _, headers = register(client, "Sam", seed=True)
    rows = client.get("/groups/leaderboard", headers=headers).json()
    # Guitar: Sam 4 x 20 = 80, Eleanor 4 x 20 = 80 (her waiting check-in does not count yet).
    # Running: Sam 5 x 30 = 150, Tanish 6 x 30 = 180. Totals: Tanish 180, Sam 230, Eleanor 80.
    assert [(r["name"], r["minutes"]) for r in rows] == [("Sam", 230), ("Tanish", 180), ("Eleanor", 80)]
    assert [r["isYou"] for r in rows] == [True, False, False]


def test_leaderboard_counts_a_friends_minutes_once_confirmed(client):
    _, headers = register(client, "Sam", seed=True)
    duels = client.get("/duels", headers=headers).json()
    guitar = next(d for d in duels if d["hobbyId"] == "guitar")
    client.post(f"/duels/{guitar['id']}/confirm", headers=headers)
    rows = {r["name"]: r["minutes"] for r in client.get("/groups/leaderboard", headers=headers).json()}
    assert rows["Eleanor"] == 80 + 25  # her 25 minute check-in is now confirmed


def test_leaderboard_with_no_duels_is_just_me(client):
    _, headers = register(client, "Sam")
    assert client.get("/groups/leaderboard", headers=headers).json() == [
        {"id": client.get("/me", headers=headers).json()["id"], "name": "Sam", "tone": "you", "minutes": 0, "isYou": True}
    ]


def test_leaderboard_needs_a_token(client):
    assert client.get("/groups/leaderboard").status_code == 401


# ---------------------------------------------------------------- invite code before sign-in


def test_the_invite_code_can_be_looked_up_before_signing_in(client, make_player):
    ari = make_player(name="Ari")
    ari.challenge("ben", code="K3X9")

    seen = client.get("/duels/by-code/k3x9")  # no token at all
    assert seen.status_code == 200
    body = seen.json()
    assert body["viewerIsCreator"] is False
    assert body["creator"]["name"] == "Ari"
    assert body["myDays"] == [] and body["status"] == "pending"
    assert client.get("/duels/by-code/ZZZZ").status_code == 404
