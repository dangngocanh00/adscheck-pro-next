---
phase: 3
title: "Extended Payment and Billing"
status: superseded
priority: P1
dependencies: [1]
effort: "1.5 days"
---

# Phase 3: Extended Payment and Billing

## Overview

Replace `/app/extended-payment` and `/app/billing/payment` with linked local workflows for payment requests, ledger review, package comparison, quota use, and invoices.

## Context & key insights

- Source confirms both routes and the locked Priority purchase path, but destination bodies were not observed.
- Prototype actions must never imply a real charge. Confirmation copy must say demo/local state before mutation.
- Currency and dates use `Intl`; balances, invoices, and account details stay fictional and anonymous.

## Requirements

- Extended Payment: status tabs, searchable ledger, create-request dialog, request detail, cancel pending request, export feedback.
- Billing: current plan/quota, monthly/yearly selector, package comparison, upgrade confirmation, invoice list/detail, download feedback.
- Accessibility: labelled currency/amount fields, inline validation, first-error focus, confirmation for cancellation/upgrade, dialog focus trap/return.

## Architecture

Both pages consume one payment/plan slice from the demo store. A successful demo request appends a ledger item; a demo upgrade changes plan/quota and unlock presentation only. Use URL query parameters for tab, status, billing interval, search, and selected invoice.

## Related code files

- Create: `src/pages/ads-check-extended-payment-page.tsx`, `src/pages/ads-check-billing-page.tsx`, `src/features/ads-check/ads-check-payment-components.tsx`
- Modify: `src/app.tsx`, `src/styles/ads-check-destinations.css`, `src/features/ads-check/ads-check-demo-store.ts`

## Implementation Steps

1. Build Extended Payment summary, status tabs, ledger table/mobile cards, and empty/no-result states.
2. Add request form with method, amount, reference, and note; validate on blur and announce save result.
3. Add request detail drawer and cancel confirmation; offer undo toast after local cancellation.
4. Build Billing plan summary, quota progress, interval switch, and an asymmetric package comparison focused on current vs Priority.
5. Make locked Priority/Mua gói navigation land on the relevant package with focus moved to its heading.
6. Add invoice list/detail and non-destructive export/download completion feedback.

## Todo

- [ ] Every mutation is explicitly marked demo-only.
- [ ] No real provider logo, bank detail, card number, or source invoice data.
- [ ] Loading, empty, validation, success, cancel, and error states covered.

## Success Criteria

- [ ] Creating/cancelling a request updates status counts and ledger without reload.
- [ ] Choosing a plan updates the shared account/edition presentation and can be reset.
- [ ] Mobile forms use 16px+ inputs and all controls are at least 44px tall.
- [ ] Keyboard users can finish both flows and return focus to the trigger.

## Risk Assessment

Payment UI can be mistaken for a live transaction. Use persistent “Mô phỏng” context, neutral confirmation copy, no external call, no persistent payment detail, and a one-click demo reset.
