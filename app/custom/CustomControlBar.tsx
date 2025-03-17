'use client';

import React, { useState, useEffect } from 'react';
import { DisconnectButton, useRoomContext } from '@livekit/components-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { mergeClasses } from '@/lib/client-utils';
import { ToggleSource } from '@livekit/components-core';
import '../../styles/CustomControlBar.css';

interface CustomControlBarProps {
  room: Room;
  roomName: string;
}

export function CustomControlBar({ room, roomName }: CustomControlBarProps) {
  const [recording, setRecording] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    if (room) {
      const updateRecordingStatus = () => setRecording(room.isRecording);
      const updateParticipantCount = () => {
        setParticipantCount(room.numParticipants);
      };

      if (room.state === 'connected') {
        updateParticipantCount();
      }

      room.on(RoomEvent.Connected, updateParticipantCount);
      room.on(RoomEvent.ParticipantConnected, updateParticipantCount);
      room.on(RoomEvent.ParticipantDisconnected, updateParticipantCount);
      room.on(RoomEvent.RecordingStatusChanged, updateRecordingStatus);

      return () => {
        room.off(RoomEvent.Connected, updateParticipantCount);
        room.off(RoomEvent.ParticipantConnected, updateParticipantCount);
        room.off(RoomEvent.ParticipantDisconnected, updateParticipantCount);
        room.off(RoomEvent.RecordingStatusChanged, updateRecordingStatus);
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

        <div className={`control-button record-sign ${recording ? '' : 'disabled'}`}>
          <span className="material-symbols-outlined">radio_button_checked</span>
        </div>

        <TrackToggle source={Track.Source.ScreenShare} />
        <DisconnectButton className="control-button end-call-button">
          <span className="material-symbols-outlined">call_end</span>
        </DisconnectButton>
      </div>

      {/* Participants, Settings btn */}
      <div className="top-right-controls">
        <div className="participant-box">
          <span className="material-symbols-outlined">people</span>
          <span className="participant-count">{participantCount}</span>
        </div>

        <div className="settings-box">
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
      return enabled ? (
        <span className="material-symbols-outlined">videocam</span>
      ) : (
        <span
          button-state="inactive"
          data-lk-video-enabled="false"
          className="material-symbols-outlined"
        >
          videocam_off
        </span>
      );
    case Track.Source.Microphone:
      return enabled ? (
        <span className="material-symbols-outlined">mic</span>
      ) : (
        <span
          button-state="inactive"
          data-lk-audio-enabled="false"
          className="material-symbols-outlined"
        >
          mic_off
        </span>
      );
    case Track.Source.ScreenShare:
      return enabled ? (
        <span className="material-symbols-outlined">screen_share</span>
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
