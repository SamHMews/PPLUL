# Apple design review

Reviewed against the repository's SKILL.md (apple-design).

- Response and direct manipulation: press feedback is immediate. The card tracks a horizontal drag 1:1, with an 8px intent threshold. Swipes may start on buttons; the trailing click is suppressed so they do not accidentally log or complete an exercise. The reps slider retains its own gesture.
- Motion: short flicks use recent velocity to project navigation. Incomplete drags settle with an interruptible critically damped spring; grabbing it retains its current position. Touch capture transfer from child text to the card is not treated as cancellation.
- Simplicity and hierarchy: combined navigation and progress, distributed spacing within each card, and no workout options menu or navigation arrows. Effort uses consistent monochrome arrow/check symbols with visible text and selected borders.
- Accessibility: primary touch targets are at least 44px. Text and controls use rem sizing. Large text and short landscape windows may scroll rather than clip controls. Keyboard navigation, named buttons, Undo, and optional logs remain available. Reduced motion removes card translation; reduced transparency and increased contrast have explicit styles.
- Restraint: no ornamental animation, sound, haptics, or moving backgrounds. Blur is limited to modal surfaces.

## Validation

17 model/storage/gesture/migration tests passed. Automated Chromium mobile touch tests exercised real touch input through the browser: horizontal swipe, swipe beginning on a weight button, independent slider interaction, effort persistence after reload, secondary navigation, and reduced-motion navigation. Layout checks passed for all 34 exercises at 375×667; representative screens also fit 390×664 and 390×844 without scrolling. Enlarged text retains scroll access.

Physical iPhone Safari and installed Home Screen behavior still require device verification. Safari browser chrome cannot be hidden by page CSS: use Share → Add to Home Screen for standalone display. History, backup, dialogs, large text, and very short windows can scroll as needed.

The service-worker cache version changes with this release; existing offline users should close all app tabs/windows and reopen online to receive the new version. Subsequent updates display an explicit Update action. Saved workout data is retained in IndexedDB.

## 23 September workout feedback

- The rep slider retains its large readout, purple track and large rounded thumb. Discrete labelled stops now follow the prescription. Native range accessibility remains underneath the custom visuals; an interruptible critically damped spring moves the visual thumb. No Logged or saving status appears underneath.
- Each changed stop requests a brief 8ms haptic tick when `navigator.vibrate` is supported. This is a progressive enhancement, not a dependency or a notification pattern. See [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate); availability and hardware behavior vary, including lack of support in iPhone Safari.
- Done saves transactionally and turns the same card green. Completed cards remain in the deck, with Completed · Undo directly on the card. There is no completion toast or automatic exit. A save failure leaves the unfinished card visible and offers Retry; Retry refreshes the deck only after saving successfully.
- Variant controls are removed. Weight set-up separates measurement (kg/lb/Unknown) from weight type (total/per dumbbell/machine/etc.). Unknown values have no suffix; changing measurement clears the current draft weight instead of converting or relabelling it.
- Programme migration removes Hip Thrusts from active sessions on any day, including older configurations. Archived snapshots remain byte-for-byte unchanged. Completed active Hip Thrust results are retained as historical records. New weeks contain no Hip Thrusts.
- Four user-reported results dated 2026-09-23 are added idempotently. Calf Raises remain 22 × 10 despite the 12–15 entry range. History validation is independent of current prescriptions and template counts. Historical units default to kg only for legacy records that omitted the measurement field.

Additional browser checks verified the four prescribed ranges, labelled stops, haptic calls, no variant/status controls, Unknown history, lb persistence, green completion with no toast, unchanged counts during browsing, Undo, upgrade from old stored state, historical deduplication, and injected save failure followed by Retry. Physical haptics and iPhone installation still require device verification.

## Physical card stack refinement

Every exercise is a persistent, separately mounted card. Dragging moves the entire top card 1:1 and reveals its neighbour underneath. A short drag springs back; a committed swipe carries the card off screen with release velocity before the next card becomes active. Both directions wrap across all exercises, including completed ones, even when the entire workout is complete. Return and exit springs can be interrupted; reduced motion uses opacity instead of card translation. Portrait card gestures reserve single-finger touch input so diagonal thumb movement is not cancelled as page scrolling. Short landscape windows retain vertical scrolling.

