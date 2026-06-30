# LiveKit push-to-talk companion

A tiny Windows helper that gives the web chat **global** push-to-talk (walkie-talkie)
— it works even when the browser is not the focused window (e.g. while you're playing
a game). A web page on its own cannot capture a key while another app is focused; this
companion can, because it uses a low-level OS keyboard hook.

## How it works

```
[companion (this app)]                         [voice chat in the browser]
 • global keyboard hook (key down/up)           • connects to ws://127.0.0.1:7331
   — fires even when the browser is in the       • key down → opens the mic
     background / a game is focused              • key up   → mutes the mic
 • localhost-only WebSocket server  ──────────► • shows a "🎙️ Рация" badge
```

While the companion is connected the call is in walkie-talkie mode: the mic stays
muted and only opens while you hold the key.

## Requirements

- **Windows** (uses a Windows keyboard hook).
- **Node.js 18+**.
- A **Chromium-based browser** (Chrome/Edge) for the chat — they allow a secure page
  to connect to `ws://127.0.0.1` (loopback). Firefox may block it.

## Setup

```bash
cd companion
npm install
```

Find the name of the key you want to use as the talk button:

```bash
npm run learn
```

Press the key — its name is printed (e.g. `F8`, `CAPS LOCK`, `MOUSE RIGHT`...). Then
start the companion with that key:

```bash
# PowerShell
$env:PTT_KEY="F8"; npm start

# cmd.exe
set PTT_KEY=F8 && npm start
```

Open the voice chat in Chrome — a `🎙️ Рация подключена` badge appears once it
connects. Hold the key to talk.

## Configuration

| Env var    | Default | Description                                                                           |
| ---------- | ------- | ------------------------------------------------------------------------------------- |
| `PTT_KEY`  | `F8`    | Key name (uppercase) used as the talk button.                                         |
| `PTT_PORT` | `7331`  | Local WebSocket port. Match `NEXT_PUBLIC_PTT_WS_URL` in the web app if you change it. |

If you change the port, point the web app at it with
`NEXT_PUBLIC_PTT_WS_URL=ws://127.0.0.1:<port>`.

## Autostart on login (optional)

Create a shortcut to `start.cmd` (a one-liner running `npm start` with your `PTT_KEY`)
and drop it into the Startup folder — press <kbd>Win</kbd>+<kbd>R</kbd>, type
`shell:startup`, and place the shortcut there.

## Notes / limitations

- Listens on `127.0.0.1` only — not reachable from the network.
- Windows only for now; the hook is OS-specific. macOS/Linux would need their own hook
  (the `node-global-key-listener` package supports them, but this is untested here).
- Some anti-cheat / antivirus software is wary of global keyboard hooks; allow the
  bundled key-listener helper if prompted.
