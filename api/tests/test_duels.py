from datetime import timedelta

from app.db import SessionLocal
from app.models import Duel


def backdate(duel_id: str, days: int) -> None:
    """Pretend the duel started `days` days earlier (the real clock moves the day forward)."""
    with SessionLocal() as db:
        d = db.get(Duel, int(duel_id))
        d.started_at = d.started_at - timedelta(days=days)
        db.commit()


# ---------------------------------------------------------------- creating


def test_challenging_a_seeded_friend_starts_immediately(player):
    d = player.challenge("eleanor")
    assert d["status"] == "active"
    assert d["opponent"] == {"id": "eleanor", "name": "Eleanor", "tone": "opponent"}
    assert d["viewerIsCreator"] is True
    assert d["today"] == 0
    assert d["myDays"] == [] and d["theirDays"] == []
    assert d["restLeft"] == 2
    assert d["inviteCode"] is None


def test_challenging_a_contact_is_pending_with_a_code(player):
    d = player.challenge("ben", code="K3X9")
    assert d["status"] == "pending"
    assert d["inviteCode"] == "K3X9"
    assert d["opponent"] == {"id": "ben", "name": "Ben", "tone": "neutral"}


def test_a_bad_or_taken_code_is_replaced(make_player):
    a, b = make_player(), make_player()
    first = a.challenge("ben", code="AAAA")
    second = b.challenge("ben", code="AAAA")
    assert first["inviteCode"] == "AAAA"
    assert second["inviteCode"] != "AAAA" and len(second["inviteCode"]) == 4
    assert a.challenge("ben", code="oops!")["inviteCode"] != "oops!"


def test_minutes_are_validated(player):
    r = player.post("/duels", {"hobbyId": "guitar", "minutes": 1, "friendId": "eleanor"})
    assert r.status_code == 400


def test_duels_are_listed_newest_first(player):
    a = player.challenge("eleanor", "guitar")
    b = player.challenge("tanish", "running")
    assert [d["id"] for d in player.duels()] == [b["id"], a["id"]]


def test_you_cannot_see_someone_elses_duel(make_player):
    a, b = make_player(), make_player()
    d = a.challenge("eleanor")
    assert b.get(f"/duels/{d['id']}").status_code == 404
    assert b.post(f"/duels/{d['id']}/checkin").status_code == 404


# ---------------------------------------------------------------- inviting a real person


def test_invite_code_flow_between_two_players(make_player):
    ari, sam = make_player(), make_player()
    sam.post("/auth/register", {"name": "Sam", "email": "sam@example.com", "password": "hunter22"})
    d = ari.challenge("ben", code="K3X9")

    # Sam looks the code up and sees who challenged them.
    seen = sam.get("/duels/by-code/k3x9").json()
    assert seen["viewerIsCreator"] is False
    assert seen["creator"]["name"] == "Ari"
    assert seen["opponent"]["name"] == "Ari"

    accepted = sam.post(f"/duels/{d['id']}/accept").json()
    assert accepted["status"] == "active"
    assert accepted["inviteCode"] is None
    assert accepted["opponent"]["name"] == "Ari"

    # Ari now sees Sam as the opponent. The code no longer works.
    mine = ari.duel(d["id"])
    assert mine["status"] == "active" and mine["opponent"]["name"] == "Sam"
    assert sam.get("/duels/by-code/K3X9").status_code == 404


def test_you_cannot_accept_your_own_challenge(player):
    d = player.challenge("ben", code="K3X9")
    r = player.post(f"/duels/{d['id']}/accept")
    assert r.status_code == 400
    assert "own challenge" in r.json()["detail"]


def test_unknown_code(player):
    r = player.get("/duels/by-code/ZZZZ")
    assert r.status_code == 404
    assert "couldn’t find that code" in r.json()["detail"]


def test_a_duel_cannot_be_accepted_twice(make_player):
    ari, sam, kim = make_player(), make_player(), make_player()
    d = ari.challenge("ben", code="K3X9")
    assert sam.post(f"/duels/{d['id']}/accept").status_code == 200
    assert kim.post(f"/duels/{d['id']}/accept").status_code == 400


