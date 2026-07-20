# Adaptive interface layout

The interface now uses content-aware wrapping rather than fixed column counts across the main pages.

## Behaviour

- Short cards keep their natural height instead of stretching to match the tallest card in a row.
- Pokédex, PC, Pokémart, Bag, Mystery research, competitions, expedition cards, theme choices and option cards choose their column count from the available width.
- Sparse collections keep sensible card widths and align to the start rather than expanding a few cards across the entire screen.
- Settings uses independently wrapping panels:
  - compact identity and region panels can sit beside each other;
  - performance settings use a medium-width panel;
  - themes and developer controls receive full width when their content needs it.
- Page headings and summary stamps wrap without overflowing.
- Short landscape windows reduce decorative padding.
- Narrow screens collapse dense grids to one column, while the Pokédex and PC retain compact two-column cards where space permits.

The changes are CSS and markup-class changes only. They do not alter save data or require a migration.
