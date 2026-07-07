'use client';
import * as React from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import {
  HEARTBEAT_TIMEOUT_MS,
  WATCH_TOGETHER_TOPIC,
  type EmbedKind,
  type WatchSyncMessage,
  type WatchTogetherEmbedState,
  type WatchTogetherStreamState,
} from './types';

type Ctx = {
  embed: WatchTogetherEmbedState;
  stream: WatchTogetherStreamState;
  startEmbed: (kind: EmbedKind, src: string) => void;
  stopEmbed: () => void;
  startStream: (file: File) => void;
  stopStream: () => void;
  sendSync: (msg: WatchSyncMessage) => void;
  subscribe: (listener: (msg: WatchSyncMessage) => void) => () => void;
};

const WatchTogetherContext = React.createContext<Ctx | null>(null);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function WatchTogetherProvider({ children }: { children: React.ReactNode }) {
  const { localParticipant } = useLocalParticipant();
  const [embed, setEmbed] = React.useState<WatchTogetherEmbedState>({ active: false });
  const [stream, setStream] = React.useState<WatchTogetherStreamState>({ active: false });
  const listenersRef = React.useRef(new Set<(msg: WatchSyncMessage) => void>());
  const lastHeartbeatRef = React.useRef(0);

  const { send } = useDataChannel(WATCH_TOGETHER_TOPIC, (msg) => {
    let parsed: WatchSyncMessage | null = null;
    try {
      parsed = JSON.parse(decoder.decode(msg.payload)) as WatchSyncMessage;
    } catch {
      return;
    }
    if (!parsed) return;
    const fromIdentity = msg.from?.identity;
    if (parsed.type === 'start-embed' || parsed.type === 'heartbeat') {
      lastHeartbeatRef.current = Date.now();
    }
    if (parsed.type === 'start-embed' && fromIdentity) {
      setEmbed({
        active: true,
        kind: parsed.kind,
        src: parsed.src,
        hostIdentity: parsed.hostIdentity,
        isHost: fromIdentity === localParticipant.identity,
      });
    } else if (parsed.type === 'heartbeat' && fromIdentity) {
      setEmbed((prev) => {
        if (prev.active) return prev;
        return {
          active: true,
          kind: parsed!.kind as EmbedKind,
          src: (parsed as Extract<WatchSyncMessage, { type: 'heartbeat' }>).src,
          hostIdentity: (parsed as Extract<WatchSyncMessage, { type: 'heartbeat' }>).hostIdentity,
          isHost: fromIdentity === localParticipant.identity,
        };
      });
    } else if (parsed.type === 'stop') {
      setEmbed({ active: false });
    }
    listenersRef.current.forEach((l) => l(parsed!));
  });

  // If the host vanishes without sending "stop" (tab crash, network drop),
  // viewers would be stuck on a frozen embed — drop it once heartbeats stop.
  React.useEffect(() => {
    if (!embed.active || embed.isHost) return;
    lastHeartbeatRef.current = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - lastHeartbeatRef.current > HEARTBEAT_TIMEOUT_MS) {
        setEmbed({ active: false });
      }
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [embed]);

  const sendSync = React.useCallback(
    (msg: WatchSyncMessage) => {
      try {
        send(encoder.encode(JSON.stringify(msg)), { reliable: true });
      } catch (err) {
        console.warn('watch-together sync send failed', err);
      }
    },
    [send],
  );

  const startEmbed = React.useCallback(
    (kind: EmbedKind, src: string) => {
      const identity = localParticipant.identity;
      sendSync({ type: 'start-embed', kind, src, hostIdentity: identity, ts: Date.now() });
      setEmbed({ active: true, kind, src, hostIdentity: identity, isHost: true });
    },
    [localParticipant.identity, sendSync],
  );

  const stopEmbed = React.useCallback(() => {
    sendSync({ type: 'stop', ts: Date.now() });
    setEmbed({ active: false });
  }, [sendSync]);

  const startStream = React.useCallback((file: File) => {
    setStream({ active: true, file });
  }, []);

  const stopStream = React.useCallback(() => {
    setStream({ active: false });
  }, []);

  const subscribe = React.useCallback((listener: (msg: WatchSyncMessage) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({
      embed,
      stream,
      startEmbed,
      stopEmbed,
      startStream,
      stopStream,
      sendSync,
      subscribe,
    }),
    [embed, stream, startEmbed, stopEmbed, startStream, stopStream, sendSync, subscribe],
  );

  return <WatchTogetherContext.Provider value={value}>{children}</WatchTogetherContext.Provider>;
}

export function useWatchTogether() {
  const ctx = React.useContext(WatchTogetherContext);
  if (!ctx) throw new Error('useWatchTogether must be used inside WatchTogetherProvider');
  return ctx;
}
