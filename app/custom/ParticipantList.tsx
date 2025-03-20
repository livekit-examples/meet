import { useLayoutContext, useRoomContext } from '@livekit/components-react';
import { Participant, RemoteParticipant } from 'livekit-client';
import { useEffect, useState } from 'react';
import { MicOffSVG, MicOnSVG } from '../svg/mic';
import { CameraOffSVG, CameraOnSVG } from '../svg/camera';
import { ScreenShareOnSVG } from '../svg/screen-share';
import { getAvatarColor, getInitials } from '@/lib/client-utils';
import { useCustomLayoutContext } from '../contexts/layout-context';

const ParticipantList = () => {
  const room = useRoomContext();
  const { localParticipant } = room;
  const [participants, setParticipants] = useState<Record<string, RemoteParticipant>>({});
  const { isParticipantsListOpen } = useCustomLayoutContext();

  function ToggleParticipantList() {
    if (isParticipantsListOpen.dispatch)
      isParticipantsListOpen.dispatch({ msg: 'toggle_participants_list' });
  }

  useEffect(() => {
    room.on('connectionStateChanged', () => {
      setParticipants({});
      room.remoteParticipants.forEach((participant) => {
        setParticipants((prev) => ({ ...prev, [participant.identity]: participant }));
      });
    });
    room.on('participantConnected', (participant) => {
      setParticipants((prev) => ({ ...prev, [participant.identity]: participant }));
    });
    room.on('participantDisconnected', (participant) => {
      setParticipants((prev) => {
        const { [participant.identity]: toDelete, ...rest } = prev;
        return rest;
      });
    });
    room.on('participantNameChanged', (name, participant) => {
      if (participant instanceof RemoteParticipant)
        setParticipants((prev) => ({ ...prev, [participant.identity]: participant }));
    });
    return () => {
      room.off('participantConnected', (participant) => {
        setParticipants((prev) => ({ ...prev, [participant.identity]: participant }));
      });
      room.off('participantDisconnected', (participant) => {
        setParticipants((prev) => {
          const { [participant.identity]: toDelete, ...rest } = prev;
          return rest;
        });
      });
      room.off('participantNameChanged', (name, participant) => {
        if (participant instanceof RemoteParticipant)
          setParticipants((prev) => ({ ...prev, [participant.identity]: participant }));
      });
    };
  }, []);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '25vw',
        margin: '1rem 1rem 4.1rem 0',
        padding: '1.25rem 1.75rem',
        backgroundColor: '#151E27',
        borderRadius: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.05rem',
            fontWeight: 'bold',
          }}
        >
          <span>{room.numParticipants}</span>
          <span>Participants</span>
        </div>
        <div
          className="material-symbols-outlined"
          style={{ color: '#556171', cursor: 'pointer' }}
          onClick={ToggleParticipantList}
        >
          close
        </div>
      </div>
      <ParticipantItem participant={localParticipant} />
      {Object.values(participants).map((participant: RemoteParticipant) => {
        return <ParticipantItem participant={participant} />;
      })}
    </div>
  );
};

export default ParticipantList;

interface ParticipantItemProps {
  participant: Participant;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ participant }) => {
  const profilePictureUrl = participant.metadata
    ? JSON.parse(participant.metadata).profilePictureUrl
    : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: 'auto' }}>
        <div>
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={participant.name} className="avatar-image" />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2rem',
                height: '2rem',
                backgroundColor: getAvatarColor(participant.identity),
                borderRadius: '100%',
              }}
            >
              {getInitials(participant.name || participant.identity)}
            </div>
          )}
        </div>
        <div>{participant.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {participant.isScreenShareEnabled ? <ScreenShareOnSVG /> : <></>}
        {participant.isCameraEnabled ? <CameraOnSVG /> : <CameraOffSVG />}
        {participant.isMicrophoneEnabled ? <MicOnSVG /> : <MicOffSVG />}
      </div>
    </div>
  );
};
