# Agency HRM UI implementation

Status: complete

## Phases

1. Foundation: Vite, tokens, shell, mock domain model.
2. Product surfaces: dashboard, employees, profile, operations modules, styleguide.
3. Organization editor: typed nodes, drag rules, drafts, review, undo/redo, keyboard alternative.
4. Quality: responsive, dark mode, accessibility, build and visual review.

## Acceptance criteria

- The flows in the supplied brief work with local mock state.
- Role switching visibly locks restricted salary data.
- Organization changes are confirmed, drafted, reviewable, undoable and keyboard operable.
- Desktop, tablet and 375px layouts avoid page-level horizontal overflow.
- `npm run build` passes.
