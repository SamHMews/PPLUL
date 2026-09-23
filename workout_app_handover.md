# Workout Tracker — Product, UX and Engineering Handover

**Status:** Design handover, 22 September 2026. **Audience:** Developer / coding agent building a production-ready, iPhone-first Progressive Web App (PWA). **Source:** The user's workout plan, actual exercise logs and iterative design decisions in this conversation. This document is the source of truth for agreed behaviour; prior interactive prototypes were illustrative and contained known defects.

## 1. Product intent and non-negotiables

Build a quiet, elegant personal workout tracker for an iPhone 13, developed on Windows and installed from Safari to the iPhone Home Screen. It should look and behave like a focused native mobile app, not a dashboard, motivational product or complex fitness platform. The user wants to spend as little time interacting with the phone as possible during a session.

**Core interaction:** launch app → six-button home → tap a workout once → immediately see its first *remaining* exercise card (or resume the exact card last viewed) → swipe the entire card left/right to browse unfinished exercises → optionally log one working weight, reps and effort → tap one Done button to complete and remove that exercise from the active deck. A day is complete only when every prescribed exercise has been marked Done. Bonus is a separate one-tap completion tile without a workout deck.

**Durability:** save every meaningful change, including unfinished workouts, across app switching, phone locking, browser closure and device restarts. Archive a week when the user deliberately starts a new week; preserve past results and make them available to inform later suggested weights and eventual progress analysis. A production app must offer export/backup, because iPhone browser storage alone is not a sufficient long-term guarantee.

**Out of scope for this phase:** designing the analysis page, public accounts/social features, notifications, automated workout scheduling, exercise video library, gamification and App Store publication. Do not build these merely because they are common fitness-app features.

## 2. Visual design — approved direction

The user explicitly approved the restrained **dark mode + muted purple accent** design. Do not revert to light mode, the earlier bright lime theme, or a loud branded style. The phrase “The grind” was specifically rejected. The home title is simply **Training**. The app should be sleek, calm and functional; basic symbols are welcome where they convey meaning.

Suggested design tokens, approximated from the approved prototype (tune for accessibility and actual device rendering):

| Token | Suggested value | Purpose |
|---|---|---|
| App background | `#111116` | Nearly black, slightly warm |
| Card/tile surface | `#201F27` | Distinguishable dark panel |
| Card border | `#37323F` / `#393440` | Fine, low-contrast separation |
| Primary text | `#F5F2F8` | Warm near-white |
| Secondary text | `#AAA2B2` | Muted lavender-grey |
| Purple accent | `#B39ACD` / `#A78BC6` | Important text, active outlines and controls |
| Purple filled button | `#70518C` | Primary actions such as Done |
| Purple selected surface | `#392A49` | Selected effort, step buttons |
| Bonus idle surface | `#30243F` | Bonus tile visually distinct |
| Completed surface | `#183E30` | Completed tile |
| Completed border | `#347658` | Completed tile outline |
| Completed progress | `#4EAD78` | Green progress segments |

Use a single consistent typeface (system UI/SF on iPhone), clear hierarchy, ample padding and generous touch targets (prefer ~48–56 px for controls). Rounded tiles/cards around 16–22 px; no heavy shadows, gradients, flashy animation, dense statistics, slogans, decorative badges, excessive labels or extraneous instructional copy. Purple should indicate *action/selection*, green should indicate *completion*, grey should indicate *not completed*. Do not use purple as a third progress state. Icons: understated dumbbell for workout tiles, sparkle for Bonus, check for completion, back arrow for navigation, +/- for weight, and calendar/refresh icon for New week. Icons are aids, not the focus.

Animations should be brief, smooth and respect reduced-motion preferences. Never animate in a way that risks losing unsaved input or accidentally completing an exercise.

## 3. Home screen — exact elements and behaviour

### 3.1 Layout

