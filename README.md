<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# LiveKit Meet

<p>
  <a href="https://meet.livekit.io"><strong>Try the demo</strong></a>
  •
  <a href="https://github.com/livekit/components-js">LiveKit Components</a>
  •
  <a href="https://docs.livekit.io/">LiveKit Docs</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
  •
  <a href="https://blog.livekit.io/">Blog</a>
</p>

<br>

An open source video conferencing app built on [LiveKit Components](https://github.com/livekit/components-js),
[LiveKit Cloud](https://cloud.livekit.io/), and Next.js. This repository is a
customized fork of [LiveKit Meet](https://github.com/livekit/meet).

![LiveKit Meet screenshot](./.github/assets/livekit-meet.jpg)

## Features

- 🎥 **Multi-party video & audio** rooms powered by the LiveKit SFU, with adaptive
  stream and dynacast for bandwidth efficiency.
- 🔗 **Two ways to join** — a managed _Demo_ flow that mints tokens for you, and a
  _Custom_ flow where you bring your own LiveKit server URL and token.
- 🔒 **End-to-end encryption (E2EE)** with the passphrase carried in the URL hash
  (never sent to the server).
- 🖼️ **Background effects** — blur or virtual background images
  (`@livekit/track-processors`).
- 🎙️ **Krisp enhanced noise cancellation**, auto-enabled on capable devices.
- 🔴 **Room recording** to S3 via LiveKit Egress (speaker-layout composite).
- 🌍 **Region selection** for LiveKit Cloud projects.
- ⚙️ **Codec & quality controls** (VP9/VP8/H.264/AV1, HQ up to 2160p) via URL params.
- ⚡ **Automatic low-CPU optimization** that degrades video quality under pressure.
- ⌨️ **Keyboard shortcuts** and a **debug overlay** (`Shift+D`).
- 📊 Optional **Datadog** log forwarding.
- 🍿 **Synchronized room cinema** for direct MP4/WebM/Ogg URLs, HLS streams,
  YouTube links, and local video files shared over LiveKit.

## Tech stack

- [Next.js](https://nextjs.org/) 15 (App Router, React 18)
- [`@livekit/components-react`](https://github.com/livekit/components-js/) for the prefab conferencing UI
- [`livekit-client`](https://github.com/livekit/client-sdk-js) for the realtime WebRTC connection
- [`livekit-server-sdk`](https://github.com/livekit/server-sdk-js) for token minting and Egress (recording)
- TypeScript (strict), ESLint, Prettier, Vitest, pnpm

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a detailed breakdown of routes, the
connection lifecycle, E2EE, and recording. Repo conventions and gotchas live in
[`CLAUDE.md`](./CLAUDE.md).

## Demo

Give it a try at https://meet.livekit.io.

## Dev setup

Requirements: **Node.js ≥ 18** (CI uses Node 24) and **pnpm** (`pnpm@10.18.2`).

1. Run `pnpm install` to install all dependencies.
2. Copy `.env.example` in the project root and rename it to `.env.local`.
3. Update the missing environment variables in the newly created `.env.local` file
   (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL` are required — generate
   the key/secret from the [LiveKit Cloud dashboard](https://cloud.livekit.io/) or your
   own server).
4. Run `pnpm dev` to start the development server and visit
   [http://localhost:3000](http://localhost:3000) to see the result.
5. Start development 🎉

## Scripts

| Command                                   | Description                      |
| ----------------------------------------- | -------------------------------- |
| `pnpm dev`                                | Start the dev server.            |
| `pnpm build`                              | Production build.                |
| `pnpm start`                              | Serve the production build.      |
| `pnpm lint` / `pnpm lint:fix`             | ESLint (`next/core-web-vitals`). |
| `pnpm test`                               | Run the Vitest suite.            |
| `pnpm format:check` / `pnpm format:write` | Prettier check / write.          |

CI runs `lint`, `format:check`, and `test` on every push and pull request.

## Environment variables

**Required (server-only):**

| Variable             | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `LIVEKIT_API_KEY`    | LiveKit API key.                                           |
| `LIVEKIT_API_SECRET` | LiveKit API secret.                                        |
| `LIVEKIT_URL`        | LiveKit server URL, e.g. `wss://my-project.livekit.cloud`. |

**Optional — recording (server-only):** `S3_KEY_ID`, `S3_KEY_SECRET`, `S3_ENDPOINT`,
`S3_BUCKET`, `S3_REGION`.

**Optional — public (`NEXT_PUBLIC_*`):**

| Variable                                                       | Description                                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SHOW_SETTINGS_MENU`                               | Set to `true` to show the in-room settings menu (devices, backgrounds, Krisp, recording). |
| `NEXT_PUBLIC_LK_RECORD_ENDPOINT`                               | Base path for recording controls, e.g. `/api/record`. Recording UI is hidden if unset.    |
| `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT`                            | Override the token endpoint (default `/api/connection-details`).                          |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`, `NEXT_PUBLIC_DATADOG_SITE` | If both set, forward client logs to Datadog.                                              |

## Configuring a room via URL

A managed room URL is `/rooms/<roomName>` and accepts:

- `?hq=true` — high quality (2160p capture, 1080p/720p simulcast).
- `?codec=vp9|vp8|h264|av1` — preferred video codec (default `vp9`).
- `?singlePC=false` — disable single peer-connection mode (default on for managed rooms).
- `?region=<id>` — pin to a LiveKit Cloud region.
- `#<passphrase>` — enable E2EE with the given passphrase (set via the home page).

The custom flow is `/custom?liveKitUrl=<wss-url>&token=<jwt>` (with optional `codec`,
`singlePC`, and `#<passphrase>`).

## Recording

Recording uses [LiveKit Egress](https://docs.livekit.io/home/egress/overview/) and
writes a composite mp4 to S3. Enable it by setting the S3 variables plus
`NEXT_PUBLIC_SHOW_SETTINGS_MENU=true` and `NEXT_PUBLIC_LK_RECORD_ENDPOINT=/api/record`,
then use **Settings → Recording** inside a room. Note: encrypted (E2EE) rooms cannot be
recorded.

> ⚠️ **Security:** the bundled `/api/record/*` and `/api/connection-details` endpoints
> are **unauthenticated** — anyone who knows a room name can request a token or
> start/stop a recording. They exist for demo purposes. **Add authentication and
> authorization before deploying to production.**

## Room cinema

Use the **Кинотеатр** pill in the upper-left corner of a connected room. The current
host can choose one of two source modes:

- **Link or YouTube** synchronizes play, pause, seeking, and playback position over a
  reliable LiveKit data channel. Direct MP4/WebM/Ogg URLs use the browser player;
  HLS (`.m3u8`) uses `hls.js`; YouTube watch, shorts, live, and embed URLs use the
  YouTube IFrame API.
- **Local file** stays on the host's device. The browser captures the local player and
  publishes its video and audio as LiveKit screen-share tracks, so there is no upload
  or file-size limit in the Next.js app.

Only the current host can replace or stop an active linked source. If the host leaves,
viewers release the stale player after the heartbeat timeout. Viewers may need to click
the playback overlay once because browsers block unmuted autoplay.

Direct sources must be playable by the browser, and HLS origins must allow cross-origin
fetches. YouTube playback is most reliable in Chromium: this app's global COEP header
requires a `credentialless` iframe, which Firefox does not currently support.

## Deployment

The repo includes a manual GitHub Action
(`.github/workflows/sync-to-production.yaml`, `workflow_dispatch`) that syncs `main`
to a `sandbox-production` branch using the LiveKit sandbox deploy action. The app is a
standard Next.js project and can also be deployed to any Next.js-compatible host
(e.g. Vercel) with the environment variables above configured.

## License

[Apache-2.0](./LICENSE)
