# Ads Check remaining screens — TDD evidence

Date: 2026-08-27

## Scope

- Shared Ads Check V8 shell and responsive navigation.
- Dashboard two-step story.
- Extended Payment controls and preview.
- Billing purchase, Priority, plan/session management, and transaction history.
- Notification filters, time control, search, and empty state.
- Masked Account destination.
- New-device login dialog and simulated post-extension Ad Accounts workspace.

## RED

Tests were written first in `e2e/ads-check-remaining-screens.spec.ts` and expanded in `e2e/ads-check-pro-adaccounts.spec.ts`.

The first sandboxed Playwright attempt was not valid RED evidence because Chrome stopped at launch with `SIGABRT/EPERM`. Running the same suite with browser permission produced the expected behavioral RED result: 7/7 new journeys failed because the destination screens, device dialog, and simulated workspace did not exist yet.

Covered journeys:

1. New-device Pro/regular session choice.
2. Post-extension Ad Accounts search, selection, bulk check, and detail dialog.
3. Dashboard step 1 → step 2 → step 1.
4. Extended Payment switch, surface choice, field choice, and preview state.
5. Billing Pro/Priority purchase, package/session management, and transaction history.
6. Notification filters, search, and empty results.
7. Account overview and security/session tab.

The review-driven RED pass then added contracts for the fourth Billing tab, keyboard tab navigation, state persistence across routes, mobile extension retry, Control Hub, Notification time/shortcut controls, real clipboard output, visible-row selection pruning, partial-selection semantics, persisted Extended Payment formatting, order-draft confirmation, and Pro/regular session differences.

A second reference-parity RED pass added `e2e/ads-check-payment-reference.spec.ts`. It initially failed on the prior generic Extended Payment and Billing layouts. The contract now covers the captured 75/25 and 70/30 desktop structures, all 17 Bubble fields, settings persistence and legacy migration, localized/currency-aware preview output, package-builder controls, derived bundle pricing, coupon invalidation, Priority/Pro invariants, checkout focus, return-state preservation, and page-level mobile overflow.

## GREEN

Final verification:

```text
npm run lint
PASS

npm run build
PASS — 2514 modules transformed

npm run test:e2e -- --workers=1 --reporter=line
50 passed, 0 skipped, 0 failed (desktop Chrome + mobile Chrome)
```

All implemented journeys now run in both projects, including mobile extension retry, migration protection for stale extension-ready state without a selected session, the responsive Ad Accounts card workspace, shell version/language controls, Billing checkout confirmation, and persisted Extended Payment settings.

The focused reference suite passes 6/6 across desktop and mobile. It verifies that the two captured payment surfaces retain their source-observed hierarchy, require a simulated bank before checkout, preserve builder state, migrate legacy settings safely, keep keyboard focus visible, and avoid copying source identities, balances, account IDs, or payment data.

## Coverage and repository constraints

- This repository has no configured unit coverage command, so a numeric 80% line/branch figure cannot be reported honestly. Behavioral coverage is supplied by 50 Playwright cases across desktop and mobile.
- Direct browser QA found no page-level horizontal overflow on the inspected desktop routes. Wide Page/Pixel schemas scroll only inside their table surface. A Pixel 7 sweep at 412×839 measured document `scrollWidth=412`, no off-viewport offenders, and a fully visible Notification search control. The in-app browser reports only its Vite HMR WebSocket limitation; production build and Playwright runs have no application runtime failures.

## Remaining evidence boundary

The source supplied post-extension VIA, TKQC, BM, Page, and Pixel structures, including the empty Page/Pixel asset states. The local version reproduces structure and interaction only, using masked anonymous simulations. No source identity, balance, quota, ad-account identifier, or payment detail is copied.
