'use client';
import * as React from 'react';
import {
  CarouselLayout,
  ConnectionStateToast,
  ControlBar,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  RoomAudioRenderer,
  useCreateLayoutContext,
  usePinnedTracks,
  useTracks,
  type MessageDecoder,
  type MessageEncoder,
  type MessageFormatter,
  type WidgetState,
} from '@livekit/components-react';
import { isEqualTrackRef, isTrackReference } from '@livekit/components-core';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import { CustomParticipantTile } from './CustomParticipantTile';
import { WatchTogetherProvider, useWatchTogether } from './watchTogether/WatchTogetherContext';
import { EmbedTile } from './watchTogether/EmbedTile';
import { StreamHostController } from './watchTogether/StreamHostController';
import { CustomChat } from './watchTogether/CustomChat';
import { CinemaPanel } from './watchTogether/CinemaPanel';

export interface CustomVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  SettingsComponent?: React.ComponentType;
}

export function CustomVideoConference(props: CustomVideoConferenceProps) {
  return (
    <WatchTogetherProvider>
      <CustomVideoConferenceInner {...props} />
    </WatchTogetherProvider>
  );
}

function CustomVideoConferenceInner({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  ...props
}: CustomVideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });
  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);
  const { embed } = useWatchTogether();
  const embedActive = embed.active;

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  React.useEffect(() => {
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
      lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          track.publication.trackSid ===
          lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
      lastAutoFocusedScreenShareTrack.current = null;
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocus = tracks.find(
        (t) =>
          t.participant.identity === focusTrack.participant.identity &&
          t.source === focusTrack.source,
      );
      if (updatedFocus !== focusTrack && isTrackReference(updatedFocus)) {
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocus });
      }
    }
  }, [
    screenShareTracks.map((t) => `${t.publication.trackSid}_${t.publication.isSubscribed}`).join(),
    focusTrack?.publication?.trackSid,
    tracks,
  ]);

  return (
    <div className="lk-video-conference" {...props}>
      <LayoutContextProvider value={layoutContext} onWidgetChange={setWidgetState}>
        <div className="lk-video-conference-inner">
          {embedActive ? (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselLayout tracks={tracks}>
                  <CustomParticipantTile />
                </CarouselLayout>
                <EmbedTile />
              </FocusLayoutContainer>
            </div>
          ) : !focusTrack ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks}>
                <CustomParticipantTile />
              </GridLayout>
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselLayout tracks={carouselTracks}>
                  <CustomParticipantTile />
                </CarouselLayout>
                {focusTrack && <CustomParticipantTile trackRef={focusTrack} />}
              </FocusLayoutContainer>
            </div>
          )}
          <CinemaPanel />
          <ControlBar controls={{ chat: true, settings: !!SettingsComponent }} />
        </div>
        <CustomChat
          style={{ display: widgetState.showChat ? 'grid' : 'none' }}
          messageFormatter={chatMessageFormatter}
          messageEncoder={chatMessageEncoder}
          messageDecoder={chatMessageDecoder}
        />
        {SettingsComponent && (
          <div
            className="lk-settings-menu-modal"
            style={{ display: widgetState.showSettings ? 'block' : 'none' }}
          >
            <SettingsComponent />
          </div>
        )}
      </LayoutContextProvider>
      <StreamHostController />
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}
