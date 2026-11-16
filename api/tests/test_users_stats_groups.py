"""Friend search, the You stats and the Groups tab: everything computed from real rows."""

from datetime import timedelta

from app.models import Duel


def backdate(db, duel_id: str, days: int) -> None:
    duel = db.get(Duel, int(duel_id))
    duel.started_at = duel.started_at - timedelta(days=days)
    db.commit()


# ---------------------------------------------------------------- search


def test_search_finds_accounts_by_name_and_email(make_player):
    me = make_player("Me")
    make_player("Samantha")
    make_player("Sam Lee")
    make_player("Kim")

    names = [h["name"] for h in me.get("/users/search?q=sam").json()]
    assert names == ["Sam Lee", "Samantha"]  # case-insensitive, alphabetical

    by_email = me.get("/users/search?q=kim.4@exa").json()
    assert [h["name"] for h in by_email] == ["Kim"]


def test_search_hides_the_full_email_and_the_person_themselves(make_player):
    me = make_player("Sam")
    other = make_player("Samuel")
    hits = me.get("/users/search?q=sam").json()
    assert [h["id"] for h in hits] == [other.id]  # not me
    assert hits[0]["email_hint"] if "email_hint" in hits[0] else hits[0]["emailHint"] == "s***@example.com"
    assert "samuel.2@example.com" not in str(hits)


def test_search_ignores_short_queries(make_player):
    me = make_player("Me")
    make_player("Sammy")
    assert me.get("/users/search?q=s").json() == []
    assert me.get("/users/search").json() == []


def test_search_treats_wildcards_as_plain_text(make_player):
    me = make_player("Me")
    make_player("Sam")
    assert me.get("/users/search?q=%25%25").json() == []  # "%%" must not match everyone


def test_search_needs_a_token(client):
    assert client.get("/users/search?q=sam").status_code == 401


def test_search_result_can_be_challenged(duo):
    ari, sam = duo
    hit = ari.get("/users/search?q=sam").json()[0]
    d = ari.post("/duels", {"hobbyId": "guitar", "minutes": 20, "friendId": hit["id"]}).json()
    assert d["opponent"]["name"] == "Sam"


# ---------------------------------------------------------------- stats


def test_stats_start_at_zero(player):
    stats = player.get("/me/stats").json()
    assert (stats["duelsWon"], stats["daysCheckedIn"], stats["currentStreak"], stats["recentCheckIns"]) == (0, 0, 0, [])
    assert (stats["xp"], stats["tier"]) == (0, "Bronze")


def test_stats_count_check_ins_and_the_streak(active_duel, db):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    stats = ari.get("/me/stats").json()
    assert (stats["duelsWon"], stats["daysCheckedIn"], stats["currentStreak"]) == (0, 1, 1)
    assert len(stats["recentCheckIns"]) == 1 and stats["recentCheckIns"][0].endswith("Z")  # my own check-in time, for the week bubbles

    backdate(db, duel_id, 1)
    ari.post(f"/duels/{duel_id}/checkin")
    backdate(db, duel_id, 1)
    ari.post(f"/duels/{duel_id}/checkin")
    stats = ari.get("/me/stats").json()
    assert (stats["duelsWon"], stats["daysCheckedIn"], stats["currentStreak"]) == (0, 3, 3)
    assert len(stats["recentCheckIns"]) == 3


def test_the_streak_survives_a_day_not_yet_checked_in_but_breaks_after_a_miss(active_duel, db):
    ari, _, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    backdate(db, duel_id, 1)  # day 2 has started and I have not checked in yet: the streak is still alive
    assert ari.get("/me/stats").json()["currentStreak"] == 1
    backdate(db, duel_id, 1)  # a whole day missed: the streak is gone
    assert ari.get("/me/stats").json()["currentStreak"] == 0
    assert ari.get("/me/stats").json()["daysCheckedIn"] == 1


