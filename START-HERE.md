# Start Training

1. Extract this ZIP to a folder on your Windows computer.
2. Double-click **Start Training.cmd**. Keep its window open while using the local app.
3. Open **http://127.0.0.1:5173** in your browser.

Node.js must be installed. The app itself has no additional runtime dependencies.

The live app is at https://samhmews.github.io/PPLUL/. On iPhone, open it in Safari and choose Share → Add to Home Screen for standalone display. The files in `dist` are the complete website.

Use **Backup & settings → Export backup** regularly. JSON restores the complete app state. CSV exports results for spreadsheets. Data lives on each device; there is no automatic cloud sync.

The app includes five routines, Bonus, swipe navigation, optional weight/reps/effort, Undo directly on completed green cards, manual week archives, history and backup/restore. New reps follow each exercise's prescribed range; historical actuals stay unchanged. Weight set-up supports kg, lb and Unknown.

The tests passed for workout logic, archive preservation, backup validation, rollback on save failure and stale-tab protection. Physical iPhone testing remains: installation, real touch gestures, lock/unlock and offline relaunch.