- Dark background, generous safe-area-aware top/bottom padding.
- Top row: left **Training** in large, restrained type; directly below it **Week N**. Right: a **New week** button, smaller and visually separate from the six large workout tiles. Place it at the top so it is difficult to hit accidentally during normal thumb use; require an explicit confirmation as a second safeguard.
- Below: a **two-column × three-row** grid of six large, thumb-friendly tiles, in this order: **Push, Pull, Legs, Upper, Lower, Bonus**. Each tile shows a simple icon and a prominent day name. No extra “Open workout” button, intermediate page or modal when selecting a main day.
- Optional unobtrusive archive count may appear beneath the grid, but do not clutter the primary experience or imply an analysis page is already implemented.

### 3.2 Workout tiles

- Main day tile default: dark neutral panel with thin border, subtle purple icon. Tap **once** to open that day's workout deck directly.
- A main day tile becomes green **only when all exercises in that day's routine have been marked Done**. Merely opening it or logging one exercise does not complete the day.
- Tapping a partially completed day opens the remaining deck at the last valid viewed exercise, not a fresh routine. Tapping a completed day should show a clear completion state and allow historical inspection if implemented; it must not silently restart or duplicate that day's entries. The exact completed-day review UI is not yet agreed.
- **Bonus**: idle tile is muted purple; tapping marks Bonus complete and turns it green immediately. There are no Bonus exercise cards or logging fields. The earlier prototype allowed tapping again to undo Bonus; **undo behaviour is not expressly approved**, so treat it as an implementation question rather than a fixed requirement.
- Tile completion is for the **current training week** only. The routine itself remains a reusable template.

### 3.3 New week action

- New week button is **at the top**, small relative to the tiles, using the purple action system (fill or border acceptable). Tap opens a confirmation dialog with explicit consequences: archive the current week, reset its completion state and start Week N+1; preserve all history.
- **Cancel** makes no changes. **Confirm** must durably commit/archive the current week *before* showing the next week. Avoid double-submits, lost data, or a reset that succeeds only in UI memory.
- The user wants to start a new week **manually**. Do **not** implement an automatic Monday reset without asking; a prior assistant assumed weekly reset without confirmation.
- Do not claim archive success until persistence has actually succeeded. If saving fails, keep the current week intact and show a recoverable error.
- An incomplete week may still be archived when explicitly confirmed; preserve each exercise's completion status and any partial entries.

## 4. Workout screen / exercise deck — exact elements

### 4.1 Header and progress

- Back arrow / **Training** returns to the home screen without ending the workout or clearing state.
- Show **[Day] Day** prominently and a compact completion indicator, e.g. `3 / 8 done` or `5 of 8 remaining`. These are different measurements; label them unambiguously.
- Progress bar contains **one segment per original exercise in that day's routine**, in original routine order. Segment is grey if unfinished and green if Done; no orange/purple intermediate status. Segments remain anchored to the original exercise identity even when finished cards disappear from the active deck.
- The counter **must not change when swiping**. Explicit bug reported: a prototype showed “3 of 8 remaining” and then “4” on the next card. Correct: Push starts at **8 of 8 remaining**, and reads **3 of 8 remaining only after five exercises are marked Done**. Use `remaining = total - completed`; never use active carousel index as remaining count.
- If displaying card position, make it separate and clearly labelled (e.g. `Card 2 of 6 unfinished`), but the user prefers minimal UI. The most important count is remaining/done, not position.

### 4.2 Exercise card content and hierarchy

Each card must have, in order or an equally clear arrangement:

