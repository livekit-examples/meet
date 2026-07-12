'use client';
import * as React from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import {
  HEARTBEAT_TIMEOUT_MS,
  WATCH_TOGETHER_TOPIC,
  isWatchSyncMessage,
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
  const embedRef = React.useRef(embed);
  embedRef.current = embed;

  const { send } = useDataChannel(WATCH_TOGETHER_TOPIC, (msg) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(decoder.decode(msg.payload));
    } catch {
      return;
    }
    if (!isWatchSyncMessage(parsed)) return;
    const fromIdentity = msg.from?.identity;
    if (!fromIdentity) return;

    if (parsed.type === 'start-embed') {
      if (parsed.hostIdentity !== fromIdentity) return;
      const current = embedRef.current;
      if (current.active && current.hostIdentity !== fromIdentity) return;
      lastHeartbeatRef.current = Date.now();
      setStream({ active: false });
      setEmbed({
        active: true,
        kind: parsed.kind,
        src: parsed.src,
        hostIdentity: parsed.hostIdentity,
        isHost: fromIdentity === localParticipant.identity,
      });
    } else if (parsed.type === 'heartbeat') {
      if (parsed.hostIdentity !== fromIdentity) return;
      const current = embedRef.current;
      if (current.active && current.hostIdentity !== fromIdentity) return;
      lastHeartbeatRef.current = Date.now();
      setEmbed((prev) => {
        if (prev.active) return prev;
        return {
          active: true,
          kind: parsed.kind,
          src: parsed.src,
          hostIdentity: parsed.hostIdentity,
          isHost: fromIdentity === localParticipant.identity,
        };
      });
    } else {
      const current = embedRef.current;
      if (!current.active || current.hostIdentity !== fromIdentity) return;
    }

    if (parsed.type === 'stop') {
      setEmbed({ active: false });
    }
    listenersRef.current.forEach((listener) => listener(parsed));
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
      const current = embedRef.current;
      if (current.active && !current.isHost) return;
      const identity = localParticipant.identity;
      setStream({ active: false });
      sendSync({ type: 'start-embed', kind, src, hostIdentity: identity, ts: Date.now() });
      setEmbed({ active: true, kind, src, hostIdentity: identity, isHost: true });
    },
    [localParticipant.identity, sendSync],
  );

  const stopEmbed = React.useCallback(() => {
    sendSync({ type: 'stop', ts: Date.now() });
    setEmbed({ active: false });
  }, [sendSync]);

  const startStream = React.useCallback(
    (file: File) => {
      const current = embedRef.current;
      if (current.active && !current.isHost) return;
      if (current.active) {
        sendSync({ type: 'stop', ts: Date.now() });
        setEmbed({ active: false });
      }
      setStream({ active: true, file });
    },
    [sendSync],
  );

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
