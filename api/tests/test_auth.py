def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_guest_gets_a_token_and_a_profile(player):
    assert player.me["isGuest"] is True
    assert player.me["name"] == "Ari"
    assert player.get("/me").json()["id"] == player.me["id"]


def test_requests_without_a_token_are_rejected(client):
    assert client.get("/duels").status_code == 401
    assert client.get("/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_register_upgrades_the_guest_and_keeps_their_duels(player):
    player.challenge("eleanor")
    r = player.post("/auth/register", {"name": "Sam", "email": "Sam@Example.com", "password": "hunter22"})
    assert r.status_code == 200
    assert r.json()["name"] == "Sam"
    assert r.json()["isGuest"] is False
    assert r.json()["email"] == "sam@example.com"
    assert len(player.duels()) == 1


def test_register_rejects_a_taken_email(make_player):
    a, b = make_player(), make_player()
    a.post("/auth/register", {"name": "A", "email": "a@example.com", "password": "secret1"})
    r = b.post("/auth/register", {"name": "B", "email": "A@example.com", "password": "secret2"})
    assert r.status_code == 409
    assert "already has an account" in r.json()["detail"]


def test_register_validates_input(player):
    assert player.post("/auth/register", {"name": "Sam", "email": "nope", "password": "hunter22"}).status_code == 422
    assert player.post("/auth/register", {"name": "Sam", "email": "s@example.com", "password": "123"}).status_code == 422


def test_login(client, player):
    player.post("/auth/register", {"name": "Sam", "email": "sam@example.com", "password": "hunter22"})

    ok = client.post("/auth/login", json={"email": "SAM@example.com", "password": "hunter22"})
    assert ok.status_code == 200
    assert ok.json()["me"]["id"] == player.me["id"]
    assert client.get("/me", headers={"Authorization": f"Bearer {ok.json()['token']}"}).status_code == 200

    wrong = client.post("/auth/login", json={"email": "sam@example.com", "password": "nope"})
    assert wrong.status_code == 401
    assert wrong.json()["detail"] == "Wrong password."

    missing = client.post("/auth/login", json={"email": "nobody@example.com", "password": "hunter22"})
    assert missing.status_code == 401
    assert "No account" in missing.json()["detail"]


def test_seeded_friends_cannot_log_in(client):
    r = client.post("/auth/login", json={"email": "eleanor@example.com", "password": "whatever"})
    assert r.status_code == 401