1. **Exercise name**, prominent and legible. Use the user's chosen specific exercise names; where a routine has an unresolved alternative, do not pretend a variant was confirmed.
2. **Prescribed set count and target rep range** shown as concise chips or small text. These are guidance, not a requirement to log every set.
3. **Working weight** area: prominent weight display with large purple-accented minus and plus buttons. Show unit context such as **per dumbbell**, **total weight** or **added weight**. Weight logging is optional. An unlogged exercise must display a neutral dash rather than inventing 0 kg or implying bodyweight. One working weight represents the **heaviest weight used**, not each set.
4. **Previous actual result** if known: clearly labelled as a historical log with weight and reps, including per-dumbbell wording where relevant. Distinguish actual historical result from a suggested weight; do not label the previous weight as “suggested” by default. If no result, show a discreet “No previous result” or omit the line. Suggestions are optional and must be grounded in real history and effort, not fabricated.
5. **Reps achieved**: a large visible number and thumb-friendly slider, user-specified range **3–9 inclusive**, default 5. Sliding updates the number immediately and saves the draft. IMPORTANT unresolved conflict: several routine targets and real logs exceed 9 (e.g. 10–15 target, 11/12 achieved). Never truncate historical reps or silently force an actual 12 to 9. Clarify how to log >9 reps before treating the 3–9 slider as a complete production input.
6. **How did it feel?** three large selectable tiles: `👍 Could do more`, `✓ Just right`, `👎 Too hard`. Exactly one selected at a time; purple border/fill indicates selection. This is optional if the user wants simply to mark an accessory done.
7. One prominent **Done** button in purple. It is the **only normal action that marks the exercise completed**. It must work even if weight/reps/effort were never entered. Done commits any optional fields that *were* entered, marks the exercise complete, removes it from the active deck and advances to a remaining exercise (or completion screen). Never interpret missing optional logging as skipped or missed.

**No separate Save and Done buttons, no per-set form, no keyboard required for normal interaction.** Use the approved full labels and effort tiles; the user disliked a compact icon-only version.

### 4.3 Weight interactions

- Plus/minus change selected weight by one sensible increment; the user explicitly wants **2.5 kg per dumbbell** for dumbbell movements. Do not assume every cable machine, barbell or selectorised stack uses a 2.5 kg increment. Make increments configurable per exercise/equipment; actual available increments need confirmation.
- Show the correct unit, especially when 30 kg means **30 kg in each hand** rather than 30 kg combined.
- If a previous weight exists, it may be prefilled as an easy one-tap starting point, but distinguish previous from an algorithmic increase. The previous prototypes displayed example future weights (bench 82.5 kg, incline 32.5 kg, shoulder 27.5 kg): **these were mock examples, not actual user logs or approved prescriptions**.
- Suggestions, when implemented, should make small progressive adjustments based on *actual reps and effort*, never automatically increase simply because a card was marked Done with no log.

### 4.4 Full-card swipe — mandatory and previously broken

- **Entire card surface** must support left and right horizontal swipes, including comfortable middle/lower thumb zones; a header-only swipe is unacceptable. The user repeatedly reported missing swipe behaviour in previews. Build and test it on an actual iPhone, not only with mouse gestures.
- Swipe left advances to next **unfinished** exercise; swipe right goes to previous **unfinished** exercise. Both directions **wrap infinitely**: last ↔ first. The routine's original ordering determines sequence, but the user can do exercises in any order.
- Swipe is **navigation only**. It must never mark Done, save an unselected rating, alter reps, change weight or discard draft state.
- Horizontal drag on the rep slider adjusts reps **without moving the card**. Taps/drags on +/- buttons, effort tiles, Done, back and other controls must not initiate a swipe. Vertical scrolling must remain possible on smaller screens; use robust pointer/touch gesture arbitration and test iOS Safari's touch behaviour.
- Define a sensible swipe threshold (~50–70 CSS px or velocity equivalent) and spring back on incomplete gestures. Avoid double navigation from synthetic touch/pointer events. Respect reduced motion.
- Preserve each exercise's draft input and position across swipes, back navigation, app switching, screen locking and relaunch. If the currently viewed card was just completed, choose the next remaining card deterministically; handle removal of the last card.
- **Done removes the exercise from the active deck.** Swiping back must skip it. Progress still reflects the completed exercise in its original slot. Do not allow a completed card to re-enter the active deck merely because the user navigates backwards.
- When no exercises remain, show a simple **Workout complete** state and make the home tile green. No confetti or motivational slogans. A Back to Training action is fine.

## 5. Weekly training template — source of truth

The user's weekly pattern is Push / Pull / Legs / Rest / Upper / Lower / Rest. The **home screen nevertheless has six tiles** (five main workout days + Bonus), not Rest Day buttons. Bonus is a single-tap indicator, not a prescribed sixth workout. The user can train out of order; do not enforce calendar dates or a fixed weekday schedule.

