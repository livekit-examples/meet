'use client';
import * as React from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { WATCH_TOGETHER_TOPIC, type WatchSyncMessage, type WatchTogetherState } from './types';

type Ctx = {
  state: WatchTogetherState;
  startVideo: (magnet: string) => void;
  stopVideo: () => void;
  sendSync: (msg: WatchSyncMessage) => void;
  subscribe: (listener: (msg: WatchSyncMessage) => void) => () => void;
};

const WatchTogetherContext = React.createContext<Ctx | null>(null);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function WatchTogetherProvider({ children }: { children: React.ReactNode }) {
  const { localParticipant } = useLocalParticipant();
  const [state, setState] = React.useState<WatchTogetherState>({ active: false });
  const listenersRef = React.useRef(new Set<(msg: WatchSyncMessage) => void>());

  const { send } = useDataChannel(WATCH_TOGETHER_TOPIC, (msg) => {
    let parsed: WatchSyncMessage | null = null;
    try {
      parsed = JSON.parse(decoder.decode(msg.payload)) as WatchSyncMessage;
    } catch {
      return;
    }
    if (!parsed) return;
    const fromIdentity = msg.from?.identity;
    if (parsed.type === 'start' && fromIdentity) {
      setState({
        active: true,
        magnet: parsed.magnet,
        hostIdentity: parsed.hostIdentity,
        isHost: fromIdentity === localParticipant.identity,
      });
    } else if (parsed.type === 'heartbeat' && fromIdentity) {
      setState((prev) => {
        if (prev.active) return prev;
        return {
          active: true,
          magnet: parsed.magnet,
          hostIdentity: parsed.hostIdentity,
          isHost: fromIdentity === localParticipant.identity,
        };
      });
    } else if (parsed.type === 'stop') {
      setState({ active: false });
    }
    listenersRef.current.forEach((l) => l(parsed!));
  });

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

  const startVideo = React.useCallback(
    (magnet: string) => {
      const identity = localParticipant.identity;
      const msg: WatchSyncMessage = {
        type: 'start',
        magnet,
        hostIdentity: identity,
        ts: Date.now(),
      };
      sendSync(msg);
      setState({ active: true, magnet, hostIdentity: identity, isHost: true });
    },
    [localParticipant.identity, sendSync],
  );

  const stopVideo = React.useCallback(() => {
    sendSync({ type: 'stop', ts: Date.now() });
    setState({ active: false });
  }, [sendSync]);

  const subscribe = React.useCallback((listener: (msg: WatchSyncMessage) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ state, startVideo, stopVideo, sendSync, subscribe }),
    [state, startVideo, stopVideo, sendSync, subscribe],
  );

  return (
    <WatchTogetherContext.Provider value={value}>{children}</WatchTogetherContext.Provider>
  );
}

export function useWatchTogether() {
  const ctx = React.useContext(WatchTogetherContext);
  if (!ctx) throw new Error('useWatchTogether must be used inside WatchTogetherProvider');
  return ctx;
}
