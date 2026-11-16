"""Cancel invite: DELETE /duels/{id} for a pending duel I created. Only the creator, only while pending."""

from app.models import Duel


def cancel(player, duel_id):
    return player.client.delete(f"/duels/{duel_id}", headers=player.headers)


def test_the_creator_can_cancel_an_open_invite(player, db):
    d = player.challenge()
    r = cancel(player, d["id"])
    assert r.status_code == 204 and r.content == b""
    assert player.duels() == []
    assert db.get(Duel, int(d["id"])) is None  # really deleted from the database


def test_the_creator_can_cancel_a_named_invite_and_the_friend_no_longer_sees_it(duo):
    ari, sam = duo
    d = ari.challenge(sam)
    assert [x["id"] for x in sam.duels()] == [d["id"]]
    assert cancel(ari, d["id"]).status_code == 204
    assert sam.duels() == [] and ari.duels() == []


def test_a_cancelled_code_stops_working(player, make_player):
    d = player.challenge()
    kim = make_player("Kim")
    assert kim.get(f"/duels/by-code/{d['inviteCode']}").status_code == 200
    cancel(player, d["id"])
    assert kim.get(f"/duels/by-code/{d['inviteCode']}").status_code == 404
    assert kim.post(f"/duels/{d['id']}/accept").status_code == 404


def test_the_friend_cannot_cancel_someone_elses_invite(duo):
    ari, sam = duo
    d = ari.challenge(sam)
    r = cancel(sam, d["id"])
    assert r.status_code == 403 and "Only the person who sent the invite" in r.json()["detail"]
    assert len(ari.duels()) == 1  # still there


def test_a_stranger_gets_not_found(duo, make_player):
    ari, _ = duo
    d = ari.challenge()
    zed = make_player("Zed")
    assert cancel(zed, d["id"]).status_code == 404
    assert len(ari.duels()) == 1


def test_an_accepted_duel_cannot_be_cancelled(active_duel):
    ari, sam, duel_id = active_duel
    for who in (ari, sam):
        r = cancel(who, duel_id)
        assert r.status_code in (400, 403)
    assert ari.duel(duel_id)["status"] == "active"
    r = cancel(ari, duel_id)
    assert r.status_code == 400 and "has not been accepted" in r.json()["detail"]


def test_a_finished_duel_cannot_be_cancelled(active_duel, db):
    ari, _, duel_id = active_duel
    d = db.get(Duel, int(duel_id))
    d.status, d.today, d.winner = "finished", 7, "tie"
    db.commit()
    assert cancel(ari, duel_id).status_code == 400


def test_cancelling_something_that_does_not_exist_or_twice_is_not_found(player):
    d = player.challenge()
    assert cancel(player, d["id"]).status_code == 204
    assert cancel(player, d["id"]).status_code == 404
    assert cancel(player, 99999).status_code == 404


def test_cancelling_needs_a_session(client, player):
    d = player.challenge()
    assert client.delete(f"/duels/{d['id']}").status_code == 401
    assert len(player.duels()) == 1


def test_the_same_challenge_can_be_sent_again_after_cancelling(player):
    first = player.challenge()
    cancel(player, first["id"])
    again = player.challenge()
    assert again["status"] == "pending"  # a fresh duel, not the deleted one (ids may be reused on SQLite, never on Postgres)
    assert [x["id"] for x in player.duels()] == [again["id"]]


def test_cancelling_one_invite_leaves_the_others(player):
    a = player.challenge(minutes=20)
    b = player.challenge(minutes=30)
    cancel(player, a["id"])
    assert [x["id"] for x in player.duels()] == [b["id"]]