The sets and target ranges below are **prescribed routine guidance**, not proof of completed training. The routine is a persistent baseline. Exercise substitutions are allowed without permanently overwriting the baseline unless the user chooses to change it.

### Push — 8 cards

| Order | Exercise | Sets × target reps | Notes |
|---|---|---|---|
| 1 | Bench Press | 2 × 4–5 | Actual historical log below exceeds target; preserve actual reps. |
| 2 | Incline Dumbbell Press | 2 × 7–9 | Weight **per dumbbell**. |
| 3 | Cable Flyes | 2 × 7–9 | **Replaces Chest Press**. |
| 4 | Dips | 2 × 7–9 | Added weight vs assisted/bodyweight convention needs specification if logged. |
| 5 | Dumbbell Shoulder Press | 2 × 7–9 | User logged DB shoulder press; per dumbbell. |
| 6 | Lateral Raises | 2 × 8–12 | Usually per dumbbell; confirm equipment if needed. |
| 7 | Skullcrushers | 2 × 7–9 | Equipment not yet specified. |
| 8 | Tricep Pushdown | 2 × 10–12 | Cable machine increment may differ. |

### Pull — 8 cards

| Order | Exercise | Sets × target reps | Notes |
|---|---|---|---|
| 1 | MAG Grip Lat Pulldowns | 2 × 7–9 | Actual historical result available. |
| 2 | Smith Machine Row | 3 × 5–7 | **Replaces V-Bar Rows**. Historical ~90 kg is estimated. |
| 3 | Chest-Supported Dumbbell Rows (Wide Pull, 45°) | 3 × 7–9 | User specified wide-pull dumbbell chest-supported variant. |
| 4 | Face Pulls (Two Ropes) | 2 × 7–9 | Cable, two ropes; corrected historical weight 23.7 kg. |
| 5 | Incline Curls | 2 × 7–9 | |
| 6 | Preacher Curls | 2 × 5–7 | |
| 7 | Hammer Cable Curls | 2 × 5–7 | |
| 8 | Reverse EZ Bar Curls | 4 × 8–12 | |

**Removed from Pull:** Wrist Curls 4 × 12–15 and Dumbbell Hammer Curls 3 × 8–12. Do not reinsert them.

### Legs — 5 cards

| Order | Exercise | Sets × target reps |
|---|---|---|
| 1 | Squats | 3 × 4–6 |
| 2 | Hamstring Curls | 2 × 8–10 |
| 3 | Leg Extensions | 2 × 10–12 |
| 4 | Hip Abductors | 2 × 12–15 |
| 5 | Calf Raises | 2 × 12–15 |

### Upper — 7 cards

| Order | Exercise | Sets × target reps | Unresolved choice |
|---|---|---|---|
| 1 | Lat Pulldown | 2 × 5–7 | Grip/attachment not specified. |
| 2 | Incline Dumbbell Press | 2 × 7–9 | Per dumbbell; historical Push result can be shown with its day label. |
| 3 | Barbell **or** Chest-Supported Row | 2 × 5–7 | User has **not yet chosen** the Upper variant. Smith row was an offered option, not a confirmed selection. |
| 4 | Overhead Barbell **or** Dumbbell Press | 2 × 4–6 | User has **not yet chosen** the Upper variant. |
| 5 | Lateral Raises | 2 × 10–12 | |
| 6 | Barbell **or** Cable Curl | 2 × 8–10 | User has **not yet chosen** the Upper variant. |
| 7 | Tricep Pushdown | 2 × 8–10 | |

The assistant previously asked which Upper row, overhead press and curl variants the user performs; no selections were supplied. Preserve the alternatives or obtain a decision. Do not silently infer them from Push/Pull.

### Lower — 7 cards

