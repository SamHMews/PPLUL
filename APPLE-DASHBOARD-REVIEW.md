# Apple Design review — 20 October 2026

Reviewed the dashboard, Day Overview, reporting and footer against the supplied [Apple Design skill](https://github.com/SamHMews/PPLUL/blob/main/SKILL.md), especially response, direct manipulation, interruptibility, spatial consistency, accessibility and typography.

## Changes

- Use native horizontal scrolling and scroll snapping for the exercise graph carousel. Cards track the finger and inherit the browser's momentum; a swipe can be interrupted without a custom animation lock. Keyboard arrows and 44px previous/next controls provide equivalent access. Each workout retains its selected graph while switching days.
- Each exercise has its own graph, with the current exercise configuration supplying its initial weight unit. Unknown values have no suffix. If historical units differ, a compact recorded-unit selector preserves access to those records without conversion or false relabelling. The exercise checklist and multi-line filter interface are removed.
- Use 10-unit chart increments and increase chart height to keep labels separate. For exceptional ranges above 1,000, increments grow by multiples of ten to bound rendering work. Saved values, missing-week gaps, zero values, earlier records and removed exercise history remain intact.
- Keep system typography and optical sizing; replace dashboard pixel font sizes with rem values and let long exercise names wrap. At enlarged text sizes, content scrolls within the dashboard rather than clipping controls or hiding navigation.
- Make small navigation, new-week and chart controls at least 44px, improve muted text contrast, show press feedback immediately, and expose selected data points to assistive technology. Chart points retain larger invisible hit areas and a visible keyboard focus treatment.
- Tile entrances now fade without overriding the tile's pressed transform. Chart drawing uses a transform-based reveal. Motion is decorative and never blocks input; reduced motion keeps the same functionality without movement.
- Add increased-contrast treatment for labels, boundaries and chart gridlines. Solid structural surfaces already satisfy reduced-transparency preferences.
- Reserve the iPhone status safe area outside the scrolling content. Remove the previous overlaid status-area mask. Size the dashboard shell from the visible viewport and update it on resizing, foregrounding and restored pages; ignore pinch-zoom scale changes. The footer is inside this fixed-height shell and includes the bottom safe area.

## Intentional user-directed choices

The skill recommends translucent floating toolbars. The user explicitly requested a solid bottom bar and no blurred content near the status area, so these regions remain opaque and do not overlay scrolling content. Compact overview proportions and the established muted purple/green palette are retained. Native scrolling supplies graph gesture physics without adding a spring library or changing exercise-deck gestures.

Individual exercise logging cards, Spotify control appearance and command behavior, programme definitions, persistence, week archiving and completion animations are outside this visual revision. Source-preservation checks remain in force. The only app integration additions are dashboard viewport setup and the release version.

## Verification

- Dashboard regression: iPhone 13 dimensions, 47px top and 34px bottom safe-area reservation, shorter visual viewport, eight-row and short-workout layouts, 200% text, increased contrast, reduced motion, actual touch swipes between graph cards, keyboard navigation, point selection, current/historical/Unknown unit handling and ten-unit axis labels.
- WebKit regression: standalone-mode simulation at 390×844, reserved status area, visible bottom navigation, eight exercises, visible-viewport resizing and enlarged text. This is a WebKit simulation, not a physical iPhone run.
- Existing history and completion regressions verify saved records, frozen historical references, restored sessions, green card state, final plate sequence, reduced-motion/fallback completion and Undo. Protected source hashes verify exercise-card controls and animation files remain unchanged.

Run `node dashboard-regression.cjs` with Playwright Chromium installed. Run `node iphone-shell-regression.cjs` with Playwright WebKit installed. Standard history and completion checks remain part of repository CI.
