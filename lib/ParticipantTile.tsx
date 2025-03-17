import React, { useEffect, useState } from 'react';
import { AudioTrack, useTracks, VideoTrack, useTrackRefContext } from '@livekit/components-react';
import { Track, Participant } from 'livekit-client';

function getAvatarColor(identity: string): string {
  const colors = [
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FFC107',
    '#FF9800',
    '#FF5722',
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
  ];

  let hash = 0;
  for (let i = 0; i < identity.length; i++) {
    hash = identity.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export interface ParticipantTileProps {
  participant?: Participant;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant: propParticipant,
}) => {
  const trackRef = useTrackRefContext();
  const participant = propParticipant || trackRef?.participant;

  if (!participant) return null;

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const isValidTrackRef =
    trackRef && 'publication' in trackRef && trackRef.publication !== undefined;

  const cameraTrack =
    isValidTrackRef && trackRef.source === Track.Source.Camera
      ? trackRef
      : useTracks([Track.Source.Camera], { onlySubscribed: false }).filter(
          (track) => track.participant.identity === participant.identity,
        )[0];

  const microphoneTrack = useTracks([Track.Source.Microphone], { onlySubscribed: false }).filter(
    (track) => track.participant.identity === participant.identity,
  )[0];

  const isSpeaking = participant.isSpeaking;

  useEffect(() => {
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.profilePictureUrl) {
          setProfilePictureUrl(metadata.profilePictureUrl);
        }
      } catch (e) {
        console.error('Failed to parse participant metadata', e);
      }
    }
  }, [participant.metadata]);

  const hasCamera = !!cameraTrack;
  const isCameraEnabled = hasCamera && !cameraTrack.publication?.isMuted;

  const hasMicrophone = !!microphoneTrack;
  const isMicrophoneEnabled = hasMicrophone && !microphoneTrack.publication?.isMuted;

  const avatarColor = getAvatarColor(participant.identity);
  const initials = getInitials(participant.name || participant.identity);

  return (
    <div className={`participant-tile ${isSpeaking ? 'speaking' : ''}`}>
      {isCameraEnabled ? (
        <div className="video-container">
          <VideoTrack trackRef={cameraTrack} />
        </div>
      ) : (
        <div className="avatar-container" style={{ backgroundColor: avatarColor }}>
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={participant.name} className="avatar-image" />
          ) : (
            <span className="avatar-initials">{initials}</span>
          )}
        </div>
      )}

      <div className="participant-info">
        {isMicrophoneEnabled ? (
          isSpeaking ? (
            <span
              className="mic-icon speaking-icon"
              style={{
                backgroundColor: '#618AFF',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              graphic_eq
            </span>
          ) : (
            <span className="mic-icon mic-on">mic</span>
          )
        ) : (
          <span className="mic-icon mic-off">mic_off</span>
        )}
        <span className="participant-name">{participant.name || participant.identity}</span>
      </div>

      {hasMicrophone && microphoneTrack && <AudioTrack trackRef={microphoneTrack} />}
    </div>
  );
};

export default ParticipantTile;
