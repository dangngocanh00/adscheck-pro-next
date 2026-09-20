---
phase: 2
title: "Dashboard"
status: superseded
priority: P1
dependencies: [1]
effort: "1 day"
---

# Phase 2: Dashboard

## Overview

Turn `/app/home` into an operational overview that summarizes account health, recent checks, spending risk, session use, and next actions using anonymous local data.

## Context & key insights

- Only the source route label is observed; the body is a constrained native-feeling design, not a claimed source clone.
- The page should answer “what needs attention now?” before showing historical detail.
- Avoid a generic equal-card dashboard: use one command strip, a compact metric row, and divided activity/work lists.

## Requirements

- Functional: time-range filter, health/status filters, quick links, recent-check detail, risk acknowledgement, and refresh with visible progress.
- Non-functional: locale-aware dates/numbers, tabular numerals, no color-only status, skeleton for delayed refresh, and deep-linked filter state.

## Architecture

Read aggregate selectors from the shared store. Keep all derivation pure and memoized. Dashboard actions deep-link to Ad Accounts with equivalent query filters rather than duplicating table logic.

## Related code files

- Create: `src/pages/ads-check-dashboard-page.tsx`, `src/features/ads-check/ads-check-dashboard-sections.tsx`
- Modify: `src/app.tsx`, `src/styles/ads-check-destinations.css`, `src/features/ads-check/ads-check-demo-store.ts`

## Implementation Steps

1. Build a dark command strip for extension/session/account status and a single primary “Kiểm tra tài khoản” action.
2. Add compact metrics for available accounts, warnings, disabled accounts, and checked spend; every metric links to a filtered workspace.
3. Add recent checks with timestamp, result text/icon, and an accessible detail disclosure.
4. Add risk/action queue with acknowledge and open-account actions; updates must alter counts immediately.
5. Add refresh loading/success/error states with retry and an `aria-live="polite"` announcement.
6. Collapse metric grid to two columns and lists to single-column sections below 768px.

## Todo

- [ ] Organic anonymous values and Vietnamese copy.
- [ ] Filters survive refresh through the URL.
- [ ] Empty dashboard gives a useful route to Ad Accounts.

## Success Criteria

- [ ] Each metric and risk item leads to the correct filtered/detail destination.
- [ ] Refresh, acknowledge, and retry create visible, testable state changes.
- [ ] At 375px the command strip, metrics, and action list need no horizontal scroll.
- [ ] Screen-reader reading order is status → metrics → risks → recent activity.

## Risk Assessment

Unobserved source body can drift from future evidence. Keep content modules and selectors replaceable; do not embed assumed source copy or geometry in the shell.
