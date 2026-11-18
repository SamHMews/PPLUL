# Missed-week reporting and Upper Day adjustments

Version 46 / LT Version 12.

Reports carry the last actual logged weight through unlogged training weeks using green dotted segments and hollow markers. Point details explicitly say Missed, Not logged yet (active week), or Weight not logged (completed legacy record), with the original source week. No inferred reps, effort or saved workout records are created. Leading weeks remain empty; unit changes reset carry-forward. Carry-forward works across report pagination boundaries and retains exact zero weights. Bodyweight-only completions are not interpreted as missing weight logs.

Upper Day uses Barbell Curl consistently for the same exercise ID, including archived names and exports, without altering recorded numbers. Bodyweight Tricep Extensions shows Bodyweight instead of weight controls/setup. Reps and effort remain mandatory; new completions store no numeric weight. Existing completed historical weights remain preserved.

The card preservation hashes were updated only for the explicitly requested bodyweight markup/validation. Other logging cards, swiping, Spotify, footer/safe areas and plate animation sources are unchanged. Tests cover dotted points and honest detail text, no source mutation, zero weights, unit boundaries, bodyweight validation/completion, rename migration, history, mobile layout, Undo and final plate timing. Apple Design guidance continues through restrained feedback, existing geometry and reduced-motion handling.
