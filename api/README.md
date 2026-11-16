# Dual API

FastAPI + SQLAlchemy. Postgres on Neon in production, SQLite for tests and quick local runs.

## Run it
```
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env      # then fill in DATABASE_URL and JWT_SECRET (see below)
python check_db.py          # optional: connects, creates the tables, prints a short report
uvicorn app.main:app --reload --host 0.0.0.0
```
Open http://localhost:8000/docs for the interactive docs. With an empty `DATABASE_URL` the API uses a local SQLite file (`dev.db`).

## Tests
`pytest` (from `api/`). They run on in-memory SQLite and refuse to run against anything else.

## Environment (`api/.env`, never committed)
| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Neon connection string (`postgresql://...?sslmode=require`). Empty = local SQLite. |
| `JWT_SECRET` | Long random string that signs login tokens. Required with Postgres. |
| `CORS_ORIGINS` | Comma-separated web origins, or `*`. |

No data is created on startup: tables only. New accounts start empty.

## Endpoints (JSON is camelCase and mirrors `app/src/data/types.ts`)
| Method and path | What it does |
|---|---|
| `GET /health` | Liveness check |
| `POST /auth/guest` | `{name}`: a guest account named with a first name, plus a token |
| `POST /auth/register` | `{name, email, password}`: with a signed-in guest it upgrades that guest; with no session it adds a brand-new user row. Returns `{token, me}` |
| `POST /auth/login` | Email + password, returns `{token, me}` |
| `GET /me`, `GET /me/stats` | The signed-in user; duels won, days checked in, current streak (from the database) |
| `GET /users/search?q=` | Real accounts by name (contains) or email (starts with), at least 2 characters, never me, email masked |
| `GET /duels`, `GET /duels/{id}` | My duels, including pending invites I received (the day is caught up with the clock) |
| `GET /duels/by-code/{code}` | Look up a pending duel by invite code. Works before signing in |
| `POST /duels` | `{hobbyId, minutes, friendId?}`: always created `pending`. With `friendId` only that person can accept; without it anyone with the code can |
| `POST /duels/{id}/accept` | Accept an invite (not your own, and only the invited person if one was named) |
| `POST /duels/{id}/checkin`, `confirm`, `rest`, `pause`, `resume`, `forfeit` | Playing |
| `POST /duels/{id}/rematch` | `{kind: "same" or "easier"}`, once the duel is over; the friend gets a pending invite |
| `GET /groups` | People I've dueled with (record) and a wins leaderboard among us, from finished duels |

Errors are `{"detail": "friendly message"}` with a sensible status (401 sign in, 403 not your invite, 404 not found, 409 email taken, 400 rule broken).

## How a duel works
- Always `pending` first. It becomes `active` (day 1 of 7) when the invited person accepts, then follows the clock: 24 hours per day since it was accepted.
- Your own check-in counts on your screen at once; it counts on your friend's screen once they confirm it ("you confirm each other"). When a day rolls over, everything pending is confirmed.
- Two rest days per player. Pausing freezes the clock for both. Forfeit ends the duel and the friend wins.
- After day 7 the duel is `finished`; the winner is whoever has more check-ins (a tie is possible). The Result screen only exists for finished duels.

## Presenter scripts (not part of the app)
```
python scripts/advance_duel.py --list                 # latest duels with their invite codes
python scripts/advance_duel.py <invite code or id> 3  # move a duel forward 3 days (7 ends it)
python scripts/purge_seed_data.py                     # delete the old demo accounts (Eleanor, Tanish) and their duels
```

## Deploying (Phase 6)
Render web service from `/api` (Oregon): build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, with the three environment variables above.
