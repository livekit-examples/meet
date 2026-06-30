import React from 'react';
import { Room } from 'livekit-client';

const DEFAULT_WS_URL = 'ws://127.0.0.1:7331';

export type PushToTalkState = {
  /** True once connected to the local companion app. */
  connected: boolean;
  /** True while the push-to-talk key is held (mic open). */
  talking: boolean;
};

/**
 * Bridges the local push-to-talk companion app to the LiveKit room.
 *
 * The companion captures a global key (works even when the browser is not the
 * focused window) and relays `down`/`up` events over a localhost WebSocket.
 * While connected we treat the call as walkie-talkie: the mic is muted and only
 * opened while the key is held.
 *
 * Configure the endpoint with `NEXT_PUBLIC_PTT_WS_URL`; set it to an empty
 * string to disable the companion entirely.
 */
export function usePushToTalk(room: Room): PushToTalkState {
  const [connected, setConnected] = React.useState(false);
  const [talking, setTalking] = React.useState(false);

  React.useEffect(() => {
    const url = process.env.NEXT_PUBLIC_PTT_WS_URL ?? DEFAULT_WS_URL;
    if (!url) {
      return;
    }

    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const setMic = (on: boolean) => {
      room.localParticipant.setMicrophoneEnabled(on).catch((err) => {
        console.error('Push-to-talk failed to toggle microphone', err);
      });
    };

    const connect = () => {
      if (disposed) {
        return;
      }
      try {
        ws = new WebSocket(url);
      } catch {
        retryTimer = setTimeout(connect, 3000);
        return;
      }

      ws.onopen = () => {
        setConnected(true);
        // Walkie-talkie mode: start muted, open only while the key is held.
        setMic(false);
      };
      ws.onmessage = (event) => {
        let msg: { type?: string; state?: string };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type !== 'ptt') {
          return;
        }
        const open = msg.state === 'down';
        setTalking(open);
        setMic(open);
      };
      ws.onclose = () => {
        setConnected(false);
        setTalking(false);
        if (!disposed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [room]);

  return { connected, talking };
}
