'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrackToggle, 
  DisconnectButton 
} from '@livekit/components-react';
import { 
  Room, 
  RoomEvent, 
  Track 
} from 'livekit-client';
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
        if (room && room.participants) {
          setParticipantCount(room.participants.size + 1); 
        }
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
    navigator.clipboard.writeText(window.location.href)
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
      <div className="control-buttons">
        <TrackToggle source={Track.Source.Microphone} className="control-button mic-button">
          {/* <span className="material-symbols-outlined">mic</span>
          <span data-lk-audio-enabled="false" className="material-symbols-outlined">mic_off</span> */}
        </TrackToggle>
        
        <TrackToggle source={Track.Source.Camera} className="control-button camera-button">
          {/* <span className="material-symbols-outlined">videocam</span>
          <span data-lk-video-enabled="false" className="material-symbols-outlined">videocam_off</span> */}
        </TrackToggle>
        
        <div className={`control-button record-sign ${recording ? '' : 'disabled'}`}>
          <span className="material-symbols-outlined">radio_button_checked</span>
        </div>
        
        <TrackToggle source={Track.Source.ScreenShare} className="control-button screen-share-button">
          {/* <span className="material-symbols-outlined">screen_share</span>
          <span data-lk-screen-share-enabled="true" className="material-symbols-outlined">screen_share</span> */}
        </TrackToggle>
        
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