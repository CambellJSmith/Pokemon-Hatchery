# Achievement ledger

The **Achievements** tab is an additive, save-compatible layer over the existing Pocket Hatchery state.

## Catalogue size

The catalogue is generated from reusable milestone families and generation-specific goal templates.

- With all nine generations enabled, the ledger currently contains 494 achievements.
- Generation-specific cards are created only for generations selected on the registration card.
- Fixed unique-species milestones that exceed the currently possible enabled-species total are omitted.
- Completion goals use the species ranges of enabled generations only.

For example, a Generation I-only save requires 151 species for **Every Invited Species** and **Complete Enabled Collection**. Pokémon from disabled generations are neither required nor counted toward those completion totals.

## Categories

The ledger covers:

- egg hatching, buying, incubation capacity, Repel saves, partner saves, and predator incidents
- Pokédex sightings, unique catches, repeat encounters, type coverage, ball variety, and living collections
- independent progress tracks for every enabled generation
- shiny species, shiny types, repeated shiny sightings, Shiny Charm use, and shiny teams
- PC population, favourites, nicknames, partners, team composition, and unusual teams
- levels, EV training, IVs, hidden abilities, evolution records, and level-100 teams
- expedition departures, returns, active groups, synchronized group sizes, routes, berries, and keepsakes
- competition entries, wins, ratings, streaks, rival records, judging stats, leagues, and difficulty
- money, Poké Balls, Master Balls, item kinds, bag totals, plates, Mystery Items, and Repels
- releases, daily streaks, save age, birthday catches, midnight catches, duplicates, and secret oddities

## Rewards

Every achievement awards Pokédollars.

- Earned achievements can be claimed individually.
- **Claim all earned** collects every currently available reward.
- Claimed IDs use the existing `claimedAchievementIds` save field.
- Reward counts use the existing `statistics.achievementRewardsClaimed` field.
- Claiming requests a final application save, writes the reward, blocks the stale page-hide save, and reloads directly back into the Achievements tab.

Claimed achievements remain permanently completed even if a later settings or collection change would otherwise reduce their live calculated progress.

## Files

- `achievements-engine.js` contains generation metadata, context calculation, catalogue generation, and progress evaluation.
- `achievements-tab.js` contains storage-safe reward claiming, filtering, searching, paging, help integration, and tab rendering.
- `achievements-tab.css` contains the responsive ledger layout and achievement-card presentation.
- `index.html` registers the desktop/mobile tab and loads the achievement assets.

No public save-version or schema-revision change is required.
