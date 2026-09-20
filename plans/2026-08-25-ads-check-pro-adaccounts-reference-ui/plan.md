# Ads Check Pro Ad Accounts reference UI

## Scope

Recreate every state and control visible at `/app/adscheck-pro/adaccounts` while the source reports that SMIT Connect is unavailable. Preserve the existing Ads Save implementation and use anonymized account fixtures.

## Delivery

- Add the exact local route and active Ads Check Pro rail state.
- Reuse the forest shell, install cards, retry action, Explore V8, Control Hub, language and version menus.
- Match the Pro/locked Priority header and authenticated account panel.
- Connect real navigation between Ads Check Pro and Ads Save.
- Verify desktop and mobile behavior with Playwright, lint, and production build.

## Constraint

The post-extension Ad Accounts table is not visible in the authorized source session. It is excluded until the extension makes that state observable.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Playwright desktop Chrome and Pixel 7: 16/16 passed across Ads Check Pro and Ads Save regression coverage.
