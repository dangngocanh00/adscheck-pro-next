# Phase 2: Asset workspaces and workflow controls

## Overview

Implement the observed VIA, TKQC, BM, Page and Pixel states. Make every visible control produce truthful local feedback.

## Related files

- Create tab-specific table, function-library and workflow components under `src/features/ads-check/`.
- Modify `src/pages/ads-save-page.tsx` only for workspace integration/promo visibility.
- Update `e2e/ads-check-pro-adaccounts.spec.ts` for new behavior.

## Implementation steps

1. VIA: render anonymized rows with connection, browser/history, tag, note and remove controls; add select-all, floating bulk actions and folders.
2. TKQC: render an active-account row, balance/threshold/limit fields and unauthorized-account disclosure.
3. BM/Page/Pixel: render screenshot-like empty states and asset-specific headers/toolbars.
4. Build searchable accordion function library from typed per-asset groups.
5. Clicking a function adds a workflow step; support remove and move up/down.
6. Add template, flow and delay controls; enable Start only with selected assets and steps.
7. Use confirmation dialogs for destructive/demo-only actions and live feedback for local mutations.

## Success criteria

- [x] VIA, TKQC, BM, Page and Pixel each expose their intended screen.
- [x] Search, selection, tag/note/folder changes and safe delete confirmation work.
- [x] Function-library search/accordion/add and workflow reorder/remove/start work by keyboard.
- [x] Page/Pixel use the observed one-line no-data state while surrounding controls remain clearly local and demo-safe.
