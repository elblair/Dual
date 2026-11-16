import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import logic
from app.db import get_db
from app.logic import DomainError
from app.models import User
from app.schemas import AuthOut, LoginIn, MeOut, RegisterIn
from app.security import create_token, current_user, hash_password, verify_password

router = APIRouter(tags=["auth"])


def _me(user: User) -> MeOut:
    return MeOut(id=user.id, name=user.name, email=user.email)


def _auth(user: User) -> AuthOut:
    return AuthOut(token=create_token(user.id), me=_me(user))


@router.post("/auth/register", response_model=AuthOut)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> AuthOut:
    """Sign up: adds a brand-new user row. Every user has an account (name, email, password); there are no guests."""
    email = body.email.strip().lower()
    name = body.name.strip()
    if not name:
        raise DomainError("Please enter your name.", status=422)
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise DomainError("That email already has an account. Try logging in.", status=409)

    user = User(
        id=secrets.token_hex(6),
        name=name,
        email=email,
        password_hash=hash_password(body.password),
        created_at=logic.utcnow(),
    )
    db.add(user)
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
