from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import logic
from app.db import get_db
from app.logic import DomainError
from app.models import Duel, User
from app.schemas import CheckinDetailsIn, CreateDuelIn, DuelOut, RematchIn
from app.security import current_user, optional_user

router = APIRouter(prefix="/duels", tags=["duels"])


@router.get("", response_model=list[DuelOut])
def list_duels(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[DuelOut]:
    duels = logic.duels_of(db, user)
    db.commit()  # settling may have moved days forward
    return [logic.build_view(db, d, user) for d in duels]


# Defined before /{duel_id} so "by-code" is not read as an id.
@router.get("/by-code/{code}", response_model=DuelOut)
def duel_by_code(code: str, user: User | None = Depends(optional_user), db: Session = Depends(get_db)) -> DuelOut:
    """Works before signing in, so an invited friend can see who challenged them first."""
    return logic.build_view(db, logic.get_duel_by_code(db, code), user)


@router.post("", response_model=DuelOut)
def create_duel(body: CreateDuelIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> DuelOut:
    duel = logic.create_duel(db, user, body.hobby_id, body.minutes, body.friend_id)
    db.commit()
    return logic.build_view(db, duel, user)


@router.get("/{duel_id}", response_model=DuelOut)
def get_duel(duel_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> DuelOut:
    duel = logic.get_duel(db, duel_id, user)
    db.commit()
    return logic.build_view(db, duel, user)


@router.post("/{duel_id}/accept", response_model=DuelOut)
def accept(duel_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> DuelOut:
    # The invited friend is not a participant yet, so look the duel up directly.
    duel = db.get(Duel, duel_id)
    if duel is None:
        raise DomainError("Duel not found.", status=404)
    logic.accept_duel(db, duel, user)
    db.commit()
    return logic.build_view(db, duel, user)


def _action(fn):
    """Build a POST /duels/{id}/<action> handler that loads the duel for the user, runs fn, and returns the new view."""

    def handler(duel_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> DuelOut:
        duel = logic.get_duel(db, duel_id, user)
        fn(db, duel, user)
        db.commit()
        return logic.build_view(db, duel, user)

    return handler


router.add_api_route("/{duel_id}/checkin", _action(logic.check_in), methods=["POST"], response_model=DuelOut)
router.add_api_route("/{duel_id}/confirm", _action(logic.confirm_friend), methods=["POST"], response_model=DuelOut)
router.add_api_route("/{duel_id}/rest", _action(logic.rest_day), methods=["POST"], response_model=DuelOut)
router.add_api_route("/{duel_id}/pause", _action(logic.pause_duel), methods=["POST"], response_model=DuelOut)
router.add_api_route("/{duel_id}/resume", _action(logic.resume_duel), methods=["POST"], response_model=DuelOut)
router.add_api_route("/{duel_id}/forfeit", _action(logic.forfeit_duel), methods=["POST"], response_model=DuelOut)


@router.post("/{duel_id}/checkin/details", response_model=DuelOut)
def checkin_details(duel_id: int, body: CheckinDetailsIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> DuelOut:
    duel = logic.get_duel(db, duel_id, user)
    logic.add_check_in_details(db, duel, user, body.minutes, body.note)
    db.commit()
    return logic.build_view(db, duel, user)


@router.post("/{duel_id}/rematch", response_model=DuelOut)
def rematch(duel_id: int, body: RematchIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> DuelOut:
    old = logic.get_duel(db, duel_id, user)
    new = logic.rematch(db, old, user, body.kind)
    db.commit()
    return logic.build_view(db, new, user)