| Order | Exercise | Sets × target reps | Notes |
|---|---|---|---|
| 1 | Deadlift (Barbell or Trap Bar) | 2 × 3–5 | Variant unresolved. |
| 2 | Bulgarian Split Squats | 2 × 6–8 per leg | Per-leg reps; weight convention needs clarification. |
| 3 | Hamstring Curls | 2 × 8–10 | |
| 4 | Hip Thrusts | 2 × 6–8 | |
| 5 | Leg Extensions | 2 × 10–12 | |
| 6 | Calf Raises | 2 × 12–15 | |
| 7 | Hanging Leg Raises **or** Cable Crunches | 2 × 12–15 | Variant unresolved; don't silently select Hanging Leg Raises. |

## 6. Actual historical workout results — preserve accurately

These are **user-reported actual logs**, unlike the illustrative suggestions in previous demos. User said to use the routine's prescribed set count unless he specifies otherwise. Where the user reported only a weight/reps and set count was inferred from the plan, mark it as inferred rather than a directly recorded set-by-set history.

| Day | Exercise | Actual weight | Actual reps | Sets | Qualification |
|---|---|---|---|---|---|
| Push | Bench Press | 80 kg total | 8 | 2 | User-reported. |
| Push | Incline Dumbbell Press | 30 kg **per dumbbell** | 12 | 2 (routine-inferred) | Preserve 12 despite proposed slider max 9. |
| Push | Dumbbell Shoulder Press | 25 kg **per dumbbell** | 11 | 2 | User-reported. |
| Pull | MAG Grip Lat Pulldown | 20.5 kg | 8 | 2 | User-reported. |
| Pull | Smith Machine Row | 80 kg plates + **estimated** 10 kg Smith bar = **approximately 90 kg total** | 6 | 3 | Bar weight is machine-specific; do not present 90 kg as exact. |
| Pull | Face Pulls (Two Ropes) | 23.7 kg | 9 | 2 | Corrected from an earlier 21.5 kg; **23.7 kg is the correct log**. |

The wide chest-supported DB row was **not logged** in the cited Pull session. Do not infer that it was skipped or missed. No other weights are confirmed actual results. In particular, 82.5 kg bench, 32.5 kg incline dumbbells and 27.5 kg shoulder dumbbells were **prototype suggestions only**.

**Historical data provenance:** Ideally store `source: user_reported`, `sets_source: reported|routine_inferred`, `weight_precision: exact|estimated`, and a nullable date rather than inventing calendar dates. Existing reports have no confirmed exact workout date in this handover. If a log is reused on another day (e.g. Push incline press shown on Upper), label the source day rather than pretending it was logged on Upper.

## 7. Data model and persistence requirements

A suggested implementation model (adapt names as needed):

- `routine_templates`: stable template ID, name, ordered exercise IDs, sets, rep target, preferred variant, weight unit, configurable increment; version templates when user changes them.
- `exercise_catalog`: stable exercise IDs and variants, aliases, equipment and unit metadata. Do not identify exercises solely by display name.
- `training_weeks`: immutable unique week ID, human-readable ordinal, start/archived timestamps (only if actually known), status active/archived, Bonus completion.
- `day_sessions`: unique week + day key, original routine/template version, completion status and last viewed exercise ID. One session per day per week, unless the user later explicitly asks for multiple sessions.
- `exercise_entries`: unique session + exercise ID, original order, completed boolean, optional `completed_at`, optional `weight_kg`, `weight_unit`, optional `reps`, optional `effort`, optional `logging_intent`/touched flags, optional exercise substitution. **Null means not logged**; 0 is a real value only when deliberately chosen.
- `draft_state`: persist per-exercise in-progress weight/reps/effort and navigation position. A default slider display of 5 must **not** be misinterpreted as an actual 5-rep log when the user taps Done without interacting with it. Track `reps_touched` or an equivalent explicit logging flag.
- `history`: preserve archived sessions and individual exercise entries, including incomplete days, original plan and edits. Do not derive past results from a mutable current template.

**Persistence semantics:** On-device IndexedDB is a sensible browser storage choice; a service worker + cached app shell enables offline operation. Persist transactionally on every meaningful change, preferably before indicating success. Handle browser refresh, standalone PWA relaunch, app switch, device restart, offline state and storage errors. Avoid relying on `localStorage` alone for production. Build **user-controlled JSON/CSV export and import or cloud backup/sync** before the app becomes the only copy of training history. If adding sync, plan for conflict handling and privacy; an account is not required merely to use an offline-first PWA.