def test_recent_check_ins_are_only_mine_and_only_the_last_two_weeks(active_duel, db):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    sam.post(f"/duels/{duel_id}/checkin")
    assert len(ari.get("/me/stats").json()["recentCheckIns"]) == 1  # not Sam's
    from app.models import Checkin

    old = db.query(Checkin).filter(Checkin.user_id == ari.id).one()
    old.created_at = old.created_at.replace(year=old.created_at.year - 1)  # a year ago
    db.commit()
    assert ari.get("/me/stats").json()["recentCheckIns"] == []
    assert ari.get("/me/stats").json()["daysCheckedIn"] == 1  # still counted in the total


def test_stats_count_duels_won_only_when_a_duel_really_ends(active_duel, db):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")
    assert ari.get("/me/stats").json()["duelsWon"] == 0  # still running
    backdate(db, duel_id, 7)
    stats = ari.get("/me/stats").json()
    assert (stats["duelsWon"], stats["daysCheckedIn"], stats["currentStreak"]) == (1, 1, 0)
    assert sam.get("/me/stats").json()["duelsWon"] == 0


def test_pending_invites_do_not_count(duo):
    ari, sam = duo
    ari.challenge(sam)
    stats = ari.get("/me/stats").json()
    assert (stats["duelsWon"], stats["daysCheckedIn"], stats["currentStreak"], stats["xp"]) == (0, 0, 0, 0)


# ---------------------------------------------------------------- groups


def test_groups_are_empty_for_a_new_account(player):
    body = player.get("/groups").json()
    assert body["rivals"] == []
    assert [(r["name"], r["wins"]) for r in body["leaderboard"]] == [("Ari", 0)]


def test_groups_list_people_you_have_dueled_with_the_record(active_duel, db):
    ari, sam, duel_id = active_duel
    ari.post(f"/duels/{duel_id}/checkin")

    before = ari.get("/groups").json()
    assert before["rivals"][0]["person"]["name"] == "Sam"
    assert (before["rivals"][0]["duels"], before["rivals"][0]["active"], before["rivals"][0]["wins"]) == (1, 1, 0)

    backdate(db, duel_id, 7)  # Ari checked in once, Sam never: Ari wins
    after = ari.get("/groups").json()
    assert (after["rivals"][0]["wins"], after["rivals"][0]["losses"], after["rivals"][0]["active"]) == (1, 0, 0)
    assert [(r["name"], r["wins"], r["isYou"]) for r in after["leaderboard"]] == [("Ari", 1, True), ("Sam", 0, False)]

    from_sams_side = sam.get("/groups").json()
    assert (from_sams_side["rivals"][0]["wins"], from_sams_side["rivals"][0]["losses"]) == (0, 1)


def test_pending_invites_are_not_rivals_yet(duo):
    ari, sam = duo
    ari.challenge(sam)
    assert ari.get("/groups").json()["rivals"] == []


def test_the_leaderboard_counts_wins_across_all_real_duels(make_player, db):
    ari, sam, kim = make_player("Ari"), make_player("Sam"), make_player("Kim")
    d1 = ari.challenge(sam)
    sam.accept(d1["id"])
    d2 = kim.challenge(sam)  # Kim and Sam duel each other too; Ari is not part of it
    sam.accept(d2["id"])
    sam.post(f"/duels/{d1['id']}/checkin")
    sam.post(f"/duels/{d2['id']}/checkin")
    backdate(db, d1["id"], 7)
    backdate(db, d2["id"], 7)
    board = {r["name"]: r["wins"] for r in ari.get("/groups").json()["leaderboard"]}
    assert board == {"Ari": 0, "Sam": 2}  # Kim is not in Ari's circle, so she is not listed
    assert ari.get("/groups").json()["leaderboard"][0]["name"] == "Sam"


def test_groups_and_stats_need_a_token(client):
    assert client.get("/groups").status_code == 401
    assert client.get("/me/stats").status_code == 401
