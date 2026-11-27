"""Custom hobby: a duel on hobby 'custom' carries the name the creator typed ("Chess"), everywhere and through a rematch."""

import pytest
from sqlalchemy import create_engine, text

from app.migrate import add_missing_columns
from app.models import Duel


def create(player, friend=None, hobby="custom", **body):
    return player.post("/duels", {"hobbyId": hobby, "minutes": 20, "friendId": friend.id if friend else None, **body})


# ---------------------------------------------------------------- stored and shown


def test_the_typed_name_is_trimmed_saved_and_returned(player, db):
    r = create(player, customHobby="  Chess  ")
    assert r.status_code == 200, r.text
    d = r.json()
    assert (d["hobbyId"], d["customHobby"]) == ("custom", "Chess")
    assert db.get(Duel, int(d["id"])).custom_hobby == "Chess"


def test_the_friend_sees_the_name_on_the_invite_after_accepting_and_by_code(duo, make_player):
    ari, sam = duo
    d = create(ari, friend=sam, customHobby="Chess").json()
    assert sam.duels()[0]["customHobby"] == "Chess"  # Pending invites
    assert sam.accept(d["id"])["customHobby"] == "Chess"
    assert ari.duel(d["id"])["customHobby"] == "Chess"
    open_invite = create(ari, customHobby="Juggling").json()
    kim = make_player("Kim")
    assert kim.get(f"/duels/by-code/{open_invite['inviteCode']}").json()["customHobby"] == "Juggling"


def test_a_catalog_hobby_has_no_custom_name_even_if_one_is_sent(player):
    plain = create(player, hobby="guitar").json()
    assert plain["customHobby"] is None
    ignored = create(player, hobby="running", customHobby="Chess").json()
    assert (ignored["hobbyId"], ignored["customHobby"]) == ("running", None)


# ---------------------------------------------------------------- validation


@pytest.mark.parametrize("name", [None, "", "   "])
def test_a_custom_hobby_needs_a_name(player, name):
    r = create(player, customHobby=name)
    assert r.status_code == 400
    assert "name" in r.json()["detail"].lower()


def test_a_name_longer_than_80_characters_is_refused(player):
    assert create(player, customHobby="x" * 81).status_code == 422
    assert create(player, customHobby="x" * 80).status_code == 200


# ---------------------------------------------------------------- invites and rematches


def test_the_same_invite_twice_is_one_duel_but_a_different_name_is_a_new_one(duo):
    ari, sam = duo
    first = create(ari, friend=sam, customHobby="Chess").json()
    again = create(ari, friend=sam, customHobby="Chess").json()
    other = create(ari, friend=sam, customHobby="Juggling").json()
    assert first["id"] == again["id"]
    assert other["id"] != first["id"]


def test_a_rematch_keeps_the_custom_name(duo):
    ari, sam = duo
    d = create(ari, friend=sam, customHobby="Chess").json()
    sam.accept(d["id"])
    ari.post(f"/duels/{d['id']}/forfeit")
    for kind in ("same", "easier"):
        r = ari.post(f"/duels/{d['id']}/rematch", {"kind": kind})
        assert r.status_code == 200, r.text
        assert (r.json()["hobbyId"], r.json()["customHobby"]) == ("custom", "Chess")


# ---------------------------------------------------------------- the database column


def test_the_column_is_added_to_an_older_database_and_old_duels_have_no_custom_name():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("create table duels (id integer primary key, hobby_id varchar, minutes integer)"))
        conn.execute(text("insert into duels (id, hobby_id, minutes) values (1, 'guitar', 20)"))
    assert "duels.custom_hobby" in add_missing_columns(engine)
    with engine.connect() as conn:
        assert conn.execute(text("select custom_hobby from duels where id = 1")).scalar() is None
