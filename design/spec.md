# Dual design spec (captured from Figma)

Source: https://www.figma.com/design/fwmURCNVOUlAAJfknpGhDS/Dual-%E2%80%93-App-Prototype
Page "Dual v2 · Improved", row "Claude's Pick". Style: Base light (Midnight dark comes later).
Captured via Figma MCP before the rate limit hit: Notes (215:3), Friend (215:98), Accept (215:152).
All other screens come from PNG exports (see design/png if present).

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

Notes frame itself (not part of the app): bg `#15151c`, cards `#23232e`, card titles `#f28c38`, body `#e6e6ec`, subtitle `#b8b8c4`.

## Tokens (Base light)

### Colors
| Name | Hex | Used for |
|---|---|---|
| ink | `#15151c` | primary text, logo bar |
| muted | `#6b6b78` | secondary text, unchecked radio border |
| muted2 | `#8a8a96` | gray avatar |
| bg (screen) | `#ffffff` | Friend screen background |
| surface | `#f5f4f7` | Accept screen bg, back button, text bubble, toggle track area |
| border | `#e4e3e9` | outlined cards |
| maroon | `#6e1023` | brand: primary button, selected check |
| maroon-bright | `#a8203a` | avatar (E / Eleanor) |
| maroon-tint | `#f7eff1` | selected row background |
| orange | `#f28c38` | "do this now", VS, logo bar |
| orange-dark | `#c4651a` | eyebrow labels (STEP 2 OF 2) |
| blue | `#4a6286` | avatar (T, A) |
| white | `#ffffff` | text on maroon, cards on gray |

### Typography (Inter)
| Role | Size | Weight | Notes |
|---|---|---|---|
| Eyebrow | 11 | Bold | letterSpacing 0.66, uppercase, orange-dark |
| Title | 28 | Bold | ink |
| Subtitle | 14 | Regular | muted |
| Row name | 15 | SemiBold | ink |
| Row sub | 12 | Regular | muted |
| Section label | 13 | SemiBold | muted |
| Body | 15 | Regular | ink |
| Button | 16 | SemiBold | white |
| Detail row | 13 | Regular label / SemiBold value | |
| Footnote | 12 | Regular | muted, centered |
| Avatar initial | 15 (40px) / 27 (72px) | SemiBold | white |
| Logo "dual" | 14 | Bold | ink |
| VS | 18 | Bold | orange |

### Spacing
Screen padding: 22 horizontal, 60 top, 30 bottom. Gap between blocks: 14.
Row padding: 12 x 10. Card padding: 16 x 14 (bubble), 14 x 12 (outlined), 16 x 13 (detail rows).
Small gaps: 2, 4, 8, 10, 12, 14.

### Radii
Avatar 40px: 20 (circle). Avatar 72px: 36 (circle). Radio 22px: 11. Back button 40px: 20.
Rows 14, outlined card 14, bubble 18, inner chip 12, detail card 18, buttons 16, URL pill 999.

### Sizes
Avatar 40 / 72 (72 has 3px white border). Back button 40. Radio 22 (1.5px muted border). Check badge 22 with 13px icon. Icons: back 19, msg 18, lock 14. Toggle 46x26. Logo bars 4x14 radius 2, gap 2.

## Screen: Friend (215:98), "Who'll keep you honest?"

Frame bg white. Content padding 60 top / 22 sides / 30 bottom, gap 14, column.

1. Header row (gap 12, centered): back button (40 circle, `surface`, back icon 19, links to Hobby) and eyebrow "STEP 2 OF 2".
2. Title "Who'll keep you honest?" (28 Bold ink).
3. Subtitle "Pick someone who'd actually notice if you skipped." (14 muted).
4. Contact list (column, gap 2). Each row: padding 12x10, radius 14, gap 12, avatar 40, text column (name 15 SemiBold, sub 12 muted), radio 22 on the right.
   - **Eleanor** (avatar `#a8203a`, "E"), sub "In your contacts · not on Dual yet". SELECTED: row bg `#f7eff1`, radio is a filled maroon `#6e1023` circle with white check icon.
   - **Tanish** (avatar `#4a6286`, "T"), sub "On Dual · runs 3× a week". Unselected: radio 1.5px `#6b6b78` border.
   - **Ben** (avatar `#8a8a96`, "B"), sub "In your contacts". Unselected.
