"""One-off cleanup: delete the demo seed data (Eleanor, Tanish and every duel involving them) from the database.

    python scripts/purge_seed_data.py

Safe to run more than once. It only touches the two seeded accounts and the duels they are part of.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import or_, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.models import Duel, User  # noqa: E402

SEEDED_IDS = ("eleanor", "tanish")


def purge_seed_data(db: Session) -> tuple[int, int]:
    """Returns (duels deleted, users deleted)."""
    duels = db.scalars(select(Duel).where(or_(Duel.creator_id.in_(SEEDED_IDS), Duel.opponent_id.in_(SEEDED_IDS)))).all()
    for duel in duels:
        db.delete(duel)
    db.flush()
    users = db.scalars(select(User).where(User.id.in_(SEEDED_IDS))).all()
    for user in users:
        db.delete(user)
    db.commit()
    return len(duels), len(users)


if __name__ == "__main__":
    from app.db import SessionLocal

    with SessionLocal() as session:
        d, u = purge_seed_data(session)
    print(f"Deleted {d} duels and {u} users.")