def test_confirming_each_others_check_ins(make_player):
    ari, sam = make_player(), make_player()
    d = ari.challenge("ben", code="K3X9")
    sam.post(f"/duels/{d['id']}/accept")

    after = ari.post(f"/duels/{d['id']}/checkin").json()
    assert after["myDays"] == [0]  # counts on my own screen right away

    seen_by_sam = sam.duel(d["id"])
    assert seen_by_sam["theirDays"] == []  # but not on Sam's until Sam confirms
    assert seen_by_sam["theirPending"] == {"minutes": 20, "note": ""}

    confirmed = sam.post(f"/duels/{d['id']}/confirm").json()
    assert confirmed["theirDays"] == [0] and confirmed["theirPending"] is None


# ---------------------------------------------------------------- playing


def test_check_in_once_per_day(player):
    d = player.challenge("eleanor")
    r = player.post(f"/duels/{d['id']}/checkin")
    assert r.status_code == 200 and r.json()["myDays"] == [0]
    again = player.post(f"/duels/{d['id']}/checkin")
    assert again.status_code == 400 and "already checked in" in again.json()["detail"]


def test_cannot_check_in_to_a_pending_duel(player):
    d = player.challenge("ben")
    assert player.post(f"/duels/{d['id']}/checkin").status_code == 400


def test_rest_days_are_limited_to_two(player):
    d = player.challenge("eleanor")
    first = player.post(f"/duels/{d['id']}/rest").json()
    assert first["myRestDays"] == [0] and first["restLeft"] == 1
    assert player.post(f"/duels/{d['id']}/rest").status_code == 400  # today is already logged

    backdate(d["id"], 1)
    assert player.post(f"/duels/{d['id']}/rest").json()["restLeft"] == 0
    backdate(d["id"], 1)
    r = player.post(f"/duels/{d['id']}/rest")
    assert r.status_code == 400 and "No rest days left" in r.json()["detail"]


def test_a_rest_day_blocks_the_check_in(player):
    d = player.challenge("eleanor")
    player.post(f"/duels/{d['id']}/rest")
    assert player.post(f"/duels/{d['id']}/checkin").status_code == 400


def test_pause_and_resume(player):
    d = player.challenge("eleanor")
    paused = player.post(f"/duels/{d['id']}/pause").json()
    assert paused["status"] == "paused" and paused["pausedUntil"].endswith("Z")
    assert player.post(f"/duels/{d['id']}/checkin").status_code == 400
    backdate(d["id"], 3)  # frozen: the clock does not move a paused duel
    assert player.duel(d["id"])["today"] == 0
    resumed = player.post(f"/duels/{d['id']}/resume").json()
    assert resumed["status"] == "active" and resumed["pausedUntil"] is None


def test_forfeit_ends_the_duel_and_the_friend_wins(player):
    d = player.challenge("eleanor")
    f = player.post(f"/duels/{d['id']}/forfeit").json()
    assert f["status"] == "finished"
    assert f["result"] == {"winner": "them", "forfeitedBy": "me"}
    assert player.post(f"/duels/{d['id']}/checkin").status_code == 400


def test_rematch_same_and_easier(player):
    d = player.challenge("eleanor", minutes=20)
    player.post(f"/duels/{d['id']}/forfeit")
    same = player.post(f"/duels/{d['id']}/rematch", {"kind": "same"}).json()
    easier = player.post(f"/duels/{d['id']}/rematch", {"kind": "easier"}).json()
    assert (same["minutes"], easier["minutes"]) == (20, 15)
    assert same["opponent"]["id"] == "eleanor" and same["status"] == "active"
    assert same["id"] != d["id"]


# ---------------------------------------------------------------- the clock


def test_the_real_clock_moves_the_day_and_seeded_friends_check_in(player):
    d = player.challenge("eleanor")
    backdate(d["id"], 3)
    after = player.duel(d["id"])
    assert after["today"] == 3
    assert after["theirDays"] == [1, 2]  # days 1 and 2 were confirmed when the day rolled over
    assert after["theirPending"] is not None  # day 3 is waiting for my OK


def test_a_duel_finishes_after_day_seven(player):
    d = player.challenge("eleanor")
    for day in range(7):
        player.post(f"/duels/{d['id']}/checkin")
        backdate(d["id"], 1)
        player.duel(d["id"])
    final = player.duel(d["id"])
    assert final["status"] == "finished" and final["today"] == 7
    assert final["result"]["winner"] == "me"  # 7 check-ins against 5 (Eleanor skips day 1 and day 7)
    assert len(final["myDays"]) == 7 and len(final["theirDays"]) == 5
