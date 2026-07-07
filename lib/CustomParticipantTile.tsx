'use client';
import * as React from 'react';
import { isTrackReference } from '@livekit/components-core';
import {
  AudioTrack,
  ConnectionQualityIndicator,
  LockLockedIcon,
  ParticipantName,
  ParticipantPlaceholder,
  ParticipantTile,
  type ParticipantTileProps,
  ScreenShareIcon,
  TrackMutedIndicator,
  useEnsureTrackRef,
  useFeatureContext,
  useIsEncrypted,
  useMaybeLayoutContext,
  VideoTrack,
} from '@livekit/components-react';
import { RemoteParticipant, Track } from 'livekit-client';
import { ParticipantVolumeControl } from './ParticipantVolumeControl';

export function CustomParticipantTile(props: ParticipantTileProps) {
  const trackRef = useEnsureTrackRef(props.trackRef);
  const isEncrypted = useIsEncrypted(trackRef.participant);
  const layoutContext = useMaybeLayoutContext();
  const autoManageSubscription = useFeatureContext()?.autoSubscription;

  const handleSubscriptionChange = React.useCallback(
    (subscribed: boolean) => {
      if (
        !subscribed &&
        trackRef.source &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isPinned(trackRef, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' });
      }
    },
    [trackRef, layoutContext],
  );

  const isVideoTrack =
    isTrackReference(trackRef) &&
    (trackRef.publication?.kind === 'video' ||
      trackRef.source === Track.Source.Camera ||
      trackRef.source === Track.Source.ScreenShare);

  const isCamera = trackRef.source === Track.Source.Camera;
  const isLocal = trackRef.participant.isLocal;
  const isRemoteAudible =
    !isLocal &&
    trackRef.participant instanceof RemoteParticipant &&
    (trackRef.source === Track.Source.Camera ||
      trackRef.source === Track.Source.Microphone ||
      trackRef.source === Track.Source.ScreenShare);

  return (
    <ParticipantTile {...props} trackRef={trackRef}>
      {isVideoTrack ? (
        <VideoTrack
          trackRef={trackRef}
          onSubscriptionStatusChanged={handleSubscriptionChange}
          manageSubscription={autoManageSubscription}
        />
      ) : isTrackReference(trackRef) ? (
        <AudioTrack trackRef={trackRef} onSubscriptionStatusChanged={handleSubscriptionChange} />
      ) : null}
      <div className="lk-participant-placeholder">
        <ParticipantPlaceholder />
      </div>
      <div className="lk-participant-metadata">
        <div className="lk-participant-metadata-item">
          {isCamera ? (
            <>
              {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
              <TrackMutedIndicator
                trackRef={{
                  participant: trackRef.participant,
                  source: Track.Source.Microphone,
                }}
                show="muted"
              />
              <ParticipantName />
            </>
          ) : (
            <>
              <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
              <ParticipantName>&apos;s screen</ParticipantName>
            </>
          )}
        </div>
        <ConnectionQualityIndicator className="lk-participant-metadata-item" />
      </div>
      {isRemoteAudible && (
        <ParticipantVolumeControl participant={trackRef.participant as RemoteParticipant} />
      )}
    </ParticipantTile>
  );
}

function isPinned(trackRef: ReturnType<typeof useEnsureTrackRef>, pinState: any): boolean {
  if (!Array.isArray(pinState)) return false;
  return pinState.some(
    (p: any) =>
      p?.participant?.identity === trackRef.participant.identity && p?.source === trackRef.source,
  );
}
