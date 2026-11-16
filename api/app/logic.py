"""Duel rules. Mirrors app/src/data/mockSource.ts (the opt-in mock) so both behave the same way."""

import re
import secrets
import threading
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Checkin, Duel, RestDay, User
from app.progression import (
    TIERS,
    XP_PER_CHECKIN,
    XP_PER_CONFIRMED_FRIEND_CHECKIN,
    XP_PER_DUEL_WON,
    level_for,
    next_level_for,
    next_tier_for,
    rest_days_for,
    tier_for,
)
from app.schemas import (
    ActivityOut,
    DuelOut,
    GroupsOut,
    LeaderRowOut,
    PendingOut,
    PersonOut,
    RivalOut,
    ResultOut,
    StatsOut,
    TierOut,
    UserHitOut,
)

LENGTH_DAYS = 7
GOAL_MAX = 60  # characters, after trimming
ACTIVITY_LIMIT = 6  # check-ins shown in "Recent check-ins"
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L


class DomainError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


_clock_lock = threading.Lock()
_last_now = datetime.min


def utcnow() -> datetime:
    """Naive UTC, used for every timestamp column.

    Strictly increasing within the process: some clocks (Windows) tick every ~15 ms, and rows created in the same tick
    would otherwise tie, which makes "newest first" ordering unreliable.
    """
    global _last_now
    with _clock_lock:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if now <= _last_now:
            now = _last_now + timedelta(microseconds=1)
        _last_now = now
        return now


def _iso(dt: datetime | None) -> str | None:
    return (dt.isoformat() + "Z") if dt else None


def clean_goal(goal: str | None) -> str | None:
    """None stays None (the suggestion). Otherwise trim and tidy the spaces; it must not be empty or longer than GOAL_MAX."""
    if goal is None:
        return None
    text = " ".join(goal.split())
    if not text:
        raise DomainError("Write a goal, or keep the suggestion.", status=422)
    if len(text) > GOAL_MAX:
        raise DomainError(f"Keep your goal under {GOAL_MAX} characters.", status=422)
    return text


def easier_goal(goal: str | None, old_minutes: int, new_minutes: int) -> str | None:
    """The goal text for an "easier win": a written goal that mentions the old minutes gets the new number; otherwise it is kept."""
    if goal is None:
        return None
    return re.sub(rf"(?<!\d){old_minutes}(?!\d)", str(new_minutes), goal, count=1)


def easier_minutes(minutes: int) -> int:
    """The lighter goal offered after a duel: half the minutes, rounded down to 5, never below 5."""
    return max(5, (minutes // 2) // 5 * 5)


def make_code(db: Session) -> str:
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))
        if db.scalar(select(Duel.id).where(Duel.invite_code == code)) is None:
            return code


# ---------------------------------------------------------------- views


def person_for(user: User, viewer_id: str | None) -> PersonOut:
    return PersonOut(id=user.id, name=user.name, tone="you" if user.id == viewer_id else "opponent")


def _other_id(duel: Duel, viewer_id: str | None) -> str | None:
    """The other player from this viewer's point of view (the creator, for anyone who is not the creator)."""
    return duel.opponent_id if viewer_id is not None and duel.creator_id == viewer_id else duel.creator_id


