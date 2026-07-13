'use client';
import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import {
  LocalAudioTrack,
  LocalVideoTrack,
  Track,
  VideoPresets,
  type LocalTrackPublication,
} from 'livekit-client';
import { useWatchTogether } from './WatchTogetherContext';
import {
  formatTorrentSpeed,
  prepareTorrentSource,
  type TorrentEngine,
  type TorrentSourceStatus,
} from './torrentSource';

export function StreamHostController() {
  const room = useRoomContext();
  const { stream, stopStream } = useWatchTogether();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const publishedRef = React.useRef<{
    video?: LocalTrackPublication;
    audio?: LocalTrackPublication;
  }>({});
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState('Подготовка файла…');
  const [detail, setDetail] = React.useState('');
  const streamSource = stream.active ? stream.source : null;

  React.useEffect(() => {
    if (!streamSource || !videoRef.current) return;
    const video = videoRef.current;
    setError(null);
    setStatus('Подготовка файла…');
    setDetail(streamSource.kind === 'file' ? streamSource.file.name : streamSource.input.name);

    let cancelled = false;
    let objectUrl: string | null = null;
    let sourceCleanup = () => {};
    const abortController = new AbortController();

    const publish = async () => {
      try {
        let torrentEngine: TorrentEngine | null = null;
        let sourceName: string;
        if (streamSource.kind === 'file') {
          sourceName = streamSource.file.name;
          objectUrl = URL.createObjectURL(streamSource.file);
          video.src = objectUrl;
        } else {
          const prepared = await prepareTorrentSource(
            video,
            streamSource.input,
            (torrentStatus) => {
              if (!cancelled) updateTorrentStatus(torrentStatus, setStatus, setDetail);
            },
            abortController.signal,
          );
          sourceCleanup = prepared.cleanup;
          torrentEngine = prepared.engine;
          sourceName = prepared.fileName;
        }

        await waitForMetadata(video);
        if (cancelled) return;

        setStatus('Запуск воспроизведения…');
        setDetail(sourceName);
        await video.play().catch(() => {
          /* autoplay may be blocked, but captureStream still works */
        });
        if (cancelled) return;

        const mediaStream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream?.();
        if (!mediaStream) {
          throw new Error('Браузер не поддерживает трансляцию локального видео (captureStream).');
        }

        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];

        if (videoTrack) {
          setStatus('Публикация видео в комнату…');
          const lvt = new LocalVideoTrack(videoTrack, undefined, true);
          const pub = await room.localParticipant.publishTrack(lvt, {
            source: Track.Source.ScreenShare,
            videoEncoding: { maxBitrate: 5_000_000, maxFramerate: 30 },
            videoSimulcastLayers: [VideoPresets.h1440, VideoPresets.h1080, VideoPresets.h720],
            simulcast: true,
          });
          // Cleanup may have run while publishTrack was in flight; the track
          // would otherwise stay published with nobody left to unpublish it.
          if (cancelled) {
            room.localParticipant.unpublishTrack(lvt, true).catch(() => {});
            return;
          }
          publishedRef.current.video = pub;
        }
        if (audioTrack) {
          setStatus('Подключение звука…');
          const lat = new LocalAudioTrack(audioTrack, undefined, true);
          const pub = await room.localParticipant.publishTrack(lat, {
            source: Track.Source.ScreenShareAudio,
          });
          if (cancelled) {
            room.localParticipant.unpublishTrack(lat, true).catch(() => {});
            return;
          }
          publishedRef.current.audio = pub;
        }
        if (!videoTrack) throw new Error('В выбранном файле не найден видеопоток.');
        setStatus(torrentEngine ? `В эфире · ${engineLabel(torrentEngine)}` : 'В эфире');
        setDetail(sourceName);
      } catch (err: any) {
        if (!cancelled && err?.name !== 'AbortError') setError(err?.message ?? String(err));
      }
    };

    publish();

    return () => {
      cancelled = true;
      abortController.abort();
      sourceCleanup();
      const { video: vp, audio: ap } = publishedRef.current;
      publishedRef.current = {};
      if (vp?.track) room.localParticipant.unpublishTrack(vp.track, true).catch(() => {});
      if (ap?.track) room.localParticipant.unpublishTrack(ap.track, true).catch(() => {});
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {}
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [streamSource, room]);

  if (!stream.active) return null;

  return (
    <div className="lk-watch-together-host-panel">
      <video ref={videoRef} className="lk-watch-together-host-video" controls playsInline />
      <div className="lk-watch-together-host-controls">
        <span className="lk-watch-together-host-label">
          <strong>{error ? 'Ошибка трансляции' : status}</strong>
          <span>{error ?? detail}</span>
        </span>
        <button type="button" className="lk-button" onClick={stopStream}>
          Завершить
        </button>
      </div>
    </div>
  );
}

function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Не удалось открыть видеопоток торрента.'));
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
  });
}

function updateTorrentStatus(
  torrentStatus: TorrentSourceStatus,
  setStatus: (value: string) => void,
  setDetail: (value: string) => void,
) {
  const engine = engineLabel(torrentStatus.engine);
  if (torrentStatus.phase === 'error') {
    setStatus(`Ошибка · ${engine}`);
  } else if (torrentStatus.phase === 'ready') {
    setStatus(`Буфер готов · ${engine}`);
  } else {
    setStatus(`Загрузка · ${engine}`);
  }
  const metrics = [
    torrentStatus.peers !== undefined ? `${torrentStatus.peers} пиров` : null,
    torrentStatus.downloadSpeed !== undefined
      ? formatTorrentSpeed(torrentStatus.downloadSpeed)
      : null,
  ].filter(Boolean);
  setDetail([torrentStatus.detail, ...metrics].join(' · '));
}

function engineLabel(engine: TorrentEngine): string {
  return engine === 'companion' ? 'Companion' : 'WebTorrent';
}
