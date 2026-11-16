# AdsCheck Pro

Frontend workspace for AdsCheck Pro and its companion modules. Built with React 19, TypeScript, Vite, React Router, Tailwind CSS, dnd-kit, Lucide and SheetJS.

## Run locally

Requires a Node.js version supported by Vite 8 (20.19+ or 22.12+).

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open http://127.0.0.1:5174/. The root URL opens AdsCheck Pro. Keep the terminal running while using the preview.

## Routes

- `/app/adscheck-pro/adaccounts`: VIA, TKQC, BM, Page and Pixel tables, folders, tags, column settings, exports and workflows.
- `/app/home`: product introduction, interactive dashboard illustration and feature cards.
- `/app/ads-save` (alias `/ads-save`): download configuration editor and local export history.
- `/app/extended-payment`: payment presentation settings and preview.
- `/app/billing/payment`: package selection and demo checkout.
- `/app/notification`: notification center.
- `/app/account`: account and session settings.

Unknown URLs redirect to AdsCheck Pro.

## Data and persistence

This is a frontend prototype with anonymous fixtures. There is no backend, real Meta integration, browser-extension connection or payment processing. Workflow execution and device sessions are local simulations. CSV/XLSX/text downloads generate real local files.

React state holds workspace rows, selections, active workflows, execution logs and Ads Save configurations. Browser storage retains selected presentation preferences, column settings, workflow templates and tags. Language options are Vietnamese, English, Russian, Thai and Chinese.

## Checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run test:e2e
```

Playwright covers desktop Chrome and mobile Chrome. See [system architecture](docs/system-architecture.md), [design guidelines](docs/design-guidelines.md) and [Chrome capture instructions](docs/chrome-playwright-capture.md).
