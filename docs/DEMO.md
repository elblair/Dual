# Graded demo script: two real people, two real phones

Everything on screen comes from the API and the Neon database. There is no seeded or sample data: a new account starts
with "No duels yet". The demo needs two phones (yours and a teammate's), or a phone plus a browser tab.

The two graded things:
1. **User registration:** a sign-up form that adds a new user to the database.
2. **Data rendering:** screens that load and show data from the database (and update after a refresh).

## Before the demo (once)

| What | How |
|---|---|
| Database | Neon project; `api/.env` has `DATABASE_URL` and `JWT_SECRET`. `python check_db.py` prints `OK` and `Users: ..., duels: ...`. |
| API | `cd api`, activate the venv, `uvicorn app.main:app --host 0.0.0.0`. Open `http://<your PC IP>:8000/health` from a phone browser to check. (Phase 6: the Render URL.) |
| App on both phones | `app/.env`: `EXPO_PUBLIC_API_URL=http://<your PC's LAN IP>:8000`, `EXPO_PUBLIC_USE_MOCK=false`. `cd app && npx expo start -c`. Both phones scan the QR in Expo Go (same Wi-Fi). |
| Neon console | A second window: your project, **Tables** (left menu). Keep `users`, `duels` and `checkins` handy. |
| Clean start | Use two new email addresses (an email that already exists is refused). To wipe test data: `python scripts/purge_seed_data.py` removes any old demo accounts; delete other rows in the Neon Tables view. |

On Today, the badge must say **Live · <host>** (green). If it says Offline or the app shows "Couldn't load this", the API URL is wrong or the server is not running. **There is no mock fallback unless you set `EXPO_PUBLIC_USE_MOCK=true` on purpose** (it is a single-user, nothing-saved mode and the badge says "Mock data").

## The script

### 1. Phone 1: register (graded item 1)
1. Open the app. The first screen shows **Log in** (top) and **Create account** (bottom).
2. Tap **Create account**. Enter a name, an email and a password (6+ characters). A bad email or a short password is refused.
3. Tap **Create account**. The app calls `POST /auth/register`, saves the user in Neon and lands on **Today**: **Hey, <name>**, the **Live** badge, and **No duels yet** with a **Start a duel** button.
4. **Show the new row in Neon:** console, **Tables → users**, refresh. The new row is on top: name, email, `created_at`, and `password_hash` (a bcrypt hash, never the password), `is_guest = false`.

### 2. Phone 2: register
Do the same with the teammate's name and email. Refresh `users` in Neon: now two rows.

### 3. Phone 1: start a duel and invite phone 2
1. **Start a duel**: pick a hobby, tap **Next: pick a friend**.
2. In **Find a friend on Dual** type the teammate's name or the start of their email. The real account appears (the email is masked). Tap it, then **Invite <name>**.
3. Today shows the duel under **This week** as "Waiting for <name> to accept."
4. Neon: **duels** has a new row (`status = pending`, `creator_id`, `opponent_id`, `invite_code`).

*Not on Dual yet?* Pick **Send by text** instead: the app creates the duel, gives you an invite code and opens the share sheet; the friend enters it under **I have a code**.

### 4. Phone 2: accept
1. Pull down on Today (or reopen the app). **Pending invites** shows "<name> invited you" with the hobby and goal. Tap **Accept**.
2. Today now shows the check-in card ("Practice guitar 20 min · vs <name> · not yet today") and the duel with 7 dots each.
3. Neon: the duel row is now `active`, with `started_at`.

### 5. Both phones: check in and confirm (graded item 2)
1. Phone 1: **I did it** → "Day 1 logged".
2. Phone 2: pull down on Today. It shows **Confirm <name>'s 20 min** with an **OK** button. Tap OK, then **I did it**.
3. Phone 1: pull down; confirm phone 2's check-in the same way. Both phones now show the same score and dots.
4. Show the **Duel** screen (tap the card), **Groups** (people you've dueled and the wins leaderboard) and **You** (duels won, days checked in, current streak): all computed from the database.
5. Neon: **checkins** has one row per check-in (`user_id`, `duel_id`, `day_index`, `confirmed`). Refresh and point at them.

### 6. Edit a row in Neon and watch the app change
In Neon: **duels**, double-click `minutes` on the duel (for example `20` → `45`), save. On either phone pull down on Today: the card now says **Practice guitar 45 min**.

### 7. Show the Result (only appears when a duel really ends)
A duel lasts 7 real days, so move it forward from your terminal (the app has no button for this):
```
cd api
.venv\Scripts\activate
python scripts/advance_duel.py --list                 # shows the latest duels with their invite codes
python scripts/advance_duel.py <invite code> 3        # move the duel forward 3 days
python scripts/advance_duel.py <invite code> 4        # 3 + 4 = 7 days: the duel ends
```
Pull down on both phones: Today shows "Guitar · finished" with the score; tap it for the **Result** (winner, dots, and three ways to start the next duel). **You** and **Groups** now count the win. The script needs the duel to be accepted, not paused, and not already over.

### 8. Log out and back in
**You → Log out** returns to the first screen. **Log in** with the same email and password: same data. A wrong password says "Wrong password."; registering an email that exists says "That email already has an account."

### 9. If the server is down
Stop the API: the badge turns **Offline** within ten seconds, the last data stays on screen, and a failed tap shows "Can't reach the server". Opening the app while it is down shows "Couldn't load this" with **Try again**.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "The app is not set up: EXPO_PUBLIC_API_URL is missing" | Set it in `app/.env`, restart with `npx expo start -c`. |
| "Can't reach the server (host)" | API not running, wrong IP (use the PC's LAN IP on a phone, not `localhost`), or Windows Firewall blocking Python on private networks. Test `http://<host>:8000/health` in the phone's browser. |
| The friend search finds no one | They must have an account (a guest has no email to find): they register first. Type at least 2 letters. |
| Pending invite doesn't show | Pull down on Today. Invites only go to the person you picked; for anyone else use the code. |
| "This invite is for someone else" | The invite was sent to a different account; send a new one or use **Send by text**. |
| Render is slow on the first tap | The free tier sleeps. Open `https://<service>.onrender.com/health` a minute before the demo. |

## Notes
- Passwords are stored as bcrypt hashes and no endpoint ever returns them.
- The friend search only returns accounts with an email, and shows the email masked.
- `api/scripts/advance_duel.py` and `api/scripts/purge_seed_data.py` are presenter tools run from a terminal; they are not part of the app.
