# AdsCheck design guidelines

- Use Toolmeta colors from https://public.toolmeta.io/ for former blue interface colors: forest `#163B2C`, deep `#092E22`, action green `#287151`, lime `#B9FF39`, and CTA gradient `#CAFF4D` to `#B0FB30`. Retain red/yellow statuses, gold Priority styling, purple accents, neutral grays and national flags.
- Shared colors live in `ads-color-version-tokens.css`. Supplied artwork in `assets/Media Toolmeta` provides white horizontal wordmarks on dark headers, gradient symbols and the lime app icon. Use forest-green text on lime buttons for contrast.
- Keep shared navigation, shell contours, bottom navigation and drawers consistent across routes.
- Maintain dense, readable asset tables with semantic headers, tabular figures, labelled selection and visible bulk-action scope.
- Keep wide tables inside local horizontal scrollers. Auxiliary panels become drawers on narrow viewports; asset cards support mobile use.
- Reuse shared resource-count pills, column menus, date pickers, dialogs and overlay focus helpers.
- Preserve keyboard focus, accessible names, touch targets and reduced-motion behavior.
- Keep VIA, TKQC, BM, Page and Pixel workflows distinct while using shared controls.
- Extended Payment settings visibly update the Bubble preview before local save.
- Billing preserves the editable purchase selection through checkout. Local verification must not imply a real transfer or account activation.
- Ads Save configurations and exports must accurately reflect selected anonymous accounts. No remote scheduler exists.
- Translate at presentation boundaries. Keep identifiers, user input and state keys stable when changing languages.
- Use anonymous fixtures and truthful local feedback throughout the prototype.
