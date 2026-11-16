# Dual

Mobile demo app where two friends "dual" to keep up a hobby (guitar, running, ...). They check in daily, confirm each other, and see who is winning with 7 dots per person over a 7-day duel. One-off class demo, no real traffic: keep everything simple.

## Source of truth for design
Figma is rate-limited. Use `design/spec.md` (tokens + screen specs) and the PNG exports in `design/png/` (Hobby, Friend, Accept, Today, Done, Duel, Result, Groups, You, Save, Break, Lock). PNGs are 2x (Duel.png is 1x). Original Figma: page "Dual v2 · Improved", row "Claude's Pick" (Break from the "Base" row). If a screen is unclear, ask the user; do not guess.

## Stack
- `/app`: React Native + Expo (TypeScript, Expo Router). Must run in Expo Go on iOS and Android, so only Expo Go compatible packages (no custom native modules, no dev builds). Expo SDK 58 (React Native 0.88, React 19.3): it must match the Expo Go in the stores; the user's iPhone has Expo Go 58.0.0, and each Expo Go build supports only one SDK. Do not change the SDK without checking the phones' Expo Go version. Expo APIs change between SDKs: check https://docs.expo.dev/versions/v58.0.0/ before using one. Expo web is used as the second player in demos (`react-native-web`).
- `/api`: FastAPI (Python), SQLAlchemy, deployed on Render free tier.
- Database: Postgres on Neon free tier. Never Render Postgres (expires after 30 days).
- Monorepo: `/app`, `/api`, `/design`, `/docs`.

## Folder structure (target)
```
app/
  app/                 Expo Router routes (screens only, thin)
    (tabs)/            today, groups, you, plus tab bar
    ...                hobby, friend, accept, duel/[id], done, result, break, save, login
  src/
    theme/             theme.ts: ALL colors, fonts, spacing, radii (light now, dark "Midnight" later)
    components/        Button, Avatar, Dots, Card, TabBar, ...
    data/              DataSource interface + types.ts, mockSource.ts, apiSource.ts, index.ts (picks by env), hooks
    state/             auth + session
api/
  app/main.py, models.py, schemas.py, routes/, db.py, auth.py
  requirements.txt
design/                spec.md + png/
docs/PLAN.md           build plan
```

## Commands
App (from `/app`):
- `npm install`
- `npx expo start` then scan the QR in Expo Go (phone and PC on the same Wi-Fi; use `--tunnel` if the network blocks it)
- `npx tsc --noEmit` type check
API (from `/api`):
- `python -m venv .venv && .venv\Scripts\activate && pip install -r requirements-dev.txt`
- `pytest` runs the tests on in-memory SQLite (conftest forces `DATABASE_URL=sqlite://` and refuses any other database, so tests never touch Neon)
- `uvicorn app.main:app --reload --host 0.0.0.0` (without `DATABASE_URL` it uses a local `dev.db` SQLite file)
- `python check_db.py` smoke-checks the database in `api/.env` (creates tables, never prints the URL)
- Env: `DATABASE_URL` (Neon), `JWT_SECRET`, `DEMO_MODE`, `CORS_ORIGINS`. Local `.env` is gitignored. Never ask the user to paste secrets into chat; never read `api/.env`.
- API layout: `app/main.py` (app, CORS, startup create_all + seed), `config.py`, `db.py`, `models.py`, `schemas.py` (camelCase, mirrors `app/src/data/types.ts`), `logic.py` (all duel rules, mirrors `mockSource.ts`), `security.py`, `routers/{auth,duels,demo}.py`, `tests/`. Any change to a rule or field goes into the TypeScript interface, `mockSource.ts` and `logic.py` together.

App env (`app/.env`, inlined at bundle time, restart with `npx expo start -c` after changes):
- `EXPO_PUBLIC_API_URL`: API base URL
- `EXPO_PUBLIC_USE_MOCK=true`: run entirely on the in-memory mock store (demo fallback if the API is down/slow)
- `EXPO_PUBLIC_DEMO=true`: show "Demo tools" on the You screen (fast-forward a day, Eleanor checks in, reset demo)

