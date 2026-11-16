"""The presenter scripts and the schema upkeep."""

import pytest
from sqlalchemy import create_engine, inspect, text

from app.logic import DomainError
from app.migrate import drop_legacy_columns
from app.models import Duel, User
from scripts.advance_duel import advance_duel, describe, find_duel
from scripts.purge_seed_data import purge_seed_data


# ---------------------------------------------------------------- advance_duel.py


def test_advance_a_duel_by_its_invite_code_until_the_result(active_duel, db):
    ari, sam, duel_id = active_duel
    code = db.get(Duel, int(duel_id)).invite_code
    ari.post(f"/duels/{duel_id}/checkin")

    summary = advance_duel(db, code.lower(), 3)
    assert "day 4 of 7" in summary and "active" in summary
    assert ari.duel(duel_id)["today"] == 3

    final = advance_duel(db, code, 4)
    assert "finished" in final and "winner: creator" in final
    assert ari.duel(duel_id)["result"]["winner"] == "me"


def test_advance_finds_a_duel_by_id_too(active_duel, db):
    _, _, duel_id = active_duel
    assert find_duel(db, duel_id).id == int(duel_id)


@pytest.mark.parametrize("days", [0, -1])
def test_advance_rejects_a_bad_number_of_days(active_duel, db, days):
    _, _, duel_id = active_duel
    with pytest.raises(DomainError):
        advance_duel(db, duel_id, days)


def test_advance_refuses_duels_that_cannot_move(duo, db):
    ari, sam = duo
    pending = ari.challenge(sam)
    with pytest.raises(DomainError, match="not been accepted"):
        advance_duel(db, pending["id"], 1)
    sam.accept(pending["id"])
    sam.post(f"/duels/{pending['id']}/pause")
    with pytest.raises(DomainError, match="paused"):
        advance_duel(db, pending["id"], 1)
    sam.post(f"/duels/{pending['id']}/resume")
    advance_duel(db, pending["id"], 7)
    with pytest.raises(DomainError, match="already over"):
        advance_duel(db, pending["id"], 1)
    with pytest.raises(DomainError, match="No duel"):
        advance_duel(db, "ZZZZ", 1)


def test_describe_lists_the_players_and_the_code(active_duel, db):
    _, _, duel_id = active_duel
    line = describe(db, db.get(Duel, int(duel_id)))
    assert "Ari vs Sam" in line and "active" in line


# ---------------------------------------------------------------- purge_seed_data.py


def test_purge_removes_only_the_seeded_accounts_and_their_duels(duo, db):
    ari, _ = duo
    db.add_all([User(id="eleanor", name="Eleanor", created_at=db.get(User, ari.id).created_at),
                User(id="tanish", name="Tanish", created_at=db.get(User, ari.id).created_at)])
    db.commit()
    d = Duel(hobby_id="guitar", minutes=20, status="active", creator_id=ari.id, opponent_id="eleanor", invite_code="SEED",
             started_at=db.get(User, ari.id).created_at, created_at=db.get(User, ari.id).created_at)
    db.add(d)
    db.commit()
    real = ari.challenge()  # a real duel that must survive

    assert purge_seed_data(db) == (1, 2)
    assert db.get(User, "eleanor") is None and db.get(User, "tanish") is None
    assert [x["id"] for x in ari.duels()] == [real["id"]]
    assert purge_seed_data(db) == (0, 0)  # safe to run again


# ---------------------------------------------------------------- drop_legacy_columns


def test_legacy_columns_from_older_versions_are_dropped():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("create table users (id varchar primary key, name varchar, is_seeded boolean, is_guest boolean)"))
        conn.execute(text("create table duels (id integer primary key, invitee_id varchar, day_offset integer, status varchar)"))
    assert sorted(drop_legacy_columns(engine)) == ["duels.day_offset", "duels.invitee_id", "users.is_guest", "users.is_seeded"]
    assert {c["name"] for c in inspect(engine).get_columns("users")} == {"id", "name"}
    assert {c["name"] for c in inspect(engine).get_columns("duels")} == {"id", "status"}
    assert drop_legacy_columns(engine) == []  # idempotent


def test_drop_legacy_columns_is_fine_on_an_empty_database():
    assert drop_legacy_columns(create_engine("sqlite://")) == []
