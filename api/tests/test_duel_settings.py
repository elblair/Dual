"""Duel settings v2 (frequency, verification, mode, unit and target): stored, validated, carried through rematches.
Only the fields exist so far; the rules that use them come in later tickets."""

import pytest
from sqlalchemy import create_engine, text

from app.logic import DuelSettings, clean_settings
from app.migrate import add_missing_columns
from app.models import Duel


def create(player, friend=None, **settings):
    return player.post("/duels", {"hobbyId": "guitar", "minutes": 20, "friendId": friend.id if friend else None, **settings})


# ---------------------------------------------------------------- defaults: duels work as before


def test_a_duel_without_settings_is_daily_mutual_compete_and_has_no_number(player):
    d = create(player).json()
    assert (d["frequency"], d["timesPerWeek"], d["verification"], d["mode"], d["unit"], d["target"]) == (
        "daily", None, "mutual", "compete", None, None)


# ---------------------------------------------------------------- stored and shown


def test_chosen_settings_are_saved_returned_and_really_in_the_database(player, db):
    d = create(player, frequency="perWeek", timesPerWeek=3, verification="photo", mode="together", unit="  miles ", target=20).json()
    assert (d["frequency"], d["timesPerWeek"], d["verification"], d["mode"], d["unit"], d["target"]) == (
        "perWeek", 3, "photo", "together", "miles", 20)
    row = db.get(Duel, int(d["id"]))
    assert (row.frequency, row.times_per_week, row.verification, row.mode, row.unit, row.target) == ("perWeek", 3, "photo", "together", "miles", 20)


def test_weekly_means_once_a_week_and_needs_no_count(player):
    d = create(player, frequency="weekly").json()
    assert (d["frequency"], d["timesPerWeek"]) == ("weekly", None)


def test_the_friend_sees_the_settings_before_and_after_accepting(duo):
    ari, sam = duo
    d = create(ari, friend=sam, frequency="weekly", verification="honor", mode="together").json()
    invite = sam.get("/duels").json()[0]
    assert (invite["frequency"], invite["verification"], invite["mode"]) == ("weekly", "honor", "together")
    accepted = sam.accept(d["id"])
    assert (accepted["frequency"], accepted["verification"], accepted["mode"]) == ("weekly", "honor", "together")


def test_a_code_lookup_shows_the_settings(player, make_player):
    d = create(player, frequency="perWeek", timesPerWeek=4).json()
    kim = make_player("Kim")
    found = kim.get(f"/duels/by-code/{d['inviteCode']}").json()
    assert (found["frequency"], found["timesPerWeek"]) == ("perWeek", 4)


# ---------------------------------------------------------------- validation


@pytest.mark.parametrize("settings", [
    {"frequency": "monthly"},
    {"verification": "trust-me"},
    {"mode": "coop"},
])
def test_an_unknown_value_is_refused(player, settings):
    assert create(player, **settings).status_code == 422


@pytest.mark.parametrize("times", [None, 0, 1, 7, 50])
def test_per_week_needs_a_count_between_2_and_6(player, times):
    r = create(player, frequency="perWeek", timesPerWeek=times)
    assert r.status_code == 422 and "check-ins a week" in r.json()["detail"]


@pytest.mark.parametrize("times", [2, 6])
def test_the_ends_of_the_per_week_range_are_allowed(player, times):
    assert create(player, frequency="perWeek", timesPerWeek=times).json()["timesPerWeek"] == times


@pytest.mark.parametrize("frequency", ["daily", "weekly"])
def test_a_count_without_per_week_is_refused(player, frequency):
    assert create(player, frequency=frequency, timesPerWeek=3).status_code == 422


def test_a_target_needs_a_unit(player):
    r = create(player, target=10)
    assert r.status_code == 422 and "what you are counting" in r.json()["detail"]
    assert create(player, unit="   ", target=10).status_code == 422  # a blank unit is no unit


@pytest.mark.parametrize("target", [0, -3, 100_001])
def test_a_target_must_be_between_1_and_the_maximum(player, target):
    assert create(player, unit="miles", target=target).status_code == 422


def test_a_unit_without_a_target_is_fine_and_a_blank_unit_becomes_none(player):
    assert create(player, unit="pages").json()["unit"] == "pages"
    assert create(player, unit="   ").json()["unit"] is None


def test_a_long_unit_is_refused(player):
    assert create(player, unit="x" * 25).status_code == 422
    assert create(player, unit="x" * 24).status_code == 200


def test_clean_settings_helper_tidies_the_unit():
    assert clean_settings(DuelSettings(unit="  hours   of  study ")).unit == "hours of study"


# ---------------------------------------------------------------- invites and rematches


def test_the_same_settings_are_the_same_pending_invite_and_other_settings_are_a_new_one(player):
    a = create(player, frequency="weekly").json()
    b = create(player, frequency="weekly").json()
    c = create(player, frequency="daily").json()
    d = create(player, frequency="weekly", mode="together").json()
    assert a["id"] == b["id"]
    assert len({a["id"], c["id"], d["id"]}) == 3


def finish(db, duel_id):
    d = db.get(Duel, int(duel_id))
    d.status, d.today, d.winner = "finished", 7, "tie"
    db.commit()


@pytest.mark.parametrize("kind", ["same", "easier"])
def test_a_rematch_keeps_the_settings(duo, db, kind):
    ari, sam = duo
    d = create(ari, friend=sam, frequency="perWeek", timesPerWeek=3, verification="honor", mode="together", unit="miles", target=12).json()
    sam.accept(d["id"])
    finish(db, d["id"])
    again = ari.post(f"/duels/{d['id']}/rematch", {"kind": kind}).json()
    assert (again["frequency"], again["timesPerWeek"], again["verification"], again["mode"], again["unit"], again["target"]) == (
        "perWeek", 3, "honor", "together", "miles", 12)


# ---------------------------------------------------------------- the database columns


def test_the_columns_are_added_to_an_older_database_and_old_duels_keep_working_as_before():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("create table duels (id integer primary key, hobby_id varchar, minutes integer)"))
        conn.execute(text("insert into duels (id, hobby_id, minutes) values (1, 'guitar', 20)"))
    added = add_missing_columns(engine)
    for column in ("frequency", "times_per_week", "verification", "mode", "unit", "target"):
        assert f"duels.{column}" in added
    with engine.connect() as conn:
        row = conn.execute(text("select frequency, times_per_week, verification, mode, unit, target from duels where id = 1")).one()
    assert tuple(row) == ("daily", None, "mutual", "compete", None, None)
    assert add_missing_columns(engine) == []  # safe to run on every start
