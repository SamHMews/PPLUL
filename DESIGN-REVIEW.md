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
