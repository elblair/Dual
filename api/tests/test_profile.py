"""Edit profile: bio, interests and avatar are stored on the user, validated, and only the fields sent change."""

import pytest
from sqlalchemy import create_engine, text

from app.logic import AVATAR_MAX, BIO_MAX, INTERESTS_MAX
from app.migrate import add_missing_columns
from app.models import User


def edit(player, **fields):
    return player.patch("/me", fields)


# ---------------------------------------------------------------- a new account has an empty profile


def test_a_new_account_has_no_bio_interests_or_avatar(player):
    me = player.get("/me").json()
    assert (me["bio"], me["interests"], me["avatar"]) == (None, [], None)


# ---------------------------------------------------------------- saved and returned


def test_the_profile_is_saved_returned_and_really_in_the_database(player, db):
    r = edit(player, bio="  I play guitar badly  ", interests=["guitar", "spanish"], avatar="fox")
    assert r.status_code == 200
    me = r.json()
    assert (me["bio"], me["interests"], me["avatar"]) == ("I play guitar badly", ["guitar", "spanish"], "fox")
    assert player.get("/me").json()["interests"] == ["guitar", "spanish"]  # still there on the next load
    row = db.get(User, player.id)
    assert (row.bio, row.interests, row.avatar) == ("I play guitar badly", "guitar,spanish", "fox")


def test_only_the_fields_sent_change(player):
    edit(player, bio="Hello", interests=["guitar"], avatar="fox")
    me = edit(player, bio="New bio").json()
    assert (me["bio"], me["interests"], me["avatar"]) == ("New bio", ["guitar"], "fox")
    me = edit(player, interests=["running"]).json()
    assert (me["bio"], me["interests"], me["avatar"]) == ("New bio", ["running"], "fox")


def test_an_empty_body_changes_nothing(player):
    edit(player, bio="Hello")
    assert edit(player).json()["bio"] == "Hello"


@pytest.mark.parametrize("empty", [None, "", "   "])
def test_an_empty_or_null_bio_clears_it(player, empty):
    edit(player, bio="Hello")
    assert edit(player, bio=empty).json()["bio"] is None


def test_an_empty_list_or_null_clears_the_interests_and_null_clears_the_avatar(player):
    edit(player, interests=["guitar"], avatar="fox")
    assert edit(player, interests=[]).json()["interests"] == []
    edit(player, interests=["guitar"])
    assert edit(player, interests=None).json()["interests"] == []
    assert edit(player, avatar=None).json()["avatar"] is None


def test_other_people_see_their_own_profile_not_mine(duo):
    ari, sam = duo
    edit(ari, bio="Ari here")
    assert sam.get("/me").json()["bio"] is None


# ---------------------------------------------------------------- validation


def test_a_bio_of_exactly_the_limit_is_allowed_and_one_more_is_not(player):
    assert edit(player, bio="x" * BIO_MAX).status_code == 200
    r = edit(player, bio="x" * (BIO_MAX + 1))
    assert r.status_code == 422 and "bio" in r.json()["detail"]


def test_a_huge_bio_is_refused_by_the_schema(player):
    assert edit(player, bio="x" * 5000).status_code == 422


def test_interests_are_tidied_lowercased_and_deduplicated_in_order(player):
    me = edit(player, interests=[" Guitar ", "guitar", "spanish", "GUITAR", "cross-fit"]).json()
    assert me["interests"] == ["guitar", "spanish", "cross-fit"]


@pytest.mark.parametrize("bad", ["", "  ", "has space", "a,b", "UPPER CASE!", "x" * 33, "-lead", "emoji🎸"])
def test_an_interest_that_is_not_an_id_is_refused(player, bad):
    r = edit(player, interests=["guitar", bad])
    assert r.status_code == 422 and "interests" in r.json()["detail"]
    assert player.get("/me").json()["interests"] == []  # nothing was saved


def test_up_to_the_maximum_interests_and_not_more(player):
    ok = [f"hobby{i}" for i in range(INTERESTS_MAX)]
    assert edit(player, interests=ok).json()["interests"] == ok
    r = edit(player, interests=ok + ["one-more"])
    assert r.status_code == 422 and str(INTERESTS_MAX) in r.json()["detail"]


def test_an_avatar_of_exactly_the_limit_is_allowed_and_one_more_is_not(player):
    assert edit(player, avatar="a" * AVATAR_MAX).status_code == 200
    assert edit(player, avatar="a" * (AVATAR_MAX + 1)).status_code == 422


def test_a_failed_edit_changes_nothing(player):
    edit(player, bio="Keep me")
    assert edit(player, bio="New", interests=["bad id"]).status_code == 422
    assert player.get("/me").json()["bio"] == "Keep me"


def test_you_must_be_signed_in(client):
    assert client.patch("/me", json={"bio": "hi"}).status_code == 401


# ---------------------------------------------------------------- the database columns


def test_the_columns_are_added_to_an_older_database_and_old_accounts_have_an_empty_profile():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("create table users (id varchar primary key, name varchar, created_at timestamp)"))
        conn.execute(text("insert into users (id, name, created_at) values ('u1', 'Old Account', '2026-01-01 00:00:00')"))
    added = add_missing_columns(engine)
    for column in ("bio", "interests", "avatar"):
        assert f"users.{column}" in added
    with engine.connect() as conn:
        row = conn.execute(text("select bio, interests, avatar from users where id = 'u1'")).one()
    assert tuple(row) == (None, None, None)
    assert add_missing_columns(engine) == []  # safe to run on every start
