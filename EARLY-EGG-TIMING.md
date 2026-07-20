# First 50 egg timing

The first 50 eggs use a linear proportional ramp from 30 seconds to the species’ normal base hatch duration.

For egg number `n` from 1 through 50:

```text
progress = (n - 1) / 49
duration = 30 seconds + (base duration - 30 seconds) × progress
```

This is implemented as an equivalent multiplier on the species base duration. Egg 1 is 30 seconds, egg 50 is exactly the base duration, and egg 51 onward remains at the base duration.

The Magmarizer multiplier is applied after the early-game curve, so it still halves the resulting duration. The instant-hatch developer option still takes precedence.

## Example: base-stat total 318

The normal base duration is 318 × 30 seconds = 2 hours 39 minutes.

| Egg | Hatch duration |
|---:|---:|
| 1 | 30 seconds |
| 2 | 3 minutes 44 seconds |
| 10 | 29 minutes 36 seconds |
| 25 | 1 hour 18 minutes 7 seconds |
| 40 | 2 hours 6 minutes 39 seconds |
| 50 | 2 hours 39 minutes |
| 51+ | 2 hours 39 minutes |

Existing active eggs numbered 1–50 are recalculated once during schema-revision-17 migration when their stored base-stat total is available.
