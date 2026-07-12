'use client';
import * as React from 'react';
import { DRIFT_TOLERANCE_S, HEARTBEAT_INTERVAL_MS, type WatchSyncMessage } from './types';
import { GestureOverlay } from './GestureOverlay';

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
  ytApiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
      ytApiPromise = null;
      reject(new Error('Не удалось загрузить YouTube IFrame API'));
    };
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
  // Keep sendSync in a ref so a changing identity doesn't tear down the player.
  const sendSyncRef = React.useRef(sendSync);
  sendSyncRef.current = sendSync;
  const lastSyncTimeRef = React.useRef(0);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [shouldPlay, setShouldPlay] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let player: any = null;

    // The app is crossOriginIsolated (COOP/COEP for E2EE), which blocks
    // cross-origin iframes unless they load credentialless — so we create the
    // iframe ourselves instead of letting the IFrame API do it. Firefox does
    // not support credentialless iframes, so YouTube mode is Chromium-only.
    const iframe = document.createElement('iframe');
    iframe.setAttribute('credentialless', '');
    (iframe as any).credentialless = true;
    const params = new URLSearchParams({
      enablejsapi: '1',
      playsinline: '1',
      rel: '0',
      controls: '1',
      disablekb: isHost ? '0' : '1',
      origin: window.location.origin,
    });
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(iframe, {
          events: {
            onReady: () => {
              if (cancelled) return;
              playerRef.current = player;
              setReady(true);
            },
            onStateChange: (e: any) => {
              if (cancelled) return;
              const state = e.data;
              setPlaying(state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING);
              if (!isHost) return;
              const t = player.getCurrentTime();
              if (state === YT.PlayerState.PLAYING) {
                sendSyncRef.current({ type: 'play', currentTime: t, ts: Date.now() });
              } else if (state === YT.PlayerState.PAUSED) {
                sendSyncRef.current({ type: 'pause', currentTime: t, ts: Date.now() });
              }
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? String(err));
      });

    return () => {
      cancelled = true;
      try {
        player?.destroy?.();
      } catch {}
      playerRef.current = null;
      iframe.remove();
      setReady(false);
      setPlaying(false);
      setShouldPlay(false);
    };
  }, [videoId, isHost]);

  React.useEffect(() => {
    if (!ready || isHost) return;
    return subscribe((msg) => {
      const player = playerRef.current;
      if (!player) return;
      const cur = player.getCurrentTime?.() ?? 0;
      if (msg.type === 'play') {
        if (Math.abs(cur - msg.currentTime) > DRIFT_TOLERANCE_S)
          player.seekTo(msg.currentTime, true);
        lastSyncTimeRef.current = msg.currentTime;
        setShouldPlay(true);
        player.playVideo();
      } else if (msg.type === 'pause') {
        player.pauseVideo();
        if (Math.abs(cur - msg.currentTime) > DRIFT_TOLERANCE_S)
          player.seekTo(msg.currentTime, true);
        lastSyncTimeRef.current = msg.currentTime;
        setShouldPlay(false);
      } else if (msg.type === 'seek') {
        player.seekTo(msg.currentTime, true);
        lastSyncTimeRef.current = msg.currentTime;
      } else if (msg.type === 'heartbeat') {
        if (Math.abs(cur - msg.currentTime) > DRIFT_TOLERANCE_S)
          player.seekTo(msg.currentTime, true);
        lastSyncTimeRef.current = msg.currentTime;
        setShouldPlay(msg.isPlaying);
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
      sendSyncRef.current({
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
  }, [ready, isHost, videoId, hostIdentity]);

  const handleGesture = () => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo?.(lastSyncTimeRef.current, true);
    player.playVideo?.();
  };

  // Without a prior gesture the browser only allows muted autoplay, so when the
  // host is playing but we aren't, offer a click-to-play fallback (delayed to
  // hide the brief cued→playing transition when autoplay works).
  const needsGesture = ready && !isHost && shouldPlay && !playing;

  return (
    <div className="lk-watch-together-yt-wrap">
      <div ref={containerRef} className="lk-watch-together-yt-frame" />
      {needsGesture && <GestureOverlay onClick={handleGesture} delayed />}
      {!ready && !error && <div className="lk-watch-together-status">Подключение к YouTube…</div>}
      {error && (
        <div className="lk-watch-together-status lk-watch-together-error">
          Ошибка YouTube: {error}
        </div>
      )}
    </div>
  );
}