**New week archive:** snapshot all five day sessions, Bonus state, original exercise identities, completed flags, optional logs and draft values. Commit the archive and new active week atomically where possible; prevent repeated confirmation from creating duplicate weeks. On failure, do not reset the old week. The archive must be available later to display previous results and build the analysis page.

**Weight suggestion logic, future:** use the latest comparable *actual* completed exercise log, its reps, effort and equipment/variant; never count an unlogged Done as evidence for progression. Keep suggested and previous weight separate fields. Do not implement an unapproved algorithm as if agreed.

## 8. PWA / iPhone / Windows delivery

- User has **Windows only** and wants to build there. No Mac, Xcode, native iOS binary or Apple developer membership is required for the chosen **PWA** route.
- Build a responsive HTTPS-hosted web app with web manifest (`name`, `short_name`, icons, `display: standalone`, theme/background colours) and service worker. Ensure iOS Safari standalone behaviour, safe areas (`viewport-fit=cover`), portrait layout, proper scrolling and touch gestures.
- Install flow on iPhone: open deployed URL in **Safari → Share → Add to Home Screen → Add**, then launch from its icon. The user found the Add to Home Screen item in Safari; the Share **Options** panel with Automatic/PDF/Web Archive is unrelated and does not contain an “Open as Web App” setting. The app's manifest/meta configuration is what enables the standalone presentation.
- The app needs a reachable hosted URL for initial installation and updates; **the user's Windows PC need not stay on**. A static host is enough for an offline-first app, while backup/sync may require a backend. Do not claim zero hosting is needed.
- Test on the user's iPhone 13 in installed standalone mode as well as Safari and Windows desktop emulation. Test after closing/reopening, locking/unlocking, going offline, rotating if supported, and clearing/losing storage (backup recovery).
- GitHub/Codex workflow was discussed as a possible way to build the app. Connecting GitHub does not itself transform a ChatGPT interactive prototype into deployable code. This handover should be committed alongside actual source code and used as a build/acceptance specification.

## 9. Interaction states and acceptance tests

### Home and navigation

1. Launch with no active workout → Training home, Week 1, six tiles in correct order.
2. Tap Push once → first remaining Push card **directly**, no second CTA.
3. Open Push, navigate to card 4, switch apps/lock/close and relaunch → exact current card and draft values restored, or a deterministic valid remaining card if card 4 was completed.
4. Back to home and reopen same day → resume, not restart. Opening another day does not alter the first day's draft.
5. Bonus tap → purple tile turns green, no deck. Its reset/undo behaviour must be explicitly decided.

### Swipe/deck

6. Swipe left on card body → next unfinished exercise; swipe right → previous; last/first wrap.
7. Swipe from **middle and lower card**, not only the header. Test on iPhone touchscreen.
8. Drag rep slider horizontally → only rep value changes; card stays put. Tap +/- or effort → no swipe.
9. Scroll vertically on small iPhone viewport → page scrolls, card does not jump.
10. Swiping repeatedly without Done → remaining counter and progress bar unchanged.
11. Mark Cable Flyes Done → card disappears; swipe back and forward → Cable Flyes never appears in active deck. Its original progress segment is green.
12. Push starts `8 of 8 remaining`. After five distinct Done actions → `3 of 8 remaining`, regardless of active card position.
13. Done on last unfinished card → simple Workout complete view; Push home tile green. Reopening must not create a duplicate workout.

### Optional logging and correctness

14. Tap Done on an untouched accessory card → completed=true, weight/reps/effort remain **null/unlogged**, not zero kg/5 reps/default effort.
15. Adjust weight and reps, swipe away/back → exact draft restored. Log 30 kg per dumbbell without doubling or mislabelling.
16. Display historical bench 80 kg × 8 and incline 30 kg per dumbbell × 12 accurately, despite 3–9 draft slider; no truncation.
17. Smith row previous weight explicitly says **approximately** 90 kg, not exact. Face pulls show corrected 23.7 kg.
18. No automated progression from Done-only exercises. Suggestions, if present, are clearly distinct from previous actual result.

