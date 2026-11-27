"""Tiny schema upkeep. This demo has no Alembic: create_all makes new tables, and this drops columns we removed and adds
columns we introduced to tables that already exist (create_all never alters an existing table)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# table -> columns that older versions created and the app no longer uses
LEGACY_COLUMNS = {"users": ["is_seeded", "is_guest"], "duels": ["invitee_id", "day_offset"]}


# table -> {column: SQL type} for columns added after a table was first created (all nullable, so old rows stay valid)
NEW_COLUMNS = {
    "duels": {
        "goal": "VARCHAR(80)",
        # Duel settings v2. Old duels get today's behavior: daily, mutual confirm, compete, no number.
        "frequency": "VARCHAR(12) NOT NULL DEFAULT 'daily'",
        "times_per_week": "INTEGER",
        "verification": "VARCHAR(12) NOT NULL DEFAULT 'mutual'",
        "mode": "VARCHAR(12) NOT NULL DEFAULT 'compete'",
        "unit": "VARCHAR(24)",
        "target": "INTEGER",
        "custom_hobby": "VARCHAR(80)",
    },
    "users": {"email_verified_at": "TIMESTAMP", "bio": "VARCHAR(160)", "interests": "VARCHAR(500)", "avatar": "VARCHAR(32)"},
}

# Run once, right after a column is added: accounts made before email verification existed count as verified.
BACKFILL = {"users.email_verified_at": "UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL"}


def add_missing_columns(engine: Engine) -> list[str]:
    """Add NEW_COLUMNS that an older database does not have yet. Safe to run on every start."""
    added = []
    inspector = inspect(engine)
    for table, columns in NEW_COLUMNS.items():
        if not inspector.has_table(table):
            continue
        existing = {c["name"] for c in inspector.get_columns(table)}
        for column, sql_type in columns.items():
            if column not in existing:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
                    if f"{table}.{column}" in BACKFILL:
                        conn.execute(text(BACKFILL[f"{table}.{column}"]))
                added.append(f"{table}.{column}")
    return added


def drop_legacy_columns(engine: Engine) -> list[str]:
    dropped = []
    inspector = inspect(engine)
    for table, columns in LEGACY_COLUMNS.items():
        if not inspector.has_table(table):
            continue
        existing = {c["name"] for c in inspector.get_columns(table)}
        for column in columns:
            if column in existing:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} DROP COLUMN {column}"))
                dropped.append(f"{table}.{column}")
    return dropped
