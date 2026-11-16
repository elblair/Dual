"""The "Recent check-ins" feed on the Duel screen (the `activity` list in the duel payload)."""

from datetime import timedelta

from app.logic import ACTIVITY_LIMIT
from app.models import Checkin, Duel


def test_a_duel_with_no_check_ins_has_an_empty_feed(active_duel):
    ari, _, duel_id = active_duel
    assert ari.duel(duel_id)["activity"] == []


def test_the_feed_shows_both_players_newest_first_from_my_point_of_view(active_duel):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    sam.post(f"/duels/{duel_id}/checkin")
    feed = ari.duel(duel_id)["activity"]
    assert [a["who"] for a in feed] == ["them", "me"]  # Sam checked in last
    assert feed[0]["minutes"] == 20 and feed[0]["note"] == ""
    assert feed[0]["createdAt"].endswith("Z") and feed[0]["dayIndex"] == 0
    # and the same two rows the other way round
    assert [a["who"] for a in sam.duel(duel_id)["activity"]] == ["me", "them"]


def test_confirmed_is_false_until_the_friend_confirms(active_duel):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    sam.post(f"/duels/{duel_id}/checkin")
    ari_feed = {a["who"]: a for a in ari.duel(duel_id)["activity"]}
    assert (ari_feed["me"]["confirmed"], ari_feed["them"]["confirmed"]) == (False, False)
    ari.post(f"/duels/{duel_id}/confirm")  # Ari confirms Sam's check-in
    ari_feed = {a["who"]: a for a in ari.duel(duel_id)["activity"]}
    assert ari_feed["them"]["confirmed"] is True and ari_feed["me"]["confirmed"] is False
    sam.post(f"/duels/{duel_id}/confirm")
    assert all(a["confirmed"] for a in ari.duel(duel_id)["activity"])


def test_the_feed_is_limited_to_the_latest_check_ins(active_duel, db):
    ari, sam, duel_id = active_duel
    now = db.query(Duel).one().started_at
    for i in range(10):
        db.add(Checkin(duel_id=int(duel_id), user_id=ari.id if i % 2 == 0 else sam.id, day_index=i // 2, confirmed=True,
                       minutes=20 + i, note="", created_at=now + timedelta(minutes=i)))
    db.commit()
    feed = ari.duel(duel_id)["activity"]
    assert len(feed) == ACTIVITY_LIMIT
    assert [a["minutes"] for a in feed] == [29, 28, 27, 26, 25, 24]  # newest first


def test_a_note_comes_through(active_duel, db):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    row = db.query(Checkin).one()
    row.note = "Finally nailed the F chord"
    db.commit()
    assert ari.duel(duel_id)["activity"][0]["note"] == "Finally nailed the F chord"


def test_someone_looking_up_an_invite_code_sees_no_feed(duo):
    ari, sam = duo
    d = ari.challenge()  # an open invite
    seen = sam.get(f"/duels/by-code/{d['inviteCode']}").json()
    assert seen["activity"] == []
