# Dual build plan

Approved (with the changes folded in below). See `CLAUDE.md` and `design/spec.md`. Code starts at Phase 0.

## Decisions (final)

1. **Guest first, account later.** First screen is Hobby ("No account needed"). The API creates a guest user on first open and returns a token. "Save your streak" upgrades the guest to an email + password account. "Log in" on Hobby signs in to an existing account.
2. **Accepting = invite code, in-app.** "Send by text" opens the native share sheet with the message and a short code (e.g. `K3X9`). The friend taps "I have a code" on Hobby and sees Accept. The browser chrome from the Accept frame is dropped. On Expo web (no share sheet) the code is copied to the clipboard instead.
3. **Friend picker keeps Eleanor, Tanish and Ben.**
   - **Eleanor** is a real seeded account (email/password in the seed script). Challenging her creates a real duel that she auto-accepts, so a one-phone demo works. The Demo tools can make her check in.
   - **Tanish** ("On Dual") is also a seeded real account, auto-accepts the same way. (Small assumption of mine; it keeps "On Dual" truthful and costs one extra seed row. Say if you'd rather he be fake.)
   - **Ben** ("In your contacts") is not on Dual: challenging him creates a pending duel and shows the share sheet with a code. A second player (teammate's phone or Expo web) accepts it.
4. **Auth:** real email + password only. Apple and Google buttons stay in the layout and show "coming soon".
5. **Demo tools** (replaces the hidden long-press): a small "Demo tools" card at the bottom of the You screen, shown only when `EXPO_PUBLIC_DEMO=true`. Actions:
   - Fast-forward a day
   - Eleanor checks in
   - Reset demo (wipes the current user's duels and recreates the seeded demo duel)
   The API exposes `/demo/advance-day`, `/demo/eleanor-checkin`, `/demo/reset`, enabled only when the API env var `DEMO_MODE=true`. The mock store implements the same three actions.
6. **Seeded demo duel on day 5.** On first launch (and on Reset demo) the current user gets a Guitar duel vs Eleanor, "Day 5 of 7": you 4 check-ins (days 1 to 4), Eleanor 4 check-ins, today (day 5) still open, matching the Today and Duel frames. One tap on "I did it" then gives Day 5 logged (5 to 4, or 5 to 5 after Eleanor checks in). Fast-forwarding to the end gives the Result screen. A second seeded duel (Running vs Tanish, 5 to 6) is created too so Today shows both cards like the design. Exact seed scores are set in the seed function and can be tuned.
7. **Mock mode fallback.** `EXPO_PUBLIC_USE_MOCK=true` runs the whole app on an in-memory mock store, no network. Built in Phase 3, kept working after Phase 5 (see "Data layer" below).
8. **Static sample data:** Groups, XP and friendship level, Silver perks, the Sunday recap, the Strava line, "Confirm Eleanor's 25 min" card, Lock screen image. In You, "$10 to charity" becomes "days checked in" and the Dual+ row is removed. Stake copy is dropped everywhere (Friend, Duel, Break, You).
9. **Icons:** `lucide-react-native` + `react-native-svg`.
10. **Sun/theme button** on Duel and You is skipped until Midnight is added.

## Expo SDK
Use the SDK supported by the Expo Go build in the App Store and Play Store, not the newest SDK on npm (npm `latest` is SDK 58, but the store builds lag; the Expo docs say the iOS App Store build has stopped at SDK 54 and that only one SDK is supported per Expo Go build).
- **SDK 58** (`expo@^58.0.0`, RN 0.88). This replaced the earlier SDK 54 choice: at the end of Phase 1 the user's iPhone reported "installed version of Expo Go is 58.0.0, the project uses 54". The App Store build had moved to 58 (our earlier read of the docs said it stopped at 54), and iOS Expo Go cannot be downgraded. Teammates need an up-to-date Expo Go. SDK 58 changes made: removed `newArchEnabled` and `android.edgeToEdgeEnabled` from app.json (now default), `createStyles` no longer uses `StyleSheet.NamedStyles`. Never move to an SDK that forces a development build.
- Only Expo Go compatible packages (no custom native modules).

## Environment flags (app, in `app/.env`)
| Var | Meaning |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base URL (local LAN IP in dev, Render URL in prod) |
| `EXPO_PUBLIC_USE_MOCK` | `true` = run on mock store, no API calls |
| `EXPO_PUBLIC_DEMO` | `true` = show Demo tools on You screen |
These are inlined at bundle time: after changing `.env`, restart with `npx expo start -c`.
API env: `DATABASE_URL`, `JWT_SECRET`, `DEMO_MODE`, `CORS_ORIGINS`.

## Data layer (so mock and API stay interchangeable)
Screens never call `fetch` or the mock directly. They use hooks from `app/src/data/` (e.g. `useDuels()`, `useDuel(id)`, `checkIn(id)`), which go through one `DataSource` TypeScript interface with two implementations:
- `mockSource.ts` (Phase 3): in-memory store seeded with the day-5 demo duel; implements guest/register/login, create duel, accept by code, check-in, rest/pause/forfeit, rematch and the three demo actions. Eleanor and Tanish "auto-accept" and "check in" in code.
- `apiSource.ts` (Phase 5): same interface over the FastAPI client.
`src/data/index.ts` picks one from `EXPO_PUBLIC_USE_MOCK`. Both return the same response shapes (shared types in `src/data/types.ts`, mirrored by the API's Pydantic schemas). Rule: any new endpoint or field is added to the interface, the mock, and the API in the same change. A checklist item in every phase from 3 on: "app still works with `EXPO_PUBLIC_USE_MOCK=true`".

## Data model (Postgres)
- `users`: id, name, email (nullable, unique), password_hash (nullable), is_guest, is_seeded, created_at
- `duels`: id, hobby, goal_text (e.g. "20 min a day"), length_days (7), status (`pending`, `active`, `finished`), creator_id, opponent_id (nullable until accepted), invite_code, start_date, current_day (0 to 6, advanced by the real clock, or by Demo fast-forward via a stored `day_offset`), paused_until, created_at
- `checkins`: id, duel_id, user_id, day_index (0 to 6), created_at; unique (duel_id, user_id, day_index)
- `rest_days`: id, duel_id, user_id, day_index (max 2 per user per week)
- Score = number of check-in days. Winner = higher count after day 7. Rematch / Easier win / New rival = new `duels` row.

## API (FastAPI)
- `POST /auth/guest`, `POST /auth/register` (upgrades guest), `POST /auth/login`, `GET /me`
- `GET /users/on-dual` (for the friend picker: Eleanor, Tanish, ...)
- `POST /duels` (hobby, goal, friend user id or null), `GET /duels`, `GET /duels/{id}`, `GET /duels/by-code/{code}`, `POST /duels/{id}/accept`
- `POST /duels/{id}/checkin`, `/rest`, `/pause`, `/forfeit`, `/rematch`
- `POST /demo/advance-day`, `/demo/eleanor-checkin`, `/demo/reset` (only when `DEMO_MODE=true`)
- JWT bearer auth, bcrypt, `create_all` on startup, seed function for Eleanor and Tanish, CORS enabled (needed for Expo web).

## Phase 4 decisions (built)
- Users have string ids (`eleanor`, `tanish` are fixed seeded accounts; everyone else a random hex id). Guests are named "Ari" until they register.
- `Duel` gained `creator` and `viewerIsCreator` in the shared types: the invited friend looks at a duel by code from their own point of view, so Accept shows the challenger (left) and the invitee (right).
- Real accounts cannot accept their own challenge (the mock still allows it so a one-phone demo works).
- The day is stored on the duel and caught up with the clock on every read (`settle`); demo fast-forward adds a day offset.
- Check-ins carry `confirmed`: yours count on your own screen at once and on your friend's once they tap OK; day rollover confirms everything.
- Tests run on in-memory SQLite only; `api/check_db.py` smoke-checks Neon from `api/.env`.

## Screen-to-route map
Hobby `/` (Log in, I have a code) -> Friend `/friend` -> share -> Today. Code -> Accept `/accept` -> Today. Today "I did it" -> Done `/done` -> Save `/save` (guests only) or back. Today card -> Duel `/duel/[id]` -> Break `/break`, Result `/result/[id]`. Tabs: Today, Groups, "+" (Hobby flow), You (with Demo tools when enabled).

## Phases (each ends with phone test steps and a commit)

**Phase 0: Repo + docs.** `.gitignore`, `CLAUDE.md`, `design/` (spec + PNGs), `docs/PLAN.md`. Commit.

**Phase 1: App setup + theme.** Step 0: confirm Expo SDK with you (above). Then `create-expo-app` in `/app` (TypeScript, Expo Router), Inter fonts, `theme.ts` (light, shaped for a later dark theme), `useTheme`, `react-native-web` + `react-dom` for Expo web, base components (Button primary/outline/orange, Avatar, Dots, Card, Pill, BackButton, TabBar with raised "+"), a throwaway kitchen-sink route. Test: Expo Go (and browser) shows the components.

**Phase 2: Onboarding screens on local state.** Hobby, Friend (Eleanor/Tanish/Ben), Accept, Save. Test: walk the flow.

**Phase 3: Core screens + mock store.** Today, Duel, Done, Result, Break, Groups (static), You (with Demo tools), tab navigation, Lock image. Build the `DataSource` interface and `mockSource` with the day-5 seed; wire Phase 2 screens to it too. Test: whole demo works with `EXPO_PUBLIC_USE_MOCK=true` and `EXPO_PUBLIC_DEMO=true`, including fast-forward to Result.

**Phase 4: API + database.** I'll stop and give you step-by-step Neon setup (create project, copy connection string, add to `api/.env`) before this phase starts. Then FastAPI project, models, auth, duel + demo endpoints, seed, pytest (SQLite for tests). Test: Swagger at `/docs` on your PC.

**Phase 5: Connect app to API.** `apiSource`, token storage (`expo-secure-store` on phones, `localStorage` on web), real sign-up/log-in, challenge, accept by code, check-in, rest/pause/forfeit, rematch, demo actions. Mock mode must still pass the same walkthrough. Test: phone vs Expo web (or a teammate's phone) dueling for real against the local API.

**Phase 6: Deploy.** I'll give you step-by-step Render setup before this phase (web service from `/api`, env vars, free tier sleeps and takes ~50s to wake: open it before the demo). Set `EXPO_PUBLIC_API_URL`, `DEMO_MODE=true`, `CORS_ORIGINS`. Test on phone over mobile data.

**Phase 7: Demo polish.** README with run steps, demo-day checklist (wake Render, check `USE_MOCK` fallback), screen-by-screen comparison against the PNGs.

## Remaining open items
- Phase 1 step 0: your Expo Go SDK version(s) on iOS and Android.
- Tanish as a seeded real account (assumption above).
- Neon (before Phase 4) and Render (before Phase 6): I'll prompt you with steps.
