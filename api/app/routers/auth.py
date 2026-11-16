import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import logic
from app.config import get_settings
from app.db import get_db
from app.logic import DomainError
from app.models import User
from app.schemas import AuthOut, LoginIn, MeOut, RegisterIn
from app.security import create_token, current_user, hash_password, verify_password

router = APIRouter(tags=["auth"])


def _me(user: User) -> MeOut:
    return MeOut(id=user.id, name=user.name, is_guest=user.is_guest, email=user.email)


@router.post("/auth/guest", response_model=AuthOut)
def create_guest(seed_demo: bool = False, db: Session = Depends(get_db)) -> AuthOut:
    """First launch: a guest account so people can start a dual before signing up.

    With ?seed_demo=true (and DEMO_MODE=true on the server) the guest also gets the day-5 demo duels.
    """
    user = User(id=secrets.token_hex(6), name="Ari", is_guest=True, is_seeded=False, created_at=logic.utcnow())
    db.add(user)
    db.flush()
    if seed_demo and get_settings().demo_mode:
        logic.seed_demo_duels(db, user)
    db.commit()
    return AuthOut(token=create_token(user.id), me=_me(user))


@router.post("/auth/register", response_model=MeOut)
def register(body: RegisterIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> MeOut:
    """"Save your streak": turn the current (guest) account into a real one."""
    email = body.email.strip().lower()
    taken = db.scalar(select(User).where(User.email == email, User.id != user.id))
    if taken is not None:
        raise DomainError("That email already has an account. Try logging in.", status=409)
    user.name = body.name.strip()
    user.email = email
    user.password_hash = hash_password(body.password)
    user.is_guest = False
    db.commit()
    return _me(user)


@router.post("/auth/login", response_model=AuthOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> AuthOut:
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user is None or user.password_hash is None:
        raise DomainError("No account with that email. Try creating one.", status=401)
    if not verify_password(body.password, user.password_hash):
        raise DomainError("Wrong password.", status=401)
    return AuthOut(token=create_token(user.id), me=_me(user))


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(current_user)) -> MeOut:
    return _me(user)
