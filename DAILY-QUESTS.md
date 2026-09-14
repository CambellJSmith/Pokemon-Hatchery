# Daily Quests

Pocket Hatchery uses the existing `dailyQuests` save field for a working three-job daily noticeboard.

## Daily board

- Three quests are selected for each local calendar day.
- The selection is deterministic for that player and date, so reloading cannot reroll the board.
- Each quest stores the relevant statistic as a baseline when the board is created. Only progress made after that baseline counts toward the daily job.
- Existing saves with the dormant empty `dailyQuests` structure are upgraded additively; no public save-version or schema-revision change is required.
- A new board replaces the previous board on the next local day. Unclaimed rewards from the previous board expire.

## Quest pool

The base pool includes hatching an egg, catching a Pokémon, buying Poké Balls, and buying an egg. Contextual jobs are added when the save can reasonably perform them, including starting an expedition, using a berry, winning a competition with a complete team, and selling an expedition keepsake.

## Rewards

Completed quests award Pokédollars only when claimed. Individual rewards and **Claim ready** are both supported. Claims increment the existing `statistics.dailyQuestRewardsClaimed` counter.

Reward claims use the same reload-safe save pattern as achievement claims: the application performs a final save first, the quest reward is written to the save, stale page-hide writes are blocked, and the Quests tab reopens after reload.

## Interface

The **Quests** tab is available in desktop and mobile navigation. It shows current progress, reward values, claim state, and the current local-day board. The hatchery help dialog also receives a Daily Quests explanation.
