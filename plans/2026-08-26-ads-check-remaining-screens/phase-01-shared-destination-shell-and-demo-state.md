---
phase: 1
title: "Shared destination shell and demo state"
status: superseded
priority: P1
dependencies: []
effort: "1.5 days"
---

# Phase 1: Shared destination shell and demo state

## Overview

Extract the observed Ads Check chrome into a reusable product shell, replace the generic holding-page contract, and establish one typed in-memory demo store for all remaining screens.

## Context & key insights

- Reference plan: `../2026-08-25-ads-check-pro-adaccounts-reference-ui/plan.md`.
- The current Ad Accounts route delegates to `AdsSavePage`; all other Ads Check destinations delegate to one holding component.
- Preserve the existing shell appearance and overlays. Refactor component boundaries, not the proven visual language.
- Keep demo identity and operational records anonymous; never derive fixtures from the captured source account.

## Requirements

- Functional: common top bar, desktop rail/mobile drawer, active-route state, account/Explore/Control Hub overlays, skip link, route titles, and session-scoped store.
- Non-functional: no circular imports, route-level lazy loading, stable keys, direct icon imports, and no localStorage for payment/session fixtures.

## Architecture

Create `AdsCheckProductShell` as presentation/navigation composition. Keep `AdsSavePage` and Ad Accounts public route APIs stable while moving shared chrome behind slots. A Zustand store owns anonymous profile, extension mode, login-session choice, notifications, plans, payments, and simulated ad accounts. URL query parameters own filters, tabs, sort, and page.

## Related code files

- Modify: `src/pages/ads-save-page.tsx`, `src/pages/ads-check-pro-adaccounts-page.tsx`, `src/app.tsx`, `src/styles/ads-check-pro.css`
- Replace usage: `src/pages/ads-check-linked-destination-page.tsx`
- Create: `src/features/ads-check/ads-check-product-shell.tsx`, `src/features/ads-check/ads-check-demo-store.ts`, `src/features/ads-check/ads-check-demo-data.ts`, `src/styles/ads-check-destinations.css`

## Implementation Steps

1. Inventory shared header, rail, drawer, promo, account, language, version, Explore, and Control Hub behavior; freeze their external labels and routes.
2. Extract shell slots for page heading, toolbar, content, overlays, and mobile bottom actions without changing extension-gate geometry.
3. Define typed anonymous fixture domains and deterministic seed values; expose reset helpers for E2E tests.
4. Model extension states: `unavailable`, `device-choice`, `ready`; model Pro/regular session choice separately.
5. Replace linked-destination routing with dedicated lazy page modules while keeping canonical paths unchanged.
6. Add URL-state helpers for tab/filter/sort/page and focus the destination `<main>` after navigation.

## Todo

- [ ] Shared shell supports every route and marks exactly one active navigation item.
- [ ] Demo store contains no source identity, exact quota, or payment data.
- [ ] Existing Ads Save and extension-gate screenshots remain visually stable.

## Success Criteria

- [ ] Direct loading and browser back/forward work on all six Ads Check routes.
- [ ] Shell controls retain their current accessible names and keyboard behavior.
- [ ] Refresh resets only documented demo state; navigation preserves current session state.
- [ ] No route renders the former holding-page sentence.

## Risk Assessment

Highest risk is regressing Ads Save while extracting shared chrome. Mitigate with small slot-based extraction, unchanged route props, baseline screenshots, and a regression test before destination work starts.
