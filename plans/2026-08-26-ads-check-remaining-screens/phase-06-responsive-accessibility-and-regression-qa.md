---
phase: 6
title: "Responsive accessibility and regression QA"
status: superseded
priority: P1
dependencies: [2, 3, 4, 5]
effort: "1.5 days"
---

# Phase 6: Responsive accessibility and regression QA

## Overview

Validate every new route and state across desktop/mobile, keyboard/screen reader semantics, reduced motion, visual fidelity, and existing Ads Save/Ads Check regressions.

## Context & key insights

- Observable source states can be compared directly; unobserved destinations are checked against the shared design system and interaction contract only.
- Existing baseline is 16/16 Playwright tests for Ads Save and the extension-gate Ad Accounts shell.
- Console capture and runtime errors must be checked during browser journeys, not inferred from build success.

## Requirements

- Viewports: 320×568, 375×812, 768×1024, 1024×768, and 1440×900; portrait and one mobile landscape pass.
- A11y: keyboard-only journeys, focus visibility/order, dialog trap/return, headings/landmarks, labels, live regions, table semantics, contrast, zoom/text growth.
- Quality: lint, TypeScript production build, full Playwright suite, visual captures, console/network review, no source/private fixture leakage.

## Architecture

Expand the existing Playwright project with route-specific page objects/fixtures only when reuse reduces duplication. Reset the demo store before each test. Keep screenshot baselines split between observed-source parity and simulation contract snapshots.

## Related code files

- Modify: `e2e/ads-check-pro-adaccounts.spec.ts`, `playwright.config.ts`, `docs/design-guidelines.md`
- Create: `e2e/ads-check-remaining-screens.spec.ts`
- Verify: `src/pages/ads-save-page.tsx`, all `src/pages/ads-check-*.tsx`, all `src/features/ads-check/*`, Ads Check style sheets

## Implementation Steps

1. Add smoke/deep-link tests for all destination routes and assert no holding text remains.
2. Cover device-login branches, quota-disabled state, install/workspace reset, and focus restoration.
3. Cover Dashboard actions; payment/billing mutations; notification badge/deep links; account session protections.
4. Cover Ad Accounts filters, sort, pagination, selection scope, bulk actions, detail deep link, empty/error recovery, and mobile cards.
5. Run keyboard-only tab-order and Escape tests; assert accessible names, `aria-sort`, live announcements, and touch target geometry.
6. Capture five breakpoint snapshots, compare observable source states, scan overflow, and test reduced-motion.
7. Run `npm run lint`, `npm run build`, and `npm run test:e2e`; review console errors and document simulation boundary.

## Todo

- [ ] Existing 16 tests stay green before adding new assertions.
- [ ] No raw PII/source quota/payment value appears in DOM or screenshots.
- [ ] No clipped focused element under sticky header, drawer, modal, or bottom action.

## Success Criteria

- [ ] All routes and primary/edge-state journeys pass in Playwright with zero uncaught runtime errors.
- [ ] No page-level horizontal overflow at any target viewport; mobile tables are replaced by cards.
- [ ] WCAG 2.1 AA contrast, 200% zoom, keyboard, focus, and reduced-motion checks pass.
- [ ] Observable source modal/gate remains high-fidelity; simulated screens are clearly labelled and internally consistent.
- [ ] `npm run lint`, `npm run build`, and the complete E2E suite pass.

## Risk Assessment

Snapshot-only tests can bless inaccessible behavior. Require behavioral assertions before screenshots, run manual keyboard/zoom checks, and separate source-parity baselines from simulation baselines.
