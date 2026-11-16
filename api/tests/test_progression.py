"""XP, tiers and friendship levels: computed from check-ins and duels, rules in app/progression.py."""

from datetime import timedelta

import pytest

from app import progression as cfg
from app.logic import utcnow
from app.models import Checkin, Duel, RestDay


def finished_duel(db, a, b, *, winner="creator", checkins_a=0, checkins_b=0, confirmed=True):
    """A finished duel between two Players, written straight into the database (what the Neon console would show)."""
    now = utcnow()
    d = Duel(
        hobby_id="guitar", minutes=20, status="finished", creator_id=a.id, opponent_id=b.id, invite_code=None,
        started_at=now - timedelta(days=8), today=7, winner=winner, created_at=now - timedelta(days=8),
    )
    db.add(d)
    db.flush()
    for i in range(checkins_a):
        db.add(Checkin(duel_id=d.id, user_id=a.id, day_index=i, confirmed=confirmed, minutes=20, note="", created_at=now))
    for i in range(checkins_b):
        db.add(Checkin(duel_id=d.id, user_id=b.id, day_index=i, confirmed=confirmed, minutes=20, note="", created_at=now))
    db.commit()
    return d


# ---------------------------------------------------------------- the config file


def test_xp_values_and_tier_thresholds_come_from_one_config_file():
    assert (cfg.XP_PER_CHECKIN, cfg.XP_PER_CONFIRMED_FRIEND_CHECKIN, cfg.XP_PER_DUEL_WON) == (10, 25, 50)
    assert [(t.name, t.min_xp) for t in cfg.TIERS] == [("Bronze", 0), ("Silver", 300), ("Gold", 800)]
    assert list(cfg.FRIENDSHIP_LEVELS) == [(6, "Ride or die"), (3, "Regulars"), (1, "New rivals")]


@pytest.mark.parametrize(
    "xp, tier, nxt",
    [(0, "Bronze", "Silver"), (299, "Bronze", "Silver"), (300, "Silver", "Gold"), (799, "Silver", "Gold"), (800, "Gold", None), (5000, "Gold", None)],
)
def test_tier_for_xp(xp, tier, nxt):
    assert cfg.tier_for(xp).name == tier
    upcoming = cfg.next_tier_for(xp)
    assert (upcoming.name if upcoming else None) == nxt


@pytest.mark.parametrize(
    "n, level", [(0, None), (1, "New rivals"), (2, "New rivals"), (3, "Regulars"), (5, "Regulars"), (6, "Ride or die"), (20, "Ride or die")]
)
def test_friendship_level_for_finished_duels(n, level):
    assert cfg.level_for(n) == level


# ---------------------------------------------------------------- XP from real activity


def test_a_new_account_has_no_xp(player):
    s = player.get("/me/stats").json()
    assert (s["xp"], s["tier"], s["nextTier"], s["xpToNext"], s["progress"]) == (0, "Bronze", "Silver", 300, 0.0)
    assert s["restDaysPerDuel"] == 2
    assert [(t["name"], t["reached"]) for t in s["tiers"]] == [("Bronze", True), ("Silver", False), ("Gold", False)]


def test_my_check_in_is_worth_10_xp(active_duel):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    assert ari.get("/me/stats").json()["xp"] == 10


def test_a_pending_invite_gives_no_xp(duo):
    ari, sam = duo
    ari.challenge(sam)
    assert ari.get("/me/stats").json()["xp"] == 0


def test_a_confirmed_friend_check_in_is_worth_25_xp(active_duel):
    ari, sam, duel_id = active_duel
    sam.post(f"/duels/{duel_id}/checkin")
    assert ari.get("/me/stats").json()["xp"] == 0  # not confirmed yet
    ari.post(f"/duels/{duel_id}/confirm")
    assert ari.get("/me/stats").json()["xp"] == 25
    assert sam.get("/me/stats").json()["xp"] == 10  # Sam's own check-in


def test_a_won_duel_is_worth_50_xp(duo, db):
    ari, sam = duo
    finished_duel(db, ari, sam, winner="creator", checkins_a=3, checkins_b=1)
    # Ari: 3 own check-ins (30) + Sam's 1 confirmed (25) + the win (50). Sam: 1 own (10) + Ari's 3 confirmed (75), no win.
    assert ari.get("/me/stats").json()["xp"] == 30 + 25 + 50
    assert sam.get("/me/stats").json()["xp"] == 10 + 75


def test_a_tie_is_not_a_win(duo, db):
    ari, sam = duo
    finished_duel(db, ari, sam, winner="tie", checkins_a=2, checkins_b=2)
    assert ari.get("/me/stats").json()["xp"] == 20 + 50  # 2 own + 2 confirmed of Sam's, no win bonus


