from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    # Seeded friends use fixed ids ('eleanor', 'tanish'); everyone else gets a random hex id.
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, default=True)
    is_seeded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime)


class Duel(Base):
    __tablename__ = "duels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hobby_id: Mapped[str] = mapped_column(String(32))
    minutes: Mapped[int] = mapped_column(Integer)
    length_days: Mapped[int] = mapped_column(Integer, default=7)
    # pending | active | paused | finished
    status: Mapped[str] = mapped_column(String(16), index=True)
    creator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    opponent_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    # For a pending duel: who was invited (a contact id such as 'ben') and the code they enter.
    invitee_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    invite_code: Mapped[str | None] = mapped_column(String(8), nullable=True, unique=True)
    started_at: Mapped[datetime] = mapped_column(DateTime)
    # Current day index 0..6 (7 = finished). Advances with the clock, or with the demo fast-forward.
    today: Mapped[int] = mapped_column(Integer, default=0)
    day_offset: Mapped[int] = mapped_column(Integer, default=0)
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
