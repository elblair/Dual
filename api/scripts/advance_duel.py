"""Move a duel forward in the database (presenter tool, not part of the app).

    python scripts/advance_duel.py --list
    python scripts/advance_duel.py <invite-code or duel id> <days>

Each day moves the duel's start date one day into the past, so the next time anyone opens the app the duel is that many
days further along (pending check-ins get confirmed, and after day 7 the duel ends and the Result screen appears).
Run it from the api folder with the venv active; it uses DATABASE_URL from api/.env.
"""

import argparse
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import or_, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.logic import DomainError, settle  # noqa: E402
from app.models import Duel, User  # noqa: E402


def find_duel(db: Session, key: str) -> Duel:
    """Look a duel up by its invite code (kept after acceptance) or by its numeric id."""
    duel = db.scalar(select(Duel).where(Duel.invite_code == key.strip().upper()))
    if duel is None and key.strip().isdigit():
        duel = db.get(Duel, int(key))
    if duel is None:
        raise DomainError(f"No duel with invite code or id '{key}'.", status=404)
    return duel


def describe(db: Session, duel: Duel) -> str:
    creator = db.get(User, duel.creator_id)
    opponent = db.get(User, duel.opponent_id) if duel.opponent_id else None
    mine = sum(1 for c in duel.checkins if c.user_id == duel.creator_id)
    theirs = sum(1 for c in duel.checkins if c.user_id == duel.opponent_id)
    day = f"day {min(duel.today + 1, duel.length_days)} of {duel.length_days}" if duel.status in ("active", "paused") else duel.status
    return (
        f"#{duel.id} code {duel.invite_code} | {duel.hobby_id} {duel.minutes} min | "
        f"{creator.name} vs {opponent.name if opponent else '(nobody yet)'} | {duel.status}, {day} | check-ins {mine} - {theirs}"
        + (f" | winner: {duel.winner}" if duel.winner else "")
    )


def advance_duel(db: Session, key: str, days: int) -> str:
    """Shift the duel's start date back by `days` and catch the stored day up. Returns a one-line summary."""
    if days < 1:
        raise DomainError("Days must be 1 or more.")
    duel = find_duel(db, key)
    if duel.status == "pending":
        raise DomainError("That duel has not been accepted yet, so it has no days to advance.")
    if duel.status == "paused":
        raise DomainError("That duel is paused. Resume it in the app first.")
    if duel.status == "finished":
        raise DomainError("That duel is already over.")
    duel.started_at = duel.started_at - timedelta(days=days)
    settle(db, duel)
    db.commit()
    return describe(db, duel)


def main() -> int:
    parser = argparse.ArgumentParser(description="Move a duel forward in the database.")
    parser.add_argument("key", nargs="?", help="invite code or duel id")
    parser.add_argument("days", nargs="?", type=int, help="how many days to move it forward")
    parser.add_argument("--list", action="store_true", help="list the latest duels with their codes")
    args = parser.parse_args()

    from app.db import SessionLocal

    with SessionLocal() as db:
        if args.list:
            for duel in db.scalars(select(Duel).order_by(Duel.id.desc()).limit(20)):
                print(describe(db, duel))
            return 0
        if not args.key or args.days is None:
            parser.error("give an invite code (or duel id) and a number of days, or use --list")
        try:
            print(advance_duel(db, args.key, args.days))
        except DomainError as e:
            print(f"Error: {e.message}")
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
