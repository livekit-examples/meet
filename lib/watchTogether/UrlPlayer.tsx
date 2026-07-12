'use client';
import * as React from 'react';
import Hls from 'hls.js';
import { DRIFT_TOLERANCE_S, HEARTBEAT_INTERVAL_MS, type WatchSyncMessage } from './types';
import { GestureOverlay } from './GestureOverlay';

type Props = {
  src: string;
  hostIdentity: string;
  isHost: boolean;
  sendSync: (msg: WatchSyncMessage) => void;
  subscribe: (l: (msg: WatchSyncMessage) => void) => () => void;
};

export function UrlPlayer({ src, hostIdentity, isHost, sendSync, subscribe }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  // Autoplay with sound is blocked until the viewer interacts with the page;
  // when play() rejects we show a click-to-play overlay instead of failing silently.
  const [needsGesture, setNeedsGesture] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const tryPlay = React.useCallback(() => {
    videoRef.current?.play().then(
      () => setNeedsGesture(false),
      () => setNeedsGesture(true),
    );
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | null = null;
    const isHls = /\.m3u8(?:$|[?&#])/i.test(src);

    setLoading(true);
    setError(null);

    if (isHls && video.canPlayType('application/vnd.apple.mpegurl') === '') {
      if (!Hls.isSupported()) {
        setLoading(false);
        setError('Этот браузер не поддерживает HLS-воспроизведение.');
        return;
      }
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        } else {
          setLoading(false);
          setError(`Не удалось воспроизвести HLS: ${data.details}`);
        }
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    return () => {
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  React.useEffect(() => {
    if (!videoRef.current || isHost) return;
    const v = videoRef.current;
    return subscribe((msg) => {
      if (msg.type === 'play') {
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S)
          v.currentTime = msg.currentTime;
        tryPlay();
      } else if (msg.type === 'pause') {
        v.pause();
        setNeedsGesture(false);
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S)
          v.currentTime = msg.currentTime;
      } else if (msg.type === 'seek') {
        v.currentTime = msg.currentTime;
      } else if (msg.type === 'heartbeat') {
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S)
          v.currentTime = msg.currentTime;
        if (msg.isPlaying && v.paused) tryPlay();
        if (!msg.isPlaying && !v.paused) {
          v.pause();
          setNeedsGesture(false);
        }
      }
    });
  }, [subscribe, isHost, tryPlay]);

  React.useEffect(() => {
    if (!isHost || !videoRef.current) return;
    const v = videoRef.current;
    const onPlay = () => sendSync({ type: 'play', currentTime: v.currentTime, ts: Date.now() });
    const onPause = () => sendSync({ type: 'pause', currentTime: v.currentTime, ts: Date.now() });
    const onSeeked = () => sendSync({ type: 'seek', currentTime: v.currentTime, ts: Date.now() });
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

  // No crossOrigin attribute: a plain (no-cors) media fetch works under
  // COEP: credentialless without the server having to send CORS headers.
  return (
    <div className="lk-watch-together-video-wrap">
      <video
        ref={videoRef}
        className="lk-watch-together-video"
        controls
        controlsList="nodownload"
        preload="auto"
        playsInline
        onCanPlay={() => {
          setLoading(false);
          setError(null);
        }}
        onPlaying={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onError={() => {
          setLoading(false);
          setError('Видео не загрузилось. Проверьте формат ссылки, CORS и доступность файла.');
        }}
      />
      {!isHost && needsGesture && <GestureOverlay onClick={tryPlay} />}
      {loading && !error && <div className="lk-watch-together-status">Загрузка видео…</div>}
      {error && <div className="lk-watch-together-status lk-watch-together-error">{error}</div>}
    </div>
  );
}
