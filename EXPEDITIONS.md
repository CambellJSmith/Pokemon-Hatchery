# Expedition system

## Route rules

- Duration: a hidden random value from 2.5 through 12 hours.
- Availability: only locations belonging to generations enabled in the player profile are offered.
- Departure: the Pokémon leaves the PC and is removed from the showcase team and partner position.
- Return: the Pokémon re-enters the PC with XP, possible level/evolution changes, money, Poké Balls, berries, and keepsakes.
- Settlement: ready routes settle at startup, on clock updates, or from the PC return control.

## Locations

| Generation | Region | Locations |
|---|---|---|
| I | Kanto | Viridian Forest; Mt. Moon; Diglett’s Cave; Safari Zone; Cerulean Cave |
| II | Johto | Ilex Forest; Ruins of Alph; Lake of Rage; National Park; Mt. Silver |
| III | Hoenn | Petalburg Woods; Granite Cave; Meteor Falls; Mt. Pyre; Shoal Cave |
| IV | Sinnoh | Eterna Forest; Great Marsh; Iron Island; Turnback Cave; Spear Pillar |
| V | Unova | Pinwheel Forest; Desert Resort; Chargestone Cave; Dragonspiral Tower; Relic Castle |
| VI | Kalos | Santalune Forest; Glittering Cave; Reflection Cave; Frost Cavern; Terminus Cave |
| VII | Alola | Melemele Meadow; Lush Jungle; Wela Volcano Park; Vast Poni Canyon; Aether Paradise |
| VIII | Galar | Slumbering Weald; Glimwood Tangle; Lake of Outrage; Crown Tundra; Isle of Armor |
| IX | Paldea | South Province; Tagtree Thicket; Asado Desert; Area Zero; Glaseado Mountain |

## Reward pools

- Poké Balls: Poké Ball, Great Ball, Ultra Ball, and Premier Ball.
- Berries: all 67 berry definitions from the repository shop database.
- Keepsakes: Tiny Mushroom, Pretty Feather, Heart Scale, Pearl, Stardust, and the red, blue, green, and yellow shards.

Reward quantity and XP/money use twice the stored travel duration, preserving the previous reward scale after travel times were halved. Keepsakes are sellable only and cannot replace unique shop or Mystery Items.

## Existing active routes

Active routes created under the previous 5–24-hour range are converted once to half their original total duration. In this package, the original save is preserved in the pre-v17 migration backup before any outstanding additive migration is written.
