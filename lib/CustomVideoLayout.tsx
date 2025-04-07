import React, { useState } from 'react';
import { GridLayout, useTracks, LayoutContextProvider, Chat } from '@livekit/components-react';
import { Track, Room } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';
import { CustomControlBar } from '@/app/custom/CustomControlBar';
import { SettingsMenu } from './SettingsMenu';
import ParticipantList from '@/app/custom/ParticipantList';
import { CustomLayoutContextProvider } from '@/app/contexts/layout-context';
import '../styles/Chat.css';

interface CustomVideoLayoutProps {
  room: Room;
  roomName: string;
}

export const CustomVideoLayout: React.FC<CustomVideoLayoutProps> = ({ room, roomName }) => {
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <CustomLayoutContextProvider
      layoutContextValue={{
        isParticipantsListOpen: {
          state: showParticipantsList,
          dispatch: () => {
            if (showChat) setShowChat(false);
            setShowParticipantsList((prev) => !prev);
          },
        },
        isChatOpen: {
          state: showChat,
          dispatch: () => {
            if (showParticipantsList) setShowParticipantsList(false);
            setShowChat((prev) => !prev);
          },
        },
      }}
    >
      <LayoutContextProvider
        value={{
          pin: {
            state: [],
            dispatch: () => {},
          },
          widget: {
            state: {
              showChat,
              showSettings,
              unreadMessages: 0,
            },
            dispatch: (action: any) => {
              if ('msg' in action && action.msg === 'toggle_settings') {
                setShowSettings((prev) => !prev);
              }
              if ('msg' in action && action.msg === 'toggle_chat') {
                if (showParticipantsList) setShowParticipantsList(false);
                setShowChat((prev) => !prev);
              }
              if ('msg' in action && action.msg === 'toggle_participants_list') {
                if (showChat) setShowChat(false);
                setShowParticipantsList((prev) => !prev);
              }
            },
          },
        }}
      >
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
              <GridLayout
                tracks={tracks}
                style={{
                  width: '100%',
                  padding: '1rem 1rem 0.5rem 1rem',
                }}
              >
                <ParticipantTile />
              </GridLayout>
              <CustomControlBar room={room} roomName={roomName} />{' '}
            </div>
          </div>
          {showParticipantsList && <ParticipantList />}
          {showChat && <Chat />}
          <SettingsMenu showSettings={showSettings} />
        </div>
      </LayoutContextProvider>
    </CustomLayoutContextProvider>
  );
};

export default CustomVideoLayout;
