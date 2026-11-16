# Dual design spec (exact values from Figma)

Source: https://www.figma.com/design/fwmURCNVOUlAAJfknpGhDS/Dual-%E2%80%93-App-Prototype
Page "Dual v2 · Improved", row "Claude's Pick" (frames 215:30 to 217:407) plus Break from the Base row (196:212).
Style: Base light now; Midnight dark later (same token names, different values). Every value below was read from Figma
(design context + the dot SVGs). `app/src/theme/theme.ts` mirrors this file. PNG exports in `design/png/` are for looking
only (mostly 2x; Duel.png and Done.png are 1x); when a PNG and this file disagree, this file wins.

Frame size 390 x ~844. Default screen padding: 22 sides, 60 top (about safe-area top + 12), 30 bottom. Gap between blocks: 14 on
Friend, Accept, Done, Result, Save; 16 on Hobby, Today, Duel, Groups, You (Break: see its section).

## Notes (215:3): "What I'd change, and why"

All 5 styles look different but work the same way. This row changes how the app works.

1. **Show value before sign-up.** You pick a hobby and challenge a friend first. The account comes after your first check-in, when you have a streak to save. Every screen before value is a place people drop off.
2. **The invited friend is the growth engine.** Every dual recruits someone. They accept from a text link in their browser, with no download, so the second person isn't lost at the App Store.
3. **Home becomes "Today".** It only shows what to do today: check in with one tap, confirm your friend inline. No feed, no streak + bars + rings competing for attention.
4. **Check in without opening the app.** A lock-screen widget and a notification you can act on. Mentor note: "if people have to go to another app, you lose."
5. **One way to show who's winning.** Seven daily dots per person. Everyone gets it in one glance, and it works in every style.
6. **Four tabs, not five.** Today · Groups · + · You. The weekly recap arrives as a Sunday card, and starter plans live in the + flow.
7. **Every ending is a beginning.** The Result screen always offers 3 next duals. "Started a second dual" is the number to track.
8. **Style: Base light + Midnight dark mode.** Ship one design system. Maroon is the brand, orange means "do this now". Let the phone switch between light and dark.

(The notes frame itself is documentation, not an app screen: bg `#15151c`, cards `#23232e`.)

## Tokens (Base light)

### Colors
| Token | Hex | Used for |
|---|---|---|
| ink | `#15151c` | primary text, logo bar |
| muted | `#6b6b78` | secondary text, radio outline |
| mutedSoft | `#8a8a96` | neutral avatar (Ben) |
| bg | `#ffffff` | screen background |
| surface | `#f5f4f7` | cards, back button, tiles, Accept screen bg |
| surfaceStrong | `#eae9ee` | pills (Copy), icon circles (Result), "See how it ends" button |
| border | `#e4e3e9` | outlined cards, tab bar top border |
| dotEmpty | `#e4e3e9` | empty progress dot |
| maroon | `#6e1023` | primary button, selected radio/check, selected border, active tab |
| maroonBright | `#a8203a` | opponent avatar + dots, "behind" score, Forfeit text |
| maroonTint | `#f7eff1` | selected row background |
| orange | `#f28c38` | "do this now": check-in button, "+" button, VS, today ring |
| orangeDark | `#c4651a` | eyebrow labels |
| orangeTint | `#fdf1e7` | starter goal, Sunday recap, streak card, flame tile |
| blue | `#4a6286` | "you" avatar + dots, link text, Groups hero card |
| blueTint | `#edf1f7` | highlighted leaderboard row |
| success | `#2e9e5b` | check circle, leading/tied score |
| successTint | `#e6f4ec` | Strava card, check badges |
| overlayLight | `rgba(255,255,255,0.16)` | icon tile and camera button on maroon |
| overlayTrack | `rgba(255,255,255,0.2)` | progress track on slate |
| onDarkMuted | `rgba(255,255,255,0.8)` | secondary text on maroon / slate |
| onDarkSubtle | `rgba(255,255,255,0.85)` | footnote on slate |

