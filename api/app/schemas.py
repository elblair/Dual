"""Request/response shapes. JSON uses camelCase and mirrors app/src/data/types.ts."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MeOut(CamelModel):
    id: str
    name: str
    email: str | None = None


class AuthOut(CamelModel):
    token: str
    me: MeOut


class PersonOut(CamelModel):
    id: str
    name: str
    tone: Literal["you", "opponent", "neutral"]


class PendingOut(CamelModel):
    minutes: int
    note: str


class ResultOut(CamelModel):
    winner: Literal["me", "them", "tie"]
    forfeited_by: Literal["me", "them"] | None = None


class ActivityOut(CamelModel):
    """One check-in in the "Recent check-ins" feed on the Duel screen."""

    who: Literal["me", "them"]
    minutes: int
    note: str
    created_at: str
    # Whether it has been confirmed ("you confirm each other"; day rollover confirms everything too).
    confirmed: bool
    day_index: int


class DuelOut(CamelModel):
    id: str
    hobby_id: str
    minutes: int
    length_days: int
    status: Literal["pending", "active", "paused", "finished"]
    # None for an open invite nobody has accepted yet.
    opponent: PersonOut | None
    creator: PersonOut
    viewer_is_creator: bool
    # Only while the duel is pending.
    invite_code: str | None
    # When the duel started (None while pending).
    started_at: str | None
    today: int
    my_days: list[int]
    their_days: list[int]
    my_rest_days: list[int]
    rest_left: int
    their_pending: PendingOut | None
    # The latest check-ins of both players, newest first (empty for someone who is not a player).
    activity: list[ActivityOut]
    paused_until: str | None
    result: ResultOut | None


class RegisterIn(CamelModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+$")
    password: str = Field(min_length=6, max_length=128)


class LoginIn(CamelModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class CreateDuelIn(CamelModel):
    hobby_id: str = Field(min_length=1, max_length=32)
    minutes: int
    # A person found with /users/search. None = an open invite that a friend accepts with the code.
    friend_id: str | None = Field(default=None, max_length=32)


class CheckinDetailsIn(CamelModel):
    """Optional details for today's check-in (the one-tap check-in logs the duel's goal minutes and no note)."""

    minutes: int = Field(ge=1, le=240)
    note: str = Field(default="", max_length=200)


class RematchIn(CamelModel):
    kind: Literal["same", "easier"]


class UserHitOut(CamelModel):
    id: str
    name: str
    email_hint: str
    # Friendship level from finished duels together (None until you have finished one).
    level: str | None


class TierOut(CamelModel):
    name: str
    min_xp: int
    perk: str | None
    reached: bool


class StatsOut(CamelModel):
    duels_won: int
    days_checked_in: int
    current_streak: int
    # My own check-in times (ISO, UTC) from the last 14 days: the app draws this week's streak bubbles from them.
    recent_check_ins: list[str]
    # Progression, all computed from check-ins and duels (rules: app/progression.py).
    xp: int
    tier: str
    next_tier: str | None
    xp_to_next: int | None
    # 0 to 1 towards the next tier (1 at the top tier).
    progress: float
    rest_days_per_duel: int
    tiers: list["TierOut"]


class RivalOut(CamelModel):
    person: PersonOut
    duels: int
    wins: int
    losses: int
    ties: int
    active: int
    finished: int
    level: str | None
    next_level: str | None
    duels_to_next_level: int | None


class LeaderRowOut(CamelModel):
    id: str
    name: str
    tone: Literal["you", "opponent", "neutral"]
    wins: int
    is_you: bool


class GroupsOut(CamelModel):
    rivals: list[RivalOut]
    leaderboard: list[LeaderRowOut]
