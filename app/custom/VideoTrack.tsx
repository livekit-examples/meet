'use client';

import React, { useRef, useEffect } from 'react';
import { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import '../../styles/VideoTrack.css';

interface VideoTrackProps {
  ref: TrackReferenceOrPlaceholder;
}

export function VideoTrack({ ref: trackRef }: VideoTrackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    const track = trackRef.publication?.track;

    if (videoEl && track) {
      track.attach(videoEl);
      return () => {
        track.detach(videoEl);
      };
    }
  }, [trackRef.publication?.track]);

  return <video ref={videoRef} className="video-element" />;
}