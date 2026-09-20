# System architecture

## Application layers

- `src/mocks`: deterministic Vietnamese HRM fixtures.
- `src/types`: domain contracts for people, assignments, approvals, attendance, payroll, and organization changes.
- `src/store`: shared role, theme, navigation, and notification state.
- `src/features/org-chart`: organization command store and drag/keyboard components.
- `src/features/hr-center`: module metadata and focused operations panels for lifecycle, schedules, contracts, assets, reporting, and employee experience.
- `src/features/operations-inbox`: detailed SLA task surface and ownership controls.
- `src/features/documents`: electronic document preview and signing-flow components.
- `src/features/approvals`: three-level approval read models, assigned-approver routing, manager cockpit, and employee self-service requests.
- `src/features/ads-save`: isolated Ads Save panels, first-run version onboarding, and a data-driven Explore V8 library containing 13 groups and 75 selectable screens.
- `src/pages/ads-check-pro-adaccounts-page.tsx`: privacy-safe Ads Check Pro route variant for `/app/adscheck-pro/adaccounts`, sharing the Ads Check shell, source-observed device/extension gates, and an explicitly simulated post-extension workspace.
- `src/features/ads-check`: reusable product shell plus device-login, Ad Accounts, Extended Payment, and Billing components. Extended Payment splits its 17-field settings editor, localized/currency-aware Bubble preview, versioned storage reader, and shared promo into focused modules. Billing separates package data, the purchase builder, and order summary; its bundle price is derived from the selectable feature catalogue so the advertised discount remains an invariant.
- `src/pages/ads-check-dashboard-page.tsx`, `ads-check-extended-payment-page.tsx`, `ads-check-billing-page.tsx`, `ads-check-notification-page.tsx`, and `ads-check-account-page.tsx`: lazy destination routes backed by deterministic and anonymous demo state. Extended Payment persists only its local presentation settings. Billing keeps purchase state mounted while the checkout confirmation is shown, preserving the user's in-progress demo configuration without writing payment data.
- `src/components/ui`: reusable accessible primitives.
- `src/pages`: lazy-loaded route surfaces.

Organization moves are represented as draft commands. A command records before/after parent, effective date, note, and subordinate option. Undo/redo uses immutable draft snapshots. Saving applies the projected parent map and retains commands in local saved history.

The prototype intentionally has no backend. Production persistence must revalidate role scope and write immutable audit/history records server-side. Ads Save and Ads Check Pro keep only the explicitly remembered V6/V8 preference, device-session demo choice, shell language, extension-ready flag, and Extended Payment presentation settings in browser storage. Extended Payment settings use schema version 2 and explicitly migrate the previous field, currency, and exchange-rate keys. Post-extension Ad Accounts rows, account management, transaction history, package selection, and session records are anonymous simulation data, not captured source-account or payment records.

CSV, payslip, and document-preview downloads are generated in the browser. Approval decisions, created employees, HR tasks, e-documents, and custom positions use the shared Zustand session store. Other page-specific controls remain local component state and reset on reload unless the Ads Check storage contract above explicitly says otherwise.

HR tasks and electronic documents carry stable employee IDs and derive their visible employee names from roster selections. Employee records are scoped by company, managed region, direct department, or self depending on role; accounting has no general profile access. Approval actions require both the expected role and the assigned demo employee ID. Read models, counts, search results, and mutations use the same shared predicates before presentation; production APIs must enforce every rule independently.
