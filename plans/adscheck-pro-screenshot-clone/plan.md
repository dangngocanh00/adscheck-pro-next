# Ads Check Pro screenshot clone

## Overview

Recreate the observed Dashboard and multi-asset Pro workspace with privacy-safe fixtures. `/app/home` keeps the two-step story but restores the wide cinematic layout. `/app/adscheck-pro/adaccounts` gains the observed VIA, TKQC, BM, Page and Pixel workspaces after the existing extension/device gates.

## Decisions

- Keep the current product shell, version/session choices, install gate, account panel and URLs.
- Never copy names, account IDs, balances, avatars or source artwork from screenshots.
- Tabs are real controls with preserved per-tab selection and search state.
- VIA uses a full-width folder/table workspace. TKQC shows function library plus workflow. BM/Page/Pixel use wide asset-specific tables, the observed empty state, function library, and a collapsed workflow rail/drawer.
- Use Lucide icons and CSS illustrations; do not import source brand or promo assets.
- Desktop targets: 1920x1080 and 1440x900. Below 1024px, auxiliary panels become drawers; below 768px, tables become cards.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [Shared shell and state model](./phase-01-shared-shell-and-state-model.md) | Complete |
| 2 | [Asset workspaces and workflow controls](./phase-02-asset-workspaces-and-workflow-controls.md) | Complete |
| 3 | [Responsive visual regression and QA](./phase-03-responsive-visual-regression-and-qa.md) | Complete |

## Acceptance

- All five asset tabs are reachable and visibly distinct.
- VIA selection, folder/tag/note and delete-safe flows work locally.
- Functions can be added, reordered and removed from a workflow; template/flow/delay controls work.
- Keyboard labels/focus, reduced motion and responsive layouts remain usable.
- Targeted Playwright, lint and production build pass.
