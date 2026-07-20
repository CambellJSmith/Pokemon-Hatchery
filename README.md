# Pocket Hatchery — save-compatible competition and expedition build

Open `index.html` through a local web server so browser storage and module files behave consistently.

```sh
cd pocket_hatchery_expeditions
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Validation

Run the included checks with:

```sh
./tests/run-tests.sh
```

The checks validate JavaScript syntax, current-version save migration, imported-state sanitisation, stuck-egg cleanup, later-generation sprite migration, API cache retry behaviour, catch timing calculations, reset persistence, the paid/prepaid egg economy, deterministic egg-predator outcomes, and complete expedition departure and return behavior.

The profile-based developer unlock and its associated personal-data handling were deliberately left unchanged.

## Adaptive interface layout

- Settings panels wrap independently according to their contents instead of stretching to the tallest panel in a grid row.
- Identity and region panels stay compact; performance settings use a medium panel; theme and developer controls receive the full row when needed.
- Pokédex, PC, Pokémart, Bag, Mystery research, competition, expedition, incubator and modal-choice grids choose their column count from available width.
- Sparse pages keep sensible card widths and align cards to the start instead of expanding a few items across the entire screen.
- Page headings, stamps, action areas and side-by-side summaries wrap cleanly on narrow or unusually shaped windows.
- Short landscape screens reduce decorative padding.
- The layout pass changes only markup classes and CSS; it does not alter or migrate save data.

See `ADAPTIVE-LAYOUT.md` for the detailed layout rules.

## Egg economy

- The first onboarding egg is free.
- Eggs 1–50 use a proportional early-game speed ramp: egg 1 takes 30 seconds before item modifiers, and egg 50 reaches the species’ full base hatch duration.
- Every later egg costs ₽50 when bought from an empty incubator.
- Prepaid Eggs are stackable Pokémart consumables costing ₽50 each.
- Empty incubators remain empty only when there are no prepaid eggs available.
- Prepaid Eggs load automatically into empty incubators, prioritising the currently selected incubator and then filling other available slots.
- The player is never asked to place or consume a prepaid egg manually.
- Newly placed eggs display `incubating` immediately; the former `nesting` state has been removed.
- Every stackable consumable in the Pokémart uses a quantity-order dialog.
- Bulk Poké Ball purchases still award one Premier Ball for each ten Poké Balls purchased.

## Egg predators and Repels

- Every egg receives one independent predator check when it becomes ready to hatch.
- The base attempt chance is exactly 1 in 25.
- `egg-predators.js` stores the complete game registry of snake-like Pokémon and explicit egg thieves used by the event.
- A partner watches every incubator and blocks half of actual attempts, reducing the unprotected loss chance to 1 in 50 while a partner is present.
- Repels cost ₽350 and stack in the Bag. When no Repel is active, one activates automatically as an egg reaches hatch time.
- One active Repel protects the next five eggs across all incubators. Every hatch spends one charge, even when no predator attempt occurs.
- Repel coverage takes priority over partner protection and makes consumption impossible for all five covered eggs.
- Every Repel-covered hatch and every successful partner defence is saved and displayed in a modal when the egg hatches.
- An unprotected successful attack removes the egg, increments the existing egg-loss statistic, and displays an incident modal.
- Persistent notice records ensure a protection message waits safely if another dialog is already open.

See `EGG-SAFETY.md` for the predator registry and exact resolution order.

## Reset behaviour

“Reset everything” blocks all late save writes, clears every `pocket_hatchery_` key from local and session storage, clears the IndexedDB recovery backup, and reloads only after cleanup finishes. Other applications’ keys on the same origin are preserved.

## Legendary Mystery Items

- `legendary-items.js` is the dedicated database for 71 Legendary Pokémon and their associated relics.
- Galarian Articuno, Zapdos, and Moltres are not separate entries.
- Manaphy is explicitly exempt and retains all of its existing special egg behaviour.
- A listed Legendary is excluded from random egg selection unless its relic count is above zero in `state.items`.
- A prepared Legendary egg checks the relic again at the moment of hatching.
- Relics appear in the Bag under the **Mystery Items** pocket and are not consumed by hatching.
- Mystery Items are registered for the bag but are not sold by the Pokémart.

## Legendary Mystery Item progression

- `legendary-items.js` contains all 71 Legendary relic records and their automatic unlock goals.
- Manaphy remains exempt from the Legendary relic gate and keeps its existing egg behaviour.
- Relics unlock from existing progression data only: typed Pokédex encounters, typed catches, Legendary catch groups, wallet balance, Poké Balls bought, eggs hatched, competition victories, and profile age.
- The Bag includes a collapsible Mystery research ledger with live progress for every locked relic.
- Earned Mystery Items are permanent and are not consumed by egg formation or hatching.
- The complete goal table is in `legendary-unlock-goals.md`.


## Expeditions

The repository expedition system is fully included rather than merely preserving its save fields.

- A PC Pokémon can be sent to one of 45 canon locations: five locations for each enabled generation.
- Expeditions last a hidden random duration from 2.5 to 12 hours. The interface deliberately does not reveal the exact return time.
- A sent Pokémon is removed from the PC, showcase team, and partner position until it returns.
- Active routes and recent return records are shown in the PC room.
- Ready routes settle automatically during startup and the one-second game clock, or through the **Welcome back** control.
- Returning Pokémon gain XP and can level or evolve through the existing growth system.
- Returns award Pokédollars, Poké Balls, berries, and harmless expedition keepsakes.
- The Pokémart includes all 67 repository berries. Every berry is a bulk-purchasable consumable.
- Berries apply capped training values: at most 252 points per stat and 510 total per Pokémon.
- Nine expedition keepsakes appear in their own Bag pocket and can be sold individually or all at once. They are never sold by the Pokémart and never substitute for unique items.
- Expedition starts, completions, berry use, keepsakes found, and keepsakes sold are tracked in statistics.
- An unfinished competition temporarily blocks expedition departure so a registered six-member lineup cannot lose a participant mid-match. Legendary Pokémon are otherwise permitted on expeditions.
- If PokéAPI is unavailable when a route returns, the Pokémon still returns safely with its rewards and recorded XP.

Existing version-13 expedition records, logs, souvenirs, berry inventory, and EV training values are retained. The expedition duration conversion remains part of the additive migration history.


## Competition ladder

The former one-step stat-total showcase has been replaced with a complete ranked competition loop.

- Five permanently unlocked league classes use peak rating for progression: Local, Bronze, Silver, Gold, and Master.
- Cautious, Standard, and Elite difficulty settings alter entry fees, opponent strength, IV quality, prizes, and rating movement.
- Each league has a persistent named rival with a specialty archetype and a saved head-to-head record.
- Rival lineups must be scouted before entry. Once revealed, the six species remain fixed until that showcase is completed, including across reloads.
- Legendary Pokémon are permitted on both player and rival teams. Rival selection does not use the Legendary egg-item gate.
- The player can reorder their six. Competitions are judged as six ordered head-to-head rounds, so lineup placement affects the result.
- Teams earn up to a 6% balance bonus from type diversity and varied statistical roles; duplicate species reduce that bonus.
- Entry fees and per-league cooldowns are committed when the showcase starts.
- The first three rounds are resolved before the player chooses a halftime tactic: Steady Finish, Rally the Team, or All-in Finale.
- Active halftime matches are saved and can be resumed instead of rerolled.
- Wins award variable Pokédollar prizes, XP, rating, streak bonuses, rival records, and higher-class unlocks. Losses still award a smaller XP pool.
- Rival scouting uses bounded attempts and no recursive retry loop.

Competition calculations are isolated in `competition-engine.js` and covered by `tests/competition-engine.test.js`.


## Save compatibility release

This package uses the existing `pocket_hatchery_save_v1` browser key and public save version 13 with additive `schemaRevision: 19`. It accepts public save versions 1 through 13. When an older schema revision is loaded, the original serialized save is copied to `pocket_hatchery_save_v1_pre_v19_backup` before the first schema-revision-19 write.

The additive migration preserves fields introduced by the repository's version-13 build, including achievements, daily quests, caught-species records, training values, expeditions, expedition logs, souvenirs, expanded statistics, and any future unknown JSON fields. The competition ladder is added alongside those fields rather than replacing them.

Because the public `version` remains 13, the repository's previous version-13 loader can still open a save written by this package if a deployment is rolled back.


Existing active expeditions created before the half-duration update are shortened once during migration. Existing active eggs numbered 1–50 are also recalculated onto the new proportional hatch curve when enough species data is already stored. Neither migration removes the Pokémon or egg. Expedition rewards retain the previous 5–24-hour value scale.
