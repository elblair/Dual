# Graded demo script

The demo is graded on two things. This script makes both obvious in about five minutes.

1. **User registration:** a sign-up page that adds a new user to the database.
2. **Data rendering:** pages that retrieve and display data from the database.

## Before you start (once)

| What | How |
|---|---|
| Database | Neon project with the connection string in `api/.env`. `python check_db.py` prints `OK`. |
| API | Local: `cd api`, activate the venv, `uvicorn app.main:app --host 0.0.0.0` (needs `DEMO_MODE=true` in `api/.env`). Live: the Render URL (Phase 6). |
| App | `app/.env`: `EXPO_PUBLIC_API_URL=http://<your PC's LAN IP>:8000` (phone) or `http://localhost:8000` (Expo web), `EXPO_PUBLIC_USE_MOCK=false`, `EXPO_PUBLIC_DEMO=true`. Then `npx expo start -c`. |
| Neon console | In a second window open your project and go to **Tables** (left menu), then the `users` table. Keep it open. |
| Fresh start | Use a new email for the demo (the app refuses an email that already exists). If you are signed in, **You → Log out**. |

Check the badge on Today: it must say **Live · <host>** (green). If it says **Mock data**, `EXPO_PUBLIC_USE_MOCK` is still `true`.

## The script

### 1. Registration (requirement 1)
1. Open the app. The first screen (Hobby) shows **Log in** at the top and a **Create account** button at the bottom. Say: "Guests can start right away, but sign-up is one tap from the very first screen."
2. Tap **Create account**. Enter a name, an email and a password (6 or more characters). Show that a bad email or a short password is refused.
3. Tap **Create account**. The app calls `POST /auth/register`, saves the user to Neon and lands on **Today**, which says **Hey, <name>**, with the **Live · <host>** badge.
4. **Show the new row in Neon:** switch to the Neon console, **Tables → users**, click the refresh icon. The new row is at the top with the name, the email, `created_at`, and `password_hash` (a bcrypt hash, never the password). Optional SQL Editor version:
   ```sql
   select name, email, is_guest, created_at from users order by created_at desc limit 5;
   ```
5. Back in the app: **You → Demo tools → Database**. The same user is the first row (name, email, `created_at`; password hashes are never sent to the app).

### 2. Data rendering (requirement 2)
Every one of these is loaded from the API (and so from Neon), with a loading state, an error state and pull-to-refresh:
1. **Today:** the greeting, the check-in card, Eleanor's check-in waiting for your OK, and this week's progress (7 dots each).
2. Tap the Guitar card → **Duel:** score, dots, goal, rest days.
3. **Groups:** the ranking list ("Top in your duals") is computed from the database.
4. **You:** your duals, rivals, days checked in.
5. **You → Demo tools → Database:** the latest users and duels straight from the tables, newest first. On a phone, pull down to refresh; in the browser tap **Refresh**.
6. Tap **Fast-forward a day** on You, then look at Database again: the duel rows change (day number, score).

### 3. Edit a row in Neon and watch the app update
1. In Neon: **Tables → duels**, find the Guitar duel (hobby_id `guitar`), double-click its `minutes` cell, change `20` to `45`, save. (SQL Editor version: `update duels set minutes = 45 where hobby_id = 'guitar' and creator_id = (select id from users order by created_at desc limit 1);`)
2. In the app: pull down on **Today** (or tap **Refresh** on the Database screen). The card now says **Practice guitar 45 min** and Database shows **Guitar · 45 min a day**.

### 4. Log out and back in
1. **You → Log out.** You land on the first screen.
2. **Log in** with the same email and password. You are back on Today with the same data: the account really lives in the database.
3. Errors are clear: a wrong password says "Wrong password."; signing up with the same email says "That email already has an account."

### 5. Guests (nobody is called "Ari")
**Next: pick a friend → pick Ben → Send by text.** A first-name prompt appears (just a first name). Continue and the share sheet opens. The new guest is a row in `users` with `is_guest = true`.

### 6. If the server is down
- Stop the API: the badge turns **Offline · <host>** within ten seconds, and screens show "Can't reach the server" with **Try again**.
- Demo-day fallback: set `EXPO_PUBLIC_USE_MOCK=true`, restart with `npx expo start -c`. The badge says **Mock data · not the database**. Say so out loud: this fallback is not the database.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Badge says Offline | The API is not running or the URL is wrong. On a phone use the PC's LAN IP, not `localhost`. Check `http://<host>:8000/health`. |
| Badge says Mock data | `EXPO_PUBLIC_USE_MOCK` is `true` or `EXPO_PUBLIC_API_URL` is empty. Fix `app/.env`, restart with `-c`. |
| No Database row in the Demo tools | `EXPO_PUBLIC_DEMO` must be `true` and the API needs `DEMO_MODE=true`. |
| "That email already has an account" | Use a new email, or log in with it. |
| Render is slow on the first tap | The free tier sleeps. Open `https://<service>.onrender.com/health` a minute before the demo. |
| Neon refresh shows nothing new | Click the refresh icon in the Tables view; check you are on the right branch (`production`) and database. |

## Notes for the grader and for you
- `GET /demo/db` shows other users' emails to any signed-in user, so it exists only while `DEMO_MODE=true`. **Set `DEMO_MODE=false` after the demo.**
- Passwords are stored as bcrypt hashes and are never returned by any endpoint.
- Seeded friends Eleanor and Tanish are real rows in `users` (`is_seeded = true`).
