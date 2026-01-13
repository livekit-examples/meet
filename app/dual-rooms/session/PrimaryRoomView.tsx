'use client';

import React from 'react';
import {
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ConnectionStateToast,
  LayoutContextProvider,
  FocusLayout,
  CarouselLayout,
  useLocalParticipant,
  useTracks,
  ControlBar,
  Chat,
} from '@livekit/components-react';
import { useCreateLayoutContext } from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { isTrackReference, isEqualTrackRef } from '@livekit/components-core';
import styles from '@/styles/DualRoom.module.css';

export interface PrimaryRoomViewProps {
  chatMessageFormatter?: any;
  SettingsComponent?: React.ComponentType;
}

export function PrimaryRoomView({
  chatMessageFormatter,
  SettingsComponent,
}: PrimaryRoomViewProps) {
  const layoutContext = useCreateLayoutContext();
  const { localParticipant } = useLocalParticipant();
  const [widgetState, setWidgetState] = React.useState({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  // Filter for screen share tracks
  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  // Auto-focus on screen share
  const focusTrack = screenShareTracks.length > 0 ? screenShareTracks[0] : null;

  // Get all tracks except local participant's camera
  const remoteTracks = tracks.filter((track) => {
    if (!isTrackReference(track)) {
      // Placeholder - keep if not local participant
      return track.participant.identity !== localParticipant.identity;
    }
    // Skip local participant's camera (but keep screen shares)
    if (
      track.participant.identity === localParticipant.identity &&
      track.publication.source === Track.Source.Camera
    ) {
      return false;
    }
    return true;
  });

  // Get local participant's camera track for PiP
  const localCameraTrack = tracks.find(
    (track) =>
      isTrackReference(track) &&
      track.participant.identity === localParticipant.identity &&
      track.publication.source === Track.Source.Camera,
  );

  // Draggable PiP state
  const [pipPosition, setPipPosition] = React.useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const pipRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (!pipRef.current) return;
      const rect = pipRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    },
    [pipRef],
  );

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPipPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <LayoutContextProvider
      value={layoutContext}
      // @ts-ignore
      onWidgetChange={(state) => setWidgetState(state)}
    >
      <div className={styles.primaryRoomInner}>
        {!focusTrack ? (
          <div className={styles.primaryGridView}>
            <GridLayout tracks={remoteTracks}>
              <ParticipantTile />
            </GridLayout>
          </div>
        ) : (
          <div className={styles.primaryFocusView}>
            <FocusLayout trackRef={focusTrack} />
            <div className={styles.primaryCarousel}>
              <CarouselLayout tracks={remoteTracks.filter((t) => !isEqualTrackRef(t, focusTrack))}>
                <ParticipantTile />
              </CarouselLayout>
            </div>
          </div>
        )}

        <ControlBar controls={{ chat: true, settings: !!SettingsComponent }} />

        {/* Picture-in-Picture local participant */}
        {localCameraTrack && isTrackReference(localCameraTrack) && (
          <div
            ref={pipRef}
            className={`${styles.localPip} ${isDragging ? styles.dragging : ''}`}
            style={{
              left: `${pipPosition.x}px`,
              top: `${pipPosition.y}px`,
            }}
            onMouseDown={handleMouseDown}
          >
            <ParticipantTile trackRef={localCameraTrack} />
          </div>
        )}

        <Chat
          style={{ display: widgetState.showChat ? 'grid' : 'none' }}
          messageFormatter={chatMessageFormatter}
        />

        {SettingsComponent && (
          <div
            className="lk-settings-menu-modal"
            style={{ display: widgetState.showSettings ? 'block' : 'none' }}
          >
            <SettingsComponent />
          </div>
        )}

        <RoomAudioRenderer />
        <ConnectionStateToast />
      </div>
    </LayoutContextProvider>
  );
}