Arrows, Swipe to browse and Workout options have been removed. Available vertical space is distributed across the card instead of accumulating above Done. The completed state stays green and keeps its actual logs; Undo is available on the same card. Browsing never changes remaining counts.

Regression coverage: physical DOM identity during drag, visible underlying neighbour, short-drag return, both-direction infinite wrapping, button-origin drags, slider isolation, mid-return re-grab, pointer cancellation, reduced motion, failure/Retry, completion persistence, all-completed browsing and Undo. All 34 mounted cards fit 375×667, 390×664 and 390×844. Physical iPhone touch feel remains to be checked on the device.

## Slider usability refinement

The card stack is unchanged. Weight Means options now use title case, and Increment/Custom Increment labels are consistent. The rep slider has a 52px-high touch strip and 32px visual thumb. Any position in the strip can begin a drag; pointer capture keeps it tracking outside the strip. Keyboard range semantics remain native. Discrete changes still request an 8ms vibration where supported; weight +/- changes now request the same small tick. Safari on iPhone does not provide the standard Vibration API, so tactile feedback cannot be guaranteed there. No notification vibrations, sound, or hidden-switch workarounds are added.

The new slider browser regression starts away from the visible thumb and drags beyond the strip; it checks slider isolation, keyboard input, haptic calls and unsupported-device fallback, labels, persistence and phone layout. The card-stack edge tests still pass.


## Installed update and control alignment refinement

Weight controls use centered vector symbols with unchanged touch targets. The green slider retains its opaque custom thumb and hides the disabled native input. Release 10 fetches versioned fresh assets, reads only its own offline cache, and reloads an older accepting client even if its original reload handler fails. New clients wait for pending saves before activation. Backup & settings displays Version 10. Workout storage and stack gestures are unchanged.

Validation: 17 model/storage tests; browser checks for centered controls and complete-card palette; a local long-lived-cache upgrade from an older app with a deliberately disabled reload handler verified new symbols, invisible native slider, preserved completion and subsequent offline reload. This validates the recovery path, not the exact cause on the user's device.


## Day symbols and exercise overview

All day, Bonus and completion symbols share a 24-unit vector grid, 16-by-16 painted path bounds, consistent stroke weight and a 32px box. The lower-left All exercises control changes to Close in the overview. Name-only mini-cards use the same dark/green surfaces as the full cards with purple/green borders. Selecting a mini-card saves the deck position and focuses that card; Close preserves the current position. Accessible names describe completion without adding visible content. Pending saves settle before opening the overview. Existing swipe physics remain unchanged; the overview switches immediately without large motion. Rem-based sizing and a short-screen spacing adjustment keep normal phone layouts within the viewport, while enlarged text can expand naturally.

Validation: all five overview counts, completion colors, selection persistence after reload, matching icon bounds including completion tick, Close behavior and three phone sizes passed. Existing physical-stack and edge regressions pass for all 34 exercises, gesture interruption, completion/Undo and failed-save Retry.

## Header overview, progress shortcuts and GitHub storage

The overview control is a purple grid icon in the upper-right 44px target; it becomes a close icon in the overview. The footer control is removed. Progress segments are semantic buttons with 44px-high hit areas and accessible exercise/completion names. Each jumps directly to its card without altering completion. Existing card physics and overview names remain unchanged. Phone layout and stack regressions passed.

GitHub stores the shared snapshot at data/workouts.json on main after connection. The public destination was explicitly selected by the user. The browser requires a PPLUL-scoped fine-grained token with Contents read/write; it is retained only in sessionStorage, never embedded in source, snapshots or exports. IndexedDB remains the offline working copy. Data changes save after a short debounce while connected; navigation alone creates no commit. SHA-guarded writes stop on conflict, and divergent copies require an explicit choice. Session reconnection compares the remote snapshot before saving. No phone history has been uploaded by the implementation task: the user must connect on that device. Unit and mocked API browser tests cover writes, Unicode, conflicts, offline retry, reload and disconnect.

