import { useIsRecording } from '@livekit/components-react';
import * as React from 'react';

export function RecordingIndicator() {
  const isRecording = useIsRecording();

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
