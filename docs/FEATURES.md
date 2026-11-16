# Feature gap analysis: Figma "Dual v2 · Improved" vs. the app today

Status: **proposal, nothing built.** Waiting for the team's OK on the recommendations at the end.

## How this was made
- Read from Figma (8 calls of the 200/day budget): the **Feedback checklist** frame (212:2), the **Base row** (21 frames, Welcome through Connect apps, y=0: names, layout and every text label from one page metadata dump), and **one Midnight frame** (Home, 213:228) for the dark-mode colors. The other 4 style rows and Claude's Pick were not read again (Claude's Pick is what the app already follows via `design/spec.md`).
- Compared with the code on `develop` after PR #13 (screens in `app/app/`, rules in `api/app/logic.py`).
- Nothing in the Base row has been looked at as a pixel screenshot yet. Before building any feature I will take 1 to 2 screenshots of its Base frame to check layout.

## Ground rules applied to every row
- **Hard rule:** everything on screen comes from the database. The Base frames are full of sample content (Eleanor, Tanish, "12-day streak", "$5 → charity", "FLR3-28", "412 min", "A VS E" avatars). None of that is copied: a feature is only recommended if it can be computed from real rows, and any text such as names or numbers is generated.
- **Team cut list:** no Dual+, no stranger matching, no in-app chat, no hardcoded/sample data. Earlier cuts that still stand unless the team reverses them: stakes/money, Strava/sync, XP, tiers, Apple/Google sign-in, lock-screen widget, Sunday recap sent as a message, accepting via web link.
- **Environment:** Expo Go SDK 58 (no custom native modules, no dev builds), Neon free Postgres, Render free web service, no paid services. Remote push notifications are not available in Expo Go on Android, and HealthKit/Health Connect/Garmin need native modules or paid/approved developer programs.
- **Four tabs only** (Today, Groups, "+", You). The Base row has five (Home, Explore, "+", Recap, Profile), so Explore and Recap would have to live inside the four tabs (cards or sub-screens), not as new tabs.

Legend: **Status** built / partly / missing. **Expo Go + free** = works in Expo Go and on free tiers with no paid service (yes / yes, with caveat / no). **Effort** S (about half a day), M (1 to 2 days), L (3+ days). **Risk** = risk to the working register -> duel -> accept -> check-in flow.

---

