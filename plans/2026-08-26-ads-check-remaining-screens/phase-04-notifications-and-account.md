---
phase: 4
title: "Notifications and account"
status: superseded
priority: P2
dependencies: [1]
effort: "1 day"
---

# Phase 4: Notifications and account

## Overview

Build complete `/app/notification` and `/app/account` screens connected to the header badge, account panel, session choice, billing, and Ad Accounts detail routes.

## Context & key insights

- Source exposes notification and account navigation plus account-panel actions, but not full page bodies.
- Notifications should route to the affected local object; account management should emphasize session/device safety and explain Pro usage.
- Demo profile stays masked and generic; never echo the source account name or email.

## Requirements

- Notifications: all/unread/type filters, mark one/all read, detail expansion, deep links, meaningful empty state.
- Account: masked profile summary, plan/quota, PIN demo action, active device/session list, revoke confirmation, logout/reset, Explore entry.
- Non-functional: badge count derived from store, time labels with exact accessible datetime, destructive actions separated and confirmed.

## Architecture

Notification state and device sessions live in shared store slices. Deep links carry target route and optional entity/query state. Account dialogs reuse the same accessible dialog primitive and session model as device login.

## Related code files

- Create: `src/pages/ads-check-notification-page.tsx`, `src/pages/ads-check-account-page.tsx`, `src/features/ads-check/ads-check-notification-list.tsx`, `src/features/ads-check/ads-check-session-panel.tsx`
- Modify: `src/app.tsx`, `src/pages/ads-save-page.tsx`, `src/styles/ads-check-destinations.css`, `src/features/ads-check/ads-check-demo-store.ts`

## Implementation Steps

1. Build notification command header, filters, unread count, divided list, and mobile detail sequence.
2. Connect mark-read/all-read to the rail/header badge and announce count changes without stealing focus.
3. Add type-specific deep links to payment, billing, and Ad Accounts states; preserve back navigation.
4. Build account overview with masked identity, plan/quota, PIN status, and session/device management.
5. Add revoke session, logout, and reset-demo confirmations with clear consequence and recovery copy.
6. Connect account-panel buttons to the full page or corresponding dialog anchor.

## Todo

- [ ] Long notification titles wrap without breaking actions.
- [ ] Read/unread is conveyed by text/icon/weight, not green alone.
- [ ] Current device cannot be revoked accidentally.

## Success Criteria

- [ ] Notification badge and page counts remain consistent after all actions.
- [ ] Every notification deep link reaches a meaningful destination state.
- [ ] Session management is usable with keyboard and at 320px width.
- [ ] Logout/reset clears only demo state and offers a clear route back to Ads Check.

## Risk Assessment

Account/session copy can imply real security guarantees. Label fixtures as demo, keep the current-device guard explicit, and avoid simulating credential entry or storing secrets.
