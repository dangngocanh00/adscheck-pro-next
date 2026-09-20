# Phase 1: Shared shell and state model

## Overview

Define a privacy-safe asset model and build the shared tabs, folder rail, toolbar, table frame, pagination and responsive panel controls. Restore the wide Dashboard composition from screenshot 1.

## Context

- Current post-extension UI is one generic four-row table.
- The screenshots show dense one-pixel-divided workspaces inside the forest shell.
- Screenshot 1 belongs to `/app/home`; screenshots 5–7 duplicate Page.

## Related files

- Modify `src/styles/ads-check-dashboard-source-fidelity.css`.
- Replace `src/features/ads-check/ads-check-adaccounts-workspace.tsx` with a small orchestrator.
- Create typed fixture/config and shared workspace components under `src/features/ads-check/`.
- Replace/split `src/styles/ads-check-adaccounts-workspace.css` and responsive rules.

## Implementation steps

1. Define asset/tab/folder/row/action/workflow types and anonymized fixtures.
2. Add semantic tablist with counts, active state and accessible labels.
3. Build folder panel, compact toolbar, headers, table/card frame and footer pagination.
4. Reserve optional desktop columns for function library/workflow; add drawer toggles below 1280px.
5. Restore the Dashboard's asymmetric two-column black/green composition and top-right CTA.

## Success criteria

- [x] Shell dimensions, radii, tabs and table density track the reference at 1920px.
- [x] No screenshot identity or account identifier appears in source fixtures.
- [x] Every icon-only control has a label and visible focus.
- [x] Dashboard remains usable at 375px without page-level horizontal scroll.