### Typography (Inter: Regular 400, Medium 500, SemiBold 600, Bold 700)
| Variant | Size / weight | Where |
|---|---|---|
| eyebrow | 11 Bold, letterSpacing 0.66, uppercase | "STEP 1 OF 2", "SUNDAY, NOV 15", "DUAL OVER · GUITAR" |
| score | 48 Bold | Duel "5 – 4" |
| display | 32 Bold | Today, Groups, You titles |
| titleLg | 30 Bold | Day 5 logged, Eleanor won, Save your streak |
| title | 28 Bold | Hobby, Friend, Accept titles |
| headingLg | 22 Bold | Groups hero title, stat numbers |
| heading | 20 Bold | profile name "Ari" |
| headingSm | 17 Bold | hero card title, "What's next?", "Silver" |
| headerTitle | 17 SemiBold | Duel header "Guitar" |
| subheading | 18 SemiBold | Break header "Need a break?" |
| cardTitle | 16 Bold | dual card title/score, "Save your streak" card title, starter goal value |
| body | 15 Regular | paragraphs, subtitles under big titles |
| bodyStrong | 15 SemiBold | row names, "2 things to do", option titles |
| label | 14 SemiBold | section labels, "Back to Today", settings rows |
| labelMedium | 14 Medium | "Log in", Duel info values |
| subtitle | 14 Regular | Friend subtitle, perk text |
| smallStrong | 13 SemiBold | button labels on pills, hobby tiles, leaderboard values |
| smallMedium | 13 Medium | names in dot rows, break buttons, Forfeit link |
| small | 13 Regular | detail rows, hero sub text |
| captionStrong | 12 SemiBold | "Starter goal" label |
| caption | 12 Regular | row subtitles, footnotes |
| microStrong | 11 SemiBold | active tab label |
| microMedium | 11 Medium | inactive tab label |
| micro | 11 Regular | stat labels, footnotes |
| tiny | 10 Regular | weekday letters under dots |
| button | 16 SemiBold | all full-width buttons |

Avatar initial = 0.375 x avatar size, SemiBold white (e.g. 15 on 40, 27 on 72).

### Spacing (pt, raw Figma values)
2 (hairline), 4 (xs), 6, 8 (sm), 9, 10 (md), 12 (lg), 13, 14 (xl), 16 (xxl), 18, 20 (xxxl), 22 (gutter), 28, 30.
Tab bar: padding top 10, bottom 28 (at least; safe area if larger).

### Radii
2 (logo bars sm, 4 for lg bars), 12 (leaderboard row, chip), 14 (stat tile, Friend row, break buttons), 16 (buttons, option rows, hobby tiles, small cards), 18 (cards), 22 (Today hero card, Groups hero card), 24 (Duel score card), 999 (pills, URL chip). Circles = size / 2. Break screen button: 14.

### Borders
1 (outlined cards, tab bar top), 1.5 (selected card, radio outline), 2 ("today" dot ring), 3 (avatar ring: orange on Duel and You, white on Accept).

### Sizes
- Avatars: 24 (dot rows on Today), 26 (Done, Result), 32 (leaderboard), 40 (rows, back button), 42 (Today header), 56 (Duel), 64 (You), 72 (Accept, 3pt white border), 92 (Break).
- Dots: 14pt diameter, 6pt gap (20pt pitch, row 134pt wide) on Today, Done, Result; 18pt diameter, 6pt gap (row 162pt wide) on Duel. Done = filled (you `#4a6286`, opponent `#a8203a`), empty = `#e4e3e9`, today = hollow ring 2pt `#f28c38` (outer diameter stays 14). Name label next to dots: 13 Medium, 62pt wide, 10pt gap to dots.
- Icons: 13 (check badge), 14 (lock), 15 (copy), 16 (break buttons, chevron in You), 18 (default; chevrons, button icons), 19 (back, settings), 20 (camera, recap spark, trophy), 22 (hobby tiles, hero, tab bar, option rows), 26 (plus), 30 (flame), 52 (Done check).
- Radio 22 (r11, 1.5pt `#6b6b78` outline; checked = filled maroon with 13 white check). Plus button 52 (r26, orange). Icon tile 44 (r14). Camera button 54 (r16). Success badge 104 (r52). Flame tile 64 (r20).
- Logo: sm = bars 4 x 14 (r2, gap 2), text 14 Bold, gap 4. lg = bars 7 x 22 (r4, gap 3), text 22 Bold, gap 7.
- Back button 40 circle, `surface`, 19 chevron-left.