def build_view(db: Session, duel: Duel, viewer: User | None) -> DuelOut:
    """A duel from one person's point of view. viewer=None is someone looking up an invite code before signing in."""
    viewer_id = viewer.id if viewer else None
    is_creator = viewer_id is not None and duel.creator_id == viewer_id
    their_id = _other_id(duel, viewer_id)
    is_player = viewer_id is not None and viewer_id in (duel.creator_id, duel.opponent_id)

    creator = db.get(User, duel.creator_id)
    other = db.get(User, their_id) if their_id else None

    my_days = sorted(c.day_index for c in duel.checkins if is_player and c.user_id == viewer_id)
    their_days = sorted(c.day_index for c in duel.checkins if c.user_id == their_id and c.confirmed)
    pending = [c for c in duel.checkins if is_player and c.user_id == their_id and not c.confirmed]
    their_pending = None
    if pending:
        latest = max(pending, key=lambda c: c.day_index)
        their_pending = PendingOut(minutes=latest.minutes, note=latest.note)
    my_rest = sorted(r.day_index for r in duel.rest_days if is_player and r.user_id == viewer_id)
    newest_first = sorted(duel.checkins, key=lambda c: (c.created_at, c.id or 0), reverse=True)[:ACTIVITY_LIMIT] if is_player else []
    activity = [
        ActivityOut(
            who="me" if c.user_id == viewer_id else "them",
            minutes=c.minutes,
            note=c.note,
            created_at=_iso(c.created_at),
            confirmed=c.confirmed,
            day_index=c.day_index,
        )
        for c in newest_first
    ]

    result = None
    if duel.winner:
        if duel.winner == "tie":
            winner = "tie"
        else:
            winner = "me" if (duel.winner == "creator") == is_creator else "them"
        forfeited = None
        if duel.forfeited_by:
            forfeited = "me" if (duel.forfeited_by == "creator") == is_creator else "them"
        result = ResultOut(winner=winner, forfeited_by=forfeited)

    paused_until = _iso(duel.paused_at + timedelta(days=7)) if duel.paused_at else None

    return DuelOut(
        id=str(duel.id),
        hobby_id=duel.hobby_id,
        minutes=duel.minutes,
        goal=duel.goal,
        length_days=duel.length_days,
        status=duel.status,
        opponent=person_for(other, viewer_id) if other else None,
        creator=person_for(creator, viewer_id),
        viewer_is_creator=is_creator,
        invite_code=duel.invite_code if duel.status == "pending" else None,
        started_at=None if duel.status == "pending" else _iso(duel.started_at),
        today=duel.today,
        my_days=my_days,
        their_days=their_days,
        my_rest_days=my_rest,
        rest_left=max(0, (rest_days_for(xp_for(db, viewer)) if is_player else rest_days_for(0)) - len(my_rest)),
        their_pending=their_pending,
        activity=activity,
        paused_until=paused_until,
        result=result,
    )


# ---------------------------------------------------------------- the day clock


def _confirm_all(duel: Duel) -> None:
    for c in duel.checkins:
        c.confirmed = True


def finish(duel: Duel, forfeited_by: str | None = None) -> None:
    """End the duel. forfeited_by is 'creator' or 'opponent'."""
    _confirm_all(duel)
    duel.status = "finished"
    duel.today = LENGTH_DAYS
    duel.paused_at = None
    duel.forfeited_by = forfeited_by
    if forfeited_by == "creator":
        duel.winner = "opponent"
    elif forfeited_by == "opponent":
        duel.winner = "creator"
    else:
        a = sum(1 for c in duel.checkins if c.user_id == duel.creator_id)
        b = sum(1 for c in duel.checkins if c.user_id == duel.opponent_id)
        duel.winner = "creator" if a > b else "opponent" if a < b else "tie"


def step_day(duel: Duel) -> None:
    """Move to the next day: everything pending is confirmed, and day 7 ends the duel."""
    _confirm_all(duel)
    duel.today += 1
    if duel.today > LENGTH_DAYS - 1:
        finish(duel)


