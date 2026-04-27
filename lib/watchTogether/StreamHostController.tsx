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

export function StreamHostController() {
  const room = useRoomContext();
  const { stream, stopStream } = useWatchTogether();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const publishedRef = React.useRef<{
    video?: LocalTrackPublication;
    audio?: LocalTrackPublication;
  }>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!stream.active || !videoRef.current) return;
    const video = videoRef.current;
    const url = URL.createObjectURL(stream.file);
    video.src = url;

    let cancelled = false;

    const publish = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => resolve();
          const onError = () => reject(new Error('Failed to load video file'));
          video.addEventListener('loadedmetadata', onLoaded, { once: true });
          video.addEventListener('error', onError, { once: true });
        });
        if (cancelled) return;

        await video.play().catch(() => {
          /* autoplay may be blocked, but captureStream still works */
        });
        if (cancelled) return;

        const mediaStream = (video as any).captureStream
          ? (video as any).captureStream()
          : (video as any).mozCaptureStream?.();
        if (!mediaStream) throw new Error('captureStream not supported in this browser');

        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];

        if (videoTrack) {
          const lvt = new LocalVideoTrack(videoTrack, undefined, true);
          publishedRef.current.video = await room.localParticipant.publishTrack(lvt, {
            source: Track.Source.ScreenShare,
            videoEncoding: { maxBitrate: 5_000_000, maxFramerate: 30 },
            videoSimulcastLayers: [VideoPresets.h1440, VideoPresets.h1080, VideoPresets.h720],
            simulcast: true,
          });
        }
        if (audioTrack) {
          const lat = new LocalAudioTrack(audioTrack, undefined, true);
          publishedRef.current.audio = await room.localParticipant.publishTrack(lat, {
            source: Track.Source.ScreenShareAudio,
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      }
    };

    publish();

    return () => {
      cancelled = true;
      const { video: vp, audio: ap } = publishedRef.current;
      publishedRef.current = {};
      if (vp?.track) room.localParticipant.unpublishTrack(vp.track, true).catch(() => {});
      if (ap?.track) room.localParticipant.unpublishTrack(ap.track, true).catch(() => {});
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {}
      URL.revokeObjectURL(url);
    };
  }, [stream.active, stream.active ? stream.file : null, room]);

  if (!stream.active) return null;

  return (
    <div className="lk-watch-together-host-panel">
      <video
        ref={videoRef}
        className="lk-watch-together-host-video"
        controls
        playsInline
      />
      <div className="lk-watch-together-host-controls">
        <span className="lk-watch-together-host-label">
          {error ? `Error: ${error}` : `Sharing: ${stream.file.name}`}
        </span>
        <button type="button" className="lk-button" onClick={stopStream}>
          Stop sharing
        </button>
      </div>
    </div>
  );
}
