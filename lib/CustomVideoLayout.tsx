import React from 'react';
import {
  GridLayout,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
  LayoutContextProvider,
  Chat,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';

export const CustomVideoLayout: React.FC = () => {
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
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <GridLayout
              tracks={tracks}
              style={{
                height: '100%',
                width: '100%',
              }}
            >
              <ParticipantTile />
            </GridLayout>
          </div>

          <ControlBar
            className="custom-control-bar"
            variation="verbose"
            controls={{
              chat: true,
              microphone: true,
              camera: true,
              screenShare: true,
              leave: true,
            }}
          />
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

        <RoomAudioRenderer />
      </div>
    </LayoutContextProvider>
  );
};

export default CustomVideoLayout;
