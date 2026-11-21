"""A duel's goal in the players' own words: stored on the duel, validated, carried through rematches."""

import pytest
from sqlalchemy import create_engine, inspect, text

from app.logic import GOAL_MAX, clean_goal, easier_goal
from app.migrate import add_missing_columns
from app.models import Duel


def create(player, goal, friend=None, hobby="guitar", minutes=20):
    body = {"hobbyId": hobby, "minutes": minutes, "friendId": friend.id if friend else None}
    if goal is not Ellipsis:
        body["goal"] = goal
    return player.post("/duels", body)


# ---------------------------------------------------------------- stored and shown


def test_a_duel_without_a_goal_has_none_and_the_app_builds_the_suggestion(player):
    d = create(player, Ellipsis).json()
    assert d["goal"] is None


def test_a_written_goal_is_saved_and_returned(player, db):
    d = create(player, "Practice scales and one song").json()
    assert d["goal"] == "Practice scales and one song"
    assert db.get(Duel, int(d["id"])).goal == "Practice scales and one song"  # really in the database


def test_the_goal_is_trimmed_and_spaces_are_tidied(player):
    assert create(player, "  Practice   guitar \n 20 min a day  ").json()["goal"] == "Practice guitar 20 min a day"


def test_the_friend_sees_the_goal_before_and_after_accepting(duo):
    ari, sam = duo
    d = create(ari, "Learn the intro to Wonderwall", friend=sam).json()
    invites = [x for x in sam.duels() if x["status"] == "pending"]
    assert invites[0]["goal"] == "Learn the intro to Wonderwall"
    accepted = sam.accept(d["id"])
    assert accepted["goal"] == "Learn the intro to Wonderwall"
    assert ari.duel(d["id"])["goal"] == "Learn the intro to Wonderwall"


def test_a_code_lookup_shows_the_goal(player, make_player):
    d = create(player, "Draw a face a day").json()
    kim = make_player("Kim")
    assert kim.get(f"/duels/by-code/{d['inviteCode']}").json()["goal"] == "Draw a face a day"


# ---------------------------------------------------------------- validation


@pytest.mark.parametrize("goal", ["", "   ", "\n\t "])
def test_an_empty_goal_is_refused(player, goal):
    r = create(player, goal)
    assert r.status_code == 422 and "Write a goal" in r.json()["detail"]
    assert player.duels() == []  # nothing was created


def test_a_goal_of_exactly_the_limit_is_allowed_and_one_more_is_not(player):
    assert create(player, "a" * GOAL_MAX).status_code == 200
    r = create(player, "b" * (GOAL_MAX + 1), minutes=25)
    assert r.status_code == 422 and str(GOAL_MAX) in r.json()["detail"]


def test_the_limit_applies_after_trimming(player):
    assert create(player, "  " + "a" * GOAL_MAX + "  ").status_code == 200


def test_a_huge_goal_is_refused_by_the_schema(player):
    assert create(player, "x" * 301).status_code == 422


def test_any_text_is_allowed_including_emoji_and_quotes(player):
    assert create(player, "Play “Hotel California” 🎸 every day").json()["goal"] == "Play “Hotel California” 🎸 every day"


def test_clean_goal_helper():
    assert clean_goal(None) is None
    assert clean_goal("  hi  there ") == "hi there"


# ---------------------------------------------------------------- the same pending challenge


def test_the_same_goal_is_the_same_pending_invite_and_another_goal_is_a_new_one(player):
    a = create(player, "Scales").json()
    b = create(player, "Scales").json()
    c = create(player, "A song").json()
    d = create(player, Ellipsis).json()
    assert a["id"] == b["id"]
    assert len({a["id"], c["id"], d["id"]}) == 3


# ---------------------------------------------------------------- rematch and easier win


def finish(db, duel_id):
    d = db.get(Duel, int(duel_id))
    d.status, d.today, d.winner = "finished", 7, "tie"
    db.commit()


def test_a_rematch_keeps_the_goal_text(duo, db):
    ari, sam = duo
    d = create(ari, "Practice guitar 20 min a day, no phone", friend=sam).json()
    sam.accept(d["id"])
    finish(db, d["id"])
    again = ari.post(f"/duels/{d['id']}/rematch", {"kind": "same"}).json()
    assert (again["goal"], again["minutes"]) == ("Practice guitar 20 min a day, no phone", 20)


def test_an_easier_win_swaps_the_minutes_inside_the_text(duo, db):
    ari, sam = duo
    d = create(ari, "Practice guitar 30 min a day", friend=sam, minutes=30).json()
    sam.accept(d["id"])
    finish(db, d["id"])
    easy = sam.post(f"/duels/{d['id']}/rematch", {"kind": "easier"}).json()
    assert (easy["minutes"], easy["goal"]) == (15, "Practice guitar 15 min a day")


def test_an_easier_win_keeps_a_goal_that_does_not_mention_the_minutes(duo, db):
    ari, sam = duo
    d = create(ari, "Learn one new chord", friend=sam, minutes=30).json()
    sam.accept(d["id"])
    finish(db, d["id"])
    easy = ari.post(f"/duels/{d['id']}/rematch", {"kind": "easier"}).json()
    assert (easy["minutes"], easy["goal"]) == (15, "Learn one new chord")


def test_a_default_goal_stays_default_on_rematch_and_easier(duo, db):
    ari, sam = duo
    d = create(ari, Ellipsis, friend=sam).json()
    sam.accept(d["id"])
    finish(db, d["id"])
    easy = ari.post(f"/duels/{d['id']}/rematch", {"kind": "easier"}).json()
    assert (easy["minutes"], easy["goal"]) == (10, None)


@pytest.mark.parametrize(
    "goal, old, new, expected",
    [
        ("Practice 20 min a day", 20, 10, "Practice 10 min a day"),
        ("20 minutes, then 20 more", 20, 10, "10 minutes, then 20 more"),  # only the first
        ("Run 120 m or 20", 20, 10, "Run 120 m or 10"),  # never inside a bigger number
        ("Run 1200 m", 20, 10, "Run 1200 m"),
        ("No numbers here", 20, 10, "No numbers here"),
        (None, 20, 10, None),
    ],
)
def test_easier_goal_helper(goal, old, new, expected):
    assert easier_goal(goal, old, new) == expected


# ---------------------------------------------------------------- the database column


def test_the_column_is_added_to_an_older_database_and_old_rows_keep_working():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("create table duels (id integer primary key, hobby_id varchar, minutes integer)"))
        conn.execute(text("insert into duels (id, hobby_id, minutes) values (1, 'guitar', 20)"))
    assert "duels.goal" in add_missing_columns(engine)
    assert "goal" in {c["name"] for c in inspect(engine).get_columns("duels")}
    with engine.connect() as conn:
        assert conn.execute(text("select goal from duels where id = 1")).scalar() is None  # old duel: no custom goal
    assert add_missing_columns(engine) == []  # safe to run on every start


def test_adding_columns_is_fine_on_an_empty_database():
    assert add_missing_columns(create_engine("sqlite://")) == []