def settle(db: Session, duel: Duel, now: datetime | None = None) -> None:
    """Catch the stored day up with the clock. Only active duels move."""
    if duel.status != "active":
        return
    now = now or utcnow()
    target = min(LENGTH_DAYS, int((now - duel.started_at).total_seconds() // 86400))
    while duel.status == "active" and duel.today < target:
        step_day(duel)


# ---------------------------------------------------------------- queries


def duels_of(db: Session, user: User) -> list[Duel]:
    """My duels, newest first: the ones I started and the ones I was invited to (pending invites included)."""
    rows = db.scalars(
        select(Duel).where(or_(Duel.creator_id == user.id, Duel.opponent_id == user.id)).order_by(Duel.id.desc())
    ).all()
    for d in rows:
        settle(db, d)
    return list(rows)


def get_duel(db: Session, duel_id: int, user: User) -> Duel:
    duel = db.get(Duel, duel_id)
    if duel is None or user.id not in (duel.creator_id, duel.opponent_id):
        raise DomainError("Duel not found.", status=404)
    settle(db, duel)
    return duel


def get_duel_by_code(db: Session, code: str) -> Duel:
    duel = db.scalar(select(Duel).where(Duel.invite_code == code.strip().upper(), Duel.status == "pending"))
    if duel is None:
        raise DomainError("We couldn’t find that code. Check it and try again.", status=404)
    return duel


def _side(duel: Duel, user: User) -> str:
    return "creator" if duel.creator_id == user.id else "opponent"


def _email_hint(email: str) -> str:
    local, _, domain = email.partition("@")
    return f"{local[:1]}***@{domain}"


def search_users(db: Session, user: User, query: str, limit: int = 10) -> list[UserHitOut]:
    """Real accounts whose name contains the text, or whose email starts with it. Never includes me."""
    q = query.strip().lower()
    if len(q) < 2:
        return []
    rows = db.scalars(
        select(User)
        .where(
            User.id != user.id,
            User.email.is_not(None),
            or_(func.lower(User.name).contains(q, autoescape=True), func.lower(User.email).startswith(q, autoescape=True)),
        )
        .order_by(func.lower(User.name), User.id)
        .limit(limit)
    ).all()
    together = finished_together(db, user)
    return [
        UserHitOut(id=u.id, name=u.name, email_hint=_email_hint(u.email or ""), level=level_for(together[u.id]))
        for u in rows
    ]


def finished_together(db: Session, user: User) -> Counter[str]:
    """How many FINISHED duels I have had with each person (friendship levels are computed from this)."""
    count: Counter[str] = Counter()
    for d in duels_of(db, user):
        other = _other_id(d, user.id)
        if d.status == "finished" and other:
            count[other] += 1
    return count


# ---------------------------------------------------------------- actions


def create_duel(db: Session, user: User, hobby_id: str, minutes: int, friend_id: str | None, goal: str | None = None) -> Duel:
    """Start a duel. It stays pending until the other person accepts: a person picked from search sees it under
    "Pending invites", anyone else enters the invite code. Creating the same pending challenge again returns the existing one."""
    if not 5 <= minutes <= 240:
        raise DomainError("Pick between 5 and 240 minutes a day.")
    goal = clean_goal(goal)
    friend = None
    if friend_id:
        friend = db.get(User, friend_id)
        if friend is None:
            raise DomainError("We couldn’t find that person.", status=404)
        if friend.id == user.id:
            raise DomainError("You can’t challenge yourself.")

    # Asking again for the same pending challenge (a retry after a cancelled share sheet, a double tap) gives back the
    # same duel and the same invite code instead of piling up duplicates.
    same_friend = Duel.opponent_id.is_(None) if friend is None else Duel.opponent_id == friend.id
    existing = db.scalar(
        select(Duel)
        .where(Duel.creator_id == user.id, Duel.status == "pending", Duel.hobby_id == hobby_id, Duel.minutes == minutes, same_friend,
               Duel.goal.is_(None) if goal is None else Duel.goal == goal)
        .order_by(Duel.id.desc())
    )
    if existing is not None:
        return existing

    now = utcnow()
    duel = Duel(
        hobby_id=hobby_id,
        minutes=minutes,
        goal=goal,
        length_days=LENGTH_DAYS,
        status="pending",
        creator_id=user.id,
        opponent_id=friend.id if friend else None,
        invite_code=make_code(db),
        started_at=now,
        today=0,
        created_at=now,
    )
    db.add(duel)
    db.flush()
    return duel


def accept_duel(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status != "pending":
        raise DomainError("This duel was already accepted.")
    if duel.creator_id == user.id:
        raise DomainError("You can’t accept your own challenge. Send the code to a friend.")
    if duel.opponent_id and duel.opponent_id != user.id:
        raise DomainError("This invite is for someone else.", status=403)
    duel.opponent_id = user.id
    duel.status = "active"
    duel.started_at = utcnow()
    duel.today = 0
    return duel


def check_in(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status != "active":
        raise DomainError("This duel is not active.")
    if duel.today > LENGTH_DAYS - 1:
        raise DomainError("This duel is over.")
    if any(c.user_id == user.id and c.day_index == duel.today for c in duel.checkins):
        raise DomainError("You already checked in today.")
    if any(r.user_id == user.id and r.day_index == duel.today for r in duel.rest_days):
        raise DomainError("You took a rest day today.")
    duel.checkins.append(
        Checkin(user_id=user.id, day_index=duel.today, confirmed=False, minutes=duel.minutes, note="", created_at=utcnow())
    )
    return duel


def add_check_in_details(db: Session, duel: Duel, user: User, minutes: int, note: str) -> Duel:
    """Set the minutes and the note on MY check-in for today. The one-tap check-in stays the default; this is optional.
    Not allowed once the friend has confirmed it (the friend confirmed what they saw)."""
    if duel.status != "active":
        raise DomainError("This duel is not active.")
    if not 1 <= minutes <= 240:
        raise DomainError("Pick between 1 and 240 minutes.")
    mine = next((c for c in duel.checkins if c.user_id == user.id and c.day_index == duel.today), None)
    if mine is None:
        raise DomainError("Check in first, then add details.")
    if mine.confirmed:
        raise DomainError("Your friend already confirmed this check-in, so it can't be changed.")
    mine.minutes = minutes
    mine.note = " ".join(note.split())[:200]
    return duel


def confirm_friend(db: Session, duel: Duel, user: User) -> Duel:
    other = duel.opponent_id if duel.creator_id == user.id else duel.creator_id
    for c in duel.checkins:
        if c.user_id == other:
            c.confirmed = True
    return duel


def rest_day(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status != "active":
        raise DomainError("This duel is not active.")
    mine = [r for r in duel.rest_days if r.user_id == user.id]
    if len(mine) >= rest_days_for(xp_for(db, user)):
        raise DomainError("No rest days left this week.")
    if any(r.day_index == duel.today for r in mine) or any(c.user_id == user.id and c.day_index == duel.today for c in duel.checkins):
        raise DomainError("Today is already logged.")
    duel.rest_days.append(RestDay(user_id=user.id, day_index=duel.today))
    return duel


def pause_duel(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status != "active":
        raise DomainError("Only an active duel can be paused.")
    duel.status = "paused"
    duel.paused_at = utcnow()
    return duel


def resume_duel(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status != "paused" or duel.paused_at is None:
        raise DomainError("This duel is not paused.")
    now = utcnow()
    # Frozen time does not count: push the start forward by the pause length.
    duel.started_at = duel.started_at + (now - duel.paused_at)
    duel.paused_at = None
    duel.status = "active"
    return duel


def forfeit_duel(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status not in ("active", "paused"):
        raise DomainError("This duel can’t be forfeited.")
    finish(duel, forfeited_by=_side(duel, user))
    return duel


def rematch(db: Session, old: Duel, user: User, kind: str) -> Duel:
    """Another duel with the same friend (they get a pending invite again)."""
    if old.status != "finished":
        raise DomainError("You can start a rematch once this duel is over.")
    other = old.opponent_id if old.creator_id == user.id else old.creator_id
    minutes = easier_minutes(old.minutes) if kind == "easier" else old.minutes
    goal = easier_goal(old.goal, old.minutes, minutes) if kind == "easier" else old.goal
    return create_duel(db, user, old.hobby_id, minutes, other, goal)


# ---------------------------------------------------------------- stats and groups (all computed from the database)


def _streak(duel: Duel, user_id: str) -> int:
    """Consecutive check-in days in this duel up to today (or yesterday, if today is not checked in yet)."""
    if duel.status not in ("active", "paused"):
        return 0
    days = {c.day_index for c in duel.checkins if c.user_id == user_id}
    cursor = duel.today if duel.today in days else duel.today - 1
    run = 0
    while cursor >= 0 and cursor in days:
        run += 1
        cursor -= 1
    return run


def _won(duel: Duel, user: User) -> bool:
    return duel.status == "finished" and bool(duel.winner) and duel.winner != "tie" and ((duel.winner == "creator") == (duel.creator_id == user.id))


def xp_from(duels: list[Duel], user: User) -> int:
    """XP from my duels (pending ones do not count): my check-ins, my friend's confirmed check-ins, duels won.
    Rates are in progression.py. A friend's check-in counts once it is confirmed (by my tap or at day rollover)."""
    xp = 0
    for d in duels:
        if d.status == "pending":
            continue
        other = _other_id(d, user.id)
        xp += XP_PER_CHECKIN * sum(1 for c in d.checkins if c.user_id == user.id)
        xp += XP_PER_CONFIRMED_FRIEND_CHECKIN * sum(1 for c in d.checkins if c.user_id == other and c.confirmed)
        if _won(d, user):
            xp += XP_PER_DUEL_WON
    return xp


def xp_for(db: Session, user: User) -> int:
    return xp_from(duels_of(db, user), user)


def stats_for(db: Session, user: User) -> StatsOut:
    duels = duels_of(db, user)
    won = 0
    days = 0
    streak = 0
    since = utcnow() - timedelta(days=14)
    recent: list[str] = []
    for d in duels:
        if d.status == "pending":
            continue
        mine = [c for c in d.checkins if c.user_id == user.id]
        days += len(mine)
        recent += [_iso(c.created_at) for c in mine if c.created_at >= since]
        streak = max(streak, _streak(d, user.id))
        if _won(d, user):
            won += 1
    xp = xp_from(duels, user)
    tier = tier_for(xp)
    upcoming = next_tier_for(xp)
    progress = 1.0 if upcoming is None else (xp - tier.min_xp) / (upcoming.min_xp - tier.min_xp)
    return StatsOut(
        duels_won=won,
        days_checked_in=days,
        current_streak=streak,
        recent_check_ins=sorted(recent),
        xp=xp,
        tier=tier.name,
        next_tier=upcoming.name if upcoming else None,
        xp_to_next=(upcoming.min_xp - xp) if upcoming else None,
        progress=round(progress, 4),
        rest_days_per_duel=tier.rest_days_per_duel,
        tiers=[TierOut(name=t.name, min_xp=t.min_xp, perk=t.perk, reached=xp >= t.min_xp) for t in TIERS],
    )


def groups_for(db: Session, user: User) -> GroupsOut:
    """People I have dueled with (head-to-head record) and a wins leaderboard among us, from real duels."""
    rivals: dict[str, RivalOut] = {}
    for d in duels_of(db, user):
        other_id = _other_id(d, user.id)
        if d.status == "pending" or not other_id:
            continue
        other = db.get(User, other_id)
        row = rivals.setdefault(
            other_id, RivalOut(person=person_for(other, user.id), duels=0, wins=0, losses=0, ties=0, active=0, finished=0, level=None, next_level=None, duels_to_next_level=None)
        )
        row.duels += 1
        if d.status == "finished":
            row.finished += 1
            if d.winner == "tie":
                row.ties += 1
            elif (d.winner == "creator") == (d.creator_id == user.id):
                row.wins += 1
            else:
                row.losses += 1
        else:
            row.active += 1

    for row in rivals.values():
        row.level = level_for(row.finished)
        upcoming_level = next_level_for(row.finished)
        row.next_level, row.duels_to_next_level = upcoming_level if upcoming_level else (None, None)

    ids = {user.id, *rivals}
    # Duels between other people only move forward when one of them opens the app: catch them up before counting wins.
    for other_duel in db.scalars(select(Duel).where(Duel.status == "active", or_(Duel.creator_id.in_(ids), Duel.opponent_id.in_(ids)))):
        settle(db, other_duel)
    db.flush()  # settled duels must be visible to the query below (autoflush is off)
    wins: Counter[str] = Counter()
    finished = db.scalars(
        select(Duel).where(Duel.status == "finished", or_(Duel.creator_id.in_(ids), Duel.opponent_id.in_(ids)))
    ).all()
    for d in finished:
        winner_id = d.creator_id if d.winner == "creator" else d.opponent_id if d.winner == "opponent" else None
        if winner_id in ids:
            wins[winner_id] += 1

    board = []
    for uid in ids:
        person = db.get(User, uid)
        board.append(LeaderRowOut(id=uid, name=person.name, tone="you" if uid == user.id else "opponent", wins=wins[uid], is_you=uid == user.id))
    board.sort(key=lambda r: (-r.wins, r.name))
    ordered = sorted(rivals.values(), key=lambda r: (-r.active, -r.duels, r.person.name))
    return GroupsOut(rivals=ordered, leaderboard=board)
