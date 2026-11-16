"""Asking for the same pending challenge twice (retry after a cancelled share sheet, double tap) must not create duplicates."""


def test_the_same_open_invite_returns_the_same_duel_and_code(player):
    first = player.challenge(hobby="guitar", minutes=20)
    again = player.challenge(hobby="guitar", minutes=20)
    assert again["id"] == first["id"] and again["inviteCode"] == first["inviteCode"]
    assert len(player.duels()) == 1


def test_a_different_hobby_or_minutes_is_a_new_invite(player):
    a = player.challenge(hobby="guitar", minutes=20)
    b = player.challenge(hobby="guitar", minutes=30)
    c = player.challenge(hobby="running", minutes=20)
    assert len({a["id"], b["id"], c["id"]}) == 3
    assert len({a["inviteCode"], b["inviteCode"], c["inviteCode"]}) == 3


def test_the_same_named_invite_returns_the_same_duel(duo):
    ari, sam = duo
    first = ari.challenge(sam)
    again = ari.challenge(sam)
    assert again["id"] == first["id"]
    assert len(sam.duels()) == 1  # Sam sees one pending invite, not two


def test_a_named_and_an_open_invite_are_different_duels(duo):
    ari, sam = duo
    named = ari.challenge(sam)
    open_invite = ari.challenge()
    assert named["id"] != open_invite["id"]


def test_two_different_people_each_get_their_own(make_player):
    ari, kim, sam = make_player("Ari"), make_player("Kim"), make_player("Sam")
    assert ari.challenge(sam)["id"] != kim.challenge(sam)["id"]
    assert ari.challenge()["id"] != kim.challenge()["id"]


def test_once_accepted_a_new_challenge_is_a_new_duel(duo):
    ari, sam = duo
    first = ari.challenge(sam)
    sam.accept(first["id"])
    second = ari.challenge(sam)  # the first one is active now, so this is a fresh pending duel
    assert second["id"] != first["id"] and second["status"] == "pending"


def test_a_rematch_after_a_finished_duel_still_works(active_duel, db):
    from app.models import Duel

    ari, sam, duel_id = active_duel
    d = db.get(Duel, int(duel_id))
    d.status, d.today, d.winner = "finished", 7, "tie"
    db.commit()
    first = ari.post(f"/duels/{duel_id}/rematch", {"kind": "same"}).json()
    again = ari.post(f"/duels/{duel_id}/rematch", {"kind": "same"}).json()
    assert first["status"] == "pending" and again["id"] == first["id"]  # tapping Send rematch twice does not duplicate