## Screens

### Hobby (215:30)
Gap 16. Header row (space-between): logo lg and link "Log in" (14 Medium, blue). Eyebrow "STEP 1 OF 2 · NO ACCOUNT NEEDED". Title "What do you want to get better at?" (28 Bold). Grid of 9 tiles, 106pt wide, gap 10 (3 across), padding 6 x 14, radius 16, icon 22 above label (13 SemiBold) with gap 8: Guitar (music), Running (pulse/activity), Spanish (globe), Gym (dumbbell), Reading (book), Drawing (palette), Cooking (utensils), Coding (code), Meditation (leaf). Selected (Guitar) = maroon fill, white content. Unselected = `surface`, ink. Starter goal card: `orangeTint`, r16, padding 16 x 14, gap 12: spark icon 22, text column (gap 2: "Starter goal" 12 SemiBold orangeDark; "20 minutes a day for 7 days" 16 Bold ink), edit (pencil) icon 18. Spacer. Button "Next: pick a friend" (primary, links to Friend).

### Friend (215:98)
Gap 14. Header row (gap 12): back button + eyebrow "STEP 2 OF 2". Title "Who'll keep you honest?" (28 Bold). Subtitle "Pick someone who'd actually notice if you skipped." (14 muted). Contact list (gap 2); row = padding 12 x 10, radius 14, gap 12, avatar 40, text (name 15 SemiBold, sub 12 muted, gap 2), radio 22:
- Eleanor (`#a8203a`), "In your contacts · not on Dual yet". SELECTED: row bg `maroonTint`, filled maroon radio with white check.
- Tanish (`#4a6286`), "On Dual · runs 3× a week".
- Ben (`#8a8a96`), "In your contacts".
Label "Your text will say" (13 SemiBold muted). Bubble: `surface`, r18, padding 16 x 14, gap 8; text 15 ink: "I'm practicing guitar 20 min a day this week. Dual me so I don't quit? 🎸" in curly quotes; inside a white chip (r12, padding 12 x 10, gap 10) with logo sm and "dual.link/k3x9" (12 muted). In our app the chip shows the real invite code instead. Stake card ("Add a $5 stake", toggle): OUT OF SCOPE, dropped. Spacer. Button "Send by text" (primary, msg icon 18, gap 8).

### Accept (215:152)
Bg `surface`. Gap 14, items centered. URL pill (white, r999, lock icon + "dual.link/k3x9") and eyebrow "WHAT ELEANOR SEES · IN HER BROWSER": browser framing, DROPPED. Spacer. Avatars row (gap 14): A (`#4a6286`, 72, 3pt white border), "VS" (18 Bold orange), E (`#a8203a`, 72, 3pt white border). Title "Ari challenged you" (28 Bold, centered). Detail card: white, r18, 4 rows padding 16 x 13, space-between, 13pt: label Regular muted, value SemiBold ink: Hobby "Guitar · 20 min a day"; Length "7 days, starts tomorrow"; Check-ins "One tap · you confirm each other"; Stake "None". Spacer. Button "Accept · no download needed" (primary; links to Today). Footnote "Check in from your texts this week. Get the app whenever you want." (12 muted, centered).

