'use strict';

/**
 * LiveKit push-to-talk companion.
 *
 * Captures one global key via a low-level keyboard hook (so it fires even when
 * the browser is not the focused window — e.g. while playing a game) and relays
 * `down`/`up` events to the browser over a localhost-only WebSocket. The web app
 * connects to it and opens the mic only while the key is held.
 *
 * Config (environment variables):
 *   PTT_PORT   WebSocket port (default 7331)
 *   PTT_KEY    Key name to use as the talk button (default "F8")
 *
 * Run `npm run learn` (or `node index.js --learn`) and press a key to discover
 * its exact name, then set PTT_KEY to that name.
 */

const { GlobalKeyboardListener } = require('node-global-key-listener');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PTT_PORT) || 7331;
const PTT_KEY = (process.env.PTT_KEY || 'F8').toUpperCase();
const LEARN = process.argv.includes('--learn') || process.env.PTT_LEARN === '1';

const wss = new WebSocketServer({ host: '127.0.0.1', port: PORT });
let talking = false;

function broadcast(state) {
  const payload = JSON.stringify({ type: 'ptt', state });
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(payload);
    }
  }
}

wss.on('listening', () => {
  console.log(`[companion] WebSocket listening on ws://127.0.0.1:${PORT}`);
  if (LEARN) {
    console.log('[companion] LEARN mode: press your desired talk key to see its name.');
  } else {
    console.log(`[companion] Talk key: "${PTT_KEY}"  (change with the PTT_KEY env var)`);
    console.log('[companion] Hold it to talk. Run `npm run learn` to find a key name.');
  }
});
wss.on('connection', () => console.log('[companion] browser connected'));
wss.on('error', (err) => console.error('[companion] WebSocket server error:', err.message));

const keyboard = new GlobalKeyboardListener();
keyboard.addListener((event) => {
  const name = (event.name || '').toUpperCase();

  if (LEARN) {
    if (event.state === 'DOWN') {
      console.log(`[learn] key down: "${event.name}"`);
    }
    return;
  }

  if (name !== PTT_KEY) {
    return;
  }
  if (event.state === 'DOWN' && !talking) {
    talking = true;
    broadcast('down');
  } else if (event.state === 'UP' && talking) {
    talking = false;
    broadcast('up');
  }
});

process.on('SIGINT', () => {
  console.log('\n[companion] shutting down');
  wss.close();
  process.exit(0);
});
