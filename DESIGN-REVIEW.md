# Apple design review

Reviewed against the repository's SKILL.md (apple-design).

- Response and direct manipulation: press feedback is immediate. The card tracks a horizontal drag 1:1, with an 8px intent threshold. Swipes may start on buttons; the trailing click is suppressed so they do not accidentally log or complete an exercise. The reps slider retains its own gesture.
- Motion: short flicks use recent velocity to project navigation. Incomplete drags settle with an interruptible critically damped spring; grabbing it retains its current position. Touch capture transfer from child text to the card is not treated as cancellation.
- Simplicity and hierarchy: combined navigation and progress, compact card spacing, and secondary actions in Workout options. Effort uses consistent monochrome arrow/check symbols with visible text and selected borders.
- Accessibility: primary touch targets are at least 44px. Text and controls use rem sizing. Large text and short landscape windows may scroll rather than clip controls. Keyboard navigation, named buttons, Undo, and optional logs remain available. Reduced motion removes card translation; reduced transparency and increased contrast have explicit styles.
- Restraint: no ornamental animation, sound, haptics, or moving backgrounds. Blur is limited to modal surfaces.

## Validation

12 model/storage/gesture tests passed. Automated Chromium mobile touch tests exercised real touch input through the browser: horizontal swipe, swipe beginning on a weight button, independent slider interaction, effort persistence after reload, secondary navigation, and reduced-motion navigation. Layout checks passed for all 35 exercises at 375×667; representative screens also fit 390×664 and 390×844 without scrolling. Enlarged text retains scroll access.

Physical iPhone Safari and installed Home Screen behavior still require device verification. Safari browser chrome cannot be hidden by page CSS: use Share → Add to Home Screen for standalone display. History, backup, dialogs, large text, and very short windows can scroll as needed.

The service-worker cache version changes with this release; existing offline users should close all app tabs/windows and reopen online to receive the new version. Subsequent updates display an explicit Update action. Saved workout data is retained in IndexedDB.