> **Update (after the team's answers):** a small real version of XP, Bronze/Silver/Gold tiers (one working perk: 3 rest days from Silver) and friendship levels (New rivals / Regulars / Ride or die) is being built, computed on read from existing data with the numbers in `api/app/progression.py`. Where the tables below say XP, tiers, ranks or levels are skipped or cut, this replaces them. Recap and Squad answers: recap is computed on open; Squad stays later. Starter plans, if built, live in a database table loaded from the API. Photos are out; minutes and a note replace them.

## 1. Base row, screen by screen

| # | Base frame | What the design shows | Status in the app | Expo Go + free | Effort | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | **Welcome** | Logo, "A VS E" avatars, tagline "Goals are better with a friend", "Get started" / "I already have an account", Terms line | Partly: Welcome has the logo, a tagline and Create account / Log in. No VS avatars (they are sample initials), no Terms line | yes | S | none | **Build (small polish)**: tagline and logo treatment only. Skip the "A VS E" art (hardcoded names) and the Terms line (no Terms page exists) |
| 2 | **Sign up** | 3-step wizard (Step 1 of 3), name/email/password, Apple, Google | Partly: one form (name, email, password), no wizard | Apple/Google: no (needs paid Apple developer account and OAuth setup) | n/a | none | **Skip** the wizard and Apple/Google (already cut). Keep the single form |
| 3 | **Interests** | Pick hobbies, "Auto-tracked" badges, "Not sure? Suggest something easy" | Missing (the Hobby picker exists, but only when starting a duel, and it is single-choice) | yes (a new `user_interests` table) | M | low (optional step after sign-up) | **Later.** Only worth it if Explore/starter plans are built (they use interests). Skip the "Auto-tracked" badge (needs Strava) |
| 4 | **Find friends** (onboarding step 3) | Sync contacts, "Dual people you already know", invite, "Invite 3 friends, get a month of Dual+", group code | Partly: the Friend screen searches real accounts by name/email and invites by text with a code | Contacts: yes in Expo Go (`expo-contacts`), but matching needs phone numbers or emails we do not store, and uploads a person's address book | M-L | medium (privacy, matching) | **Later / skip contacts.** Skip the Dual+ reward (cut). Group code goes with Squad (row 17) |
| 5 | **Home** | Streak card (flame, "12-day streak", week bubbles), confirm banner, "Your duals" cards (both avatars, bars, vibe chip, "2 days left", "Strava · auto", "$5 → charity" chips), "Your crew" row, "Weekly recap is ready" card | Partly: Today has check-in hero, confirm card, pending invites, dual cards with 7 dots each, tab bar. Missing: streak card, "days left" chip, crew row, recap card | yes (streak and days left are already computed by `/me/stats` and the duel clock) | S each | low | **Build**: streak card (real current streak and this week's days), "N days left" chip, "Your crew" row (people you've dueled, from `/groups`). Skip the Strava and money chips. Recap card only if Recap (row 16) is built |
| 6 | **Dual** | Hero, "Who's winning: You lead by 1", today's check-in, **How check-ins work** card, **Stake**, **Breaks**, **Recent check-ins** feed, "Take a break" | Partly: the Duel screen has the score, 7 dots per person, day X of 7, rules rows, break entry, "See the result" | yes | S-M | low (read-only) | **Build**: "You lead by N" line, "How check-ins work" card (microcopy), **Recent check-ins** feed from real check-ins (needs `created_at` and `confirmed` in the duel payload, a small API addition). Skip the Stake row |
| 7 | **Check-in** | "I practiced", duration stepper (– 20 min +), photo, note, "Log it" | Partly: **one tap** "I did it" (no minutes, no photo, no note) | Stepper and note: yes. Photo: Expo Go can pick an image (`expo-image-picker`), but there is **no free object storage** (storing images in Neon would eat the free 0.5 GB) | M | **medium: this is the core flow** | **Build the optional note and minutes**, behind the existing one tap (the tap stays the default; "Add details" is optional). **Skip photo** (storage). Keep tests for the one-tap path unchanged |
| 8 | **Confirm** | List of friends' check-ins with note and photo, "Looks good" / "Ask about it", "crew votes" on disputes | Partly: a confirm card on Today with OK (confirms the friend's latest check-in) | yes | S (screen), L (voting) | low (screen) / medium (voting) | **Build** a dedicated Confirm screen listing pending confirmations with the friend's note (needs the note feature from row 7). **Skip** crew voting: with two-person duels there is no crew. A simple "Ask about it" flag that the other player sees can come later |
| 9 | **Break** | Rest day, pause a week, forfeit, "Come back by Nov 22" | **Built** (this is the screen the app was matched to; stake wording dropped) | yes | n/a | n/a | Done |
| 10 | **Result** | "DUAL OVER", winner, "6 – 5 days", **"What you got out of it"** (minutes, XP, Friendship Lv, charity), Rematch / easier goal / next dual | Partly: winner, dots, Rematch, Easier win, New friend are built | yes | S | low | **Build** a "what you got out of it" block from real data only: days checked in, change vs your last duel, total minutes (needs minutes from row 7). **Skip** XP, Friendship Lv, charity |
| 11 | **Start: Friend** | Tabs Friends / My groups / Recent, level per friend, search, "Invite someone new" | Partly: search real accounts, invite by text | yes | S | low | **Build "Recent"** (people you have dueled, already in `/groups`). "My groups" with Squad. Skip levels (see checklist row 4) |
| 12 | **Start: Rules** | Hobby, goal text, **length (1 week / 2 weeks / 30 days)**, how you'll check in (friend / auto-sync / photo), **vibe** (Chill / Friendly / Fierce) | Partly: hobby and minutes on the Hobby screen; length fixed at 7 days by design | length: the API has `length_days` but the 7-dot progress rule and the 2 rest days are fixed by design | S (vibe), M (length) | medium (length touches dots, clock, rest days) | **Vibe: later (S, cosmetic, a column on `duels`).** **Length: skip** (conflicts with "7 dots per person"; Platinum perk only). **Auto-sync / photo: skip** |
| 13 | **Start: Stake** | $5 stake, charity choice, wallet | Missing (cut) | **No**: money needs a payment provider and real payouts | L | high | **Skip** (cut: no money, no stakes) |
| 14 | **Sent** | "Your dual is on its way", summary rows, "Back home", "Invite more" | Missing: after sending, the app goes straight to Today (the sent card shows the code) | yes | S | low | **Build**: a confirmation screen with the summary, the invite code (so it is visible, not only in the share sheet) and "Invite someone else" |
| 15 | **Explore** | Search, **starter plans**, "Your groups", "Friends from your contacts", "Easy comebacks" | Missing | yes, but the plan content is a fixed catalog | M | low (new screen) | **Later; needs a team decision** (is a fixed catalog of starter plans acceptable? the hobby catalog already is). Skip contacts. Not a fifth tab: a card on Today or the Hobby screen |
| 16 | **Recap** | Weekly numbers (days practiced, vs last week, streak), duals this week, "Coming up", "Start your next dual" | Missing (the "Sunday recap" was cut when it was sample content) | yes **if computed in the app on demand**. Not as a Sunday message: remote push does not work in Expo Go on Android, and there is no email service on the free tier | M | low (read-only) | **Build as an in-app screen** (computed from check-ins and duels; a card on Today or You links to it). Do not promise "sent every Sunday" |
| 17 | **Squad** | Group (floor vs floor), live rivalry minutes, group code, leaderboard | Partly: the Groups tab lists people you've dueled and a wins leaderboard | yes (new `groups` and `group_members` tables, join by code, no strangers) | L | medium (new tables, new join flow; the duel flow is untouched) | **Later (L).** Needs minutes per check-in (row 7) for the "412 min" style rivalry. Worth doing only if the demo needs "groups of all sizes" |
| 18 | **Profile** | Handle, duels won, streak, charity $, **rank + XP + perks**, **friendship levels**, connected apps, Dual+ | Partly: You has duels won, days checked in, current streak, log out | yes | S (display), M (perks) | low-medium (perks change rules) | **Build small**: show the real favorite hobbies (from your duels). **Skip** charity $, XP, Silver/Gold/Platinum and Dual+. Levels and perks: see checklist rows 4 and 5 |
| 19 | **Apps** (Settings) | Connected apps, money wallet, charity, **notifications** toggles, Log out | Missing (only Log out on You) | Notifications: **local** scheduled notifications work in Expo Go; remote push does not | M | low | **Build only a "Daily reminder"** (local notification at a time you pick; stored on the phone). Skip apps, money, charity. Verify `expo-notifications` local scheduling on SDK 58 in Expo Go before committing to it |
| 20 | **Dual+** | Paid insights, "Try 7 days free" fake-door | Missing (cut) | n/a | n/a | n/a | **Skip** (cut list) |
| 21 | **Connect apps** | Strava, Apple Health, Garmin, Fitbit, Duolingo, ... | Missing (cut) | **No**: HealthKit, Health Connect and Garmin need native modules or partner approval. Strava OAuth is free but needs a registered app, a redirect and a token store | L | high | **Skip.** The app already does what the footer says: "Your opponent confirms your check-ins instead" |

