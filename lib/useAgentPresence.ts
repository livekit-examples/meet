'use client';

import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

// Agent name must match config.py BOT_NAME
const TRANSCRIPTION_AGENT_NAME = 'LiveKit Transcription';

/**
 * Hook to detect if a transcription agent is present in the room.
 * Checks for participant with name "LiveKit Transcription".
 */
export function useAgentPresence() {
  const room = useRoomContext();
  const [hasAgent, setHasAgent] = React.useState(false);
  const [agentParticipant, setAgentParticipant] = React.useState<RemoteParticipant | null>(null);

  const checkForAgent = React.useCallback(() => {
    if (!room) {
      setHasAgent(false);
      setAgentParticipant(null);
      return;
    }

    // Check all remote participants for our transcription agent by name
    for (const participant of room.remoteParticipants.values()) {
      if (participant.name === TRANSCRIPTION_AGENT_NAME) {
        setHasAgent(true);
        setAgentParticipant(participant);
        return;
      }
    }

    setHasAgent(false);
    setAgentParticipant(null);
  }, [room]);

  React.useEffect(() => {
    if (!room) return;

    // Initial check
    checkForAgent();

    // Listen for participant changes
    const handleParticipantConnected = () => checkForAgent();
    const handleParticipantDisconnected = () => checkForAgent();

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room, checkForAgent]);

  return { hasAgent, agentParticipant, checkForAgent };
}

export default useAgentPresence;