## Design rules
- Match the Figma/PNGs closely, using real React Native components (`View`, `Text`, `Pressable`, `ScrollView`). No web code, no Tailwind, no HTML.
- Every color, font, font size, spacing value and radius comes from `app/src/theme/theme.ts`. No hardcoded hex or magic numbers in screens/components. Theme is a typed object so a Midnight dark theme can be added later and picked with `useColorScheme`. Use a `useTheme()` hook, not direct imports of the light palette.
- Font: Inter (via `@expo-google-fonts/inter`). Icons: `lucide-react-native` (matches the design's icon style).
- Brand: maroon `#6e1023`. Orange `#f28c38` means "do this now" (check-in actions). Never use orange for decoration elsewhere.
- Progress is always 7 dots per person (`Dots` component): you = blue, opponent = maroon-bright, empty = light gray, today = orange ring.
- Four tabs only: Today, Groups, +, You. "+" starts a new duel (Hobby flow).
- Screens have 22pt side padding, 60pt top. Respect safe areas.

## Scope
Real (backed by API + DB): sign up / log in, pick a hobby, challenge a friend, accept a duel, one-tap check-in, 7-dot progress, Result with "start next duel", Break (rest day / pause / forfeit).
Seeded real accounts: Eleanor and Tanish (auto-accept challenges; Eleanor can check in via Demo tools). Ben is a non-Dual contact: challenging him makes a pending duel with an invite code. Every user gets a seeded Guitar duel vs Eleanor on day 5 of 7 (and Running vs Tanish) on first launch and on "Reset demo".
Demo tools (You screen, only when `EXPO_PUBLIC_DEMO=true`): fast-forward a day, "Eleanor checks in", reset demo. API: `/demo/*`, only when `DEMO_MODE=true`.
Fake (sample data): Strava sync labels, friend-confirmation card, Sunday recap, Groups screen, XP/friendship level, Silver tier perks. Lock screen is a static image only.
Accepting a duel is in-app via invite code (share sheet; clipboard on web). Apple/Google sign-in buttons show "coming soon"; email + password is real.
Skip entirely: stakes/money (also remove stake text from copy), Dual+, accepting via web link.

## Git workflow (simplified Git Flow; details in CONTRIBUTING.md)
- `main`: production / demo-ready. Render deploys from it. Never commit directly; only merge via pull request.
- `develop`: integration branch. Branch all work from it, merge back via PR.
- `feature/<short-name>`: one per phase or feature, from `develop` (e.g. `feature/phase-1-theme`, `feature/today-screen`, `feature/api-auth`).
- `fix/<short-name>`: bug fixes, from `develop`.
- `hotfix/<short-name>`: urgent fixes from `main`, merged into `main` AND `develop`.
- No staging branch (one free Render service): `main` is what we deploy.
- Commits and PR titles use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`. Small, focused commits. Never commit secrets or `.env` files.
- Each phase = one feature branch -> PR into `develop` (what changed, how to test on a phone, screenshots for UI). PRs into `develop` need no approval (the user merges them); only `main` needs 1 approval.
- When `develop` is stable and demo-ready, PR `develop` -> `main` and tag it (`v0.1.0`, `v0.2.0`, ...).
- Delete feature branches after merging.
- Use `gh pr create --base develop` to open PRs; if `gh` is unavailable, give the user the GitHub compare link instead.
- Before starting a phase: `git switch develop && git pull`, then create the feature branch. Never push or merge without the user's go-ahead.

## Visual verification (every phase with new screens)
Run Expo web with demo mode (`EXPO_PUBLIC_DEMO=true npx expo start --web --port 8099 --clear`), open it with Claude in Chrome, screenshot every new screen at phone size and compare side by side with `design/png/` and `design/spec.md`. Fix differences before merging and list what could not be matched in the PR.
- The browser viewport is desktop-wide: wrap the app in a 390x844 frame, e.g. `document.write('<div style="width:390px;height:844px;transform:scale(0.72);transform-origin:0 0"><iframe id="f" src="/today" style="width:390px;height:844px;border:0"></iframe></div>')`, then change `f.src` per screen and use the `zoom` action. Deep links reseed the in-memory mock, so flows that change data must be clicked through.
- Metro on this machine sometimes serves stale shared modules (theme, Screen) after edits: if a change does not show up, kill the server and restart with `--clear`.
- Web has no safe-area insets: top padding is `max(inset + 12, 60)` so web and phones both get Figma's 60.

## Working rules
- Build in small phases; after each: say how to run/test on a phone, then commit (Conventional Commits) on the phase's feature branch and open a PR into `develop`.
- Do not write code beyond the approved phase. Ask before changing scope.
- Data access: screens only use hooks from `app/src/data/`, never `fetch` or the mock directly. Any new field/endpoint goes into the `DataSource` interface, `mockSource`, and the API in the same change. Mock mode (`EXPO_PUBLIC_USE_MOCK=true`) must keep working after the API exists; check it at the end of every phase from Phase 3.
- Neon (before Phase 4) and Render (before Phase 6): stop and give the user step-by-step setup instructions when reaching those phases.
- Keep secrets out of git.
