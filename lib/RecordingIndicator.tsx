import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import * as React from 'react';

export function RecordingIndicator() {
  const [recordingState, setRecordingState] = React.useState({
    recording: { isRecording: false, recorder: '' },
  });
  const isRecording = React.useMemo(() => {
    return recordingState.recording.isRecording;
  }, [recordingState]);
  const room = useRoomContext();

  const updateRoomMetadata = (metadata: string) => {
    const parsedMetadata = JSON.parse(metadata === '' ? '{}' : metadata);
    setRecordingState({
      recording: {
        isRecording: parsedMetadata.recording.isRecording,
        recorder: parsedMetadata.recording.recorder,
      },
    });
  };

  React.useEffect(() => {
    if (room) {
      room.on(RoomEvent.RoomMetadataChanged, updateRoomMetadata);

      return () => {
        room.off(RoomEvent.RoomMetadataChanged, updateRoomMetadata);
      };
    }
  }, [room]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        boxShadow: isRecording ? 'red 0px 0px 0px 3px inset' : 'none',
        pointerEvents: 'none',
      }}
    ></div>
  );
}
