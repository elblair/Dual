"""Optional minutes and note on a check-in. The one-tap check-in stays the default and keeps working with no details."""

import pytest


def details(player, duel_id, minutes=30, note=""):
    return player.post(f"/duels/{duel_id}/checkin/details", {"minutes": minutes, "note": note})


def test_one_tap_check_in_still_works_with_no_details(active_duel):
    """The default path: no body, goal minutes, no note."""
    ari, _, duel_id = active_duel
    r = ari.post(f"/duels/{duel_id}/checkin")
    assert r.status_code == 200
    mine = r.json()["activity"][0]
    assert (mine["who"], mine["minutes"], mine["note"]) == ("me", 20, "")


def test_details_set_the_minutes_and_the_note(active_duel):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    r = details(ari, duel_id, 35, "Finally nailed the F chord")
    assert r.status_code == 200
    mine = r.json()["activity"][0]
    assert (mine["minutes"], mine["note"]) == (35, "Finally nailed the F chord")


def test_the_friend_sees_the_details_on_the_pending_check_in(active_duel):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    details(ari, duel_id, 25, "Scales for 10 min, then a song")
    pending = sam.duel(duel_id)["theirPending"]
    assert pending == {"minutes": 25, "note": "Scales for 10 min, then a song"}
    feed = sam.duel(duel_id)["activity"][0]
    assert (feed["who"], feed["minutes"], feed["note"]) == ("them", 25, "Scales for 10 min, then a song")


def test_details_can_be_changed_until_the_friend_confirms(active_duel):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    details(ari, duel_id, 25, "first")
    assert details(ari, duel_id, 40, "second").status_code == 200
    sam.post(f"/duels/{duel_id}/confirm")
    r = details(ari, duel_id, 60, "too late")
    assert r.status_code == 400 and "already confirmed" in r.json()["detail"]
    assert ari.duel(duel_id)["activity"][0]["minutes"] == 40  # unchanged


def test_details_need_a_check_in_first(active_duel):
    ari, _, duel_id = active_duel
    r = details(ari, duel_id, 30, "hi")
    assert r.status_code == 400 and "Check in first" in r.json()["detail"]


def test_details_only_change_my_own_check_in(active_duel):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    sam.post(f"/duels/{duel_id}/checkin")
    details(sam, duel_id, 50, "Sam's note")
    feed = {a["who"]: a for a in ari.duel(duel_id)["activity"]}
    assert (feed["me"]["minutes"], feed["me"]["note"]) == (20, "")
    assert (feed["them"]["minutes"], feed["them"]["note"]) == (50, "Sam's note")


@pytest.mark.parametrize("minutes", [0, -5, 241, 10_000])
def test_minutes_must_be_between_1_and_240(active_duel, minutes):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    assert details(ari, duel_id, minutes, "x").status_code == 422


def test_a_note_is_limited_to_200_characters_and_whitespace_is_tidied(active_duel):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    assert details(ari, duel_id, 20, "x" * 201).status_code == 422
    r = details(ari, duel_id, 20, "  a   b \n c  ")
    assert r.json()["activity"][0]["note"] == "a b c"


def test_details_are_refused_for_someone_who_is_not_in_the_duel(active_duel, make_player):
    _, _, duel_id = active_duel
    stranger = make_player("Zed")
    assert details(stranger, duel_id).status_code == 404


def test_details_need_a_session(client, active_duel):
    _, _, duel_id = active_duel
    assert client.post(f"/duels/{duel_id}/checkin/details", json={"minutes": 20, "note": ""}).status_code == 401


def test_details_are_refused_on_a_finished_duel(active_duel, db):
    from app.models import Duel

    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    d = db.get(Duel, int(duel_id))
    d.status = "finished"
    d.today = 7
    db.commit()
    r = details(ari, duel_id)
    assert r.status_code == 400 and "not active" in r.json()["detail"]
