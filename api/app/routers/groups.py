from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import logic
from app.db import get_db
from app.models import User
from app.schemas import GroupsOut
from app.security import current_user

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=GroupsOut)
def groups(user: User = Depends(current_user), db: Session = Depends(get_db)) -> GroupsOut:
    """People I have dueled with (head-to-head record) and a wins leaderboard among us, from real duels."""
    result = logic.groups_for(db, user)
    db.commit()  # reading settles days forward
    return result
