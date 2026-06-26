# UI harness (browser automation)

Local Playwright-based harness for verifying LiveKit Meet UI behavior in a real browser. Use this when you need evidence beyond unit tests — e.g. slider wiring, translation overlay state, or remote audio volume changes with two participants in a room.

## Prerequisites

1. **Dev server running** from the repo root with valid LiveKit env (`.env.local`):
   ```bash
   pnpm dev
   ```
2. **Chrome or Chromium** on the machine, or set `CHROME_PATH` to the browser binary.
3. **Harness dependencies** (isolated; does not add Playwright to the main app):
   ```bash
   cd tools/ui-harness
   pnpm install
   ```

Optional: install Playwright's Chromium if you prefer it over system Chrome:
```bash
pnpm run install-browsers
# then: CHROME_PATH="$(pnpm exec playwright-core install --dry-run chromium 2>/dev/null || echo '')"
# or point CHROME_PATH at ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome
```

## Running the original-volume check

From `tools/ui-harness/`:

```bash
pnpm test:original-volume
```

Or with an explicit base URL if the app is not on port 3000:

```bash
BASE_URL=http://127.0.0.1:3005 pnpm test:original-volume
```

Headed mode (watch the browser):

```bash
HEADLESS=false pnpm test:original-volume
```

Fixed room name (for debugging):

```bash
ROOM_NAME=my-debug-room pnpm test:original-volume
```

## What `translation-original-volume.mjs` verifies

Two browser contexts join the same room (`Speaker` + `Listener`). The listener page:

1. Waits for the translation overlay **Original remote volume** slider.
2. Moves the slider to 30% with translation **off** → remote `<audio>` volume must become `0.3`.
3. Enables translation → volume auto-ducks to `0.15`.
4. Moves the slider to 60% with translation **on** → volume must become `0.6`.

On success, prints JSON to stdout and saves a screenshot to `artifacts/translation-original-volume.png`. On failure, prints JSON with `passed: false` and exits non-zero.

## Selectors and stability

Prefer stable hooks already in the app:

| Control | Selector |
|---------|----------|
| Original volume slider | `input[aria-label="Original remote volume"]` |
| Translated volume slider | `input[aria-label="Translated volume"]` |
| Enable translation | checkbox next to label text `Enable translation` |
| Join room | PreJoin name field + button matching `/join/i` |

When adding new checks, use `aria-label`, roles, or `data-*` attributes in the UI rather than CSS module class names.

## Adding a new probe

1. Add a script next to `translation-original-volume.mjs` (or extend `lib/helpers.mjs`).
2. Register an npm script in `tools/ui-harness/package.json`.
3. Document the scenario in this file under a new heading.
4. Write artifacts to `tools/ui-harness/artifacts/` (gitignored).

## Cleanup

- Stop any dev server you started for the run.
- `artifacts/` is safe to delete; it is not committed.

## Notes

- Uses fake mic/camera flags so joins work without real devices.
- Requires network access to your LiveKit server (same as manual testing).
- Firefox-specific issues need a separate probe with `firefox` from Playwright if you add it; this harness currently targets Chromium/Chrome only.
