from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import logic
from app.db import get_db
from app.models import User
from app.schemas import LeaderRowOut
from app.security import current_user

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/leaderboard", response_model=list[LeaderRowOut])
def leaderboard(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[LeaderRowOut]:
    """People in my duels (and me), ranked by minutes practiced."""
    rows = logic.leaderboard(db, user)
    db.commit()  # reading settles days forward
    return rows
