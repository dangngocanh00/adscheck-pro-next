# Phase 3: Responsive visual regression and QA

## Overview

Converge visual fidelity and protect the existing first-run/install/account flows with targeted Playwright coverage.

## Implementation steps

1. Capture desktop at 1920x1080 and 1440x900; correct spacing, clipping, overflow and panel widths.
2. Verify 1024px auxiliary drawers and 375px mobile cards/touch targets.
3. Check keyboard order, dialog focus return, ARIA states and reduced motion.
4. Run targeted Playwright, lint and production build; fix all regressions.
5. Perform React/code review, secret scan, commit and push.

## Success criteria

- [x] No page-level horizontal scroll at required breakpoints.
- [x] Critical controls meet 44px touch targets on mobile.
- [x] Existing version/session/install/account navigation tests remain green.
- [x] Targeted E2E, lint and build pass with no suppressed failures.

## Risks

- Wide Page/Pixel schemas intentionally scroll inside the table region; prevent that overflow from escaping to the document.
- Wide captures compress on laptops; use drawers rather than squeezed auxiliary panels.
