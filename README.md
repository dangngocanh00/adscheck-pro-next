# Fun Agency HRM

Frontend-only HRM prototype for Fun Agency. It includes role-aware dashboards, the agency's real position catalog, employee operations, approvals, attendance, payroll, organization editing, dark mode, responsive layouts, and realistic local mock data.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run build
npm run lint
npm run test:e2e
```

Chrome/CDP UI capture instructions: [`docs/chrome-playwright-capture.md`](docs/chrome-playwright-capture.md).

## Main routes

- `/login`: demo sign-in.
- `/`: role-aware dashboard and charts.
- `/hr-center`: connected HR operations center for employee lifecycle, schedules, contracts, assets, reports, and employee experience.
- `/work-inbox`: shared HR work queue with SLA, priority, ownership, filters, completion, and local task creation.
- `/documents`: electronic people-document library with signing progress, expiry alerts, reminders, drafts, and downloads.
- `/org-chart`: draggable organization editor with draft confirmation, review, undo/redo, keyboard moves, and mobile hierarchy browser.
- `/employees`: searchable/filterable table and card views scoped to the viewer's company, managed regions, direct department, or own record.
- `/employees/:id`: employee profile with route-level access guards and permission-locked salary and mutation controls.
- `/employees/new`: five-step employee form with scoped region/role choices, session draft state, and document upload selection.
- `/approvals`: assigned-approver cockpit with three approval levels plus employee request creation, tracking, rejection feedback, and safe cancellation.
- `/departments`, `/attendance`, `/payroll`, `/settings`: interactive operations modules with local decisions, detail drawers/modals, exports, and editable settings.
- `/styleguide`: reusable components, tokens, and UI states.

Use the role switcher in the header to demo CEO, senior manager, leader, HR, accounting, and employee scopes. The global header search finds people and modules. All changes remain in local state; no API or external HR data is used.
