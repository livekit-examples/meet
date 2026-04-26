'use client';
import * as React from 'react';
import { useWatchTogether } from './WatchTogetherContext';
import type { WatchSyncMessage } from './types';

const HEARTBEAT_INTERVAL_MS = 5000;
const DRIFT_TOLERANCE_S = 0.6;

export function WatchTogetherTile() {
  const { state, stopVideo, sendSync, subscribe } = useWatchTogether();
  if (!state.active) return null;
  return (
    <ActiveTile
      magnet={state.magnet}
      hostIdentity={state.hostIdentity}
      isHost={state.isHost}
      stopVideo={stopVideo}
      sendSync={sendSync}
      subscribe={subscribe}
    />
  );
}

type ActiveProps = {
  magnet: string;
  hostIdentity: string;
  isHost: boolean;
  stopVideo: () => void;
  sendSync: (msg: WatchSyncMessage) => void;
  subscribe: (l: (msg: WatchSyncMessage) => void) => () => void;
};

function ActiveTile({ magnet, hostIdentity, isHost, stopVideo, sendSync, subscribe }: ActiveProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [status, setStatus] = React.useState<string>('Connecting…');
  const [progress, setProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const ignoreEventsRef = React.useRef(false);
  const torrentRef = React.useRef<any>(null);
  const clientRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    (async () => {
      try {
        // @ts-expect-error - dist build has no types
        const mod = await import('webtorrent/dist/webtorrent.min.js');
        if (cancelled) return;
        const WebTorrent = mod.default ?? mod;
        const client = new WebTorrent();
        clientRef.current = client;
        client.on('error', (err: Error) => setError(err.message));

        setStatus('Looking up peers…');
        client.add(magnet, (torrent: any) => {
          if (cancelled) return;
          torrentRef.current = torrent;
          setStatus(`Found ${torrent.name}, ${torrent.numPeers} peers`);
          const file = torrent.files
            .slice()
            .sort((a: any, b: any) => b.length - a.length)
            .find((f: any) => /\.(mp4|webm|mkv|m4v|mov)$/i.test(f.name));
          if (!file) {
            setError('No playable video file found in torrent');
            return;
          }
          file.streamTo(videoRef.current!);
          torrent.on('download', () => {
            setProgress(torrent.progress);
            setStatus(
              `${(torrent.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s · ${torrent.numPeers} peers`,
            );
          });
          torrent.on('done', () => setStatus('Downloaded'));
          torrent.on('wire', () => setStatus(`${torrent.numPeers} peers`));
        });
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();

    return () => {
      cancelled = true;
      try {
        clientRef.current?.destroy();
      } catch {}
      clientRef.current = null;
      torrentRef.current = null;
    };
  }, [magnet]);

  React.useEffect(() => {
    if (!videoRef.current || isHost) return;
    const v = videoRef.current;
    const unsub = subscribe((msg: WatchSyncMessage) => {
      if (msg.type === 'play') {
        ignoreEventsRef.current = true;
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S) {
          v.currentTime = msg.currentTime;
        }
        v.play().catch(() => {});
        queueMicrotask(() => (ignoreEventsRef.current = false));
      } else if (msg.type === 'pause') {
        ignoreEventsRef.current = true;
        v.pause();
        if (Math.abs(v.currentTime - msg.currentTime) > DRIFT_TOLERANCE_S) {
          v.currentTime = msg.currentTime;
        }
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
    return unsub;
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
        magnet,
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
  }, [isHost, magnet, hostIdentity, sendSync]);

  return (
    <div className="lk-watch-together-tile">
      <video
        ref={videoRef}
        className="lk-watch-together-video"
        controls={isHost}
        playsInline
      />
      <div className="lk-watch-together-overlay">
        <div className="lk-watch-together-status">
          {error ? `Error: ${error}` : status}
          {progress > 0 && progress < 1 && ` · ${Math.round(progress * 100)}%`}
        </div>
        {isHost && (
          <button
            type="button"
            className="lk-button lk-watch-together-stop"
            onClick={stopVideo}
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
