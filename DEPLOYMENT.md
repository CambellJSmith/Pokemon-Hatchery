# Save-compatible deployment

Upload the contents of this folder to the existing `CambellJSmith/Pokemon-Hatchery` repository and keep the GitHub Pages domain unchanged.

## Save continuity

- Browser storage key remains `pocket_hatchery_save_v1`.
- Public save `version` remains `13`, matching the repository build already used by players.
- The new additive format is tracked by `schemaRevision: 17`.
- Existing version 1–13 saves are accepted.
- A missing competition ladder is initialised without replacing the profile.
- Existing achievements, quests, Pokédex data, PC Pokémon, EV training, expeditions, souvenirs, inventory, incubators, statistics, and unrecognised future JSON fields are retained.
- Imported version-13 backup files are also accepted.

## Expedition data

Existing `expeditions`, `expeditionLog`, `souvenirs`, berry inventory, Pokémon EV values, and expedition statistics remain in the same save object. Active routes continue from their migrated `returnAt` timestamp after deployment; ready routes settle on the next startup or clock tick. Active eggs numbered 1–50 are recalculated to the new early-game hatch curve when their stored species totals are available.

The update adds 67 berry item definitions and nine keepsake definitions without renaming any repository item IDs.

## Recovery copy

Before the first schema-revision-17 write, the original serialized save is copied to:

`pocket_hatchery_save_v1_pre_v17_backup`

The storage layer also attempts to write the same recovery copy into IndexedDB when IndexedDB is available.

## Rollback behaviour

The public save version deliberately remains 13. The previous repository loader therefore continues to accept saves written by this build and preserves the additive competition fields as unknown JSON data. Rolling the website back does not force registration.

## Important browser condition

Local storage belongs to the website origin. Keep the same protocol and hostname. Replacing files in the same GitHub Pages repository does not change the origin, but moving the game to another domain makes the old browser save unavailable at that new origin.
