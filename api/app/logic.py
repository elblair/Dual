"""Duel rules. Mirrors app/src/data/mockSource.ts so the app behaves the same on the mock and on the API."""

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Checkin, Duel, RestDay, User
from app.schemas import DbDuelOut, DbInfoOut, DbSnapshotOut, DbUserOut, DuelOut, LeaderRowOut, PendingOut, PersonOut, ResultOut

LENGTH_DAYS = 7
REST_LIMIT = 2
# Seeded friends check in on days 1 to 6 and skip the last day, so a full run ends 6 to 5 like the Result frame.
BOT_LAST_DAY = 5
# id -> (name, avatar tone). Avatar tones follow the Figma frames (Eleanor maroon, Tanish blue).
SEEDED = {"eleanor": ("Eleanor", "opponent"), "tanish": ("Tanish", "you")}
CONTACT_NAMES = {"ben": "Ben"}
NOTES = ["Finally nailed the F chord", "Felt good today", "Short but sweet", "Got it done before work", "Back at it"]
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L


class DomainError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def utcnow() -> datetime:
    """Naive UTC, used for every timestamp column."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def make_code() -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(4))


# ---------------------------------------------------------------- people


def is_bot(user_id: str | None) -> bool:
    return user_id in SEEDED


def person_for(user: User, viewer_id: str | None) -> PersonOut:
    if user.id == viewer_id:
        tone = "you"
    else:
        tone = SEEDED.get(user.id, ("", "opponent"))[1]
    return PersonOut(id=user.id, name=user.name, tone=tone)


def invitee_person(duel: Duel) -> PersonOut:
    key = duel.invitee_id or "friend"
    return PersonOut(id=key, name=CONTACT_NAMES.get(key, key.title()), tone="neutral")


# ---------------------------------------------------------------- views


def build_view(db: Session, duel: Duel, viewer: User | None) -> DuelOut:
    """A duel from one player's point of view. viewer=None is someone looking up an invite code before signing in."""
    viewer_id = viewer.id if viewer else None
    is_creator = viewer_id is not None and duel.creator_id == viewer_id
    their_id = duel.opponent_id if is_creator else duel.creator_id

    creator = db.get(User, duel.creator_id)
    opponent_user = db.get(User, their_id) if their_id else None
    opponent = person_for(opponent_user, viewer_id) if opponent_user else invitee_person(duel)

    my_days = sorted(c.day_index for c in duel.checkins if c.user_id == viewer_id)
    their_days = sorted(c.day_index for c in duel.checkins if c.user_id == their_id and c.confirmed)
    pending = [c for c in duel.checkins if c.user_id == their_id and not c.confirmed]
    their_pending = None
    if pending:
        latest = max(pending, key=lambda c: c.day_index)
        their_pending = PendingOut(minutes=latest.minutes, note=latest.note)
    my_rest = sorted(r.day_index for r in duel.rest_days if r.user_id == viewer_id)

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

    paused_until = None
    if duel.paused_at:
        paused_until = (duel.paused_at + timedelta(days=7)).isoformat() + "Z"

    return DuelOut(
        id=str(duel.id),
        hobby_id=duel.hobby_id,
        minutes=duel.minutes,
        length_days=duel.length_days,
        status=duel.status,
        opponent=opponent,
        creator=person_for(creator, viewer_id),
        viewer_is_creator=is_creator,
        invite_code=duel.invite_code,
        today=duel.today,
        my_days=my_days,
        their_days=their_days,
        my_rest_days=my_rest,
        rest_left=max(0, REST_LIMIT - len(my_rest)),
        their_pending=their_pending,
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


def _bot_note(duel: Duel, day: int) -> str:
    return NOTES[(duel.id + day) % len(NOTES)]


def add_bot_checkin(db: Session, duel: Duel, day: int) -> None:
    """A seeded friend checks in (waiting for the player's OK)."""
    if not is_bot(duel.opponent_id):
        return
    if any(c.user_id == duel.opponent_id and c.day_index == day for c in duel.checkins):
        return
    duel.checkins.append(
        Checkin(
            user_id=duel.opponent_id,
            day_index=day,
            confirmed=False,
            minutes=duel.minutes + 5,
            note=_bot_note(duel, day),
            created_at=utcnow(),
        )
    )


def step_day(db: Session, duel: Duel) -> None:
    """Move to the next day: everything pending is confirmed, a seeded friend checks in, day 7 ends the duel."""
    _confirm_all(duel)
    duel.today += 1
    if duel.today > LENGTH_DAYS - 1:
        finish(duel)
    elif duel.today <= BOT_LAST_DAY:
        add_bot_checkin(db, duel, duel.today)


def settle(db: Session, duel: Duel, now: datetime | None = None) -> None:
    """Catch the stored day up with the clock (plus any demo fast-forward). Only active duels move."""
    if duel.status != "active":
        return
    now = now or utcnow()
    elapsed = int((now - duel.started_at).total_seconds() // 86400)
    target = min(LENGTH_DAYS, elapsed + duel.day_offset)
    while duel.status == "active" and duel.today < target:
        step_day(db, duel)


# ---------------------------------------------------------------- queries


def duels_of(db: Session, user: User) -> list[Duel]:
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


# ---------------------------------------------------------------- actions


def create_duel(db: Session, user: User, hobby_id: str, minutes: int, friend_id: str, invite_code: str | None) -> Duel:
    if not 5 <= minutes <= 240:
        raise DomainError("Pick between 5 and 240 minutes a day.")
    friend = db.get(User, friend_id)
    if friend is not None and friend.id == user.id:
        raise DomainError("You can’t challenge yourself.")

    now = utcnow()
    duel = Duel(
        hobby_id=hobby_id,
        minutes=minutes,
        length_days=LENGTH_DAYS,
        creator_id=user.id,
        started_at=now,
        today=0,
        created_at=now,
    )
    if friend is not None:
        # Someone already on Dual (Eleanor, Tanish, a rematch opponent): no acceptance needed.
        duel.status = "active"
        duel.opponent_id = friend.id
    else:
        code = (invite_code or "").strip().upper()
        if len(code) != 4 or not all(ch in CODE_ALPHABET for ch in code) or db.scalar(select(Duel).where(Duel.invite_code == code)):
            code = make_code()
            while db.scalar(select(Duel).where(Duel.invite_code == code)):
                code = make_code()
        duel.status = "pending"
        duel.invitee_id = friend_id
        duel.invite_code = code
    db.add(duel)
    db.flush()
    return duel


def accept_duel(db: Session, duel: Duel, user: User) -> Duel:
    if duel.status != "pending":
        raise DomainError("This duel was already accepted.")
    if duel.creator_id == user.id:
        raise DomainError("You can’t accept your own challenge. Send the code to a friend.")
    now = utcnow()
    duel.opponent_id = user.id
    duel.status = "active"
    duel.invite_code = None
    duel.invitee_id = None
    duel.started_at = now
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
    if len(mine) >= REST_LIMIT:
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
    other = old.opponent_id if old.creator_id == user.id else old.creator_id
    friend_id = other or old.invitee_id or "friend"
    minutes = 15 if kind == "easier" else old.minutes
    return create_duel(db, user, old.hobby_id, minutes, friend_id, None)


# ---------------------------------------------------------------- seeding and demo


def seed_bot_users(db: Session) -> None:
    now = utcnow()
    for uid, (name, _tone) in SEEDED.items():
        if db.get(User, uid) is None:
            db.add(User(id=uid, name=name, is_guest=False, is_seeded=True, created_at=now))
    db.flush()


def _seed_duel(db: Session, user: User, hobby: str, minutes: int, friend: str, today: int, mine: list[int], theirs: list[int], pending: bool) -> Duel:
    now = utcnow()
    duel = Duel(
        hobby_id=hobby,
        minutes=minutes,
        length_days=LENGTH_DAYS,
        status="active",
        creator_id=user.id,
        opponent_id=friend,
        started_at=now - timedelta(days=today, seconds=60),  # `today` whole days in, plus a minute of margin
        today=today,
        created_at=now,
    )
    for d in mine:
        duel.checkins.append(Checkin(user_id=user.id, day_index=d, confirmed=True, minutes=minutes, note="", created_at=now))
    for d in theirs:
        duel.checkins.append(Checkin(user_id=friend, day_index=d, confirmed=True, minutes=minutes, note="", created_at=now))
    if pending:
        duel.checkins.append(
            Checkin(user_id=friend, day_index=today, confirmed=False, minutes=25, note="Finally nailed the F chord", created_at=now)
        )
    db.add(duel)
    db.flush()
    return duel


def seed_demo_duels(db: Session, user: User) -> None:
    """Guitar vs Eleanor on day 5 (4 to 4, Eleanor's check-in waiting for OK) and Running vs Tanish on day 6 (5 to 6)."""
    seed_bot_users(db)
    _seed_duel(db, user, "running", 30, "tanish", 5, [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5], pending=False)
    _seed_duel(db, user, "guitar", 20, "eleanor", 4, [0, 1, 2, 3], [0, 1, 2, 3], pending=True)


def demo_advance_day(db: Session, user: User) -> None:
    for duel in duels_of(db, user):
        if duel.status == "active":
            duel.day_offset += 1
            settle(db, duel)


def demo_opponent_checkin(db: Session, user: User) -> None:
    for duel in duels_of(db, user):
        if duel.status != "active" or duel.today > LENGTH_DAYS - 1:
            continue
        if not is_bot(duel.opponent_id):
            continue
        if any(c.user_id == duel.opponent_id and c.day_index == duel.today for c in duel.checkins):
            continue
        add_bot_checkin(db, duel, duel.today)


def demo_reset(db: Session, user: User) -> None:
    for duel in db.scalars(select(Duel).where(Duel.creator_id == user.id)).all():
        db.delete(duel)
    db.flush()
    seed_demo_duels(db, user)


# ---------------------------------------------------------------- groups-style list


def leaderboard(db: Session, user: User, limit: int = 5) -> list[LeaderRowOut]:
    """Everyone in my duels (and me), ranked by minutes practiced. A friend's minutes count once I confirm them."""
    totals: dict[str, int] = {user.id: 0}
    for duel in duels_of(db, user):
        for uid in (duel.creator_id, duel.opponent_id):
            if uid:
                totals.setdefault(uid, 0)
        for c in duel.checkins:
            if c.user_id == user.id or c.confirmed:
                totals[c.user_id] = totals.get(c.user_id, 0) + c.minutes
    rows = []
    for uid, minutes in totals.items():
        person = db.get(User, uid)
        rows.append(LeaderRowOut(id=uid, name=person.name, tone=person_for(person, user.id).tone, minutes=minutes, is_you=uid == user.id))
    rows.sort(key=lambda r: (-r.minutes, r.name))
    return rows[:limit]


# ---------------------------------------------------------------- the Database screen


def _iso(dt: datetime | None) -> str:
    return (dt.isoformat() + "Z") if dt else ""


def db_snapshot(db: Session, engine_name: str, host: str, limit: int = 20) -> DbSnapshotOut:
    """The latest rows straight from the tables, newest first. Never includes password hashes."""
    users = db.scalars(select(User).order_by(User.created_at.desc(), User.id.desc()).limit(limit)).all()
    duels = db.scalars(select(Duel).order_by(Duel.id.desc()).limit(limit)).all()

    def name_of(user_id: str | None) -> str | None:
        user = db.get(User, user_id) if user_id else None
        return user.name if user else None

    duel_rows = []
    for d in duels:
        a = sum(1 for c in d.checkins if c.user_id == d.creator_id)
        b = sum(1 for c in d.checkins if c.user_id == d.opponent_id)
        opponent = name_of(d.opponent_id) or invitee_person(d).name
        duel_rows.append(
            DbDuelOut(
                id=str(d.id),
                hobby_id=d.hobby_id,
                minutes=d.minutes,
                goal=f"{d.minutes} min a day",
                status=d.status,
                creator=name_of(d.creator_id) or "?",
                opponent=opponent,
                score=f"{a} – {b}",
                today=d.today,
                created_at=_iso(d.created_at),
            )
        )
    return DbSnapshotOut(
        database=DbInfoOut(engine=engine_name, host=host),
        user_count=db.scalar(select(func.count()).select_from(User)) or 0,
        duel_count=db.scalar(select(func.count()).select_from(Duel)) or 0,
        users=[
            DbUserOut(id=u.id, name=u.name, email=u.email, is_guest=u.is_guest, is_seeded=u.is_seeded, created_at=_iso(u.created_at))
            for u in users
        ],
        duels=duel_rows,
    )