### Today (215:185)
Gap 16, scrollable above the tab bar. Header (space-between): column (gap 2) eyebrow "SUNDAY, NOV 15" (11 Bold muted, 0.66) and "Today" (display 32 Bold); avatar "A" 42 (`#4a6286`, initial 16 SemiBold; links to You). "2 things to do" (15 SemiBold muted).
- Hero card: maroon, r22, padding 18, gap 14. Row (gap 12): icon tile 44 (r14, overlayLight) with music icon 22; text gap 2: "Practice guitar 20 min" (17 Bold white), "vs Eleanor · she's done today" (13, onDarkMuted). Row (gap 10): orange button flex 1 "I did it" (check 18, 16 SemiBold ink, padding 20 x 16, r16; links to Done) and camera button 54 (r16, overlayLight, camera icon 20).
- Confirm card (FAKE): `surface`, r18, padding 16 x 14, gap 12: avatar E 40, text (15 SemiBold "Confirm Eleanor's 25 min", 12 muted “Finally nailed the F chord”), OK pill (maroon, padding 16 x 9, 13 SemiBold white).
- Strava card (FAKE): `successTint`, r18, padding 16 x 14, gap 12: shield-check icon 22, text (15 SemiBold "Running vs Tanish · done", 12 muted "3.2 mi synced from Strava at 7:10 AM").
- "This week" (15 SemiBold muted).
- Dual card x2 (tap opens Duel): outline 1pt border, r18, padding 16, gap 10. Title row (space-between): hobby (16 Bold ink) and score (16 Bold; success `#2e9e5b` when tied or ahead, maroonBright `#a8203a` when behind). Two rows (gap 10): avatar 24 (initial 9), name (13 Medium, 62 wide), dots 14. Guitar: "4 – 4", You 4 done + today ring + 2 empty, Eleanor 4 done + 3 empty. Running: "5 – 6", You 5 done + today ring + 1 empty (A blue), Tanish 6 done + 1 empty (T avatar blue, dots maroonBright).
- Sunday recap (FAKE): `orangeTint`, r18, padding 16 x 14, gap 12: spark 20; text (14 SemiBold "Sunday recap", 12 muted "5 days practiced, up from 3. See how last week ended."), chevron 18.
Tab bar: Today active.

### Done (217:2)
Gap 14, items centered, spacer above and below. Success circle 104 (`#2e9e5b`, r52) with white check 52. "Day 5 logged" (30 Bold). "Eleanor gets a tap to confirm it. You're tied 5 – 5." (15 muted, centered). Card `surface`, r18, padding 18 x 16, gap 10: two dot rows (avatar 26, initial 10; name 13 Medium; dots 14). Card `orangeTint`, r18, padding 18 x 16, gap 10 (only shown to guests): "Save your streak" (16 Bold), "You're 1 day in. Make an account so you don't lose it. 20 seconds." (13 muted), orange button "Create account" (links to Save). Spacer. Link "Back to Today" (14 SemiBold blue).

### Duel (217:79)
Gap 16. Header (space-between): back button, "Guitar" (17 SemiBold), settings icon button 40 (`surface`, gear icon 19; skipped until Midnight/settings exist). Score card: `surface`, r24, padding 20 x 22, gap 16, centered: eyebrow "DAY 5 OF 7 · FRIENDLY" (muted); row (gap 22): column (gap 6) avatar 56 (`#4a6286`, orange 3pt ring, initial 21) + "You" (13 SemiBold), score "5 – 4" (48 Bold), column avatar E 56 + "Eleanor". Dots column (gap 8): two rows of 18pt dots (162 wide) then weekday letters M T W T F S S (10 muted, gap 15). Info card: outline 1pt, r18, three rows (padding 16 x 13, gap 12, icon 18): Goal "20 min a day · ends Saturday" (music), Check-ins "You confirm each other · crew votes on disputes" (users), Stake "None · add one next dual" (heart; stake copy dropped in our app); label 12 muted, value 14 Medium, gap 1. "Need a break?" (14 SemiBold muted). Row (gap 8) of two buttons flex 1: `surface`, r14, padding 10 x 12, icon 16 + 13 Medium: "Rest day · 2 left" (calendar), "Pause 1 week" (pause). "Forfeit" (13 Medium, maroonBright). Spacer. Button "See how it ends (Saturday)" (`surfaceStrong` bg, ink text; links to Result).

### Result (217:166)
Gap 14. Header block (gap 6, centered, padding 10 vertical): eyebrow "DUAL OVER · GUITAR" (orangeDark), "Eleanor won, 6 – 5" (30 Bold), "You practiced 5 days, up from 3 last time." (15 muted). Card `surface`, r18, padding 18 x 16, gap 10: two dot rows (avatar 26) and row (gap 10): badge 22 (`successTint`, r11, check 13 success) + "+60 XP · Friendship Lv 3 with Eleanor" (14 Regular; FAKE). "What's next?" (17 Bold). Three option rows (padding 16 x 14, r16, gap 12): circle 40 + text (15 SemiBold; 12 muted; gap 1) + chevron 18:
- Rematch "Same goal, 7 days": SELECTED = `maroonTint` bg, 1.5pt maroon border, circle maroon with white refresh icon 19.
- Easier win "4 of 7 days, 15 min": `surface`, circle `surfaceStrong` with trophy 19.
- New rival "Dual Tanish at running": `surface`, circle `surfaceStrong` with users 19 (links to Friend).
Spacer. Button "Send rematch". Footnote "We track one number: did you start a second dual?" (11 muted, centered).

