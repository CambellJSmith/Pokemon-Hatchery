# Catching and interface performance pass

## Catching changes

Catching remains a skill interaction, but the default profiles are more forgiving:

- Poké Ball attempts use slower targets and a wider safe zone.
- Premier, Great, and Ultra Balls scale those advantages further.
- Non-Master-Ball attempts allow one missed target.
- Hard Poké Ball encounters require three successful taps out of four.
- Hard Ultra Ball encounters require two successful taps out of three.
- Low-power devices and reduced-motion users receive the lightweight **tap now** interaction rather than the animated shrinking ring.
- Master Balls remain automatic catches.

## Interface changes

- Pokédex, PC, Pokémart, and Mystery research entries render in bounded batches.
- Search input is debounced rather than reconstructing the page on every keystroke.
- Only the first 24 visible panels receive entrance animation.
- Forced synchronous layout reads were removed from interface effects.
- Internal rerenders no longer force focus back to the page container.
- Images use asynchronous decoding and off-screen lazy loading.
- Large cards use containment and `content-visibility` where supported.
- Sprite and API hosts are preconnected.
- Expedition and incubator maintenance runs every 10 seconds normally and every 30 seconds in low-power mode, while hatch countdown updates remain responsive.
- Maintenance is suspended while the tab is hidden and runs immediately when the tab becomes visible again.

## Interface performance setting

The Settings page offers three persistent modes:

- **Automatic** uses browser and device signals. It selects low power when reduced motion or Data Saver is enabled, when the device reports 4 GB RAM or four CPU threads or fewer, or when `content-visibility` is unavailable.
- **Standard** requests standard rendering, 96-item archive batches, and 10-second maintenance. Browser reduced-motion accessibility preferences are still respected.
- **Low power** forces lean rendering, 48-item archive batches, 30-second maintenance, and the lightweight catch prompt.

Lean mode removes broad page animations, infinite sprite motion, backdrop blur, image filters, hover transforms, decorative transitions, and expensive hover shadows. The selection takes effect immediately after saving and is stored with the profile.

## Compatibility layer

`compatibility.js` loads before the rest of the game and supplies small fallbacks for:

- `Object.fromEntries`
- `Array.prototype.flatMap`
- `String.prototype.replaceAll`
- `Element.matches`
- `Element.closest`
- `NodeList.forEach`
- `requestAnimationFrame`
- `cancelAnimationFrame`
- `performance.now`

API requests also work in browsers that support `fetch` but do not provide `AbortController`.

The game still requires JavaScript, `fetch`, promises, local storage or IndexedDB-backed storage, and other broadly supported modern browser fundamentals.
