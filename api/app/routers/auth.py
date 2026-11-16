import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import logic
from app.config import get_settings
from app.db import get_db
from app.logic import DomainError
from app.models import User
from app.schemas import AuthOut, GuestIn, LoginIn, MeOut, RegisterIn
from app.security import create_token, current_user, hash_password, optional_user, verify_password

router = APIRouter(tags=["auth"])


def _me(user: User) -> MeOut:
    return MeOut(id=user.id, name=user.name, is_guest=user.is_guest, email=user.email)


def _auth(user: User) -> AuthOut:
    return AuthOut(token=create_token(user.id), me=_me(user))


def _new_user(db: Session, name: str, *, guest: bool) -> User:
    user = User(id=secrets.token_hex(6), name=name, is_guest=guest, is_seeded=False, created_at=logic.utcnow())
    db.add(user)
    db.flush()
    return user


@router.post("/auth/guest", response_model=AuthOut)
def create_guest(body: GuestIn, db: Session = Depends(get_db)) -> AuthOut:
    """A guest account named with a first name, so people can start a dual before signing up.

    With seedDemo=true (and DEMO_MODE=true on the server) the guest also gets the day-5 demo duels.
    """
    name = body.name.strip()
    if not name:
        raise DomainError("Please enter a first name.", status=422)
    user = _new_user(db, name, guest=True)
    if body.seed_demo and get_settings().demo_mode:
        logic.seed_demo_duels(db, user)
    db.commit()
    return _auth(user)


@router.post("/auth/register", response_model=AuthOut)
def register(body: RegisterIn, current: User | None = Depends(optional_user), db: Session = Depends(get_db)) -> AuthOut:
    """Sign up. With a signed-in guest this is "Save your streak" (the guest becomes a real account and keeps their duels);
    with no session it adds a brand-new user row."""
    email = body.email.strip().lower()
    name = body.name.strip()
    if not name:
        raise DomainError("Please enter your name.", status=422)
    taken = db.scalar(select(User).where(User.email == email, User.id != (current.id if current else "")))
    if taken is not None:
        raise DomainError("That email already has an account. Try logging in.", status=409)

    user = current
    is_new = user is None
    if user is None:
        user = _new_user(db, name, guest=False)
    user.name = name
    user.email = email
    user.password_hash = hash_password(body.password)
    user.is_guest = False
    if is_new and body.seed_demo and get_settings().demo_mode:
        logic.seed_demo_duels(db, user)
    db.commit()
    return _auth(user)


@router.post("/auth/login", response_model=AuthOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> AuthOut:
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user is None or user.password_hash is None:
        raise DomainError("No account with that email. Try creating one.", status=401)
    if not verify_password(body.password, user.password_hash):
        raise DomainError("Wrong password.", status=401)
    return _auth(user)


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(current_user)) -> MeOut:
    return _me(user)
