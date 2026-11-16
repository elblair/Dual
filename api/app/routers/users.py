from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import logic
from app.db import get_db
from app.models import User
from app.schemas import StatsOut, UserHitOut
from app.security import current_user

router = APIRouter(tags=["users"])


@router.get("/users/search", response_model=list[UserHitOut])
def search_users(q: str = Query(default="", max_length=80), user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[UserHitOut]:
    """Find real accounts to challenge, by name or by the start of their email (at least 2 characters)."""
    return logic.search_users(db, user, q)


@router.get("/me/stats", response_model=StatsOut)
def my_stats(user: User = Depends(current_user), db: Session = Depends(get_db)) -> StatsOut:
    """Duels won, days checked in and the current streak, computed from the database."""
    stats = logic.stats_for(db, user)
    db.commit()
    return stats
