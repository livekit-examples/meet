# Architecture

This document describes how the app is put together: the routes, the realtime
connection lifecycle, and the supporting features (E2EE, recording, performance
optimization, regions). It is a fork of [LiveKit Meet](https://github.com/livekit/meet);
the structure below reflects this repository's code.

## High-level overview

The app is a **Next.js 15 (App Router)** front end. It does not own any media
infrastructure — all audio/video routing is done by a **LiveKit server** (LiveKit
Cloud or self-hosted). The Next.js server side is intentionally tiny: three Route
Handlers that (a) mint a participant access token and (b) start/stop recording.
Everything else is a browser client that talks WebRTC directly to LiveKit.

```
                          ┌──────────────────────────────────────────┐
                          │                Browser                    │
                          │                                           │
  app/page.tsx  ────────► │  PageClientImpl / VideoConferenceClient   │
  (tabbed launcher)       │     • livekit-client Room                 │
                          │     • <VideoConference/> prefab UI        │
                          │     • E2EE worker, perf optimizer         │
                          └───────┬─────────────────────────┬─────────┘
                                  │ 1. fetch token          │ 3. WebRTC (media + data)
                                  ▼                         ▼
        ┌─────────────────────────────────┐     ┌──────────────────────────┐
        │  Next.js Route Handlers (server) │     │     LiveKit server        │
        │  • /api/connection-details       │     │  (Cloud or self-hosted)   │
        │  • /api/record/start|stop        │ ──► │  • SFU / rooms            │
        │     (uses livekit-server-sdk)    │  2. │  • Egress → S3            │
        └─────────────────────────────────┘ Egress└──────────────────────────┘
```

1. The client asks the Next.js server for connection details (server URL + JWT).
2. For recording, the client calls the record endpoints, which use the
   `livekit-server-sdk` `EgressClient` to start/stop a Room Composite Egress.
3. The client connects to the LiveKit server over WebRTC and exchanges media.

## Routes

| Path                                       | Type   | Responsibility                                                                                                                                             |
| ------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/page.tsx`                             | client | Landing page. Tabbed launcher: **Demo** (generates a random room id, optional E2EE) and **Custom** (paste a server URL + token). Routes to the room pages. |
| `app/rooms/[roomName]/page.tsx`            | server | Parses `region`/`hq`/`codec`/`singlePC` search params, then renders `PageClientImpl`.                                                                      |
| `app/rooms/[roomName]/PageClientImpl.tsx`  | client | The **managed** flow: shows `<PreJoin/>`, fetches a token from `connection-details`, builds the `Room`, and renders the conference.                        |
| `app/custom/page.tsx`                      | server | Validates `liveKitUrl`/`token`/`codec` from the URL, then renders `VideoConferenceClientImpl`.                                                             |
| `app/custom/VideoConferenceClientImpl.tsx` | client | The **bring-your-own-token** flow: builds the `Room` directly from URL-provided credentials. No PreJoin, no token fetch.                                   |
| `app/api/connection-details/route.ts`      | server | `GET` → mints a short-lived participant JWT for `{roomName, participantName}`, optionally region-routed.                                                   |
| `app/api/record/start/route.ts`            | server | `GET` → starts a Room Composite Egress to S3 (speaker layout, mp4).                                                                                        |
| `app/api/record/stop/route.ts`             | server | `GET` → stops all active egresses for the room.                                                                                                            |

## `lib/` modules

| File                        | Role                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | `ConnectionDetails` shape + `isVideoCodec` guard.                                                                                                                          |
| `client-utils.ts`           | `randomString`, `generateRoomId`, passphrase encode/decode, `isLowPowerDevice` (uses `navigator.hardwareConcurrency < 6`).                                                 |
| `getLiveKitURL.ts`          | Rewrites a `*.livekit.cloud` host to a region-pinned host by inserting `<region>` plus the `production`/`staging` environment segment. Covered by `getLiveKitURL.test.ts`. |
| `useSetupE2EE.ts`           | Reads the passphrase from `location.hash` and spins up the `livekit-client/e2ee-worker` Web Worker.                                                                        |
| `usePerfomanceOptimiser.ts` | `useLowCPUOptimizer` — listens for `LocalTrackCpuConstrained` and degrades publisher/subscriber video quality.                                                             |
| `SettingsMenu.tsx`          | In-room settings drawer (Media / Recording tabs). Gated by `NEXT_PUBLIC_SHOW_SETTINGS_MENU`.                                                                               |
| `CustomVideoConference.tsx` | Conference layout with participant volume controls, custom chat, and the watch-together cinema stage.                                                                      |
| `watchTogether/**`          | Cinema source picker, synchronized URL/HLS/YouTube players, and local-file publication through LiveKit screen-share tracks.                                                |
| `CameraSettings.tsx`        | Camera device + background effects (blur / virtual background via `@livekit/track-processors`).                                                                            |
| `MicrophoneSettings.tsx`    | Mic device + Krisp enhanced noise cancellation (auto-on for non-low-power devices).                                                                                        |
| `RecordingIndicator.tsx`    | Red inset border + toast while the room is being recorded.                                                                                                                 |
| `KeyboardShortcuts.tsx`     | Cmd/Ctrl-Shift-A (mic), Cmd/Ctrl-Shift-V (camera).                                                                                                                         |
| `Debug.tsx`                 | `Shift+D` debug overlay (tracks, bitrates, permissions, scenario simulation) + optional Datadog log forwarding. Exposes `window.__lk_room`.                                |

## Connection lifecycle (managed flow)

`PageClientImpl` is the reference implementation. The custom flow is a simplified
version of the same steps.

```
PreJoin (username, mic/cam choices)
   │  onSubmit
   ▼
GET /api/connection-details?roomName=&participantName=[&region=]
   │  → { serverUrl, participantToken, ... }
   ▼
build RoomOptions (codec, simulcast layers, e2ee, singlePeerConnection)
   │
   ▼
new Room(roomOptions)            ← memoized once
   │
   ├─ if E2EE: keyProvider.setKey(passphrase) → room.setE2EEEnabled(true)
   │
   ▼
room.connect(serverUrl, token)   ← after E2EE setup completes
   │
   ├─ setCameraEnabled / setMicrophoneEnabled per PreJoin choices
   ├─ useLowCPUOptimizer(room)   ← degrade quality under CPU pressure
   └─ RoomEvent.Disconnected → router.push('/')
   ▼
<RoomContext.Provider value={room}>
   <VideoConference/>  +  KeyboardShortcuts, DebugMode, RecordingIndicator, (SettingsMenu)
```

Key `RoomOptions` decisions (`PageClientImpl.tsx`):

- **Codec**: defaults to `vp9`; under E2EE, `vp9`/`av1` are dropped (SVC codecs are
  incompatible with the encryption path) so LiveKit falls back to a supported codec.
- **Capture / simulcast**: `hq` → 2160p capture with 1080p+720p layers; otherwise
  720p capture with 540p+216p layers.
- **`red`** (audio redundancy) is enabled only when E2EE is off.
- **`adaptiveStream`** and **`dynacast`** are always on.
- **`singlePeerConnection`** comes from the `singlePC` URL param (managed: default on,
  custom: default off).

## End-to-end encryption (E2EE)

- The passphrase travels in the **URL hash** (`#<passphrase>`), so it is never sent to
  the Next.js server (hashes are client-only).
- `useSetupE2EE` derives the passphrase and instantiates the
  `livekit-client/e2ee-worker` Web Worker. An `ExternalE2EEKeyProvider` feeds the key
  into the worker; `room.setE2EEEnabled(true)` activates insertable-streams encryption.
- This requires cross-origin isolation, which is why `next.config.js` sets
  `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`.
- Unsupported browsers raise `DeviceUnsupportedError`, surfaced to the user via an alert.
- **Encrypted rooms cannot be recorded** (Egress cannot decrypt the media).

## Recording (Egress)

- Driven entirely from the in-room **Settings → Recording** tab (requires
  `NEXT_PUBLIC_SHOW_SETTINGS_MENU` + `NEXT_PUBLIC_LK_RECORD_ENDPOINT`).
- `start` creates a `RoomCompositeEgress` with `speaker` layout, writing an mp4
  (`<iso-timestamp>-<roomName>.mp4`) to the configured S3 bucket. It first checks
  `listEgress` to avoid double-recording (returns `409` if already active).
- `stop` lists active egresses (`status < 2`) and stops them all.
- `useIsRecording()` drives the `RecordingIndicator` and the settings toggle state.
- **Security**: both endpoints are unauthenticated — see the `CAUTION` comment in each
  handler. Add auth before any non-demo use.

## Token issuance & regions

- `connection-details` builds an `AccessToken` (livekit-server-sdk) with grants
  `roomJoin / canPublish / canPublishData / canSubscribe`, `ttl = 5m`.
- Participant identity is `"<name>__<4-char-postfix>"`. The postfix is stored in a
  `random-participant-postfix` cookie so a returning user keeps a stable identity.
- If a `region` is supplied, `getLiveKitURL` rewrites the LiveKit Cloud host to route
  to that region (only for `*.livekit.cloud` hosts; other hosts pass through unchanged).

## Performance optimization

`useLowCPUOptimizer` (`usePerfomanceOptimiser.ts`) reacts to the
`ParticipantEvent.LocalTrackCpuConstrained` event:

- Calls `track.prioritizePerformance()` on the local publisher.
- Drops every **remote** subscription to `VideoQuality.LOW`, and keeps newly
  subscribed tracks low while in low-power mode.
- Optionally stops local video processors (off by default).

`isLowPowerDevice()` (`< 6` logical cores) also drives defaults elsewhere — e.g. Krisp
noise-filter quality and whether it auto-enables.

## Watch-together cinema

`CustomVideoConference` always mounts `WatchTogetherProvider` and a visible
`CinemaPanel`. A participant can start a direct media URL, a YouTube URL, or a local
video file. Starting linked media moves the conference into focus layout with the
player as the main stage and participant tracks in the carousel.

### Linked media synchronization

- `parseVideoUrl` normalizes URLs and extracts video IDs from YouTube watch, short,
  embed, live, `youtu.be`, and privacy-enhanced embed links.
- Progressive sources use the native `<video>` element. HLS playlists use native HLS
  where available and `hls.js` elsewhere, with recovery for fatal network and media
  errors.
- YouTube uses the IFrame API. The iframe is created manually with `credentialless`
  because the app is cross-origin isolated for E2EE.
- The host sends `start-embed`, `play`, `pause`, `seek`, and a 2.5-second heartbeat on
  the reliable `watch-together` LiveKit data topic. Viewers re-seek only after drift
  exceeds 600 ms.
- Incoming packets are schema-validated. Control and stop packets are accepted only
  from the identity recorded as the current host. Only that host can replace an active
  linked source.
- Heartbeats let late joiners discover the active source. Three missed heartbeats plus
  slack clear the player after an ungraceful host disconnect.
- Browsers commonly reject unmuted autoplay. Both players expose a synchronized
  click-to-play fallback for affected viewers.

### Local files

Local files are never uploaded to Next.js. `StreamHostController` creates an object URL,
plays the file in a host-only `<video>`, captures it with `captureStream()`, wraps the
result in LiveKit local video/audio tracks, and publishes them as screen-share sources.
The regular screen-share focus and subscription path then delivers the media to viewers.
Stopping the source unpublishes both tracks, stops them, and revokes the object URL.

This requires a browser with `HTMLMediaElement.captureStream()` and a file codec that
the browser can decode. Direct/HLS sources must also satisfy the remote origin's CORS
and media-access policy. YouTube mode is effectively Chromium-only while Firefox lacks
credentialless iframe support under COEP.

## Build & tooling

- **Next.js** `15.2.8`, **React** `18.3.1`, App Router, `reactStrictMode: false`,
  `productionBrowserSourceMaps: true`, `source-map-loader` for `.mjs`.
- **TypeScript** strict, `moduleResolution: Bundler`, path alias `@/* → ./*`.
- **ESLint** `next/core-web-vitals`; **Prettier** (LF, single quotes, width 100).
- **Vitest** for unit tests.
- **Renovate** keeps dependencies current; LiveKit packages are grouped and automerged.
- **CI** (`.github/workflows/test.yaml`): lint + format check + tests on push/PR.
- **Deploy** (`.github/workflows/sync-to-production.yaml`): manual `workflow_dispatch`
  syncs `main` to a `sandbox-production` branch via the LiveKit sandbox deploy action.
