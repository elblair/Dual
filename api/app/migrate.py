"""Tiny schema upkeep. This demo has no Alembic: create_all makes new tables, and this drops columns we removed and adds
columns we introduced to tables that already exist (create_all never alters an existing table)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# table -> columns that older versions created and the app no longer uses
LEGACY_COLUMNS = {"users": ["is_seeded", "is_guest"], "duels": ["invitee_id", "day_offset"]}


# table -> {column: SQL type} for columns added after a table was first created (all nullable, so old rows stay valid)
NEW_COLUMNS = {"duels": {"goal": "VARCHAR(80)"}}


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
