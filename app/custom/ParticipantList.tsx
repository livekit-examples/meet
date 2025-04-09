import { useRoomContext } from '@livekit/components-react';
import { Participant, RemoteParticipant } from 'livekit-client';
import { MicOffSVG, MicOnSVG } from '../svg/mic';
import { CameraOffSVG, CameraOnSVG } from '../svg/camera';
import { ScreenShareOnSVG } from '../svg/screen-share';
import { getAvatarColor, getInitials } from '@/lib/client-utils';
import { useCustomLayoutContext } from '../contexts/layout-context';

const ParticipantList = () => {
  const room = useRoomContext();
  const { localParticipant, remoteParticipants } = room;
  const { isParticipantsListOpen } = useCustomLayoutContext();

  function ToggleParticipantList() {
    if (isParticipantsListOpen.dispatch)
      isParticipantsListOpen.dispatch({ msg: 'toggle_participants_list' });
  }

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
      {[...remoteParticipants.entries()].map((participant) => {
        return <ParticipantItem participant={participant[1]} />;
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
            <img
              src={profilePictureUrl}
              alt={participant.name}
              className="avatar-image"
              style={{
                maxWidth: '2rem',
                maxHeight: '2rem',
              }}
            />
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
        <div style={{ fontSize: '0.9rem' }}>{participant.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {participant.isScreenShareEnabled ? <ScreenShareOnSVG /> : <></>}
        {participant.isCameraEnabled ? <CameraOnSVG /> : <CameraOffSVG />}
        {participant.isMicrophoneEnabled ? <MicOnSVG /> : <MicOffSVG />}
      </div>
    </div>
  );
};
