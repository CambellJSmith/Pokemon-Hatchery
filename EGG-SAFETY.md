# Egg predators and automatic protection

## Resolution order

Each egg is checked exactly once when its hatch timer finishes and its Pokémon record is ready.

1. If an active Repel has charges, the egg uses one charge and is completely protected.
2. If no Repel is active but at least one Repel is in the Bag, one activates automatically with five charges; the current egg immediately uses the first charge.
3. The game rolls the base predator attempt at **1 in 25**.
4. Repel-covered eggs hatch safely whether an attempt occurs or not.
5. Without Repel coverage, an assigned partner blocks **50%** of actual attempts.
6. If neither protection applies, the predator consumes the egg and the incubator becomes empty.

A partner changes the actual egg-loss probability from 1/25 to 1/50. A Repel covers five eggs globally across all incubators. Every egg that reaches hatch time spends one charge, including eggs for which no predator appears.

## Hatch popups

Every Repel-covered egg queues a persistent popup after it hatches. The popup reports how many of the five protections remain and, when an attack occurred, names the predator that was repelled.

When a partner blocks an actual attempt, the hatch popup names both the partner and the predator. If another dialog is already open, protection notices wait until it closes.

An eaten egg produces an immediate incident popup and increments `statistics.eggsLostToSnakes`.

## Predator registry

The list is stored in `egg-predators.js`. Selection prefers predators from the generations enabled in the current save; if an enabled-generation set contains no registered predator, the full registry is used so the event still functions.

- Generation 1: Ekans, Arbok, Onix, Dratini, Dragonair
- Generation 2: Dunsparce, Steelix, Sneasel
- Generation 3: Seviper, Milotic, Huntail, Gorebyss, Rayquaza
- Generation 4: Weavile, Giratina
- Generation 5: Snivy, Servine, Serperior, Tynamo, Eelektrik, Eelektross
- Generation 6: Zygarde
- Generation 8: Silicobra, Sandaconda, Eternatus, Sneasler
- Generation 9: Orthworm, Dudunsparce

The registry is data-driven. New entries can be added without changing the event resolver.

## Repel

- Item ID: `repel`
- Pokémart price: ₽350
- Stackable: yes
- Manual use button: none
- Activation: automatic when an egg reaches hatch time and no Repel is already active
- Coverage: the next five eggs that reach hatch time
- Charge use: one charge per hatch, whether or not a predator attempt occurs
- Protection rate: 100% while coverage is active
- Save field: `activeItemEffects.repelEggsRemaining`
