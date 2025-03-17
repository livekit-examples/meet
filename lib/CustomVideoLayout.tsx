import React from 'react';
import {
  GridLayout,
  useTracks,
  RoomAudioRenderer,
  LayoutContextProvider,
  Chat,
} from '@livekit/components-react';
import { Track, Room } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';
import { CustomControlBar } from '@/app/custom/CustomControlBar';

interface CustomVideoLayoutProps {
  room: Room;
  roomName: string;
}

export const CustomVideoLayout: React.FC<CustomVideoLayoutProps> = ({ room, roomName }) => {
  const [showChat, setShowChat] = React.useState(false);

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
            unreadMessages: 0,
          },
          dispatch: (action: any) => {
            if ('msg' in action && action.msg === 'toggle_chat') {
              setShowChat((prev) => !prev);
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
          width: '100%',
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
        <RoomAudioRenderer />
      </div>
    </LayoutContextProvider>
  );
};

export default CustomVideoLayout;
