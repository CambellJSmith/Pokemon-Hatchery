# Mobile compatibility layer

`mobile-compatibility.css` is loaded after every feature stylesheet and provides the final responsive rules for the game. `mobile-compatibility.js` supplies the small amount of viewport and menu state management that CSS cannot reliably provide across mobile browsers.

## Coverage

- switches the nine-item desktop navigation to a touch-sized menu before it can overflow
- supports display cut-outs and home indicators through safe-area insets
- uses the visual viewport height for mobile browser chrome and on-screen keyboards
- prevents iOS form zoom by keeping interactive text fields at 16px on compact layouts
- gives touch controls a minimum 48px target and removes hover-only movement on coarse pointers
- constrains images, long labels, grid children, and modal content so they cannot create horizontal scrolling
- converts dense forms, toolbars, summary stamps, collection grids, settings, competition sheets, expedition controls, and achievement cards to progressively simpler layouts
- presents dialogs as scrollable bottom sheets on phones
- keeps toasts, expedition launch controls, navigation, and the status bar clear of device safe areas
- includes additional handling for very narrow devices and short landscape screens

## JavaScript behavior

The helper module does not read or write game saves. It only:

- synchronizes the mobile menu state and active-tab accessibility attributes
- closes the menu on outside taps, tab selection, Escape, or a desktop-width transition
- locks background scrolling while a menu or modal is open
- updates CSS variables from `visualViewport` and the measured header height

The layer is intentionally additive so feature-specific desktop styles remain unchanged.
