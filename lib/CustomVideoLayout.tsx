import React from 'react';
import { GridLayout, useTracks, LayoutContextProvider, Chat } from '@livekit/components-react';
import { Track, Room } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';
import { CustomControlBar } from '@/app/custom/CustomControlBar';
import { SettingsMenu } from './SettingsMenu';

interface CustomVideoLayoutProps {
  room: Room;
  roomName: string;
}

export const CustomVideoLayout: React.FC<CustomVideoLayoutProps> = ({ room, roomName }) => {
  const [showChat, setShowChat] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
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
            if ('msg' in action && action.msg === 'toggle_chat') {
              setShowChat((prev) => !prev);
            }
            if ('msg' in action && action.msg === 'toggle_settings') {
              setShowSettings((prev) => !prev);
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
          </div>
        </div>

        {showChat && (
          <div
            className="lk-chat-container"
            style={{
              width: '470px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Chat
              style={{
                height: '100%',
              }}
            />
          </div>
        )}
        <CustomControlBar room={room} roomName={roomName} />
        <SettingsMenu showSettings={showSettings} />
      </div>
    </LayoutContextProvider>
  );
};

export default CustomVideoLayout;
