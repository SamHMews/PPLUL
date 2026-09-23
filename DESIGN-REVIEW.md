# Apple design review

Reviewed against the repository's SKILL.md (apple-design).

- Response and direct manipulation: press feedback is immediate. The card tracks a horizontal drag 1:1, with an 8px intent threshold. Swipes may start on buttons; the trailing click is suppressed so they do not accidentally log or complete an exercise. The reps slider retains its own gesture.
- Motion: short flicks use recent velocity to project navigation. Incomplete drags settle with an interruptible critically damped spring; grabbing it retains its current position. Touch capture transfer from child text to the card is not treated as cancellation.
- Simplicity and hierarchy: combined navigation and progress, compact card spacing, and secondary actions in Workout options. Effort uses consistent monochrome arrow/check symbols with visible text and selected borders.
- Accessibility: primary touch targets are at least 44px. Text and controls use rem sizing. Large text and short landscape windows may scroll rather than clip controls. Keyboard navigation, named buttons, Undo, and optional logs remain available. Reduced motion removes card translation; reduced transparency and increased contrast have explicit styles.
- Restraint: no ornamental animation, sound, haptics, or moving backgrounds. Blur is limited to modal surfaces.

## Validation

17 model/storage/gesture/migration tests passed. Automated Chromium mobile touch tests exercised real touch input through the browser: horizontal swipe, swipe beginning on a weight button, independent slider interaction, effort persistence after reload, secondary navigation, and reduced-motion navigation. Layout checks passed for all 34 exercises at 375×667; representative screens also fit 390×664 and 390×844 without scrolling. Enlarged text retains scroll access.

Physical iPhone Safari and installed Home Screen behavior still require device verification. Safari browser chrome cannot be hidden by page CSS: use Share → Add to Home Screen for standalone display. History, backup, dialogs, large text, and very short windows can scroll as needed.

The service-worker cache version changes with this release; existing offline users should close all app tabs/windows and reopen online to receive the new version. Subsequent updates display an explicit Update action. Saved workout data is retained in IndexedDB.

## 23 September workout feedback

- The rep slider retains its large readout, purple track and large rounded thumb. Discrete labelled stops now follow the prescription. Native range accessibility remains underneath the custom visuals; an interruptible critically damped spring moves the visual thumb. No Logged or saving status appears underneath.
- Each changed stop requests a brief 8ms haptic tick when `navigator.vibrate` is supported. This is a progressive enhancement, not a dependency or a notification pattern. See [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate); availability and hardware behavior vary, including lack of support in iPhone Safari.
- Done saves transactionally, holds a green card for 360ms, then exits smoothly over 200ms. Reduced motion uses an opacity-only exit. There is no completion toast. Undo stays in Completed exercises. A save failure leaves the unfinished card visible and offers Retry; Retry refreshes the deck only after saving successfully.
- Variant controls are removed. Weight set-up separates measurement (kg/lb/Unknown) from weight type (total/per dumbbell/machine/etc.). Unknown values have no suffix; changing measurement clears the current draft weight instead of converting or relabelling it.
- Programme migration removes Hip Thrusts from active sessions on any day, including older configurations. Archived snapshots remain byte-for-byte unchanged. Completed active Hip Thrust results are retained as historical records. New weeks contain no Hip Thrusts.
- Four user-reported results dated 2026-09-23 are added idempotently. Calf Raises remain 22 × 10 despite the 12–15 entry range. History validation is independent of current prescriptions and template counts. Historical units default to kg only for legacy records that omitted the measurement field.

Additional browser checks verified the four prescribed ranges, labelled stops, haptic calls, no variant/status controls, Unknown history, lb persistence, green completion with no toast, unchanged counts during browsing, Undo, upgrade from old stored state, historical deduplication, and injected save failure followed by Retry. Physical haptics and iPhone installation still require device verification.