def test_progress_runs_from_the_tier_to_the_next_one(duo, db):
    ari, sam = duo
    finished_duel(db, ari, sam, winner="opponent", checkins_a=7, checkins_b=0)  # 70 XP
    s = ari.get("/me/stats").json()
    assert (s["xp"], s["tier"], s["xpToNext"]) == (70, "Bronze", 230)
    assert s["progress"] == round(70 / 300, 4)


def reach_silver(db, ari, sam):
    for _ in range(5):  # 5 finished duels x 7 own check-ins = 350 XP
        finished_duel(db, ari, sam, winner="opponent", checkins_a=7)


def test_silver_is_reached_at_300_xp_and_gold_at_800(duo, db):
    ari, sam = duo
    reach_silver(db, ari, sam)
    s = ari.get("/me/stats").json()
    assert (s["xp"], s["tier"], s["nextTier"], s["xpToNext"]) == (350, "Silver", "Gold", 450)
    assert s["restDaysPerDuel"] == 3
    for _ in range(7):
        finished_duel(db, ari, sam, winner="opponent", checkins_a=7)  # +490 = 840
    s = ari.get("/me/stats").json()
    assert (s["tier"], s["nextTier"], s["xpToNext"], s["progress"]) == ("Gold", None, None, 1.0)
    assert [t["perk"] for t in s["tiers"]] == [None, "3 rest days per duel instead of 2", "Start group rivalries (coming later)"]


# ---------------------------------------------------------------- the working perk: a third rest day


def test_bronze_has_two_rest_days_per_duel(active_duel, db):
    ari, _, duel_id = active_duel
    assert ari.duel(duel_id)["restLeft"] == 2
    for day in (1, 2):
        db.add(RestDay(duel_id=int(duel_id), user_id=ari.id, day_index=day))
    db.commit()
    assert ari.duel(duel_id)["restLeft"] == 0
    r = ari.post(f"/duels/{duel_id}/rest")
    assert r.status_code == 400 and "No rest days left" in r.json()["detail"]


def test_silver_gets_three_rest_days_and_the_api_enforces_it(active_duel, db):
    ari, sam, duel_id = active_duel
    reach_silver(db, ari, sam)
    assert ari.duel(duel_id)["restLeft"] == 3
    assert sam.duel(duel_id)["restLeft"] == 3  # Ari's 35 confirmed check-ins are worth 875 XP to Sam: Gold, which also has 3
    for day in (1, 2):
        db.add(RestDay(duel_id=int(duel_id), user_id=ari.id, day_index=day))
    db.commit()
    assert ari.duel(duel_id)["restLeft"] == 1
    assert ari.post(f"/duels/{duel_id}/rest").status_code == 200  # the third one is allowed
    assert ari.duel(duel_id)["restLeft"] == 0


def test_a_fourth_rest_day_is_refused_even_for_silver(active_duel, db):
    ari, sam, duel_id = active_duel
    reach_silver(db, ari, sam)
    for day in (1, 2, 3):
        db.add(RestDay(duel_id=int(duel_id), user_id=ari.id, day_index=day))
    db.commit()
    assert ari.duel(duel_id)["restLeft"] == 0
    r = ari.post(f"/duels/{duel_id}/rest")
    assert r.status_code == 400 and "No rest days left" in r.json()["detail"]


# ---------------------------------------------------------------- friendship levels


def test_no_level_until_a_duel_is_finished(duo):
    ari, sam = duo
    d = ari.challenge(sam)
    sam.accept(d["id"])
    assert ari.get("/groups").json()["rivals"][0]["level"] is None
    assert ari.get("/users/search?q=sam").json()[0]["level"] is None


@pytest.mark.parametrize("finished, level", [(1, "New rivals"), (2, "New rivals"), (3, "Regulars"), (5, "Regulars"), (6, "Ride or die")])
def test_levels_on_groups_and_in_the_friend_search(duo, db, finished, level):
    ari, sam = duo
    for _ in range(finished):
        finished_duel(db, ari, sam)
    rival = ari.get("/groups").json()["rivals"][0]
    assert (rival["finished"], rival["level"]) == (finished, level)
    expected_next = {1: ("Regulars", 2), 2: ("Regulars", 1), 3: ("Ride or die", 3), 5: ("Ride or die", 1), 6: (None, None)}[finished]
    assert (rival["nextLevel"], rival["duelsToNextLevel"]) == expected_next
    assert ari.get("/users/search?q=sam").json()[0]["level"] == level
    assert sam.get("/users/search?q=ari").json()[0]["level"] == level  # both sides see it


def test_other_peoples_duels_do_not_raise_my_level(make_player, db):
    ari, sam, kim = make_player("Ari"), make_player("Sam"), make_player("Kim")
    for _ in range(3):
        finished_duel(db, sam, kim)
    assert ari.get("/users/search?q=sam").json()[0]["level"] is None  # Sam and Kim's history is not mine
