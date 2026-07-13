# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

A video-conferencing web app — a customized fork of [LiveKit Meet](https://github.com/livekit/meet).
It is a **Next.js 15 App Router** front end on top of the LiveKit realtime SDKs
(`livekit-client`, `@livekit/components-react`) with a thin set of Next.js Route
Handlers that mint access tokens and drive room recording (Egress). There is no
database and no custom backend service — all realtime media is handled by a
LiveKit server (LiveKit Cloud or self-hosted).

See `ARCHITECTURE.md` for the full picture.

## Commands

Package manager is **pnpm** (pinned to `pnpm@10.18.2` via `packageManager`). Node `>=18`; CI runs Node 24.

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm build            # production build
pnpm start            # serve the production build
pnpm lint             # next lint (eslint, next/core-web-vitals)
pnpm lint:fix         # eslint --fix
pnpm test             # run the vitest suite once
pnpm format:check     # prettier --check (CI gate)
pnpm format:write     # prettier --write
```

Unit tests (vitest) live next to the code as `*.test.ts(x)` files in `lib/`, plus
`companion/ptt-core.test.js`. To run a single test file:
`pnpm vitest run lib/getLiveKitURL.test.ts`.

CI (`.github/workflows/test.yaml`) runs, in order: `pnpm lint`, `pnpm format:check`,
`pnpm test`. All three must pass.

## Setup

1. `pnpm install`
2. Copy `.env.example` → `.env.local`
3. Fill in `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` (from the LiveKit Cloud dashboard or your own server).
4. `pnpm dev`

## Architecture in one screen

Two ways to join a room, each with its own entry route and client component:

| Mode               | Route                           | Token source                                          | Client component                           |
| ------------------ | ------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| **Demo / managed** | `app/rooms/[roomName]/page.tsx` | `GET /api/connection-details` mints a JWT server-side | `app/rooms/[roomName]/PageClientImpl.tsx`  |
| **Custom**         | `app/custom/page.tsx`           | URL already carries `liveKitUrl` + `token` (BYO)      | `app/custom/VideoConferenceClientImpl.tsx` |

- The landing page (`app/page.tsx`) is just a tabbed launcher for those two modes.
- Both client components build a `livekit-client` `Room`, connect, and render the
  prefab `<VideoConference />` from `@livekit/components-react` inside a `RoomContext.Provider`.
- Server route handlers (`app/api/**`) are the only server code:
  - `connection-details` → issues a short-lived (`5m`) participant JWT.
  - `record/start` + `record/stop` → control LiveKit Egress (S3 output).
- `lib/` holds the reusable pieces: token-region helper, E2EE setup, the low-CPU
  performance optimizer, and the in-room UI add-ons (settings menu, camera/mic
  settings, debug overlay, recording indicator, keyboard shortcuts, synchronized
  room cinema).

## Conventions

- **TypeScript, strict mode.** Path alias `@/*` → repo root (`@/lib/...`).
- **Prettier** config: single quotes, `trailingComma: all`, semicolons, width 100,
  2-space tabs. `endOfLine` is the prettier default (`lf`) — see the line-endings
  gotcha below. Run `pnpm format:write` before committing.
- **Client vs server components.** Anything touching `livekit-client`, browser APIs,
  or React state is a client component (`'use client'`). Route handlers and the
  `page.tsx` shells stay server components; they `await` `params`/`searchParams`
  (Next 15 async dynamic APIs) and pass plain props down.
- **Feature flags are env-driven** (`NEXT_PUBLIC_*`) and read at module scope. See
  the env table below.

## Environment variables

Server-only (never exposed to the browser):

| Var                                                                       | Required           | Purpose                                             |
| ------------------------------------------------------------------------- | ------------------ | --------------------------------------------------- |
| `LIVEKIT_API_KEY`                                                         | yes                | LiveKit API key, used to sign tokens / call Egress. |
| `LIVEKIT_API_SECRET`                                                      | yes                | LiveKit API secret.                                 |
| `LIVEKIT_URL`                                                             | yes                | LiveKit server URL (`wss://…livekit.cloud`).        |
| `S3_KEY_ID` / `S3_KEY_SECRET` / `S3_ENDPOINT` / `S3_BUCKET` / `S3_REGION` | only for recording | Destination bucket for Egress recordings.           |

Public (`NEXT_PUBLIC_*`, shipped to the browser):

| Var                                                             | Default                   | Purpose                                                                                                          |
| --------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SHOW_SETTINGS_MENU`                                | off                       | Shows the in-room settings menu (camera backgrounds, Krisp noise filter, speaker selection, recording controls). |
| `NEXT_PUBLIC_LK_RECORD_ENDPOINT`                                | unset                     | Base path for recording controls (e.g. `/api/record`). Recording UI is hidden if unset.                          |
| `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT`                             | `/api/connection-details` | Override the token endpoint (used by `PageClientImpl`).                                                          |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` / `NEXT_PUBLIC_DATADOG_SITE` | unset                     | If both set, LiveKit client logs are forwarded to Datadog (`lib/Debug.tsx`).                                     |
| `NEXT_PUBLIC_PTT_WS_URL`                                        | `ws://127.0.0.1:7331`     | WebSocket endpoint of the local push-to-talk companion (`companion/`). Set to an empty string to disable.        |

## Per-room URL parameters

Room behavior is tuned through query/hash parameters rather than settings:

- `?hq=true` — capture at 2160p and publish 1080p/720p simulcast (default 720p capture, 540p/216p simulcast).
- `?codec=vp9|vp8|h264|av1` — preferred video codec (default `vp9`; forced off under E2EE for vp9/av1).
- `?singlePC=false` — disable single-peer-connection mode (managed rooms default it **on**; custom rooms default it **off**).
- `?region=<id>` — pin to a LiveKit Cloud region (`lib/getLiveKitURL.ts` rewrites the host).
- `#<passphrase>` — URL hash carries the E2EE passphrase; presence of a hash enables end-to-end encryption (`lib/useSetupE2EE.ts`).

## Gotchas (read before editing)

- **Line endings / Windows + WSL.** The repo is committed with **LF**. If your
  checkout rewrites files to CRLF, `git status` shows the entire tree as modified
  even though nothing changed (`git diff --ignore-cr-at-eol` is then empty), and a
  CRLF commit would fail `pnpm format:check` in CI. A `.gitattributes` enforces
  `eol=lf`; keep editors set to LF and run `git add --renormalize .` if a checkout
  drifts. **Never commit a whole-tree "reformat" that is only line-ending churn.**
- **The recording API is unauthenticated by design.** `record/start` and
  `record/stop` accept any `roomName` with no auth check (see the `CAUTION` comment
  in each handler). Don't ship the demo recording flow to production without adding
  authn/authz.
- **The token endpoint is also open** — `connection-details` issues a publish-capable
  JWT to anyone who requests one for a room name. Fine for a demo; gate it for real use.
- **E2EE + recording are mutually exclusive.** Server-side Egress cannot record an
  encrypted room; `SettingsMenu` throws if you try.
- **`useSetupE2EE` memoizes the E2EE worker/key provider per mount** and terminates
  the worker on unmount. Keep it that way — an unmemoized `Worker` created during
  render leaks a worker per render.
- **`reactStrictMode` is `false`** (`next.config.js`) — effects do not double-invoke
  in dev, which hides some cleanup bugs. Test connection/teardown carefully.
- **COOP/COEP headers** are set globally in `next.config.js` (required for the E2EE
  WebWorker / SharedArrayBuffer). Cross-origin assets must be `credentialless`-compatible.
  Cross-origin **iframes** are blocked under COEP unless they load `credentialless` —
  the watch-together YouTube player creates its iframe manually with that attribute
  (Chromium-only; Firefox does not support credentialless iframes).