### Navigation
Base: Home / Explore / "+" / Recap / Profile (5). App: Today / Groups / "+" / You (4, per CLAUDE.md). Recommendation: keep four tabs. Recap and Explore become cards or sub-screens reached from Today and You. Do not add tabs.

---

## 2. Feedback checklist (frame 212:2), row by row

| # | Feedback (from) | Where Figma handles it | Status in the app | Expo Go + free | Effort | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | Will people quit after a week? (Jack, Rose, mentors) | Weekly recap, Result rematch + suggested next duals, streak card, rest days | Partly: Result rematch/easier/new friend and 2 rest days are built. Missing: streak card, recap | yes | S + M | low | **Build** streak card (Home) and the in-app Recap (rows 5, 16) |
| 2 | Keep the betting cap, keep it fun (Jack, mentors) | Start: Stake ($5 default, $20 cap, charity) | Cut by the team | **No** (money) | L | high | **Skip** |
| 3 | Duals of all sizes / groups (Jack, Rohan, Jordan) | Squad, Start: "My groups", Explore "Your groups" | Partly: Groups tab (people dueled + wins leaderboard) | yes | L | medium | **Later** (Squad, row 17) |
| 4 | Friendship levels (Jack) | Profile friendship levels, level per friend | Missing | yes (derive from duels done together) | S-M | low | **Later; team decision.** Without perks it is a cosmetic rank, which the business cut ("cosmetic-only ranks"). Only build together with checklist row 5 |
| 5 | Real perks for ranking up (Jack, Abbi, Rose) | Profile rank card: Silver extra pause day, Gold start rivalries, Platinum longer duals | Missing (XP and tiers cut) | yes (rules in `logic.py`) | M | medium (changes rest/pause rules) | **Skip for now.** "Longer duals" conflicts with the 7-day rule. Revisit only if the team reverses the XP/tier cut |
| 6 | Bring in friends, referral reward (Jack, adjustment 3) | Find friends (contacts, invite reward, group code), Explore contacts, Sent "invite more" | Partly: invite by text with a code, friend search | Contacts: caveats (row 4 above). Reward = Dual+ month (cut) | S (Sent screen) / L (contacts) | low / medium | **Build** "Invite more" on the Sent screen. **Skip** contacts and the reward |
| 7 | How is progress recorded honestly? (Declan, adjustment 2) | Check-in, Confirm (one-tap confirm, crew votes disputes), Connect apps, "How check-ins work" | Partly: **friend confirms** is built (the core honesty mechanism). No notes/photos, no disputes, no auto-sync | note: yes. photo: storage problem. votes: no crew. auto-sync: no | M | medium (core flow) | **Build** note + minutes, Confirm screen, and the "How check-ins work" card. **Skip** photo, crew votes, auto-sync |
| 8 | Looks flat / needs identity and consistency (Jack, Declan) | One component set, 5 styles, logo mark | **Built**: theme tokens, shared components, logo; one style (Claude's Pick) | yes | n/a | n/a | Done. Dark mode (section 3) adds the second look |
| 9 | More icons, profile pictures on dual cards (Abbi) | Interests + Explore icons, Home cards show both people | Partly: Lucide hobby icons and **both players shown on dual cards** are built. Avatars are initials, not photos | Photos: storage problem | n/a / M | low | **Skip profile photos** (storage). Keep initials avatars |
| 10 | White on light blue was hard to read (Abbi) | Automatic contrast pass in every style | Built for the palette in `theme.ts` (from Figma); not formally audited | yes | S | none | **Build a quick contrast check** while doing dark mode (white-on-blue `#4a6286`, orange on dark) |
| 11 | Pause / break / forfeit (Abbi, Maya) | Break screen, Dual "Take a break" | **Built** | yes | n/a | n/a | Done |
| 12 | Friend accountability, not betting; friendly default (adj. 1, Maya, Nina) | Welcome copy, Rules "Friendly default", stake optional | **Built** in spirit: no stakes at all. "Vibe" chips (Chill/Friendly/Fierce) are not | yes | S | low | **Vibe: later** (row 12) |
| 13 | Launch with auto-tracked hobbies (adjustment 2) | Interests badges, Connect apps, Strava running dual | Missing (cut) | **No** | L | high | **Skip** |
| 14 | Paid tier = insights ~$3/mo (adj. 4, Jordan, Rohan) | Dual+ screen, fake-door test | Cut | n/a | n/a | n/a | **Skip** (cut list) |
| 15 | Track "started a second dual" (adjustment 6) | Recap + Result push into the next dual | Partly: Result pushes to the next duel. No measurement | yes | S | none | **Build as a presenter script**, not a tracker: `api/scripts/metrics.py` prints, from the database, how many users started a second duel (and rematches, accepted invites, check-ins per duel). Real data, no analytics service |
| 16 | Cut: stranger matching, chat, cosmetic ranks, big stakes (business) | No Messages tab, Recap replaces chat, $5 default | **Respected**: none of these exist | n/a | n/a | n/a | Keep cut |
| 17 | Beginners don't know where to start (mentor) | Explore starter plans, Interests "suggest something easy", "easy comebacks" | Partly: Result "Easier win" (half the minutes) is built | yes (fixed catalog) | M | low | **Later** with Explore (row 15). Needs the catalog decision |

---

## 3. Dark mode ("Midnight"), the only style row read

The theme is already prepared for it (`theme.ts` is typed for a second palette picked with `useColorScheme`). Colors read from the Midnight Home frame (Figma has no color variables, so these are the fills used on the frame):

| Token (purpose) | Midnight | Notes |
|---|---|---|
| Background | `#0b0b10` | page |
| Card / surface | `#17171f` | with border `#2a2a35` |
| Tab bar | `#15151c` | top border `#2a2a35` |
| Chip / secondary surface | `#23232e` | |
| Progress track | `#2a2a35` | |
| Text | `#f2f2f5` | |
| Muted text | `#9b9ba8` | |
| Brand card (streak) | `#8e1730` | |
| Maroon bright (opponent) | `#a8203a` | same as light |
| You / blue | `#4a6286` | same as light; link text `#9db4d6` |
| Orange | `#f28c38` | same as light ("do this now") |
| Orange tint (confirm banner) | `#2a1e16` | |
| Success text / tint | `#5bc98a` / `#14291d` | |
| Inner pill on the brand card | `#1c1c25` | |
| Neutral avatar | `#8a8a96` | |

Status: missing. Expo Go: yes (`useColorScheme`, `expo-system-ui` already installed). Effort: **S-M** (map about 15 colors to the existing tokens, audit for hardcoded white/black, check every screen in Chrome in dark). Risk: low (colors only). Recommendation: **Build.** Needs a screenshot of the Midnight Home and one more frame to confirm the mapping before coding.

---

## 4. Recommendations, in a suggested order

Each item is **one `feature/` branch and one PR into `develop`**, with tests and `tsc` clean, checked in Chrome against its Figma frame, and the register -> duel -> accept -> check-in flow re-run after every merge.

**Build (proposed)**
1. `feature/dark-mode`: Midnight palette, contrast pass. S-M, no data, no risk.
2. `feature/home-streak-crew`: Today streak card, "N days left" chip, "Your crew" row, "Recent" in the friend picker. S, read-only (data already in `/me/stats` and `/groups`).
3. `feature/duel-details`: "You lead by N", "How check-ins work" card, Recent check-ins feed (adds `createdAt` to the check-in payload). S-M.
4. `feature/sent-screen`: "Your dual is on its way" with the visible invite code and "Invite someone else". S.
5. `feature/checkin-note-minutes`: optional minutes and note on a check-in (columns on `checkins`), the friend's note on the Confirm card, then a dedicated Confirm screen. M, **medium risk**: the one-tap check-in stays the default and keeps its tests.
6. `feature/result-recap`: "What you got out of it" on Result and an in-app weekly Recap card/screen, both computed (needs 5 for minutes). M.
7. `feature/daily-reminder`: local daily notification. S-M, after verifying `expo-notifications` local scheduling works in Expo Go 58.
8. `chore/metrics-script`: `api/scripts/metrics.py` ("started a second duel"). S.

**Later (need a team decision or depend on the above)**: Interests + Explore starter plans (catalog decision), Squad / group rivalry with group codes (L), vibe chip, friendship levels (only with perks), profile favorite hobbies.

**Skip**: Dual+, stakes/charity/wallet, Strava and every app/watch integration, Apple/Google sign-in, photos and profile pictures (no free storage), contacts sync, crew voting, longer/30-day duels, XP and tiers (unless the cut is reversed), stranger matching, in-app chat, remote push and "sent every Sunday".

## 5. Questions for the team
1. Is a fixed catalog of starter plans and "easy comebacks" acceptable under "no hardcoded data" (like the hobby catalog), or must Explore wait?
2. Do XP, tiers and friendship levels stay cut? (The checklist asks for real perks; the business cut cosmetic ranks. Perks would change the 2 rest days / 7-day rules.)
3. Is a Recap that is computed when you open it (no Sunday message) enough?
4. Are groups (Squad) needed for the demo, or is the current Groups tab enough?
5. OK to keep photos out (no free storage), with notes and minutes instead?

## 6. What I will not do without an OK
Build anything on this list. After you reply with the items to build (and answers to section 5), I'll start with the first branch.

## 7. Build status (updated after the team's answers)

| Item | Status | PR |
|---|---|---|
| a. Dark mode (Midnight) + Appearance setting | built | #15 |
| b. Home additions (streak card, days left, crew row, recent friends) | built | #16 |
| XP, tiers (one working perk) and friendship levels, computed on read | built | #17 |
| c. Duel page additions (lead pill, how check-ins work, recent check-ins) | built | #18 |
| d. Sent screen | built | #19 |
| f. Weekly recap (computed on open) | built | #20 |
| e. Minutes + note on a check-in, Confirm screen (one tap stays the default) | built | #21 |
| g. Daily reminder (local notification) | **not built**: see below | n/a |
| h. "Started a second duel" measurement | done as a doc: `docs/METRICS.md` (SQL, no tracker) | this PR |

**Why g was not built.** The rule was to build it only if local notifications could be verified in Expo Go on both iOS and Android. The Expo docs for SDK 58 say local notifications remain available in Expo Go and list a daily trigger for both platforms, but that is documentation, not a test: it could not be run on real devices here, Android Expo Go has an `expo-notifications` limitation for remote push (a warning at import is possible), exact timing on Android 12+ needs an alarm permission (otherwise approximate), and Android 13+ needs a notification channel before the permission prompt appears. It can be built (about half a day) once someone tests a scheduled notification on an iPhone and an Android phone in Expo Go.
