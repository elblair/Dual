"""Progression rules: XP, tiers, friendship levels. Every number lives in this file.

Nothing here is stored: XP, the tier and the friendship levels are computed from check-ins and duels each time they are
read (see `logic.xp_for`, `logic.stats_for`, `logic.groups_for`), so there are no extra tables.
"""

from dataclasses import dataclass

# ---- XP
XP_PER_CHECKIN = 10  # each of my own check-ins
XP_PER_CONFIRMED_FRIEND_CHECKIN = 25  # each check-in of my friend that has been confirmed in my duels
XP_PER_DUEL_WON = 50  # each finished duel I won (a forfeit win counts)


# ---- tiers
@dataclass(frozen=True)
class Tier:
    name: str
    min_xp: int
    rest_days_per_duel: int
    # What reaching this tier unlocks, shown on You. None = nothing to unlock.
    perk: str | None


TIERS: tuple[Tier, ...] = (
    Tier("Bronze", 0, 2, None),
    Tier("Silver", 300, 3, "3 rest days per duel instead of 2"),
    Tier("Gold", 800, 3, "Start group rivalries (coming later)"),
)


def tier_for(xp: int) -> Tier:
    """The highest tier whose threshold the XP reaches."""
    reached = [t for t in TIERS if xp >= t.min_xp]
    return reached[-1]


def next_tier_for(xp: int) -> Tier | None:
    """The next tier to reach, or None at the top."""
    return next((t for t in TIERS if t.min_xp > xp), None)


def rest_days_for(xp: int) -> int:
    return tier_for(xp).rest_days_per_duel


# ---- friendship levels, from FINISHED duels with the same friend (highest threshold first)
FRIENDSHIP_LEVELS: tuple[tuple[int, str], ...] = (
    (6, "Ride or die"),
    (3, "Regulars"),
    (1, "New rivals"),
)


def level_for(finished_duels_together: int) -> str | None:
    """None until the two of you have finished a duel together."""
    for minimum, name in FRIENDSHIP_LEVELS:
        if finished_duels_together >= minimum:
            return name
    return None


def next_level_for(finished_duels_together: int) -> tuple[str, int] | None:
    """The next friendship level and how many more finished duels it needs, or None at the top."""
    for minimum, name in reversed(FRIENDSHIP_LEVELS):
        if finished_duels_together < minimum:
            return name, minimum - finished_duels_together
    return None
