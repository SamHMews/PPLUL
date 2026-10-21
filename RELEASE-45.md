# Workout logging and presentation follow-up

Version 45 / LT Version 11. Reviewed against the repository Apple Design skill.

- Reports use the existing completion green. Dips is filtered from the read-only report projection (current, archived and undated sources); saved history is not deleted or rewritten.
- Home tiles fill the remaining vertical space equally. Dashboard headings receive 30px top content padding (24px on short screens) in addition to the existing safe-area allowance. The verified footer and installed-PWA viewport handling remain intact.
- Missing weight, reps or effort blocks completion both in the UI and in the model. Inline Required hints and accessible descriptions identify only missing fields, and clear as those fields are saved. Explicit zero weight is valid. Completed legacy records remain unchanged and Undo remains available.
- Reps show a dash until actually logged. Selecting the slider minimum explicitly, including with the keyboard, saves it. Saving runs through the existing persistence queue before completion validation.
- Plate impact shake increases from a 20px peak / 140ms decay to 32px / 185ms decay, ending after 640ms. Fall geometry, impact detection, the 1560ms hold, simultaneous Home transition and reduced-motion fallback are unchanged.

The preservation contract was updated only for the explicitly requested reps display/selection, validation binding and shake amplitude changes. Existing card markup, gestures, music controls, storage, programme and other protected assets retain their hashes. Animation tests now enter valid logs before completing cards and assert the stronger impact, blocked incomplete final card, floor contact and simultaneous exit. Reporting tests cover green lines, lossless Dips exclusion, expanded home geometry, required fields and accepted zero weight. Existing history, iPhone WebKit and Spotify regressions remain in CI.

No missing historical reps or effort values are invented. New validation applies to future completion actions. Physical iPhone system blur still needs confirmation after the increased heading clearance.
