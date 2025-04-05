'use client';

import React, { useState, useEffect } from 'react';
import {
  DisconnectButton,
  useIsRecording,
  useLayoutContext,
  useRoomContext,
} from '@livekit/components-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { mergeClasses } from '@/lib/client-utils';
import { ToggleSource } from '@livekit/components-core';
import '../../styles/CustomControlBar.css';
import { CameraOffSVG, CameraOnSVG } from '../svg/camera';
import { MicOffSVG, MicOnSVG } from '../svg/mic';
import { ScreenShareOnSVG } from '../svg/screen-share';
import { useCustomLayoutContext } from '../contexts/layout-context';
import { useToast } from './toast/use-toast';

interface CustomControlBarProps {
  room: Room;
  roomName: string;
}

export function CustomControlBar({ room, roomName }: CustomControlBarProps) {
  const recordingEndpoint = process.env.NEXT_PUBLIC_LK_RECORD_ENDPOINT;
  const isRecording = useIsRecording();
  const [isRecordingRequestPending, setIsRecordingRequestPending] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const { dispatch } = useLayoutContext().widget;
  const { isParticipantsListOpen } = useCustomLayoutContext();
  const { toast } = useToast();
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    if (isFirstMount) return setIsFirstMount(false);
    setIsRecordingRequestPending(false);
    if (isRecording) {
      toast({
        title: 'Recording in progress. Please be aware this call is being recorded.',
      });
    } else {
      toast({
        title: 'Recorded ended. This call is no longer being recorded.',
      });
    }
  }, [isRecording]);

  function ToggleParticipantsList() {
    if (isParticipantsListOpen.dispatch)
      isParticipantsListOpen.dispatch({ msg: 'toggle_participants_list' });
  }

  const toggleRoomRecording = async () => {
    if (isRecordingRequestPending) return;
    setIsRecordingRequestPending(true);
    if (!isRecording)
      toast({
        title: 'Starting call recording. Please wait...',
      });
    else
      toast({
        title: 'Stopping call recording. Please wait...',
      });

    if (!recordingEndpoint) {
      throw TypeError('No recording endpoint specified');
    }
    if (room.isE2EEEnabled) {
      throw Error('Recording of encrypted meetings is currently not supported');
    }
    let response: Response;
    const now = new Date(Date.now()).toISOString();
    // const fileName = `${now}-${room.name}.mp4`;
    if (isRecording) {
      response = await fetch(recordingEndpoint + `/stop?roomName=${room.name}`);
    } else {
      response = await fetch(recordingEndpoint + `/start?roomName=${room.name}&now=${now}`);
    }
    if (response.ok) {
    } else {
      console.error(
        'Error handling recording request, check server logs:',
        response.status,
        response.statusText,
      );
    }
  };

  useEffect(() => {
    if (room) {
      const updateParticipantCount = () => {
        setParticipantCount(room.numParticipants);
      };

      room.on(RoomEvent.Connected, updateParticipantCount);
      room.on(RoomEvent.ParticipantConnected, updateParticipantCount);
      room.on(RoomEvent.ParticipantDisconnected, updateParticipantCount);

      return () => {
        room.off(RoomEvent.Connected, updateParticipantCount);
        room.off(RoomEvent.ParticipantConnected, updateParticipantCount);
        room.off(RoomEvent.ParticipantDisconnected, updateParticipantCount);
      };
    }
  }, [room]);

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert('Link copied to clipboard!'))
      .catch((err) => console.error('Failed to copy link:', err));
  };

  return (
    <div className="custom-control-bar">
      <div className="room-name-box">
        <span className="room-name">{roomName}</span>
        <button className="copy-link-button" onClick={handleCopyLink}>
          <span className="material-symbols-outlined">content_copy</span>
        </button>
      </div>

      {/* Center: Control Buttons */}
      <div className="control-bar control-buttons">
        <TrackToggle source={Track.Source.Microphone} />
        <TrackToggle source={Track.Source.Camera} />

        <div
          className={`control-btn ${isRecording ? '' : 'disabled'}`}
          onClick={toggleRoomRecording}
          data-lk-active={isRecording}
          style={{
            cursor: isRecordingRequestPending ? 'not-allowed' : 'pointer',
            color: isRecordingRequestPending ? 'gray' : isRecording ? '#ED7473' : 'white',
          }}
        >
          {isRecording ? (
            <span className="material-symbols-outlined" style={{}}>
              stop_circle
            </span>
          ) : (
            <span className="material-symbols-outlined">radio_button_checked</span>
          )}
        </div>

        <TrackToggle source={Track.Source.ScreenShare} />
        <DisconnectButton className="end-call-button">
          <span className="material-symbols-outlined">call_end</span>
        </DisconnectButton>
      </div>

      {/* Participants, Settings btn */}
      <div className="top-right-controls">
        <div className="participant-box" onClick={ToggleParticipantsList}>
          <span className="material-symbols-outlined">people</span>
          <span className="participant-count">{participantCount}</span>
        </div>

        <div
          className="settings-box"
          onClick={() => {
            if (dispatch) dispatch({ msg: 'toggle_settings' });
          }}
        >
          <span className="material-symbols-outlined">settings</span>
        </div>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  enabled?: boolean;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function ControlButton({ enabled = true, icon, className, onClick }: ControlButtonProps) {
  return (
    <button
      className={mergeClasses('control-btn', className)}
      data-lk-active={!enabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function TrackToggle({ source }: { source: ToggleSource }) {
  const { enabled, toggle } = useTrackToggle({ source });
  const isScreenShare = source === Track.Source.ScreenShare;

  return (
    <ControlButton
      onClick={toggle}
      enabled={isScreenShare ? !enabled : enabled}
      icon={<TrackIcon trackSource={source} enabled={isScreenShare ? !enabled : enabled} />}
    />
  );
}

interface TrackIconProps {
  trackSource: ToggleSource;
  enabled: boolean;
}

function TrackIcon({ trackSource, enabled }: TrackIconProps) {
  switch (trackSource) {
    case Track.Source.Camera:
      return enabled ? <CameraOnSVG /> : <CameraOffSVG />;
    case Track.Source.Microphone:
      return enabled ? <MicOnSVG /> : <MicOffSVG />;
    case Track.Source.ScreenShare:
      return enabled ? (
        <ScreenShareOnSVG />
      ) : (
        <span
          button-state="inactive"
          data-lk-screen-share-enabled="true"
          className="material-symbols-outlined"
        >
          stop_screen_share
        </span>
      );
  }
}

// Custom hook for track toggle
function useTrackToggle({ source }: { source: ToggleSource }) {
  const { localParticipant } = useRoomContext();

  const toggle = () => {
    switch (source) {
      case Track.Source.Camera:
        return localParticipant.setCameraEnabled(!enabled);
      case Track.Source.Microphone:
        return localParticipant.setMicrophoneEnabled(!enabled);
      case Track.Source.ScreenShare:
        return localParticipant.setScreenShareEnabled(!enabled);
    }
  };

  const enabled = (() => {
    switch (source) {
      case Track.Source.Camera:
        return localParticipant.isCameraEnabled;
      case Track.Source.Microphone:
        return localParticipant.isMicrophoneEnabled;
      case Track.Source.ScreenShare:
        return localParticipant.isScreenShareEnabled;
    }
  })();

  return { enabled, toggle };
}
