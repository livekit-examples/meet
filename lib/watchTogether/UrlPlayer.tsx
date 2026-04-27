'use client';
import * as React from 'react';
import type { WatchSyncMessage } from './types';

const HEARTBEAT_INTERVAL_MS = 5000;
const DRIFT_TOLERANCE_S = 0.6;

type Props = {
  src: string;
  hostIdentity: string;
  isHost: boolean;
  sendSync: (msg: WatchSyncMessage) => void;
  subscribe: (l: (msg: WatchSyncMessage) => void) => () => void;
};

export function UrlPlayer({ src, hostIdentity, isHost, sendSync, subscribe }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const ignoreEventsRef = React.useRef(false);

  React.useEffect(() => {
    if (!videoRef.current || isHost) return;
    const v = videoRef.current;
    return subscribe((msg) => {
      if (msg.type === 'play') {
        ignoreEventsRef.current = true;
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S)
          v.currentTime = msg.currentTime;
        v.play().catch(() => {});
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'pause') {
        ignoreEventsRef.current = true;
        v.pause();
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S)
          v.currentTime = msg.currentTime;
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'seek') {
        ignoreEventsRef.current = true;
        v.currentTime = msg.currentTime;
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'heartbeat') {
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S) {
          ignoreEventsRef.current = true;
          v.currentTime = msg.currentTime;
          queueMicrotask(() => (ignoreEventsRef.current = false));
        }
        if (msg.isPlaying && v.paused) v.play().catch(() => {});
        if (!msg.isPlaying && !v.paused) v.pause();
      }
    });
  }, [subscribe, isHost]);

  React.useEffect(() => {
    if (!isHost || !videoRef.current) return;
    const v = videoRef.current;
    const onPlay = () => {
      if (ignoreEventsRef.current) return;
      sendSync({ type: 'play', currentTime: v.currentTime, ts: Date.now() });
    };
    const onPause = () => {
      if (ignoreEventsRef.current) return;
      sendSync({ type: 'pause', currentTime: v.currentTime, ts: Date.now() });
    };
    const onSeeked = () => {
      if (ignoreEventsRef.current) return;
      sendSync({ type: 'seek', currentTime: v.currentTime, ts: Date.now() });
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeked', onSeeked);
    const heartbeat = window.setInterval(() => {
      sendSync({
        type: 'heartbeat',
        kind: 'url',
        src,
        hostIdentity,
        currentTime: v.currentTime,
        isPlaying: !v.paused,
        ts: Date.now(),
      });
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeked', onSeeked);
      window.clearInterval(heartbeat);
    };
  }, [isHost, src, hostIdentity, sendSync]);

  return (
    <video
      ref={videoRef}
      className="lk-watch-together-video"
      src={src}
      controls={isHost}
      playsInline
      crossOrigin="anonymous"
    />
  );
}
