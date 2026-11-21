"""Check-in frequency (SCRUM-13): how many check-ins a duel allows, rest days, the streak and the winner for each mode."""

from tests.test_duels import backdate


def start(ari, sam, **settings):
    """An accepted duel with the given frequency settings. Returns the duel id."""
    r = ari.post("/duels", {"hobbyId": "guitar", "minutes": 20, "friendId": sam.id, **settings})
    assert r.status_code == 200, r.text
    sam.accept(r.json()["id"])
    return r.json()["id"]


def next_day(db, ari, duel_id):
    backdate(db, duel_id, 1)
    return ari.duel(duel_id)


# ---------------------------------------------------------------- slots (the dots)


def test_slots_are_seven_for_daily_one_for_weekly_and_n_for_per_week(duo):
    ari, sam = duo
    assert ari.challenge(sam)["slots"] == 7
    assert ari.post("/duels", {"hobbyId": "piano", "minutes": 20, "friendId": sam.id, "frequency": "weekly"}).json()["slots"] == 1
    assert ari.post("/duels", {"hobbyId": "gym", "minutes": 20, "friendId": sam.id, "frequency": "perWeek", "timesPerWeek": 4}).json()["slots"] == 4


# ---------------------------------------------------------------- daily (as before)


def test_daily_allows_one_check_in_a_day_and_seven_in_all(duo, db):
    ari, sam = duo
    duel_id = start(ari, sam)
    for day in range(7):
        assert ari.post(f"/duels/{duel_id}/checkin").status_code == 200
        assert ari.post(f"/duels/{duel_id}/checkin").status_code == 400  # a second one the same day
        if day < 6:
            next_day(db, ari, duel_id)
    assert len(ari.duel(duel_id)["myDays"]) == 7


# ---------------------------------------------------------------- weekly


def test_weekly_allows_exactly_one_check_in_whichever_day_you_pick(duo, db):
    ari, sam = duo
    duel_id = start(ari, sam, frequency="weekly")
    next_day(db, ari, duel_id)
    next_day(db, ari, duel_id)  # day 3: no check-in yet and nothing is wrong
    assert ari.post(f"/duels/{duel_id}/checkin").status_code == 200
    next_day(db, ari, duel_id)
    r = ari.post(f"/duels/{duel_id}/checkin")
    assert r.status_code == 400 and "all your check-ins" in r.json()["detail"]


def test_weekly_duel_is_won_by_checking_in_and_tied_when_both_do(duo, db):
    ari, sam = duo
    duel_id = start(ari, sam, frequency="weekly")
    ari.post(f"/duels/{duel_id}/checkin")
    backdate(db, duel_id, 7)
    final = ari.duel(duel_id)
    assert final["status"] == "finished" and final["result"]["winner"] == "me"
    assert (len(final["myDays"]), len(final["theirDays"])) == (1, 0)


# ---------------------------------------------------------------- N times a week


def test_per_week_stops_at_n_and_the_days_in_between_are_free(duo, db):
    ari, sam = duo
    duel_id = start(ari, sam, frequency="perWeek", timesPerWeek=3)
    for _ in range(3):
        assert ari.post(f"/duels/{duel_id}/checkin").status_code == 200
        next_day(db, ari, duel_id)
        next_day(db, ari, duel_id)  # a day off between check-ins
    assert ari.post(f"/duels/{duel_id}/checkin").status_code == 400
    assert len(ari.duel(duel_id)["myDays"]) == 3


def test_per_week_still_allows_only_one_check_in_a_day(duo):
    ari, sam = duo
    duel_id = start(ari, sam, frequency="perWeek", timesPerWeek=3)
    ari.post(f"/duels/{duel_id}/checkin")
    r = ari.post(f"/duels/{duel_id}/checkin")
    assert r.status_code == 400 and "already checked in today" in r.json()["detail"]


# ---------------------------------------------------------------- rest days


def test_rest_days_only_exist_in_daily_duels(duo):
    ari, sam = duo
    weekly = start(ari, sam, frequency="weekly")
    assert ari.duel(weekly)["restLeft"] == 0
    r = ari.post(f"/duels/{weekly}/rest")
    assert r.status_code == 400 and "only for daily" in r.json()["detail"]
    daily = ari.post("/duels", {"hobbyId": "gym", "minutes": 20, "friendId": sam.id}).json()["id"]
    sam.accept(daily)
    assert ari.duel(daily)["restLeft"] == 2
    assert ari.post(f"/duels/{daily}/rest").status_code == 200


# ---------------------------------------------------------------- streak


def streak(player):
    return player.get("/me/stats").json()["currentStreak"]


def test_weekly_streak_is_one_after_the_check_in_and_stays_through_the_free_days(duo, db):
    ari, sam = duo
    duel_id = start(ari, sam, frequency="weekly")
    assert streak(ari) == 0
    next_day(db, ari, duel_id)
    ari.post(f"/duels/{duel_id}/checkin")
    assert streak(ari) == 1
    next_day(db, ari, duel_id)
    next_day(db, ari, duel_id)
    assert streak(ari) == 1  # the days after it are free, nothing is missed


def test_per_week_streak_counts_check_ins_while_the_rest_can_still_be_done(duo, db):
    ari, sam = duo
    duel_id = start(ari, sam, frequency="perWeek", timesPerWeek=4)
    ari.post(f"/duels/{duel_id}/checkin")
    next_day(db, ari, duel_id)
    ari.post(f"/duels/{duel_id}/checkin")
    assert streak(ari) == 2
    for _ in range(3):
        next_day(db, ari, duel_id)  # day 4: 2 done, 2 owed, 3 days left: still possible
    assert streak(ari) == 2
    next_day(db, ari, duel_id)  # day 5: 2 owed but 2 days left, today included: still possible
    assert streak(ari) == 2
    next_day(db, ari, duel_id)  # day 6: 2 owed, 1 day left: no longer possible, the streak is gone
    assert streak(ari) == 0
