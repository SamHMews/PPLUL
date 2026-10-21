# Apple Design review — 21 October 2026

Reviewed the dashboard, Day Overview, reporting and footer against the supplied [Apple Design skill](https://github.com/SamHMews/PPLUL/blob/main/SKILL.md), especially response, direct manipulation, interruptibility, spatial consistency, accessibility and typography.

## Changes

- Use native horizontal scrolling and scroll snapping for the exercise graph carousel. Cards track the finger and inherit the browser's momentum; a swipe can be interrupted without a custom animation lock. Keyboard arrows and 44px previous/next controls provide equivalent access. Each workout retains its selected graph while switching days.
- Each exercise has its own graph, with the current exercise configuration supplying its initial weight unit. Unknown values have no suffix. If historical units differ, a compact recorded-unit selector preserves access to those records without conversion or false relabelling. The exercise checklist and multi-line filter interface are removed.
- Use 10-unit chart increments and increase chart height to keep labels separate. For exceptional ranges above 1,000, increments grow by multiples of ten to bound rendering work. Saved values, missing-week gaps, zero values, earlier records and removed exercise history remain intact.
- Keep system typography and optical sizing; replace dashboard pixel font sizes with rem values and let long exercise names wrap. At enlarged text sizes, content scrolls within the dashboard rather than clipping controls or hiding navigation.
- Make small navigation, new-week and chart controls at least 44px, improve muted text contrast, show press feedback immediately, and expose selected data points to assistive technology. Chart points retain larger invisible hit areas and a visible keyboard focus treatment.
- Tile entrances now fade without overriding the tile's pressed transform. Chart drawing uses a transform-based reveal. Motion is decorative and never blocks input; reduced motion keeps the same functionality without movement.
- Add increased-contrast treatment for labels, boundaries and chart gridlines. Solid structural surfaces already satisfy reduced-transparency preferences.
- Reserve the iPhone status safe area outside the scrolling content. Remove the previous overlaid status-area mask. Use the full CSS dynamic viewport in installed Home Screen mode rather than shortening it with JavaScript visual-viewport measurements. Safari tabs retain their visible-viewport handling. The footer includes the bottom safe area and centers its four icon/label groups within the whole surface, retaining clearance above the Home indicator.

## Intentional user-directed choices

The skill recommends translucent floating toolbars. The user explicitly requested a solid bottom bar and no blurred content near the status area, so these regions remain opaque and do not overlay scrolling content. Compact overview proportions and the established muted purple/green palette are retained. Native scrolling supplies graph gesture physics without adding a spring library or changing exercise-deck gestures.

Individual exercise logging cards, Spotify control appearance and command behavior, programme definitions, persistence, week archiving and completion animations are outside this visual revision. Source-preservation checks remain in force. The app integration remains limited to dashboard viewport setup and the release version. The document now requests an opaque iOS status bar to keep content out of the translucent status region; no logging-card source or animation code changes.

## Verification

- Dashboard regression: iPhone 13 dimensions, 47px top and 34px bottom safe-area reservation, shorter reported visual viewport without a standalone bottom gap, actual viewport resizing, centered footer controls, eight-row and short-workout layouts, 200% text, increased contrast, reduced motion, actual touch swipes between graph cards, keyboard navigation, point selection, current/historical/Unknown unit handling and ten-unit axis labels.
- WebKit regression: standalone-mode simulation at 390×844, reserved status area, visible bottom navigation, eight exercises, visible-viewport resizing and enlarged text. This is a WebKit simulation, not a physical iPhone run.
- Existing history and completion regressions verify saved records, frozen historical references, restored sessions, green card state, final plate sequence, reduced-motion/fallback completion and Undo. Protected source hashes verify exercise-card controls and animation files remain unchanged.

Run `node dashboard-regression.cjs` with Playwright Chromium installed. Run `node iphone-shell-regression.cjs` with Playwright WebKit installed. Standard history and completion checks remain part of repository CI.

## Screenshot follow-up — Version 43 / LT Version 9

- Installed apps use `100dvh` independently of `visualViewport.height`; a smaller reported JavaScript viewport can no longer shorten the Home Screen shell. Actual CSS viewport resizing still resizes it. The root uses the same solid footer surface while the dashboard is present.
- Footer targets and icon/label groups are centered both horizontally and vertically within the navigation surface. The bottom safe inset is included in its height, with at least 20px clearance beneath labels at the tested iPhone size.
- The status-bar meta setting is `black`, not `black-translucent`. [Apple documents](https://developer-mdn.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html) that this puts web content below the status bar. The week context also uses a stronger, solid foreground colour. Browser automation cannot reproduce iOS system compositing; physical-device verification of that effect remains necessary.
- Every graph explicitly labels its numeric axes: “Weight (kg)” / “Weight (lb)” (or just “Weight” for Unknown) above the scale and “Training week” below the week numbers. Labels sit outside SVG scaling and update when historical units are selected. No record is converted or relabelled.
- Chromium and WebKit regressions cover opaque status metadata, full standalone viewport despite a shortened reported visual viewport, navigation centering, unit labels, eight-row overview layout, enlarged text and reduced motion. Existing history/completion tests and protected-source hashes remain unchanged.
