# Apple Design review — 21 October 2026

Reviewed against the supplied [Apple Design skill](https://github.com/SamHMews/PPLUL/blob/main/SKILL.md). This follow-up addresses the user's physical iPhone 13 screenshots after Version 43 / LT Version 9, which still showed a 47-point bottom strip and softened week context.

## Installed iPhone shell

The previous CSS-only `100dvh` fix and opaque status-bar metadata did not resolve the user's installed app. WebKit [236445](https://bugs.webkit.org/show_bug.cgi?id=236445) documents a bottom offset equal to the top safe inset; [316008](https://bugs.webkit.org/show_bug.cgi?id=316008) documents installation-retained status-bar behavior. These reports support the diagnosis but do not replace measurement on the user's phone.

The new viewport calculation compensates only when an installed iPhone reports a height deficit matching its nonzero top safe inset and its screen width matches the window. Normal viewports, opaque native-inset installations, mismatched orientation and keyboard-sized reductions are not expanded. Both document and dashboard shell use that resolved height. Safari tabs retain visible-viewport handling. The dashboard backing surface matches the footer colour.

A separate non-interactive fixed opaque surface covers the status safe area. Unlike a full-screen body or meta-tag change, its geometry meets WebKit's edge-sampling criteria described in this [firsthand PWA investigation](https://modernwebweekly.substack.com/p/so-whats-up-with-the-ios27-blur). It is visible only on installed-app dashboard screens and never covers a logging card or plate animation. Typography retains a solid, higher-contrast week label.

## Screen-sized reports and secondary screens

- Every exercise report occupies an identical card grid inside the available screen height. Numeric range no longer determines card height. The chart measures its allotted plot area and redraws on resizing.
- Weight-only historical values, gaps, point details, per-dumbbell convention, actual configured units, prior-unit selection, Unknown units and retired exercise records remain intact. No conversions or suggested-weight substitution.
- Fine 10-unit gridlines remain for ordinary ranges. Numeric labels adapt to available space rather than colliding or extending the card; the first and maximum values remain visible. Exact recorded values remain available through point selection.
- Training week and Weight (kg/lb) labels remain explicit. Unknown displays Weight without an invented unit. Undated historical records cycle in the existing detail area instead of expanding a long list.
- Native horizontal scrolling, interruptible snapping, keyboard navigation, 44-point controls and reduced-motion behavior are retained. Larger text and short landscape/keyboard viewports retain a scrolling accessibility fallback rather than clipping content.
- History selects one saved workout at a time and pages results to fit. Settings selects one existing section at a time. These are presentation changes to existing DOM/forms; existing export, import, authentication and sync actions remain bound, and no saved data is modified by paging.

The user's request for solid surfaces and no top blur takes precedence over the skill's suggestion of translucent toolbar treatments.

## Preservation and validation

Protected logging-card sections, weight controls, reps slider, effort controls, gesture logic, Spotify integration, programme, storage and celebration sources remain unchanged. Existing hashes continue to enforce this boundary.

Chromium and WebKit checks cover 390×844, 47/34-point safe areas, normal and lost-status-inset viewport signatures, keyboard/mismatched-size non-compensation, opaque top-surface geometry, navigation alignment, eight-row overview, same-size report cards, units, readable labels, no vertical overflow at the standard iPhone size, all history results through paging, all Settings sections, enlarged text and reduced motion. The WebKit suite now runs in CI alongside dashboard, history, Spotify and completion tests.

History/completion tests cover persistence, rollover, active-session restoration, green completion state, final plate impact and simultaneous return to Home, fallback/reduced motion and Undo. No physical iPhone is attached to this environment: system-level blur and final physical-screen alignment still require confirmation on the user's device. Browser simulation is not presented as physical-device verification.

Release: Version 44 / LT Version 10.
