# System architecture

AdsCheck Pro is a browser-only React SPA. `src/main.tsx` mounts React Router and loads shared tokens followed by AdsCheck styles. `src/app.tsx` lazy-loads the product routes; `/` and unknown URLs redirect to `/app/adscheck-pro/adaccounts`.

## Modules

- `src/pages`: Dashboard shell, Pro workspace, Ads Save, Extended Payment, Billing, Notification and Account destinations.
- `src/features/ads-check`: product shell, navigation, responsive drawers, asset tables, function catalogues, workflows, purchase flows and anonymous fixtures.
- `src/features/ads-save`: shared account/Control Hub dialogs, Explore library, configuration editor and configured workspace.
- `src/components/ui`: generic UI primitives and overlay focus helpers.
- `src/i18n`: five language dictionaries, canonical message helpers and external-store subscriptions.
- `src/styles`: shared tokens, baseline styles and AdsCheck/Ads Save styling.
- `e2e`: Playwright interaction and layout checks for desktop/mobile Chrome.

## Main flow

The Pro route renders `AdsSavePage` with the `ads-check-pro` variant and mounts `AdsCheckAdAccountsWorkspace` immediately. No version prompt, device-session selection, extension installation gate or automatic notification instruction dialog blocks entry. Existing browser preferences do not control workspace access.

The workspace owns the VIA, TKQC, BM, Page and Pixel state. Tables, filters, folders, row selections, workflow steps and dialogs are split into feature components. Workflow execution produces deterministic simulated results and local execution history. SheetJS is lazy-loaded for CSV/XLSX export.

Other destinations use `AdsCheckProductShell`. Shared navigation, shell curves, bottom navigation and responsive drawer helpers keep product chrome aligned.

All modules open directly without a version-selection welcome dialog, including Ads Save and its alias. Saved version preferences remain available to existing manual controls and never block navigation.

## State boundaries

- React state: asset rows, selections, folders, active workflows, execution logs, purchase selections, account operations and Ads Save configurations/history. These reset when their owner unmounts or the page reloads.
- `sessionStorage`: session version, demo login-session choice and extension-ready choice.
- `localStorage`: remembered version, language, Extended Payment presentation settings, UI/column preferences, function catalogue preferences, workflow mode, saved demo templates and tags/associations.

Storage validation and migrations live beside each feature. Extended Payment uses versioned settings. The `m` helper supplies stable canonical labels for existing state logic; `t` and `tx` translate at presentation boundaries.

There is no backend or server authorization. No real Meta jobs, remote scheduling, account connection or payment activation takes place. Production integrations must introduce server-side validation, authentication, persistence and audit records.
