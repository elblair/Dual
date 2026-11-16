from datetime import timedelta

from app.models import Duel


def backdate(db, duel_id: str, days: int) -> None:
    """Pretend the duel started `days` days earlier (the real clock moves the day forward)."""
    duel = db.get(Duel, int(duel_id))
    duel.started_at = duel.started_at - timedelta(days=days)
    db.commit()


# ---------------------------------------------------------------- inviting


def test_inviting_a_person_creates_a_pending_duel_they_can_see(duo):
    ari, sam = duo
    d = ari.challenge(sam, minutes=25)
    assert d["status"] == "pending"
    assert d["viewerIsCreator"] is True
    assert d["opponent"]["id"] == sam.id and d["opponent"]["name"] == "Sam"
    assert len(d["inviteCode"]) == 4
    assert d["startedAt"] is None and d["minutes"] == 25

    # Sam sees it as a pending invite from Ari.
    invites = sam.duels()
    assert len(invites) == 1
    assert invites[0]["status"] == "pending" and invites[0]["viewerIsCreator"] is False
    assert invites[0]["creator"]["name"] == "Ari" and invites[0]["opponent"]["name"] == "Ari"
    assert invites[0]["myDays"] == []


def test_an_open_invite_has_a_code_and_no_opponent(player):
    d = player.challenge()
    assert d["status"] == "pending" and d["opponent"] is None
    assert len(d["inviteCode"]) == 4 and d["inviteCode"].isalnum()


def test_invite_codes_are_unique(player):
    codes = {player.challenge()["inviteCode"] for _ in range(20)}
    assert len(codes) == 20


def test_challenging_someone_who_does_not_exist_or_yourself_fails(player):
    assert player.post("/duels", {"hobbyId": "guitar", "minutes": 20, "friendId": "nobody"}).status_code == 404
    assert player.post("/duels", {"hobbyId": "guitar", "minutes": 20, "friendId": player.id}).status_code == 400


def test_minutes_are_validated(player):
    assert player.post("/duels", {"hobbyId": "guitar", "minutes": 1}).status_code == 400
    assert player.post("/duels", {"hobbyId": "guitar", "minutes": 241}).status_code == 400


def test_duels_are_listed_newest_first(player):
    a = player.challenge(hobby="guitar")
    b = player.challenge(hobby="running")
    assert [d["id"] for d in player.duels()] == [b["id"], a["id"]]


def test_you_cannot_see_someone_elses_duel(make_player, duo):
    ari, sam = duo
    d = ari.challenge(sam)
    stranger = make_player("Zed")
    assert stranger.get(f"/duels/{d['id']}").status_code == 404
    assert stranger.post(f"/duels/{d['id']}/checkin").status_code == 404


# ---------------------------------------------------------------- accepting


def test_the_invited_person_accepts_from_their_pending_invites(duo):
    ari, sam = duo
    d = ari.challenge(sam)
    accepted = sam.accept(d["id"])
    assert accepted["status"] == "active" and accepted["today"] == 0
    assert accepted["startedAt"].endswith("Z") and accepted["inviteCode"] is None
    assert accepted["opponent"]["name"] == "Ari"

    mine = ari.duel(d["id"])
    assert mine["status"] == "active" and mine["opponent"]["name"] == "Sam"


def test_a_friend_who_is_not_on_dual_accepts_with_the_code(make_player):
    ari = make_player("Ari", account=True)
    d = ari.challenge()
    friend = make_player("Kim")  # a guest on another phone

    seen = friend.get(f"/duels/by-code/{d['inviteCode'].lower()}").json()
    assert seen["creator"]["name"] == "Ari" and seen["viewerIsCreator"] is False

    accepted = friend.accept(d["id"])
    assert accepted["status"] == "active" and accepted["opponent"]["name"] == "Ari"
    assert ari.duel(d["id"])["opponent"]["name"] == "Kim"
    assert friend.get(f"/duels/by-code/{d['inviteCode']}").status_code == 404  # the code works once


def test_the_invite_code_can_be_looked_up_before_signing_in(client, player):
    d = player.challenge()
    seen = client.get(f"/duels/by-code/{d['inviteCode']}")  # no token at all
    assert seen.status_code == 200
    body = seen.json()
    assert body["viewerIsCreator"] is False and body["creator"]["name"] == "Ari"
    assert body["myDays"] == [] and body["status"] == "pending"
    assert client.get("/duels/by-code/ZZZZ").status_code == 404


def test_an_invite_for_one_person_cannot_be_accepted_by_another(make_player, duo):
    ari, sam = duo
    d = ari.challenge(sam)
    other = make_player("Zed")
    r = other.post(f"/duels/{d['id']}/accept")
    assert r.status_code == 403 and "for someone else" in r.json()["detail"]
    assert sam.accept(d["id"])["status"] == "active"


def test_you_cannot_accept_your_own_challenge(player):
    d = player.challenge()
    r = player.post(f"/duels/{d['id']}/accept")
    assert r.status_code == 400 and "own challenge" in r.json()["detail"]


def test_a_duel_cannot_be_accepted_twice(make_player):
    ari = make_player("Ari")
    d = ari.challenge()
    assert make_player("Sam").post(f"/duels/{d['id']}/accept").status_code == 200
    assert make_player("Kim").post(f"/duels/{d['id']}/accept").status_code == 400


