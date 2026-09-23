# Training — PPLUL

An offline-first, iPhone-focused workout tracker built from `workout_app_handover.md`.

## Use

Open the hosted app in Safari and choose Share → Add to Home Screen. Open it once online before going offline. The Windows computer does not need to stay on for the hosted app.

- Five workout decks plus a one-tap Bonus tile.
- Swipe across the card, including buttons; the reps slider has its own gesture. Left/right wraps through unfinished exercises. Arrow buttons and keyboard navigation are also supported.
- Working weight, reps and effort are optional. An untouched card completes without an invented log.
- New rep entries use each exercise's prescribed range, with numbered stops and an optional short haptic tick on supported devices. Historical results are never clamped to the current range.
- Dumbbells use 2.5 kg per hand. Other weight steps and units are configured on the exercise card. The first weight adjustment uses the previous actual weight when available; subsequent taps change it by the chosen step.
- Exercise variant selectors have been removed. Programme changes belong in configuration.
- Done saves, turns the card green briefly, then removes it from the deck. There is no completion toast. Undo is available through Workout options → Completed exercises. Tap Bonus again to undo it.
- New week explicitly confirms and saves the archived week and next week together, including unfinished drafts.
- History includes the six earlier actual logs plus the four reported Legs results dated 23 September 2026. Leg Extension 175 × 10 and Calf Raises 22 × 10 have Unknown units and display no suffix. Weight set-up supports kg, lb and Unknown; no conversion is performed.
- Hip Thrusts have been removed from the active programme. Existing archives are preserved, including any Hip Thrusts they contain. The current decks contain 8/8/5/7/6 exercises.

## Data and backups

IndexedDB stores a single versioned state snapshot transactionally. Writes use a revision check to avoid a stale tab overwriting a newer tab. A failure leaves the saved week intact and offers Retry. Close or reload stale tabs when prompted.

Backup & settings exports full JSON for restore and CSV for spreadsheet review. JSON restores units, precision, drafts, position, current week and archives. Restore validates and applies current programme migrations before replacing data, and requires confirmation. Historical snapshots remain unchanged. Browser storage is device-local and can be removed by browser settings or storage eviction; export regularly. No automatic cross-device sync is claimed.

A service worker caches the local application assets. New versions activate once older app windows close. Increment the service-worker cache version whenever the application assets change.

## Develop on Windows

Install Node.js, then run `npm start` from this directory and open the printed local URL. No compilation or production dependencies are required. `dist/` contains the complete static website and can be hosted over HTTPS. Its relative URLs support subdirectory hosting.

For tests, run `npm ci` then `npm test`.

## Verification

Automated model tests cover routine counts, bidirectional wraparound, removal, counters, null logs, historical precision, archive snapshots and backup validation. Storage tests exercise atomic save, failure rollback and stale-tab rejection. Browser checks cover direct entry, card drag, logging, reload/resume, Undo, archive confirmation and history.

Still requires an actual iPhone 13 check: touch arbitration with the slider, lock/unlock, standalone installation, offline relaunch and restoration from a downloaded backup on another device. Desktop-sized and phone-sized browser checks cannot substitute for physical-device verification.
