import pytest


def guitar(duels):
    return next(d for d in duels if d["hobbyId"] == "guitar")


def running(duels):
    return next(d for d in duels if d["hobbyId"] == "running")


def test_demo_seed_matches_the_design(make_player):
    p = make_player(seed_demo=True)
    duels = p.duels()
    assert [d["hobbyId"] for d in duels] == ["guitar", "running"]

    g = guitar(duels)
    assert (g["today"], g["myDays"], g["theirDays"]) == (4, [0, 1, 2, 3], [0, 1, 2, 3])
    assert g["theirPending"] == {"minutes": 25, "note": "Finally nailed the F chord"}
    assert g["opponent"]["name"] == "Eleanor" and g["minutes"] == 20

    r = running(duels)
    assert (r["today"], len(r["myDays"]), len(r["theirDays"])) == (5, 5, 6)
    assert r["opponent"]["name"] == "Tanish" and r["theirPending"] is None


def test_the_seed_does_not_drift_on_read(make_player):
    p = make_player(seed_demo=True)
    for _ in range(3):
        assert guitar(p.duels())["today"] == 4


def test_no_seed_unless_asked(make_player):
    assert make_player().duels() == []


def test_confirm_then_check_in_gives_the_done_screen_numbers(make_player):
    p = make_player(seed_demo=True)
    g = guitar(p.duels())
    p.post(f"/duels/{g['id']}/confirm")
    after = p.post(f"/duels/{g['id']}/checkin").json()
    assert (len(after["myDays"]), len(after["theirDays"])) == (5, 5)  # "You're tied 5 – 5"


def test_fast_forward_to_the_result_frame(make_player):
    """Check in on day 5, fast-forward three days: Eleanor wins 6 to 5, like the Result frame."""
    p = make_player(seed_demo=True)
    g = guitar(p.duels())
    p.post(f"/duels/{g['id']}/checkin")
    for _ in range(3):
        assert p.post("/demo/advance-day").status_code == 204
    final = guitar(p.duels())
    assert final["status"] == "finished"
    assert final["result"] == {"winner": "them", "forfeitedBy": None}
    assert (len(final["myDays"]), len(final["theirDays"])) == (5, 6)
    # Running (one day behind) finished too.
    assert running(p.duels())["status"] == "finished"


def test_opponent_check_in_adds_a_pending_confirmation(make_player):
    p = make_player()
    d = p.challenge("tanish")
    assert d["theirPending"] is None
    assert p.post("/demo/opponent-checkin").status_code == 204
    after = p.duel(d["id"])
    assert after["theirPending"]["minutes"] == 25
    # Calling it again does not stack a second one.
    p.post("/demo/opponent-checkin")
    assert p.duel(d["id"])["theirPending"]["minutes"] == 25


def test_reset_restores_the_seed(make_player):
    p = make_player(seed_demo=True)
    p.post(f"/duels/{guitar(p.duels())['id']}/forfeit")
    p.challenge("tanish", "coding")
    assert p.post("/demo/reset").status_code == 204
    duels = p.duels()
    assert sorted(d["hobbyId"] for d in duels) == ["guitar", "running"]
    assert guitar(duels)["status"] == "active" and guitar(duels)["today"] == 4


def test_demo_endpoints_are_off_without_demo_mode(make_player, monkeypatch):
    p = make_player()
    monkeypatch.setenv("DEMO_MODE", "false")
    for path in ("/demo/advance-day", "/demo/opponent-checkin", "/demo/reset"):
        assert p.post(path).status_code == 404
    # ...and guests are not seeded either.
    assert make_player(seed_demo=True).duels() == []


@pytest.mark.parametrize("path", ["/demo/advance-day", "/demo/opponent-checkin", "/demo/reset"])
def test_demo_endpoints_need_a_token(client, path):
    assert client.post(path).status_code == 401