def test_a_pending_duel_cannot_be_played(duo):
    ari, sam = duo
    d = ari.challenge(sam)
    assert ari.post(f"/duels/{d['id']}/checkin").status_code == 400
    assert ari.post(f"/duels/{d['id']}/rest").status_code == 400


# ---------------------------------------------------------------- playing together


def test_confirming_each_others_check_ins(active_duel):
    ari, sam, duel_id = active_duel
    after = ari.post(f"/duels/{duel_id}/checkin").json()
    assert after["myDays"] == [0]  # counts on my own screen right away

    seen_by_sam = sam.duel(duel_id)
    assert seen_by_sam["theirDays"] == []  # but not on Sam's until Sam confirms
    assert seen_by_sam["theirPending"] == {"minutes": 20, "note": ""}

    confirmed = sam.post(f"/duels/{duel_id}/confirm").json()
    assert confirmed["theirDays"] == [0] and confirmed["theirPending"] is None


def test_check_in_once_per_day(active_duel):
    ari, _, duel_id = active_duel
    assert ari.post(f"/duels/{duel_id}/checkin").status_code == 200
    again = ari.post(f"/duels/{duel_id}/checkin")
    assert again.status_code == 400 and "already checked in" in again.json()["detail"]


def test_rest_days_are_limited_to_two(active_duel, db):
    ari, _, duel_id = active_duel
    first = ari.post(f"/duels/{duel_id}/rest").json()
    assert first["myRestDays"] == [0] and first["restLeft"] == 1
    assert ari.post(f"/duels/{duel_id}/rest").status_code == 400  # today is already logged

    backdate(db, duel_id, 1)
    assert ari.post(f"/duels/{duel_id}/rest").json()["restLeft"] == 0
    backdate(db, duel_id, 1)
    r = ari.post(f"/duels/{duel_id}/rest")
    assert r.status_code == 400 and "No rest days left" in r.json()["detail"]


def test_a_rest_day_blocks_the_check_in(active_duel):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/rest")
    assert ari.post(f"/duels/{duel_id}/checkin").status_code == 400


def test_pause_and_resume(active_duel, db):
    ari, sam, duel_id = active_duel
    paused = sam.post(f"/duels/{duel_id}/pause").json()  # either player can pause: it freezes for both
    assert paused["status"] == "paused" and paused["pausedUntil"].endswith("Z")
    assert ari.post(f"/duels/{duel_id}/checkin").status_code == 400
    backdate(db, duel_id, 3)  # frozen: the clock does not move a paused duel
    assert ari.duel(duel_id)["today"] == 0
    resumed = ari.post(f"/duels/{duel_id}/resume").json()
    assert resumed["status"] == "active" and resumed["pausedUntil"] is None


def test_forfeit_ends_the_duel_and_the_friend_wins(active_duel):
    ari, sam, duel_id = active_duel
    f = ari.post(f"/duels/{duel_id}/forfeit").json()
    assert f["status"] == "finished" and f["result"] == {"winner": "them", "forfeitedBy": "me"}
    assert sam.duel(duel_id)["result"] == {"winner": "me", "forfeitedBy": "them"}
    assert ari.post(f"/duels/{duel_id}/checkin").status_code == 400


def test_rematch_sends_a_new_pending_invite_to_the_same_friend(active_duel):
    ari, sam, duel_id = active_duel
    assert ari.post(f"/duels/{duel_id}/rematch", {"kind": "same"}).status_code == 400  # only once it is over
    ari.post(f"/duels/{duel_id}/forfeit")

    same = ari.post(f"/duels/{duel_id}/rematch", {"kind": "same"}).json()
    easier = ari.post(f"/duels/{duel_id}/rematch", {"kind": "easier"}).json()
    assert (same["minutes"], easier["minutes"]) == (20, 10)  # easier = half, rounded down to 5
    assert same["status"] == "pending" and same["opponent"]["id"] == sam.id
    assert [d["status"] for d in sam.duels()][:2] == ["pending", "pending"]  # Sam finds both under Pending invites


# ---------------------------------------------------------------- the clock and the result


def test_the_real_clock_moves_the_day_and_confirms_check_ins(active_duel, db):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    sam.post(f"/duels/{duel_id}/checkin")
    backdate(db, duel_id, 2)
    after = ari.duel(duel_id)
    assert after["today"] == 2
    assert after["myDays"] == [0] and after["theirDays"] == [0]  # day 0 check-ins were confirmed at rollover


def test_a_duel_finishes_after_day_seven_with_the_winner_by_check_ins(active_duel, db):
    ari, sam, duel_id = active_duel
    for day in range(7):
        ari.post(f"/duels/{duel_id}/checkin")
        if day < 4:
            sam.post(f"/duels/{duel_id}/checkin")  # Sam misses the last three days
        backdate(db, duel_id, 1)
        ari.duel(duel_id)
    final = ari.duel(duel_id)
    assert final["status"] == "finished" and final["today"] == 7
    assert final["result"] == {"winner": "me", "forfeitedBy": None}
    assert (len(final["myDays"]), len(final["theirDays"])) == (7, 4)
    assert sam.duel(duel_id)["result"]["winner"] == "them"


def test_an_even_duel_is_a_tie(active_duel, db):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    sam.post(f"/duels/{duel_id}/checkin")
    backdate(db, duel_id, 7)
    assert ari.duel(duel_id)["result"] == {"winner": "tie", "forfeitedBy": None}


def test_no_result_while_the_duel_is_running(active_duel):
    ari, _, duel_id = active_duel
    assert ari.duel(duel_id)["result"] is None