### Weeks and durability

19. New week button at top → confirmation; Cancel does nothing.
20. Confirm New week → archive full current state before reset; Week N+1 appears; all six tiles reset; history preserved.
21. Close app/browser and restart phone → week, history, drafts and current position retained.
22. Export history and restore it on a clean install/new device → all exercise results, units, variants, incomplete entries and weeks preserved.
23. Simulate persistence failure during New week → no data loss, no false success and no partial reset.

## 10. Known defects in prior interactive prototypes — do not copy them

- Some previews rendered **Previous/Next buttons instead of working swipe**; another only supported swiping the header. Full-card touch swiping is a hard requirement.
- Some prototypes counted carousel position as “remaining,” causing the reported `3 of 8` → `4` bug. Derive remaining from completed flags only.
- Earlier demos prefilled weights and slider reps and then risked recording them as actual when Done was tapped. Separate defaults/drafts from intentional logs.
- One demo incorrectly treated 90 kg Smith row as exact; preserve estimated bar weight.
- Some demos silently chose Hanging Leg Raises or Upper exercise variants; alternatives remain unresolved.
- A prototype used `localStorage` and described an archive, but browser-local demo state is **not** a reliable permanent database or backup.
- One demo's New week reset did not actually archive data. The real app must archive transactionally before resetting.
- Earlier assistant claimed all buttons automatically reset with a new training week; the user's requested interaction is a **manual New week button**.
- Do not reintroduce “The grind,” bright lime branding, unnecessary decorative UI, a second Open workout CTA or a Rest Day home tile.

## 11. Outstanding decisions to confirm with the user

These are *not* blockers for a faithful visual prototype, but they matter before shipping a trustworthy logger:

1. **Reps above 9:** preserve the desired 3–9 slider while allowing 10–15+ on high-rep exercises. Possibilities: exercise-specific slider range or a `10+` extension. Ask, don't silently change or cap.
2. **Upper variants:** Barbell vs chest-supported row; barbell vs dumbbell overhead press; barbell vs cable curl. Also Lower deadlift and abs alternatives.
3. **Weight increments:** exact increments for barbell, Smith machine, cable stacks and bodyweight/assisted movements; dumbbells are explicitly 2.5 kg per hand.
4. **Completion correction:** how to undo an accidentally tapped Done / edit a completed exercise without violating the “removed from active deck” rule. A separate unobtrusive completed-exercise review may be appropriate; not yet specified.
5. **Bonus undo:** whether tapping the green Bonus tile again unmarks it.
6. **New week after partial completion:** confirmation text and whether to warn about unfinished days; archive should still preserve them.
7. **Backup choice:** downloadable export/import, private cloud sync, or both; authentication only if needed.
8. **Suggested weight rules:** precise progression algorithm and whether suggestions appear on every lift or only major lifts.
9. **Substitutions:** how to choose an exercise variant for one session versus permanently updating the routine template.
10. **Completed-day review and analysis page:** deferred by user; preserve data now so both can be built later.

## 12. Recommended build sequence

1. Create responsive dark/purple home and exercise card screens with the exact approved visual hierarchy.
2. Implement immutable routine templates and stable exercise IDs; seed *only* the real historical logs above, clearly marked as historical and with unknown dates.
3. Implement an unfinished-exercise deck with robust iOS full-card swipes, wraparound, gesture isolation, correct counters and Done-removal semantics.
4. Implement optional logging with touched flags, correct weight units, effort and draft preservation.
5. Add offline-first durable persistence, installed-PWA behaviour and manual atomic weekly archiving.
6. Add export/import or cloud backup and validate restore before real-world use.
7. Test all acceptance cases on the actual iPhone. Revisit analysis and progression only after the core workflow is stable.

**Success criterion:** At the gym, the user can unlock his iPhone, tap the Training icon, land on his current exercise, swipe anywhere comfortable to the next unfinished card, optionally adjust a weight and reps, tap Done, and put the phone away — confident that every actual result and archived week will still be there later.
