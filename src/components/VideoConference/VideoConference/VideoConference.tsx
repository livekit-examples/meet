import React, { useRef, useEffect } from 'react'
import { isEqualTrackRef, isTrackReference, log, isWeb } from '@livekit/components-core'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import {
  CarouselView,
  ConnectionStateToast,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  RoomAudioRenderer,
  usePinnedTracks,
  useTracks
} from '@livekit/components-react'
import classNames from 'classnames'
import { RoomEvent, Track } from 'livekit-client'
import { useCreateLayoutContext } from '../../../hooks/useLayoutContext'
import { ControlBar } from '../ControlBar'
import ParticipantTile from '../ParticipantTile'
import RightPanel from '../RightPanel'
import type { VideoConferenceProps } from './VideoConference.types'
import styles from './VideoConference.module.css'

/**
 * This component is the default setup of a classic LiveKit video conferencing app.
 * It provides functionality like switching between participant grid view and focus view.
 *
 * @remarks
 * The component is implemented with other LiveKit components like `FocusContextProvider`,
 * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <VideoConference />
 * <LiveKitRoom>
 * ```
 * @public
 */
export function VideoConference(props: VideoConferenceProps) {
  const lastAutoFocusedScreenShareTrack = useRef<TrackReferenceOrPlaceholder | null>(null)

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged] }
  )

  const layoutContext = useCreateLayoutContext()

  const screenShareTracks = tracks.filter(isTrackReference).filter(track => track.publication.source === Track.Source.ScreenShare)

  const focusTrack = usePinnedTracks(layoutContext)?.[0]
  const carouselTracks = tracks.filter(track => !isEqualTrackRef(track, focusTrack))

  useEffect(() => {
    // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
    if (screenShareTracks.length > 0 && lastAutoFocusedScreenShareTrack.current === null) {
      log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] })
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] })
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0]
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(track => track.publication.trackSid === lastAutoFocusedScreenShareTrack.current?.publication?.trackSid)
    ) {
      log.debug('Auto clearing screen share focus.')
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' })
      lastAutoFocusedScreenShareTrack.current = null
    }
  }, [screenShareTracks.map(ref => ref.publication.trackSid).join(), focusTrack?.publication?.trackSid])

  return (
    <div className="lk-video-conference" {...props}>
      {isWeb() && (
        <LayoutContextProvider value={layoutContext}>
          <div className={`${styles.VideoConferenceInnerContainer} lk-video-conference-inner`}>
            {!focusTrack ? (
              <div className={classNames('lk-grid-layout-wrapper', styles.LayoutWrapper)}>
                <GridLayout tracks={tracks} className={styles.GridLayout}>
                  <ParticipantTile imageSize="massive" />
                </GridLayout>
                <RightPanel />
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper">
                <FocusLayoutContainer>
                  <CarouselView tracks={carouselTracks}>
                    <ParticipantTile imageSize="huge" />
                  </CarouselView>
                  {focusTrack && <FocusLayout track={focusTrack} />}
                </FocusLayoutContainer>
              </div>
            )}
            <ControlBar controls={{ chat: true, peoplePanel: true }} variation="minimal" />
          </div>
        </LayoutContextProvider>
      )}
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  )
}
