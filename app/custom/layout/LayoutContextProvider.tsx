import React, { useState } from 'react';
import { LayoutContextProvider, TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { CustomLayoutContextProvider } from '@/app/contexts/layout-context';
import { PinAction } from '@livekit/components-react/dist/context/pin-context';
import { PanelTopInactive, Pi } from 'lucide-react';

interface CustomVideoLayoutContextProviderProps {
  children: React.ReactNode;
}

export const CustomVideoLayoutContextProvider: React.FC<CustomVideoLayoutContextProviderProps> = ({
  children,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [pinnedTracks, setPinnedTracks] = useState<TrackReferenceOrPlaceholder[]>();

  const toggleParticipantsList = () => {
    if (showChat) setShowChat(false);
    setShowParticipantsList((prev) => !prev);
  };

  const toggleChat = () => {
    if (showParticipantsList) setShowParticipantsList(false);
    setShowChat((prev) => !prev);
  };

  const toggleSettings = () => {
    setShowSettings((prev) => !prev);
  };

  return (
    <CustomLayoutContextProvider
      layoutContextValue={{
        isParticipantsListOpen: {
          state: showParticipantsList,
          dispatch: toggleParticipantsList,
        },
        isChatOpen: {
          state: showChat,
          dispatch: toggleChat,
        },
      }}
    >
      <LayoutContextProvider
        value={{
          pin: {
            state: pinnedTracks,
            dispatch: (action: PinAction) => {
              if (action.msg === 'set_pin') {
                setPinnedTracks([action.trackReference]);
              }
              if (action.msg === 'clear_pin') {
                setPinnedTracks([]);
              }
            },
          },
          widget: {
            state: {
              showChat,
              showSettings,
              unreadMessages: 0,
            },
            dispatch: (action: any) => {
              switch (action && action.msg) {
                case 'toggle_settings':
                  toggleSettings();
                  break;
                case 'toggle_chat':
                  toggleChat();
                  break;
                case 'toggle_participants_list':
                  toggleParticipantsList();
                  break;
              }
            },
          },
        }}
      >
        {children}
      </LayoutContextProvider>
    </CustomLayoutContextProvider>
  );
};
