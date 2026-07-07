'use client';
import * as React from 'react';
import { Track } from 'livekit-client';
import type { RemoteParticipant } from 'livekit-client';
import {
  getStoredVolume,
  setStoredVolume,
  subscribeVolumeChange,
  VOLUME_DEFAULT,
  VOLUME_MAX,
  VOLUME_MIN,
} from './participantVolumes';

type Props = {
  participant: RemoteParticipant;
};

export function ParticipantVolumeControl({ participant }: Props) {
  const identity = participant.identity;
  const [volume, setVolume] = React.useState<number>(
    () => getStoredVolume(identity) ?? VOLUME_DEFAULT,
  );
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      // setVolume defaults to the mic track; screen-share and watch-together
      // audio is published as ScreenShareAudio and needs its own call.
      participant.setVolume(volume);
      participant.setVolume(volume, Track.Source.ScreenShareAudio);
    } catch (err) {
      console.warn('Failed to set participant volume', err);
    }
  }, [participant, volume]);

  React.useEffect(() => {
    return subscribeVolumeChange(identity, (v) => setVolume(v));
  }, [identity]);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleChange = (next: number) => {
    setVolume(next);
    setStoredVolume(identity, next);
  };

  const muted = volume === 0;
  const reduced = volume < VOLUME_DEFAULT && volume > 0;

  return (
    <div ref={containerRef} className="lk-participant-volume" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="lk-participant-volume-button"
        aria-label={`Volume for ${participant.name || identity}`}
        title={`Volume: ${Math.round(volume * 100)}%`}
        onClick={() => setOpen((v) => !v)}
      >
        <SpeakerIcon muted={muted} reduced={reduced} />
      </button>
      {open && (
        <div className="lk-participant-volume-popover">
          <input
            type="range"
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={0.01}
            value={volume}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            aria-label="Volume"
          />
          <div className="lk-participant-volume-row">
            <span className="lk-participant-volume-value">{Math.round(volume * 100)}%</span>
            <button
              type="button"
              className="lk-participant-volume-reset"
              onClick={() => handleChange(VOLUME_DEFAULT)}
              disabled={volume === VOLUME_DEFAULT}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SpeakerIcon({ muted, reduced }: { muted: boolean; reduced: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <path
            d="M15.5 8.5a5 5 0 010 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={reduced ? 0.4 : 1}
          />
          {!reduced && (
            <path
              d="M18 6a8 8 0 010 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.8}
            />
          )}
        </>
      )}
    </svg>
  );
}
