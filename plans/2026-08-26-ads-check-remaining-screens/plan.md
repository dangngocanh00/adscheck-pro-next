---
title: "Ads Check remaining screens UI/UX"
description: "Replace every Ads Check holding route with an interactive, anonymized product screen and complete the Ad Accounts device-login/post-extension demo flow."
status: completed
priority: P1
branch: "main"
tags: [ads-check, ui-ux, react, accessibility, responsive]
blockedBy: []
blocks: []
created: "2026-08-26T04:55:31.589Z"
createdBy: "ck:plan"
source: skill
---

# Ads Check remaining screens UI/UX

## Overview

Finish the local Ads Check product experience behind the already-cloned forest/mint shell. Replace the Dashboard, Extended Payment, Billing, Notification, and Account holding pages; add the observed new-device login modal; and provide a clearly labelled simulated post-extension Ad Accounts workspace.

## Evidence & honesty boundary

- Observed source: Dashboard story, Extended Payment, Billing, Notification, `/app/adscheck-pro/adaccounts` extension gate, shared navigation, locked Priority state, authenticated account panel, and “Đăng nhập trên thiết bị mới” modal with Pro/regular choices.
- Not observed: the full Account destination body and post-extension table. Those two screens remain explicitly anonymized simulations rather than claimed source clones.
- Fixtures remain local, organic, and anonymous: no real name, email, ad-account ID, session quota, invoice, or payment detail.

## Product direction

- Operational, data-dense dark forest UI; mint surfaces and lime are reserved for active/primary state.
- Use dividers and hierarchy before decorative cards; Be Vietnam Pro for Vietnamese readability and tabular numerals for metrics.
- One shared shell, session-backed version/language/extension choices, meaningful local state changes, and explicit loading/empty/recovery states.
- Desktop table becomes prioritized cards on mobile; primary touch targets remain at least 44×44px.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Shared destination shell and demo state](./phase-01-shared-destination-shell-and-demo-state.md) | Superseded by observed-source implementation |
| 2 | [Dashboard](./phase-02-dashboard.md) | Superseded by observed-source implementation |
| 3 | [Extended Payment and Billing](./phase-03-extended-payment-and-billing.md) | Superseded by observed-source implementation |
| 4 | [Notifications and account](./phase-04-notifications-and-account.md) | Superseded by observed-source implementation |
| 5 | [Device login and simulated Ad Accounts workspace](./phase-05-device-login-and-simulated-ad-accounts-workspace.md) | Superseded by observed-source implementation |
| 6 | [Responsive accessibility and regression QA](./phase-06-responsive-accessibility-and-regression-qa.md) | Superseded by executed QA evidence |

The detailed phase files are retained as pre-observation design drafts. Their unchecked proposal items are not completion claims; the implemented contract and executed evidence live in this summary and `docs/testing/ads-check-remaining-screens-tdd.md`.

## Dependencies

- Builds on the completed `plans/2026-08-25-ads-check-pro-adaccounts-reference-ui/` shell and the existing Ads Save Explore/Control Hub overlays.
- Phase 1 blocks phases 2–5; phase 6 validates all previous phases.

## Global success criteria

- Every listed route renders a real task-focused screen; no holding-page explanation remains.
- Device-login choice deterministically enters the extension gate or simulated table state and survives in-session navigation.
- Implemented filters, visible-row bulk selection, detail dialogs, notification state, and billing/payment demo actions visibly change local state.
- Playwright desktop/mobile projects and the manual browser sweep have no page-level horizontal overflow after the responsive notification fix.
- Core tabs, menus, dialogs, step changes, clipboard action, and shell controls support keyboard use and visible focus; automated checks cover the critical routed journeys.
- Existing Ads Save and Ads Check extension-gate flows remain green under lint, build, and Playwright regression.

## Unresolved questions

- Exact source geometry/content for the Account destination body and post-extension table remains unavailable; later authorized evidence should replace simulation-specific assumptions without changing route contracts.
