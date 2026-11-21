import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import logic, verification
from app.db import get_db
from app.logic import DomainError
from app.models import User
from app.schemas import AuthOut, LoginIn, MeOut, ProfileIn, RegisterIn, VerifyEmailIn
from app.security import create_token, current_user, hash_password, verify_password

router = APIRouter(tags=["auth"])


def _me(user: User) -> MeOut:
    return MeOut(
        id=user.id,
        name=user.name,
        email=user.email,
        email_verified=user.email_verified_at is not None,
        bio=user.bio,
        interests=logic.interests_of(user),
        avatar=user.avatar,
    )


def _auth(user: User) -> AuthOut:
    return AuthOut(token=create_token(user.id), me=_me(user))


@router.post("/auth/register", response_model=AuthOut)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> AuthOut:
    """Sign up: adds a brand-new user row and emails a 6-digit code. Every user has an account; there are no guests.
    The token works at once, but the app keeps the person on the Verify screen until /auth/verify-email succeeds."""
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
    try:
        verification.send_code(db, user)
    except DomainError:
        pass  # the account exists either way; the Verify screen's "Send a new code" tries again
    return _auth(user)


@router.post("/auth/login", response_model=AuthOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> AuthOut:
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user is None or user.password_hash is None:
        raise DomainError("No account with that email. Try creating one.", status=401)
    if not verify_password(body.password, user.password_hash):
        raise DomainError("Wrong password.", status=401)
    return _auth(user)


@router.post("/auth/verify-email", response_model=MeOut)
def verify_email(body: VerifyEmailIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> MeOut:
    verification.verify_code(db, user, body.code)
    return _me(user)


@router.post("/auth/resend-code", status_code=204)
def resend_code(user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    if user.email_verified_at is not None:
        raise DomainError("Your email is already verified.", status=409)
    verification.send_code(db, user)


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(current_user)) -> MeOut:
    return _me(user)


@router.patch("/me", response_model=MeOut)
def update_me(body: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> MeOut:
    """Edit profile: bio, interests and avatar. Only the fields sent are changed."""
    logic.update_profile(user, {name: getattr(body, name) for name in body.model_fields_set})
    db.commit()
    return _me(user)