### Groups (217:239) (FAKE, static)
Gap 16. "Groups" (display 32). Hero card: blue `#4a6286`, r22, padding 18, gap 12: row (space-between) "LIVE · ENDS SUNDAY" (11 Bold white, 0.66) and "Floor 3" (12, onDarkMuted); "Floor 3 vs Floor 4" (22 Bold white); two bar rows (gap 10): label 13 Medium white (64 wide), track 170 x 10 (r5, overlayTrack) with fill (Floor 3: orange, 82% = 139.4; Floor 4: white, 77% = 130.9), value 13 SemiBold white ("412 min", "388 min"); footnote "You added 95 min · 2nd on your floor" (13, onDarkSubtle). "Top on Floor 3 this week" (14 SemiBold muted). Leaderboard (gap 2), rows padding 12 x 10, r12, gap 12: rank (13 Bold muted), avatar 32 (initial 12), name (14 SemiBold, flex 1), value (13 SemiBold). Eleanor 140 min, You 95 min (row bg `blueTint`), Tanish 72 min. Card `surface`, r16, padding 16 x 14, gap 12: "Invite your floor" (14 SemiBold) / "Code FLR3-28" (12 muted), pill "Copy" (`surfaceStrong`, padding 16 x 9, copy icon 15, 13 SemiBold). Outline card r16: "CU Run Club" / "8 members · Saturday long run", chevron 18. Button "Dual a floor-mate" (links to Friend). Tab bar: Groups active.

### You (217:314)
Gap 16. Header (space-between): "You" (display 32), settings icon button 40 (skip for now). Profile row (gap 14): avatar 64 (maroon `#6e1023`, 3pt orange ring, initial 24); name "Ari" (20 Bold), "Guitar · Running · Spanish" (13 muted), gap 2. Stat tiles row (gap 10), each flex 1, `surface`, r14, padding 8 x 14, centered, gap 2: value 22 Bold, label 11 muted: "8 duals won", "5 second duals", "$10 to charity" (stake related: replace with "days checked in"). Silver card (FAKE): outline, r18, padding 16, gap 10: row trophy 20 + "Silver" (17 Bold) / "2 wins to Gold" (12 muted); perk rows (badge 22 + 14 text): "Silver perk: 1 extra rest day every month" (successTint badge, check) and "Gold perk: start your own group rivalries" (`surfaceStrong` badge, check). "Your rivals" (14 SemiBold muted). Rival rows (gap 12): avatar 40; "Eleanor" (15 SemiBold) / "Friendship Lv 3 · 3 duals · 1 – 2" (12 muted); "Tanish" / "Friendship Lv 1 · 1 dual · live". Card `surface`, r18, two rows (padding 16 x 14, gap 12, icon 18): shield-check "Connected apps / Strava, Apple Watch" (14 SemiBold / 12 muted, chevron 16; FAKE); spark "Dual+ · $3/mo / Trends and personal bests" (DROPPED, out of scope). Demo tools card goes here when `EXPO_PUBLIC_DEMO=true` (not in Figma; our own styling from tokens). Tab bar: You active.

### Save (217:407)
Gap 14. Back button (links to Done). Flame tile 64 (`orangeTint`, r20) with flame icon 30 (orange). "Save your streak" (30 Bold). "You've already started. Create an account so your dual with Eleanor is safe." (15 muted). Spacer. Buttons: "Continue with Apple" (primary maroon), "Continue with Google" (outline 1pt `border`, ink text), "Use email" (outline, mail icon 18, gap 8). Apple and Google show "coming soon"; email is the real sign-up. Footnote "We ask for an account only after your first check-in." (11 muted, centered).

