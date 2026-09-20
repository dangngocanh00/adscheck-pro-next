---
phase: 5
title: "Device login and simulated Ad Accounts workspace"
status: superseded
priority: P1
dependencies: [1]
effort: "2 days"
---

# Phase 5: Device login and simulated Ad Accounts workspace

## Overview

Add the observed “Đăng nhập trên thiết bị mới” gate and a clearly labelled simulated post-extension Ad Accounts operations workspace with filters, bulk actions, and account detail.

## Context & key insights

- Observed modal: title, explanatory copy, remaining-session context, Pro-session action, and regular-session action over a blurred/scrimmed Ad Accounts page.
- Exact account table is unavailable in the authorized source session. Preserve the observed modal accurately; treat everything after choice/extension readiness as a product simulation.
- Avoid unsafe invented actions. Prioritize inspect, refresh, tag, export, and detail rather than delete/disable advertising accounts.

## Requirements

- Modal: deterministic trigger, Pro/regular choices, disabled/quota state, close/escape path, focus trap/return, no background interaction.
- Workspace: search, status/BM/permission/currency/risk filters, sorting, pagination, select-all-current-page, refresh/export/tag bulk actions, detail drawer.
- States: skeleton, ready, no accounts, no filter results, stale data, simulated error with retry.
- Mobile: account cards with select/status/primary metric/actions; filters in a labelled sheet; no squeezed desktop table.

## Architecture

`extensionMode` selects install gate vs device choice vs workspace. Session choice updates quota presentation and logs a notification. Table state is URL-owned; selection is page-local and clears predictably on filter/page changes. Detail is deep-linkable by anonymous fixture ID. Bulk actions update store records and announce affected count.

## Related code files

- Create: `src/features/ads-check/ads-check-device-login-dialog.tsx`, `src/features/ads-check/ads-check-adaccounts-workspace.tsx`, `src/features/ads-check/ads-check-adaccounts-table.tsx`, `src/features/ads-check/ads-check-adaccount-detail.tsx`
- Modify: `src/pages/ads-check-pro-adaccounts-page.tsx`, `src/features/ads-check/ads-check-demo-store.ts`, `src/features/ads-check/ads-check-demo-data.ts`, `src/styles/ads-check-pro.css`

## Implementation Steps

1. Reproduce modal hierarchy/scrim/blur and the two observed choices using anonymous session counts.
2. Define state transitions for close, Pro quota unavailable, Pro success, regular success, and retry/reset.
3. Build toolbar and URL-backed filters/sort/page with applied-filter chips and “Xóa bộ lọc”.
4. Build semantic desktop table with labelled checkboxes, `aria-sort`, tabular values, status text/icons, and stable row actions.
5. Add safe bulk refresh, export feedback, and local tag assignment; show selection scope and completion count.
6. Add account detail drawer with overview, permissions, spend context, recent checks, copy-ID feedback, and deep link.
7. Build mobile cards/filter sheet and verify selection/detail behavior across navigation and resize.

## Todo

- [ ] Permanent “Dữ liệu mô phỏng” disclosure in workspace context.
- [ ] No real ad-account IDs, BM names, spend, balances, or session counts.
- [ ] Selection never silently includes records outside the visible page.
- [ ] Modal actions have source-like names and explanatory accessible labels.

## Success Criteria

- [ ] Source-observed modal content/order/state is visually and behaviorally represented without exposing source data.
- [ ] Search, every filter, sort, page, bulk action, and detail deep link produce deterministic results.
- [ ] Desktop table is operable by keyboard; mobile cards expose the same decisions without horizontal page scroll.
- [ ] Closing/reopening and Pro/regular choices preserve predictable focus and history behavior.
- [ ] Users can always return to the extension-install gate or reset the simulation.

## Risk Assessment

Primary risk is presenting invented post-extension UI as an exact clone. Keep the disclosure persistent, isolate fixture/schema assumptions, and schedule a comparison pass whenever authorized source evidence becomes observable.
