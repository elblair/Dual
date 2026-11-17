# Dual

Mobile demo app where two friends "dual" to keep up a hobby (guitar, running, ...). They check in once a day, confirm each other, and see who is winning with 7 dots per person over a 7-day duel.

Everything on screen comes from the API and the database. There is no seeded, sample or mock data: a new account starts with "No duels yet".

| Part | Folder | Tech |
|---|---|---|
| Mobile app | `app/` | React Native + Expo SDK 58 (Expo Router, TypeScript), runs in Expo Go on iOS and Android, and on Expo web |
| API | `api/` | FastAPI + SQLAlchemy |
| Database | Neon | Postgres (free tier) |
| Hosting | Render | Free web service, Oregon (blueprint: `render.yaml`) |
| Design | `design/` | `spec.md` (tokens and screen specs) and PNG exports of the Figma screens |
| Docs | `docs/` | `DEMO.md` (demo script and checklist), `PLAN.md`, `FEATURES.md`, `METRICS.md`, `RENDER_HANDOFF.md` |

## Run it locally

You need Node 20+, Python 3.12, and a Neon connection string (or nothing: without `DATABASE_URL` the API uses a local SQLite file).

**API** (from `api/`)
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env        # then fill in DATABASE_URL and JWT_SECRET yourself; never commit .env
python check_db.py            # prints OK when the database is reachable
uvicorn app.main:app --reload --host 0.0.0.0
pytest                        # tests run on in-memory SQLite, never on Neon
```

**App** (from `app/`)
```
npm install
copy .env.example .env        # EXPO_PUBLIC_API_URL defaults to the Render API (https://dual-api-memp.onrender.com); use http://localhost:8000 (browser) or your PC's LAN IP (phone) for a local API
npx expo start -c             # scan the QR code with Expo Go (phone and PC on the same Wi-Fi), or press w for the browser
npx tsc --noEmit              # type check
```

The Expo Go in the phone's store must match the project's SDK (58). Do not change the SDK without checking it.

## Demo

`docs/DEMO.md` is the two-phone script (register, invite, accept, check in, confirm) plus the demo-day checklist.

## Deploy the API

The API is live on Render (Oregon, free tier) at **https://dual-api-memp.onrender.com** and redeploys automatically when `main` changes; check it at `/health`. `render.yaml` is the Render Blueprint and `docs/RENDER_HANDOFF.md` has the click-by-click setup. To use it from a phone, set `EXPO_PUBLIC_API_URL=https://dual-api-memp.onrender.com` and `EXPO_PUBLIC_USE_MOCK=false` in `app/.env` and restart Expo with `npx expo start -c`.

## Deploy the web app

The same app also runs as a website: a free Render **static site** (never sleeps) built with `npx expo export --platform web` and defined in `render.yaml` (`dual-web`). Open its link on a phone, choose **Share > Add to Home Screen** (iPhone, Safari) or **Install app / Add to Home screen** (Android, Chrome), and Dual opens full screen from its icon with no browser bars: no Expo Go, no laptop. `docs/RENDER_WEB.md` has the click-by-click setup, including the exact `CORS_ORIGINS` value for the API. "Send by text" uses the browser's share sheet (Web Share API) and copies the text where there is none.

Releases: `develop` -> `main` PRs titled `release: v0.x.0`, merged with a **merge commit** (never squash), then tagged (see `CONTRIBUTING.md`).

## Git workflow

`main` is what gets deployed (merge by pull request only, 1 approval). Work goes on `feature/*`, `fix/*` or `chore/*` branches from `develop` and is merged back by pull request. Commits and PR titles use Conventional Commits. Details: `CONTRIBUTING.md`.