### Break (Base row, 196:212)
Uses its own metrics: padding 20 sides, 56 top, 28 bottom, gap 18, items centered. Header (gap 12): back button 40 (Base value `#e9e8ee`; we use `surfaceStrong` `#eae9ee`) + "Need a break?" (18 SemiBold). Avatar A 92 (`#4a6286`, initial 35). "Life happens. Pick what fits, and your progress stays safe." (15 muted, centered). Three option cards (padding 14, r16, gap 12, items start, icon 22, text gap 3: title 15 SemiBold, sub 12 muted):
- Rest day (calendar): "2 left this week · your streak stays alive". SELECTED: 1.5pt maroon border, tint bg, radio filled maroon with white check 13.
- Pause for a week (pause): "The dual freezes for both of you. Come back by Nov 22 and nothing is lost." Unselected: `surface`, radio outline.
- Forfeit (flag, title in maroonBright): "Wave the white flag. Eleanor wins, your stake goes to charity." (our copy drops "your stake goes to charity").
Spacer. Button maroon "Take a rest day" (label follows the selection; padding 20 x 15, radius 14). Footnote "Eleanor will see that you're resting." (12 muted).
Base-row values that differ by about 1 level from the Claude's Pick tokens and are NOT added as separate tokens: card bg `#f4f3f6` (we use `surface` `#f5f4f7`), selected tint `#f6eef0` (we use `maroonTint` `#f7eff1`), back button `#e9e8ee` (we use `surfaceStrong`).

### Lock screen (217:42)
Static image only: `design/png/Lock.png`. Dark gradient, 8:41 clock, widget "5 – 5 / Done today", notification "Eleanor practiced 25 min / Looks good · Ask", Strava line.

### Tab bar (Today, Groups, You frames)
White, 1pt top border `border`, padding 10 top / 28 bottom, items centered: Today (home), Groups (users), "+" (52pt orange circle, plus icon 26, in line with the others, links to Hobby), You (user). Icon 22, label 11 (active SemiBold maroon `#6e1023`, inactive Medium muted `#6b6b78`), gap 4.

## Implementation notes (deliberate differences from the frames)
All sample content in the frames is replaced by real data from the API; the frames show layout and style only.
- Today: no Strava card, no Sunday recap, no camera button; "Hey, <name> · N things to do"; a "Pending invites" section; "No duels yet" empty state; "vs <name> · done today" (no gendered pronouns).
- Friend: a search field and real results (masked email) instead of the fixed contacts list; no stake card; the invite text preview says the code is added when you send.
- Accept: no browser chrome and no "Stake" row; length reads "7 days, starts when you accept".
- Duel: weekday letters and "ends <weekday>" computed from the real start date; no stake row, no "crew votes on disputes", no settings gear, no "See how it ends" (the Result button appears only for a finished duel).
- Result: no XP or friendship line, no "up from 3 last time", no fixed rival; options are Rematch, Easier win (half the minutes) and New friend.
- Groups: rebuilt on real data (wins leaderboard and people you've dueled); the floor battle, invite floor, run club and "Dual a floor-mate" are gone.
- You: stats are duels won, days checked in and current streak; no tier card, no rivals list, no connected-apps or lock-screen rows, no Dual+.
- Save ("Save your streak") was dropped: there are no guest accounts, so everyone signs up on Welcome first. No Apple/Google buttons.
- Icons are Lucide, so a few glyphs differ slightly from Figma's.
- Not in Figma, built from tokens: Welcome (`/welcome`), code entry (`/code`, after login), email form (`/auth`), the friend search, loading/error states, the Live / Offline badge, and the account card on You.

## Navigation
Hobby -> Friend -> (Send by text) -> Accept -> (Accept) -> Today. Today: "I did it" -> Done -> Save (or Back to Today); dual card -> Duel -> Break / Result; Sunday recap -> Result. Tabs: Today, Groups, "+" (Hobby flow), You. Result: Rematch/Easier win -> Today, New rival -> Friend.

## Icons
Figma icons look like Lucide: music, activity (pulse), globe, dumbbell, book-open, palette, utensils, code, leaf, sparkles (spark), pencil (edit), camera, shield-check, flame, mail, calendar, pause, flag, trophy, users, heart, house, user, copy, chevron-right, chevron-left, check, refresh-cw, settings, plus, message-square, lock. We use `lucide-react-native` instead of the exported SVGs.
