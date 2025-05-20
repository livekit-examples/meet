'use client';

import React from 'react';
import { Track } from 'livekit-client';
import { useLocalParticipant, useTrackToggle } from '@livekit/components-react';

export function KeyboardShortcuts() {
  const _ = useLocalParticipant();
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({ source: Track.Source.Microphone });
  const { toggle: toggleCamera, enabled: cameraEnabled } = useTrackToggle({ source: Track.Source.Camera });

  React.useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      // Toggle microphone: Cmd/Ctrl-Shift-A
      if (toggleMic && event.key === 'A' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        toggleMic(!micEnabled, true);
      }

      // Toggle camera: Cmd/Ctrl-Shift-V
      if (event.key === 'V' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        toggleCamera(!cameraEnabled, true);
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [
    toggleMic, micEnabled,
    toggleCamera, cameraEnabled,
  ]);

  return null;
}
