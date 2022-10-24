import { HStack } from '@chakra-ui/react';
import { faCommentDots } from '@fortawesome/free-regular-svg-icons';
import { faComment, faDesktop, faStop } from '@fortawesome/free-solid-svg-icons';
import {
  AudioSelectButton,
  ControlButton,
  ControlsProps,
  useParticipant,
  VideoSelectButton,
} from '@livekit/react-components';
import { useState } from 'react';
import styles from '../styles/Room.module.css';
import ChatOverlay from './ChatOverlay';

const Controls = ({ room, onLeave }: ControlsProps) => {
  const { cameraPublication: camPub } = useParticipant(room.localParticipant);
  const [videoButtonDisabled, setVideoButtonDisabled] = useState(false);
  const [audioButtonDisabled, setAudioButtonDisabled] = useState(false);
  const [screenButtonDisabled, setScreenButtonDisabled] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [numUnread, setNumUnread] = useState(0);

  const startChat = () => {
    setChatOpen(true);
  };

  const audioEnabled = room.localParticipant.isMicrophoneEnabled;
  const muteButton = (
    <AudioSelectButton
      isMuted={!audioEnabled}
      isButtonDisabled={audioButtonDisabled}
      onClick={() => {
        setAudioButtonDisabled(true);
        room.localParticipant
          .setMicrophoneEnabled(!audioEnabled)
          .finally(() => setAudioButtonDisabled(false));
      }}
      onSourceSelected={(device) => {
        setAudioButtonDisabled(true);
        room
          .switchActiveDevice('audioinput', device.deviceId)
          .finally(() => setAudioButtonDisabled(false));
      }}
    />
  );

  const videoEnabled = !(camPub?.isMuted ?? true);
  const videoButton = (
    <VideoSelectButton
      isEnabled={videoEnabled}
      isButtonDisabled={videoButtonDisabled}
      onClick={() => {
        setVideoButtonDisabled(true);
        room.localParticipant
          .setCameraEnabled(!videoEnabled)
          .finally(() => setVideoButtonDisabled(false));
      }}
      onSourceSelected={(device) => {
        setVideoButtonDisabled(true);
        room
          .switchActiveDevice('videoinput', device.deviceId)
          .finally(() => setVideoButtonDisabled(false));
      }}
    />
  );

  const screenShareEnabled = room.localParticipant.isScreenShareEnabled;
  const screenButton = (
    <ControlButton
      label={screenShareEnabled ? 'Stop sharing' : 'Share screen'}
      icon={screenShareEnabled ? faStop : faDesktop}
      disabled={screenButtonDisabled}
      onClick={() => {
        setScreenButtonDisabled(true);
        room.localParticipant
          .setScreenShareEnabled(!screenShareEnabled)
          .finally(() => setScreenButtonDisabled(false));
      }}
    />
  );

  const chatButton = (
    <ControlButton
      label="Chat"
      icon={numUnread > 0 ? faCommentDots : faComment}
      onClick={startChat}
    />
  );

  return (
    <>
      <HStack>
        {muteButton}
        {videoButton}
        {screenButton}
        {chatButton}
        {onLeave && (
          <ControlButton
            label="End"
            className={styles.dangerButton}
            onClick={() => {
              room.disconnect();
              onLeave(room);
            }}
          />
        )}
      </HStack>
      <ChatOverlay
        room={room}
        isOpen={isChatOpen}
        onUnreadChanged={setNumUnread}
        onClose={() => {
          setChatOpen(false);
        }}
      />
    </>
  );
};

export default Controls;
