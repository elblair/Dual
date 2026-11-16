"""Smoke-check the database from api/.env: python check_db.py

Connects, creates the tables if they are missing (and drops columns the app no longer uses), and prints a short report.
It never creates data and never prints the connection string.
"""

from sqlalchemy import func, select, text

from app import models  # noqa: F401  (registers the tables)
from app.db import Base, SessionLocal, engine
from app.migrate import drop_legacy_columns
from app.models import Duel, User


def main() -> None:
    url = engine.url
    print(f"Database: {url.get_backend_name()} ({url.get_driver_name()}) on host {url.host or 'local file'}")
    with engine.connect() as conn:
        version = conn.execute(text("select version()")).scalar() if url.get_backend_name() == "postgresql" else "sqlite"
        print(f"Connected. Server: {str(version)[:60]}")
    dropped = drop_legacy_columns(engine)
    if dropped:
        print(f"Dropped old columns: {', '.join(dropped)}")
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        print(f"Tables ready. Users: {db.scalar(select(func.count()).select_from(User))}, duels: {db.scalar(select(func.count()).select_from(Duel))}")
    print("OK")


if __name__ == "__main__":
    main()
