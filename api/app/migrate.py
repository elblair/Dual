"""Tiny schema upkeep. This demo has no Alembic: create_all makes new tables, and this drops columns we removed."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# table -> columns that older versions created and the app no longer uses
LEGACY_COLUMNS = {"users": ["is_seeded", "is_guest"], "duels": ["invitee_id", "day_offset"]}


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
