# Chrome and Playwright UI capture

This project uses Playwright with the installed system Chrome. It supports repeatable E2E checks and an optional Chrome DevTools Protocol capture for authorized reference pages.

## Run local UI checks

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```

The Playwright server starts the Vite app on `http://127.0.0.1:5174`. Tests run at desktop and Pixel 7 dimensions with the Chrome channel.

## Let Codex control your normal Chrome

Open Codex **Settings → Computer use** and install/enable the ChatGPT Chrome extension. The extension is required before Codex can use the current Chrome tabs and their signed-in session. Authentication challenges and CAPTCHA remain manual.

## Capture through Chrome DevTools Protocol

Use a separate temporary Chrome profile. Do not expose a daily browser profile through a debugging port.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/creatify-playwright-profile
```

Sign in manually in that Chrome window, open the authorized reference page, then run:

```bash
npm run capture:chrome -- https://adscheck.smit.vn/app/ads-save
```

Override the endpoint or output directory when needed:

```bash
CDP_URL=http://127.0.0.1:9333 npm run capture:chrome -- \
  https://example.com ./artifacts/chrome-capture/example
```

The capture writes:

- `page.png`: full-page screenshot.
- `page.html`: runtime DOM after JavaScript rendering.
- `ui-inventory.json`: visible controls, geometry, selected computed styles, and CSS custom properties.

The script does not inspect cookies, passwords, browser storage, or saved credentials. It does not clone backend APIs or server-side business logic.
