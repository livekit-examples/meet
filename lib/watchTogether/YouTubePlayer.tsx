'use client';
import * as React from 'react';
import type { WatchSyncMessage } from './types';

const HEARTBEAT_INTERVAL_MS = 5000;
const DRIFT_TOLERANCE_S = 0.6;

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<any> | null = null;

function loadYouTubeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

type Props = {
  videoId: string;
  hostIdentity: string;
  isHost: boolean;
  sendSync: (msg: WatchSyncMessage) => void;
  subscribe: (l: (msg: WatchSyncMessage) => void) => () => void;
};

export function YouTubePlayer({ videoId, hostIdentity, isHost, sendSync, subscribe }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<any>(null);
  const ignoreEventsRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let player: any = null;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        player = new YT.Player(containerRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: isHost ? 1 : 0,
            disablekb: isHost ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              playerRef.current = player;
              setReady(true);
            },
            onStateChange: (e: any) => {
              if (!isHost || ignoreEventsRef.current) return;
              const state = e.data;
              const t = player.getCurrentTime();
              if (state === YT.PlayerState.PLAYING) {
                sendSync({ type: 'play', currentTime: t, ts: Date.now() });
              } else if (state === YT.PlayerState.PAUSED) {
                sendSync({ type: 'pause', currentTime: t, ts: Date.now() });
              }
            },
          },
        });
      })
      .catch((err) => setError(err?.message ?? String(err)));

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      setReady(false);
    };
  }, [videoId, isHost, sendSync]);

  React.useEffect(() => {
    if (!ready || isHost) return;
    return subscribe((msg) => {
      const player = playerRef.current;
      if (!player) return;
      const cur = player.getCurrentTime?.() ?? 0;
      if (msg.type === 'play') {
        ignoreEventsRef.current = true;
        if (Math.abs(cur - msg.currentTime) > DRIFT_TOLERANCE_S) player.seekTo(msg.currentTime, true);
        player.playVideo();
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'pause') {
        ignoreEventsRef.current = true;
        player.pauseVideo();
        if (Math.abs(cur - msg.currentTime) > DRIFT_TOLERANCE_S) player.seekTo(msg.currentTime, true);
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'seek') {
        ignoreEventsRef.current = true;
        player.seekTo(msg.currentTime, true);
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'heartbeat') {
        if (Math.abs(cur - msg.currentTime) > DRIFT_TOLERANCE_S) {
          ignoreEventsRef.current = true;
          player.seekTo(msg.currentTime, true);
          queueMicrotask(() => (ignoreEventsRef.current = false));
        }
        const isPlaying = player.getPlayerState?.() === 1;
        if (msg.isPlaying && !isPlaying) player.playVideo();
        if (!msg.isPlaying && isPlaying) player.pauseVideo();
      }
    });
  }, [ready, isHost, subscribe]);

  React.useEffect(() => {
    if (!ready || !isHost) return;
    const heartbeat = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      sendSync({
        type: 'heartbeat',
        kind: 'youtube',
        src: videoId,
        hostIdentity,
        currentTime: player.getCurrentTime?.() ?? 0,
        isPlaying: player.getPlayerState?.() === 1,
        ts: Date.now(),
      });
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(heartbeat);
  }, [ready, isHost, videoId, hostIdentity, sendSync]);

  return (
    <div className="lk-watch-together-yt-wrap">
      <div ref={containerRef} className="lk-watch-together-yt-frame" />
      {error && <div className="lk-watch-together-status">YouTube error: {error}</div>}
    </div>
  );
}