5. Label "Your text will say" (13 SemiBold muted).
6. Message bubble: bg `surface`, radius 18, padding 16x14, gap 8. Text: "I'm practicing guitar 20 min a day this week. Dual me so I don't quit? 🎸" (15 ink, wrapped in curly quotes). Inside, white chip (radius 12, padding 12x10, gap 10): logo (two 4x14 bars, ink then orange, radius 2, then "dual" 14 Bold) and "dual.link/k3x9" (12 muted).
7. Stake card (OUT OF SCOPE, skip): "Add a $5 stake / Optional · loser's $5 goes to charity" with toggle. Decision pending: drop.
8. Spacer (flex 1).
9. Primary button "Send by text": bg maroon, radius 16, padding 20x16, msg icon 18 + text 16 SemiBold white, gap 8. Links to Accept.

Assets: icon/back, icon/check, icon/msg (SVGs, were temporary Figma URLs; not downloaded; redraw from PNG or use Ionicons equivalents and tell the user).

## Screen: Accept (215:152), "Ari challenged you"

Frame bg `surface` (#f5f4f7). Content padding 60/22/30, gap 14, column, items centered.

1. URL pill: white, radius 999, padding 14x10, gap 8, lock icon 14 + "dual.link/k3x9" (13 muted). Full width. (Demo chrome of the browser view.)
2. Eyebrow "WHAT ELEANOR SEES · IN HER BROWSER" (11 Bold orange-dark, 0.66 tracking). Demo chrome.
3. Spacer.
4. Avatars row (gap 14, centered): "A" avatar 72 `#4a6286` with 3px white border, "VS" (18 Bold orange), "E" avatar 72 `#a8203a` with 3px white border. Initials 27 SemiBold white.
5. Title "Ari challenged you" (28 Bold ink, centered).
6. Detail card: white, radius 18, 4 rows (padding 16x13, space-between, 13px). Label Regular muted, value SemiBold ink.
   - Hobby / "Guitar · 20 min a day"
   - Length / "7 days, starts tomorrow"
   - Check-ins / "One tap · you confirm each other"
   - Stake / "None"
7. Spacer.
8. Primary button "Accept · no download needed" (maroon, radius 16, padding 20x16, 16 SemiBold white). Links to Today.
9. Footnote "Check in from your texts this week. Get the app whenever you want." (12 muted, centered).

## Navigation seen so far
Hobby -> Friend -> (Send by text) -> Accept -> (Accept) -> Today.
Four tabs: Today · Groups · + · You.

## Screens read from PNG exports (design/png/*.png)
PNGs are 2x of a 390pt-wide frame (Today.png and Duel.png differ: Today is 2x, Duel is 1x). Divide by 2 for pt. Exact hex values for the new colors below are estimates from pixels; the Figma-captured tokens above win on conflict.

Extra colors seen: success green `~#2e9e5b` (done circle, 4–4 score, check), success tint `~#e6f3ea`, orange tint `~#fdeee3` (starter goal / recap / streak cards), slate `~#4a6286` (Groups hero card), gray dot `~#e4e3e9`, tab bar top border light gray.
Dots: you = blue `#4a6286`, opponent = maroon-bright `#a8203a`, empty = light gray, today = orange ring (hollow). 7 per person, ~11pt diameter, ~20pt apart.

- **Hobby** (215:30): logo (two bars + "dual") top-left, "Log in" link (blue) top-right. Eyebrow "STEP 1 OF 2 · NO ACCOUNT NEEDED". Title "What do you want to get better at?". 3x3 grid of hobby tiles (Guitar, Running, Spanish, Gym, Reading, Drawing, Cooking, Coding, Meditation), icon above label, tile `surface` radius ~18, selected = maroon fill with white content. "Starter goal" card (orange tint, sparkle icon, orange-dark label, "20 minutes a day for 7 days", pencil icon to edit). Bottom button "Next: pick a friend".
- **Today** (215:185): "SUNDAY, NOV 15" eyebrow (muted), title "Today", avatar "A" top-right (blue, 42pt). "2 things to do". Maroon hero card: music icon tile, "Practice guitar 20 min", "vs Eleanor · she's done today", orange full-width "I did it" button with check + a camera icon button beside it. Gray card: avatar E, "Confirm Eleanor's 25 min", quote "Finally nailed the F chord", small maroon "OK" pill (fake). Green card with shield-check: "Running vs Tanish · done", "3.2 mi synced from Strava at 7:10 AM" (fake). "This week" label, then one outlined card per dual: hobby name, score (green when leading/tied "4 – 4", maroon when behind "5 – 6"), two rows with avatar, name, 7 dots. Orange-tint "Sunday recap" card with sparkle, text, chevron (fake). Tab bar at bottom.
- **Duel** (217:79): back button, title "Guitar" centered, sun icon button right (theme toggle, skip until Midnight). `surface` card: "DAY 5 OF 7 · FRIENDLY", big avatars (You with orange ring, Eleanor), score "5 – 4", two dot rows, weekday letters M T W T F S S under dots. Outlined card with rows: Goal ("20 min a day · ends Saturday", music icon), Check-ins ("You confirm each other · crew votes on disputes", users icon), Stake ("None · add one next dual", heart icon). "Need a break?" label, two pills "Rest day · 2 left" and "Pause 1 week", red text link "Forfeit", bottom gray button "See how it ends (Saturday)" (goes to Result).
- **Done** (217:2): big green check circle, "Day 5 logged", "Eleanor gets a tap to confirm it. You're tied 5 – 5.", gray card with the two dot rows, orange-tint card "Save your streak / You're 1 day in. Make an account so you don't lose it. 20 seconds." with orange "Create account" button (goes to Save), blue link "Back to Today". (Card only shown when the user is still a guest.)
- **Result** (217:166): eyebrow "DUAL OVER · GUITAR", title "Eleanor won, 6 – 5", subtitle "You practiced 5 days, up from 3 last time." Gray card: both dot rows + green check "+60 XP · Friendship Lv 3 with Eleanor" (fake). "What's next?" then 3 selectable cards: Rematch "Same goal, 7 days" (selected: maroon border, tint fill, maroon circle icon with refresh), Easier win "4 of 7 days, 15 min" (trophy), New rival "Dual Tanish at running" (users). Chevron on each. Bottom button "Send rematch", footnote "We track one number: did you start a second dual?".
- **Groups** (217:239): FAKE static screen. Title "Groups", slate hero card "LIVE · ENDS SUNDAY / Floor 3 vs Floor 4" with two progress bars (orange 412 min, white 388 min), "You added 95 min · 2nd on your floor". "Top on Floor 3 this week" leaderboard (Eleanor 140, You 95 highlighted, Tanish 72). "Invite your floor / Code FLR3-28" with Copy pill. Outlined "CU Run Club / 8 members · Saturday long run". Maroon button "Dual a floor-mate". Tab bar.
- **You** (217:314): title "You", sun button, large avatar (maroon with orange ring) "Ari", "Guitar · Running · Spanish". 3 stat tiles: "8 duals won", "5 second duals", "$10 to charity" (stake related: replace). Outlined "Silver" card with trophy, "2 wins to Gold", two perk rows (fake). "Your rivals": Eleanor "Friendship Lv 3 · 3 duals · 1 – 2", Tanish "Friendship Lv 1 · 1 dual · live". Gray card with "Connected apps / Strava, Apple Watch" and "Dual+ · $3/mo" (Dual+ is out of scope, drop). Tab bar with You active.
- **Save** (217:407): back button, orange-tint rounded square with flame icon, "Save your streak", "You've already started. Create an account so your dual with Eleanor is safe.", bottom: maroon "Continue with Apple", outlined "Continue with Google", outlined "Use email" (mail icon), footnote "We ask for an account only after your first check-in."
- **Break** (Base row, 196:212): back button + "Need a break?" header, big avatar "A", "Life happens. Pick what fits, and your progress stays safe." Three selectable cards: Rest day (calendar icon, "2 left this week · your streak stays alive", selected = maroon border, tint, filled check), Pause for a week (pause icon, "The dual freezes for both of you. Come back by Nov 22 and nothing is lost."), Forfeit (red flag icon and red title, "Wave the white flag. Eleanor wins, your stake goes to charity." -> drop the stake clause). Bottom maroon button "Take a rest day" (label follows selection), footnote "Eleanor will see that you're resting." Back button here is a darker gray `~#e8e7ec` (Base row style).
- **Lock screen** (217:42): static image only, `design/png/Lock.png`. Shown as a plain image (e.g. from the Today or Done flow or an "About" entry). Dark gradient, 8:41 clock, widget "5 – 5 / Done today", notification "Eleanor practiced 25 min / Looks good · Ask", Strava line.
- **Tab bar** (Groups/You): Today (home icon), Groups (users), center "+" orange circle ~52pt raised, You (person). Active = maroon icon+label, inactive = muted. Top hairline border.

Icons look like Lucide (music, activity, globe, dumbbell, book-open, palette, utensils, code, leaf, sparkles, pencil, camera, shield-check, flame, mail, calendar, pause, flag, trophy, users, heart, home, user, copy, chevron-right, check, refresh-cw, sun).
