# Phase 01 — implementation

## Context

- Reference: `https://adscheck.smit.vn/app/ads-save`
- Target: `src/pages/ads-save-page.tsx`
- Styling: `src/styles/ads-save.css`

## Requirements

- 46px desktop header, 58px icon rail, mint workspace with 20px radius.
- 840px two-column install grid with 400px cards and 40px gap.
- Mobile header at 42px and stacked 356px-wide cards.
- No copied logos or remote assets.

## Implementation

- Add route-level lazy import before the shared shell routes.
- Compose semantic header, navigation, main content, install cards, and promotion.
- Use CSS variables scoped to `.ads-save-app` to avoid HRM token conflicts.
- Use local state for edition switch, mobile menu, promo dismissal, and toast feedback.

## Todo

- [x] Add page component.
- [x] Add scoped responsive CSS.
- [x] Register route and stylesheet.
- [x] Verify keyboard and reduced motion.
