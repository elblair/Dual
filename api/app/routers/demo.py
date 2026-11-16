from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import logic
from app.config import get_settings
from app.db import get_db
from app.logic import DomainError
from app.models import User
from app.security import current_user


def require_demo() -> None:
    if not get_settings().demo_mode:
        raise DomainError("Not found.", status=404)


# Demo tools (You screen). Only available when DEMO_MODE=true.
router = APIRouter(prefix="/demo", tags=["demo"], dependencies=[Depends(require_demo)])


@router.post("/advance-day", status_code=204)
def advance_day(user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    logic.demo_advance_day(db, user)
    db.commit()


@router.post("/opponent-checkin", status_code=204)
def opponent_checkin(user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    logic.demo_opponent_checkin(db, user)
    db.commit()


@router.post("/reset", status_code=204)
def reset(user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    logic.demo_reset(db, user)
    db.commit()
