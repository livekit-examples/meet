import React, { useEffect } from 'react';
import {
  GridLayout,
  useTracks,
  Chat,
  CarouselLayout,
  usePinnedTracks,
  useLayoutContext,
} from '@livekit/components-react';
import { isEqualTrackRef } from '@livekit/components-core';
import { Track, Room } from 'livekit-client';
import { CustomControlBar } from '@/app/custom/CustomControlBar';
import ParticipantList from '@/app/custom/ParticipantList';
import { ParticipantTile } from '@/lib/ParticipantTile';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useCustomLayoutContext } from '@/app/contexts/layout-context';
import '@/styles/Chat.css';
import { FocusLayout, FocusLayoutContainer } from './FocusLayout';

interface CustomVideoLayoutProps {
  room: Room;
  roomName: string;
}

export const CustomVideoLayout: React.FC<CustomVideoLayoutProps> = ({ room, roomName }) => {
  const { isChatOpen, isParticipantsListOpen } = useCustomLayoutContext();
  const layoutContext = useLayoutContext();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const focusTrack = usePinnedTracks()[0];
  const test = usePinnedTracks();

  useEffect(() => {
    console.log({ test });
  }, [test]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: '#070707',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          {!focusTrack ? (
            <GridLayout
              tracks={tracks}
              style={{
                width: '100%',
                padding: '1rem 1rem 0.5rem 1rem',
              }}
            >
              <ParticipantTile />
            </GridLayout>
          ) : (
            <FocusLayoutContainer
              style={{
                width: '100%',
                height: '93%',
                padding: '1rem 1rem 0.5rem 1rem',
              }}
            >
              <CarouselLayout tracks={tracks}>
                <ParticipantTile />
              </CarouselLayout>
              {focusTrack && <FocusLayout style={{ width: '100%' }} trackRef={focusTrack} />}{' '}
            </FocusLayoutContainer>
          )}
          <CustomControlBar room={room} roomName={roomName} />{' '}
        </div>
      </div>
      {isParticipantsListOpen.state && <ParticipantList />}
      {isChatOpen.state && <Chat />}
      <SettingsMenu showSettings={layoutContext.widget.state?.showSettings || false} />
    </div>
  );
};

export default CustomVideoLayout;
