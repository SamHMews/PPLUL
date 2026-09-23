# Start Training

1. Extract this ZIP to a folder on your Windows computer.
2. Double-click **Start Training.cmd**. Keep its window open while using the local app.
3. Open **http://127.0.0.1:5173** in your browser.

Node.js must be installed. The app itself has no additional runtime dependencies.

The files in `dist` are the complete website. They are ready for an HTTPS web host when you decide to publish. No website was published as part of this delivery. Using it on your iPhone independently of your computer will require hosting.

Use **Backup & settings → Export backup** regularly. JSON restores the complete app state. CSV exports results for spreadsheets. Data lives on each device; there is no automatic cloud sync.

The app includes the five routines, Bonus, full-card swipe navigation, optional weight/reps/effort, Undo, manual week archives, history and backup/restore. New reps are limited to 3–9. Earlier actual 11/12-rep logs are retained.

The tests passed for workout logic, archive preservation, backup validation, rollback on save failure and stale-tab protection. Physical iPhone testing remains: installation, real touch gestures, lock/unlock and offline relaunch.
