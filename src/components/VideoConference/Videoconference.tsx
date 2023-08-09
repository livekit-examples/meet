import * as React from 'react'
import { isEqualTrackRef, isTrackReference, log, isWeb } from '@livekit/components-core'
import {
  CarouselView,
  Chat,
  ConnectionStateToast,
  ControlBar,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  MessageFormatter,
  RoomAudioRenderer,
  useCreateLayoutContext,
  // useParticipants,
  usePinnedTracks,
  useTracks
} from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import { ParticipantTile } from './ParticipantTile'
import type { TrackReferenceOrPlaceholder, WidgetState } from '@livekit/components-core'

/**
 * @public
 */
export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter
}

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
export function VideoConference({ chatMessageFormatter, ...props }: VideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({ showChat: false })
  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null)

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged] }
  )

  // TODO: remove this unused declaration if it's not needed
  /* const participants = useParticipants({
    updateOnlyOn: [RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected]
  }) */

  const widgetUpdate = (state: WidgetState) => {
    log.debug('updating widget state', state)
    setWidgetState(state)
  }

  const layoutContext = useCreateLayoutContext()

  const screenShareTracks = tracks.filter(isTrackReference).filter(track => track.publication.source === Track.Source.ScreenShare)

  const focusTrack = usePinnedTracks(layoutContext)?.[0]
  const carouselTracks = tracks.filter(track => !isEqualTrackRef(track, focusTrack))

  React.useEffect(() => {
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
        <LayoutContextProvider
          value={layoutContext}
          // onPinChange={handleFocusStateChange}
          onWidgetChange={widgetUpdate}
        >
          <div className="lk-video-conference-inner">
            {!focusTrack ? (
              <div className="lk-grid-layout-wrapper">
                <GridLayout tracks={tracks}>
                  <ParticipantTile imageSize="massive" />
                </GridLayout>
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
            <ControlBar controls={{ chat: true }} />
          </div>
          <Chat style={{ display: widgetState.showChat ? 'flex' : 'none' }} messageFormatter={chatMessageFormatter} />
        </LayoutContextProvider>
      )}
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  )
}
