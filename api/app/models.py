from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # When the person typed the code we emailed them. None = not verified yet (the app shows the Verify screen).
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime)


class EmailCode(Base):
    """The latest 6-digit sign-up code for a user. Only a hash is kept; a new code replaces the old one."""

    __tablename__ = "email_codes"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    sent_at: Mapped[datetime] = mapped_column(DateTime)


class Duel(Base):
    __tablename__ = "duels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hobby_id: Mapped[str] = mapped_column(String(32))
    minutes: Mapped[int] = mapped_column(Integer)
    # The goal in the players' own words ("Scales for 20 minutes"). None = the app's suggestion built from the hobby and minutes.
    goal: Mapped[str | None] = mapped_column(String(80), nullable=True)
    length_days: Mapped[int] = mapped_column(Integer, default=7)
    # pending | active | paused | finished
    status: Mapped[str] = mapped_column(String(16), index=True)
    creator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    # Set when a specific person was invited, or when someone accepted a code. None for an open invite.
    opponent_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    # The code a friend enters to accept (kept after acceptance so a duel can be found by it).
    invite_code: Mapped[str | None] = mapped_column(String(8), nullable=True, unique=True)
    started_at: Mapped[datetime] = mapped_column(DateTime)
    # Current day index 0..6 (7 = finished). Caught up with the clock whenever the duel is read.
    today: Mapped[int] = mapped_column(Integer, default=0)
    paused_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    winner: Mapped[str | None] = mapped_column(String(16), nullable=True)  # creator | opponent | tie
    forfeited_by: Mapped[str | None] = mapped_column(String(16), nullable=True)  # creator | opponent
    created_at: Mapped[datetime] = mapped_column(DateTime)

    checkins: Mapped[list["Checkin"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    rest_days: Mapped[list["RestDay"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class Checkin(Base):
    __tablename__ = "checkins"
    __table_args__ = (UniqueConstraint("duel_id", "user_id", "day_index"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    duel_id: Mapped[int] = mapped_column(ForeignKey("duels.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    day_index: Mapped[int] = mapped_column(Integer)
    # "You confirm each other": counts for the other player's score once they confirm it.
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    minutes: Mapped[int] = mapped_column(Integer)
    note: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime)


class RestDay(Base):
    __tablename__ = "rest_days"
    __table_args__ = (UniqueConstraint("duel_id", "user_id", "day_index"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    duel_id: Mapped[int] = mapped_column(ForeignKey("duels.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    day_index: Mapped[int] = mapped_column(Integer)
