# LiveKit local companion

One localhost helper provides two optional browser capabilities:

- global push-to-talk, even while a game or another window has focus;
- standard BitTorrent peer support for the room cinema.

The web app discovers capabilities over `ws://127.0.0.1:7331`. Torrent playback uses
the companion when available and automatically falls back to browser WebTorrent when
it is not running. The fallback can only reach WebRTC-compatible peers; the companion
can reach regular BitTorrent peers.

## Data flow

```text
regular torrent peers -> companion -> localhost HTTP range stream
                      -> host browser <video> -> captureStream()
                      -> LiveKit screen-share -> room viewers
```

Torrent data and files never go to the Next.js server. Pieces are stored in an OS
temporary directory on the host and deleted when playback stops or the owning browser
socket disconnects. LiveKit receives only the encoded real-time media stream.

## Requirements

- Node.js 18 or newer.
- Windows for the global keyboard hook.
- Chrome or Edge is recommended for localhost media capture.

The torrent service itself is Node-based, but the current companion also initializes a
Windows keyboard hook, so other operating systems are not supported yet.

## Setup

```bash
cd companion
npm install
```

Find the global talk-key name:

```bash
npm run learn
```

Then start both PTT and torrent capabilities:

```powershell
# PowerShell
$env:PTT_KEY="F8"; npm start
```

```bat
:: cmd.exe
set PTT_KEY=F8 && npm start
```

Keep this process running while the browser room is open. The cinema's **Torrent** tab
will choose it automatically; there is no engine toggle.

## Ports and configuration

| Variable            | Default           | Purpose                                                                          |
| ------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `PTT_KEY`           | `F8`              | Global key name used as the talk button.                                         |
| `PTT_PORT`          | `7331`            | Local capability WebSocket port.                                                 |
| `TORRENT_PORT`      | `PTT_PORT + 1`    | Local HTTP range-stream port used by the host browser.                           |
| `COMPANION_ORIGINS` | torrent: loopback | Comma-separated trusted browser origins, for example `https://chat.example.com`. |
| `PTT_ORIGINS`       | torrent: loopback | Legacy alias used when `COMPANION_ORIGINS` is unset.                             |

If the WebSocket port changes, configure the web app before building:

```dotenv
NEXT_PUBLIC_COMPANION_WS_URL=ws://127.0.0.1:7441
```

To disable global push-to-talk while keeping torrent support:

```dotenv
NEXT_PUBLIC_COMPANION_WS_URL=ws://127.0.0.1:7331
NEXT_PUBLIC_PTT_WS_URL=
```

For a web app opened from a deployed domain, trust its exact origin before starting
the companion:

```powershell
$env:COMPANION_ORIGINS="https://chat.example.com"; npm start
```

Without an explicit allowlist, remote origins can still use the legacy PTT relay but
the companion does not advertise or accept torrent commands from them. Local
`localhost`, `127.0.0.1`, and `[::1]` development origins are trusted automatically.

## Torrent behavior

- Accepts magnet links and `.torrent` files up to 2 MB.
- Automatically selects the largest MP4/M4V/WebM/OGG/MOV/MKV file.
- Supports HTTP byte ranges, so seeking prioritizes the required torrent pieces.
- Shows peers, download speed, progress, and the selected engine in the host panel.
- Runs one torrent session at a time and replaces the previous session on a new start.
- Deletes the temporary piece store on stop, disconnect, or companion shutdown.

The browser still has to decode the selected container and codecs. MP4 with H.264/AAC
and WebM are the most portable choices; MKV and HEVC support varies by browser and OS.

## Security

- Both servers bind to `127.0.0.1` and are not reachable from the LAN.
- Torrent stream paths contain a random token.
- Torrent commands are enabled by default only for loopback web origins. Set an exact
  `COMPANION_ORIGINS` allowlist when the app is hosted on another domain.
- The legacy PTT relay still accepts connections from other origins when no allowlist
  is configured. Set `COMPANION_ORIGINS` to restrict the entire WebSocket.
- Use torrents only for content you are authorized to download and share.

## Autostart

Create a shortcut that runs `npm start` in this directory and place it in the Windows
Startup folder (`Win+R`, then `shell:startup`).
