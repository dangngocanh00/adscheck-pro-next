# Phase 02 — verification

## Checks

- [x] Build and lint pass.
- [x] No console errors on `/app/ads-save`.
- [x] Compare at 1280×720 and 390×844.
- [x] Confirm no horizontal overflow at 390px.
- [x] Confirm menu opens/closes, edition toggle changes state, and actions announce feedback.
- [x] Confirm existing root dashboard still loads through unchanged routing.

## Risks

- Global styles may leak into the route; mitigate with a root-scoped reset.
- Exact proprietary font may not be available; use a close local humanist sans fallback.
- Reference floating promotion overlaps content on mobile; preserve the gesture while keeping close control reachable.
