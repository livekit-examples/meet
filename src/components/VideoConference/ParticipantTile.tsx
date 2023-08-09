import * as React from 'react'
import { isParticipantSourcePinned } from '@livekit/components-core'
import {
  AudioTrack,
  ConnectionQualityIndicator,
  FocusToggle,
  ParticipantContext,
  ParticipantName,
  TrackMutedIndicator,
  VideoTrack,
  useEnsureParticipant,
  useMaybeLayoutContext,
  useMaybeParticipantContext,
  useMaybeTrackContext,
  useParticipantTile
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import Profile from 'decentraland-dapps/dist/containers/Profile'
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core'
import type { Participant, TrackPublication } from 'livekit-client'

/** @public */
export function ParticipantContextIfNeeded(
  props: React.PropsWithChildren<{
    participant?: Participant
  }>
) {
  const hasContext = !!useMaybeParticipantContext()
  return props.participant && !hasContext ? (
    <ParticipantContext.Provider value={props.participant}>{props.children}</ParticipantContext.Provider>
  ) : (
    <>{props.children}</>
  )
}

/** @public */
export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
  disableSpeakingIndicator?: boolean
  participant?: Participant
  source?: Track.Source
  publication?: TrackPublication
  onParticipantClick?: (event: ParticipantClickEvent) => void
  imageSize?: 'normal' | 'large' | 'huge' | 'massive'
}

/**
 * The ParticipantTile component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `TrackLoop` component or by spreading a track reference as properties.
 *
 * @example
 * ```tsx
 * <ParticipantTile source={Track.Source.Camera} />
 *
 * <ParticipantTile {...trackReference} />
 * ```
 * @public
 */
export function ParticipantTile({
  participant,
  children,
  source = Track.Source.Camera,
  onParticipantClick,
  publication,
  disableSpeakingIndicator,
  imageSize,
  ...htmlProps
}: ParticipantTileProps) {
  const p = useEnsureParticipant(participant)
  const trackRef: TrackReferenceOrPlaceholder = useMaybeTrackContext() ?? {
    participant: p,
    source,
    publication
  }

  const { elementProps } = useParticipantTile<HTMLDivElement>({
    participant: trackRef.participant,
    htmlProps,
    source: trackRef.source,
    publication: trackRef.publication,
    disableSpeakingIndicator,
    onParticipantClick
  })

  const layoutContext = useMaybeLayoutContext()

  const handleSubscribe = React.useCallback(
    (subscribed: boolean) => {
      if (
        trackRef.source &&
        !subscribed &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isParticipantSourcePinned(trackRef.participant, trackRef.source, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' })
      }
    },
    [trackRef.participant, layoutContext, trackRef.source]
  )

  const participantWithProfile: Participant = React.useMemo(
    () => ({
      ...trackRef.participant,
      name: 'Edita me'
    }),
    [trackRef.participant]
  ) as Participant

  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <ParticipantContextIfNeeded participant={trackRef.participant}>
        {children ?? (
          <>
            {trackRef.publication?.kind === 'video' ||
            trackRef.source === Track.Source.Camera ||
            trackRef.source === Track.Source.ScreenShare ? (
              <VideoTrack
                participant={trackRef.participant}
                source={trackRef.source}
                publication={trackRef.publication}
                onSubscriptionStatusChanged={handleSubscribe}
              />
            ) : (
              <AudioTrack
                participant={trackRef.participant}
                source={trackRef.source}
                publication={trackRef.publication}
                onSubscriptionStatusChanged={handleSubscribe}
              />
            )}
            <div className="lk-participant-placeholder">
              <Profile address={trackRef.participant.identity} imageOnly size={imageSize} />
            </div>
            <div className="lk-participant-metadata">
              <div className="lk-participant-metadata-item">
                {trackRef.source === Track.Source.Camera ? (
                  <>
                    <TrackMutedIndicator source={Track.Source.Microphone} show={'muted'}></TrackMutedIndicator>
                    <ParticipantName participant={participantWithProfile} />
                  </>
                ) : (
                  <>
                    {/* <ScreenShareIcon style={{ marginRight: "0.25rem" }} /> */}
                    <ParticipantName participant={participantWithProfile}>&apos;s screen</ParticipantName>
                  </>
                )}
              </div>
              <ConnectionQualityIndicator className="lk-participant-metadata-item" />
            </div>
          </>
        )}
        <FocusToggle trackSource={trackRef.source} />
      </ParticipantContextIfNeeded>
    </div>
  )
}
