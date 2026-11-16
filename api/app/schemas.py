"""Request/response shapes. JSON uses camelCase and mirrors app/src/data/types.ts."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MeOut(CamelModel):
    id: str
    name: str
    is_guest: bool
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


class DuelOut(CamelModel):
    id: str
    hobby_id: str
    minutes: int
    length_days: int
    status: Literal["pending", "active", "paused", "finished"]
    opponent: PersonOut
    creator: PersonOut
    viewer_is_creator: bool
    invite_code: str | None
    today: int
    my_days: list[int]
    their_days: list[int]
    my_rest_days: list[int]
    rest_left: int
    their_pending: PendingOut | None
    paused_until: str | None
    result: ResultOut | None


class RegisterIn(CamelModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+$")
    password: str = Field(min_length=6, max_length=128)
    # With no signed-in guest, a brand-new account can also get the demo duels (the app sends its demo flag).
    seed_demo: bool = False


class LoginIn(CamelModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class CreateDuelIn(CamelModel):
    hobby_id: str = Field(min_length=1, max_length=32)
    minutes: int
    friend_id: str = Field(min_length=1, max_length=32)
    invite_code: str | None = Field(default=None, max_length=8)


class RematchIn(CamelModel):
    kind: Literal["same", "easier"]


class GuestIn(CamelModel):
    name: str = Field(min_length=1, max_length=80)
    seed_demo: bool = False


class LeaderRowOut(CamelModel):
    id: str
    name: str
    tone: Literal["you", "opponent", "neutral"]
    minutes: int
    is_you: bool


class DbUserOut(CamelModel):
    id: str
    name: str
    email: str | None
    is_guest: bool
    is_seeded: bool
    created_at: str


class DbDuelOut(CamelModel):
    id: str
    hobby_id: str
    minutes: int
    goal: str
    status: str
    creator: str
    opponent: str
    score: str
    today: int
    created_at: str


class DbInfoOut(CamelModel):
    engine: str
    host: str


class DbSnapshotOut(CamelModel):
    database: DbInfoOut
    user_count: int
    duel_count: int
    users: list[DbUserOut]
    duels: list[DbDuelOut]
