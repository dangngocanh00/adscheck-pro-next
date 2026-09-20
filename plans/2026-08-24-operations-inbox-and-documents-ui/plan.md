# Operations inbox and e-document UI

Status: complete

## Goal

Close the two highest-value gaps found in the Fun Agency HRM UX audit: a unified HR work queue and an electronic document/signature center.

## Scope

- Add a role-aware operations inbox with SLA, priority, ownership, filters, detail, completion, and local task creation.
- Add an electronic document center with signing progress, expiry alerts, filters, download, reminders, and local document creation.
- Connect both routes to navigation, global search, dashboard alerts, and the HR center.
- Preserve the existing operational command-center visual language, responsive behavior, dark mode, and local-only data model.

## Acceptance criteria

- New routes provide meaningful state changes rather than toast-only actions.
- Work items and documents remain consistent while navigating during the session.
- 375px layouts have no page-level horizontal overflow and keep primary controls at least 44px.
- Light and dark modes remain legible.
- `npm run build` and `npm run lint` pass.

## Constraint

- Frontend prototype only; no external signature provider, file storage, API, or database.

## Verification

- Production build and ESLint pass after the final role/identity review.
- Desktop QA: work queue renders without horizontal overflow; dynamic SLA, filters, completion, blocked-state protection, and owner permissions work.
- Role QA: Leader task creation remains in the Leader scope; contract drafting is gated; sidebar, dashboard, search, and notifications count only accessible records.
- Document QA: multi-signer flow, clamped progress, draft/waiting/signed/expiring states, renewal, and employee-profile synchronization work.
- Mobile QA at 375px: work queue and document library have no page-level horizontal overflow, keep 44px controls, and expose no visible supporting text below 12px.
- Dark-mode QA passed for both new workflow routes.
