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
| `DEMO_MODE` | `true` enables `/demo/*` and `?seed_demo=true` on guest creation. |
| `CORS_ORIGINS` | Comma-separated web origins, or `*`. |

## Endpoints (JSON is camelCase and mirrors `app/src/data/types.ts`)
| Method and path | What it does |
|---|---|
| `GET /health` | Liveness check |
| `POST /auth/guest` | `{name, seedDemo?}`: a guest account named with a first name, plus a token (optionally with the day-5 demo duels) |
| `POST /auth/register` | `{name, email, password, seedDemo?}`: with a signed-in guest it upgrades that guest ("Save your streak"); with no session it adds a brand-new user row. Returns `{token, me}` |
| `POST /auth/login` | Email + password, returns `{token, me}` |
| `GET /me` | The signed-in user |
| `GET /duels`, `GET /duels/{id}` | My duels (the day is caught up with the clock) |
| `GET /duels/by-code/{code}` | Look up a pending duel by invite code. Works before signing in, so the invited friend sees who challenged them |
| `GET /groups/leaderboard` | People in my duels (and me), ranked by minutes practiced |
| `POST /duels` | Challenge: `{hobbyId, minutes, friendId, inviteCode?}`. `eleanor`/`tanish` start at once; anyone else is pending with a code |
| `POST /duels/{id}/accept` | Accept by code (not your own challenge) |
| `POST /duels/{id}/checkin` · `confirm` · `rest` · `pause` · `resume` · `forfeit` | Playing |
| `POST /duels/{id}/rematch` | `{kind: "same" \| "easier"}` |
| `POST /demo/advance-day` · `opponent-checkin` · `reset` | Demo tools (only with `DEMO_MODE=true`) |
| `GET /demo/db` | The Database screen: latest users (name, email, created_at) and duels (hobby, players, status, score) straight from the tables, newest first. Never includes password hashes. Needs a token and `DEMO_MODE=true` |

Errors are `{"detail": "friendly message"}` with a sensible status (401 sign in, 404 not found, 409 email taken, 400 rule broken).

## How a duel works
- Seven days, day index 0 to 6. The stored day follows the clock (24 hours per day since it started) and the demo fast-forward adds extra days.
- Your own check-in counts on your screen at once; it counts on your friend's screen once they confirm it ("you confirm each other"). When a day rolls over, everything pending is confirmed.
- Seeded friends (Eleanor, Tanish) check in on days 1 to 6 and wait for your OK; they skip day 7, so a full run ends 6 to 5 against someone who checked in once on day 5.
- Two rest days per player. Pausing freezes the clock for both. Forfeit ends the duel and the friend wins.
- The duel is created with the app's local invite code. Someone who is not on Dual yet enters it under "I have a code" and accepts.

## Deploying (Phase 6)
Render web service from `/api`: build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, with the four environment variables above.
