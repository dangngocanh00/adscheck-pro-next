# Ads Save reference UI

## Goal

Build a standalone React route at `/app/ads-save` that faithfully reproduces the supplied Ads Save installation screen within the AdsCheck application.

## Direction

- Dark forest application frame with a compact utility header and icon rail.
- Pale mint clipped workspace containing two white installation choices.
- Bright green reserved for the active route and primary action.
- Desktop measurements follow the 1280×720 reference; mobile follows the 390×844 reference.
- Third-party trademark graphics are replaced with original geometric marks while preserving size and hierarchy.

## Phases

1. Add the isolated route and responsive component.
2. Recreate visual tokens, cards, navigation, and floating promotion.
3. Add every reference popover, account panel, Control Hub/Explore modal, and mobile drawer control.
4. Expand Explore V8 into the complete 13-group, 75-screen guide library.
5. Add local interactions, accessibility, and reduced-motion behavior.
6. Audit every remaining source button and add first-run onboarding controls.
7. Build, lint, and compare desktop/mobile screenshots.

## Success criteria

- Route uses its dedicated AdsCheck workspace shell.
- Desktop and mobile composition match measured geometry.
- Toggle, retry, account, language, version, Control Hub, Explore V8, dismiss, and purchase feedback work locally.
- Keyboard focus and semantic labels remain visible.
- Existing routes and production build remain healthy.
- Every Explore group and its 70 tutorial entries can be searched and opened.
