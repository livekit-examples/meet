import * as React from 'react';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { isTrackReference, isTrackReferencePinned } from '@livekit/components-core';
import {
  AudioTrack,
  VideoTrack,
  ParticipantContext,
  TrackRefContext,
  useEnsureTrackRef,
  useFeatureContext,
  useMaybeLayoutContext,
  useMaybeParticipantContext,
  useMaybeTrackRefContext,
  useParticipantTile,
  ConnectionQualityIndicator,
  FocusToggle,
} from '@livekit/components-react';
import { getAvatarColor, getInitials } from './client-utils';

export function ParticipantContextIfNeeded(
  props: React.PropsWithChildren<{
    participant?: Participant;
  }>,
) {
  const hasContext = !!useMaybeParticipantContext();
  return props.participant && !hasContext ? (
    <ParticipantContext.Provider value={props.participant}>
      {props.children}
    </ParticipantContext.Provider>
  ) : (
    <>{props.children}</>
  );
}

export function TrackRefContextIfNeeded(
  props: React.PropsWithChildren<{
    trackRef?: TrackReferenceOrPlaceholder;
  }>,
) {
  const hasContext = !!useMaybeTrackRefContext();
  return props.trackRef && !hasContext ? (
    <TrackRefContext.Provider value={props.trackRef}>{props.children}</TrackRefContext.Provider>
  ) : (
    <>{props.children}</>
  );
}

export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
  trackRef?: TrackReferenceOrPlaceholder;
  disableSpeakingIndicator?: boolean;

  onParticipantClick?: (event: ParticipantClickEvent) => void;
}

export const ParticipantTile: (
  props: ParticipantTileProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = React.forwardRef<HTMLDivElement, ParticipantTileProps>(
  function ParticipantTile(
    {
      trackRef,
      children,
      onParticipantClick,
      disableSpeakingIndicator,
      ...htmlProps
    }: ParticipantTileProps,
    ref,
  ) {
    const trackReference = useEnsureTrackRef(trackRef);
    const {
      name,
      identity,
      metadata,
      isEncrypted,
      isSpeaking,
      isMicrophoneEnabled,
      isScreenShareEnabled,
    } = trackReference.participant;

    const { elementProps } = useParticipantTile<HTMLDivElement>({
      htmlProps,
      disableSpeakingIndicator,
      onParticipantClick,
      trackRef: trackReference,
    });
    const layoutContext = useMaybeLayoutContext();

    const autoManageSubscription = useFeatureContext()?.autoSubscription;

    const handleSubscribe = React.useCallback(
      (subscribed: boolean) => {
        if (
          trackReference.source &&
          !subscribed &&
          layoutContext &&
          layoutContext.pin.dispatch &&
          isTrackReferencePinned(trackReference, layoutContext.pin.state)
        ) {
          layoutContext.pin.dispatch({ msg: 'clear_pin' });
        }
      },
      [trackReference, layoutContext],
    );

    const [profilePictureUrl, setProfilePictureUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (metadata) {
        try {
          const parsedMetadata = JSON.parse(metadata);
          if (parsedMetadata.profilePictureUrl) {
            setProfilePictureUrl(parsedMetadata.profilePictureUrl);
          }
        } catch (e) {
          console.error('Failed to parse participant metadata', e);
        }
      }
    }, [metadata]);

    const avatarColor = getAvatarColor(identity);
    const initials = getInitials(name || identity);

    return (
      <div ref={ref} style={{ position: 'relative' }} {...elementProps}>
        <TrackRefContextIfNeeded trackRef={trackReference}>
          <ParticipantContextIfNeeded participant={trackReference.participant}>
            {children ?? (
              <>
                {isTrackReference(trackReference) &&
                  (trackReference.publication?.kind === 'video' ||
                    trackReference.source === Track.Source.Camera ||
                    trackReference.source === Track.Source.ScreenShare) ? (
                  <VideoTrack
                    trackRef={trackReference}
                    onSubscriptionStatusChanged={handleSubscribe}
                    manageSubscription={autoManageSubscription}
                  />
                ) : (
                  isTrackReference(trackReference) && (
                    <AudioTrack
                      trackRef={trackReference}
                      onSubscriptionStatusChanged={handleSubscribe}
                    />
                  )
                )}
                <div className="lk-participant-placeholder">
                  <div className="avatar-container" style={{ backgroundColor: avatarColor }}>
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt={name} className="avatar-image" />
                    ) : (
                      <span className="avatar-initials">{initials}</span>
                    )}
                  </div>
                </div>
                <div className="lk-participant-metadata">
                  <div>
                    <div className="participant-info">
                      {isMicrophoneEnabled ? (
                        <>
                          {isSpeaking ? (
                            <span className="mic-icon speaking-icon">graphic_eq</span>
                          ) : (
                            <span className="mic-icon mic-on">mic</span>
                          )}
                        </>
                      ) : (
                        <span className="mic-icon mic-off">mic_off</span>
                      )}
                      <span className="participant-name">
                        {name || identity}
                        {trackReference.source === Track.Source.ScreenShare
                          ? ' (Screen Share)'
                          : ''}
                      </span>
                    </div>
                  </div>
                  <ConnectionQualityIndicator className="lk-participant-metadata-item" />
                </div>
              </>
            )}
            <FocusToggle trackRef={trackReference} />
          </ParticipantContextIfNeeded>
        </TrackRefContextIfNeeded>
      </div>
    );
  },
);