## Remembered GitHub connection (Version 13)

Supersedes the session-only credential policy above at the user’s request. The repository-scoped token is stored in device localStorage and automatically reused on launch. Existing session tokens migrate without re-entry. Disconnect clears both stores, leaving workouts intact. Tokens remain outside snapshots/exports/source. Opening offline and then returning online rechecks GitHub using the saved connection. Tests cover new sessions, migration and forgetting credentials.

## Manual save recovery (Version 14)

Save now previously called a flush that returned silently if the saved token had not reached a ready connection, including conflicts. It now waits for local saves and rechecks GitHub with the remembered token, exposing conflict choices or errors. A missing token produces a persistent status and focuses the connection field. No workouts are replaced without choosing a copy. Browser regression covers a failed initial connection followed by Save now, a divergent remote copy, and a missing token.

## Upper Day and final-exercise plate impact (Version 15)

Upper now has fixed Wide-Grip Machine Row (2 x 5–7) and Smith Machine Shoulder Press (2 x 4–6). New exercise IDs prevent old equipment results being mistaken for new machine results. Replaced active logs/drafts are retained as historical records under their original names; archived weeks are unchanged. Migration is idempotent.

Only a successful Done that changes remaining from one to zero starts the sequence, regardless of card order. The green card remains visible for 220ms, then a photoreal cast-iron plate falls with quadratic acceleration for 620ms. At viewport-floor contact a 40ms vibration is requested where available, with a brief damped vertical UI jolt and a tiny rebound. After 440ms of rebound/settle/fade, navigation returns Home with a green tile. Total duration is approximately 1.3 seconds. Reopening an already completed day, Undo and intermediate completions do not celebrate. Reduced motion uses a stationary plate fade without falling, shaking or haptics. Backgrounding ends and cleans up the sequence.

The referenced JPEG was not present in the supplied attachments, synced project or repository. The transparent plate asset was generated from the written cast-iron material description. No manufacturer match is claimed. The image and animation module are included in the offline cache.

Validation: model/storage tests and replacement-history regression pass. Browser tests verify last-remaining completion out of numerical order, floor-aligned haptic timing, automatic green Home tile, no replay, Undo and reduced motion. All 34 cards continue to fit three phone viewports, and existing interrupted-gesture/save-retry regressions pass.

## Slower tilted plate and Hip Abductors removal (Version 16)

The plate now has a textured face and shallow layered rim, changing three-dimensional tilt during a 1.45-second accelerating fall. First floor contact triggers the UI jolt/haptic; a visible 28px rebound, smaller recoil and damped rocking settle the plate toward a flatter angle before Home. Total sequence is approximately 2.6 seconds. Circular projected edge and rim thickness determine floor contact. Reduced motion retains a stationary fade.

Hip Abductors are removed from fresh and existing active programmes, with saved results/drafts retained and archived weeks untouched. Legs now has four exercises. Validation: 24 model/storage tests, celebration order/3D motion/contact/reduced-motion browser checks and overview phone layouts passed. Falling and rebound frames were visually inspected.

## Flat 3D landing and simultaneous Home transition (Version 17)

The plate uses a textured WebGL mesh with beveled faces, a thick rim, central bore and directional lighting. Its diameter is 106% of the viewport width, centered at 69% of the width. A 900ms accelerating fall wobbles toward a flat landing, followed by a small damped rebound and rocking settle. Impact triggers the existing brief screen jolt and optional vibration. The plate stays opaque until navigation is ready; Home rendering and plate removal happen in the same microtask turn, avoiding an intermediate visible frame. The green completed card stays behind the plate throughout.

Reduced motion and unavailable WebGL use a stationary plate with no shake or haptic. Interrupted rendering cleans up interaction state. Browser validation covers normal 3D, reduced motion, no-WebGL fallback, exact floor contact, completion and Undo. Frame sampling with an artificial 250ms Home persistence delay confirms the plate and completed card disappear together when Home appears.
