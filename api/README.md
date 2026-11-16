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
| `POST /auth/register` | `{name, email, password}`: always adds a brand-new user row (there are no guests). Returns `{token, me}` |
| `POST /auth/login` | Email + password, returns `{token, me}` |
| `GET /me`, `GET /me/stats` | The signed-in user; duels won, days checked in, current streak, and my check-in times from the last 14 days (from the database) |
| `GET /users/search?q=` | Real accounts by name (contains) or email (starts with), at least 2 characters, never me, email masked |
| `GET /duels`, `GET /duels/{id}` | My duels, including pending invites I received (the day is caught up with the clock) |
| `GET /duels/by-code/{code}` | Look up a pending duel by invite code. Works before signing in |
| `POST /duels` | `{hobbyId, minutes, friendId?}`: always created `pending`. With `friendId` only that person can accept; without it anyone with the code can. Asking again for the same pending challenge (same hobby, minutes and friend) returns the existing duel and code instead of a duplicate |
| `POST /duels/{id}/accept` | Accept an invite (not your own, and only the invited person if one was named) |
| `POST /duels/{id}/checkin`, `confirm`, `rest`, `pause`, `resume`, `forfeit` | Playing |
| `POST /duels/{id}/checkin/details` | `{minutes, note}`: optional minutes (1 to 240) and note (up to 200 characters) on MY check-in for today. The one-tap `checkin` stays the default (goal minutes, no note). Refused once the friend has confirmed it |
| `POST /duels/{id}/rematch` | `{kind: "same" or "easier"}`, once the duel is over; the friend gets a pending invite |
| `GET /groups` | People I've dueled with (record) and a wins leaderboard among us, from finished duels |

Errors are `{"detail": "friendly message"}` with a sensible status (401 sign in, 403 not your invite, 404 not found, 409 email taken, 400 rule broken).

## Progression (XP, tiers, friendship levels)
Computed on every read from check-ins and duels (no extra tables). All numbers are in `app/progression.py`.
- **XP:** 10 per check-in of mine, 25 per check-in of my friend that is confirmed in my duels (by my tap or at day rollover), 50 per duel won. Pending duels give nothing.
- **Tiers:** Bronze 0, Silver 300, Gold 800. Silver and above get **3 rest days per duel instead of 2** (enforced by `POST /duels/{id}/rest` and shown as `restLeft`). Gold: "Start group rivalries (coming later)" is only listed.
- **Friendship levels,** from FINISHED duels with the same friend: New rivals (1), Regulars (3+), Ride or die (6+). Returned as `level` on `/groups` rivals (with `nextLevel`, `duelsToNextLevel`) and on `/users/search` hits.
- `GET /me/stats` returns `xp`, `tier`, `nextTier`, `xpToNext`, `progress` (0 to 1), `restDaysPerDuel` and `tiers` (name, minXp, perk, reached).

## How a duel works
- Always `pending` first. It becomes `active` (day 1 of 7) when the invited person accepts, then follows the clock: 24 hours per day since it was accepted.
- Your own check-in counts on your screen at once; it counts on your friend's screen once they confirm it ("you confirm each other"). When a day rolls over, everything pending is confirmed.
- Two rest days per player (three from Silver). Pausing freezes the clock for both. Forfeit ends the duel and the friend wins.
- Each duel payload has `activity`: the latest 6 check-ins of both players (who, minutes, note, createdAt, confirmed), newest first, for the "Recent check-ins" list.
- After day 7 the duel is `finished`; the winner is whoever has more check-ins (a tie is possible). The Result screen only exists for finished duels.

## Presenter scripts (not part of the app)
```
python scripts/advance_duel.py --list                 # latest duels with their invite codes
python scripts/advance_duel.py <invite code or id> 3  # move a duel forward 3 days (7 ends it)
python scripts/purge_seed_data.py                     # delete the old demo accounts (Eleanor, Tanish) and their duels
```

## Deploying (Phase 6)
Live at https://dual-api-memp.onrender.com (auto-deploys from `main`). Render web service from `/api` (Oregon): build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, with the three environment variables above.
