'use client';

import React from 'react';
import {
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  RoomName,
  ConnectionStateToast,
  LayoutContextProvider,
  FocusLayout,
  CarouselLayout,
} from '@livekit/components-react';
import { useCreateLayoutContext } from '@livekit/components-react';
import { useTracks } from '@livekit/components-react';
import { Track, Room } from 'livekit-client';
import { isTrackReference } from '@livekit/components-core';
import styles from '@/styles/DualRoom.module.css';

export interface SecondaryRoomViewProps {
  onToggleEnlarge: () => void;
  isEnlarged: boolean;
  room: Room;
}

export function SecondaryRoomView({ onToggleEnlarge, isEnlarged, room }: SecondaryRoomViewProps) {
  const layoutContext = useCreateLayoutContext();
  const [isAudioMuted, setIsAudioMuted] = React.useState(true); // Muted by default
  const [isCameraEnabled, setIsCameraEnabled] = React.useState(false);
  const [isMicEnabled, setIsMicEnabled] = React.useState(false);
  const [showControls, setShowControls] = React.useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { updateOnlyOn: [], onlySubscribed: false },
  );

  // Filter for screen share tracks
  const screenShareTracks = tracks.filter(
    (track) => isTrackReference(track) && track.publication.source === Track.Source.ScreenShare,
  );

  // Filter for camera tracks (participants)
  const cameraTracks = tracks.filter((track) => {
    if (!isTrackReference(track)) return true;
    return track.publication?.source === Track.Source.Camera;
  });

  // Use first screen share track as focus, or null if none available
  const focusTrack = screenShareTracks.length > 0 ? screenShareTracks[0] : null;

  const toggleAudioMute = React.useCallback(() => {
    setIsAudioMuted((prev) => !prev);
  }, []);

  const toggleCamera = React.useCallback(() => {
    const newState = !isCameraEnabled;
    setIsCameraEnabled(newState);
    room.localParticipant.setCameraEnabled(newState).catch((error) => {
      console.error('Failed to toggle camera:', error);
      setIsCameraEnabled(!newState); // Revert on error
    });
  }, [isCameraEnabled, room]);

  const toggleMic = React.useCallback(() => {
    const newState = !isMicEnabled;
    setIsMicEnabled(newState);
    room.localParticipant.setMicrophoneEnabled(newState).catch((error) => {
      console.error('Failed to toggle microphone:', error);
      setIsMicEnabled(!newState); // Revert on error
    });
  }, [isMicEnabled, room]);

  return (
    <LayoutContextProvider value={layoutContext}>
      <div
        className={styles.secondaryRoomInner}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className={styles.secondaryRoomHeader}>
          <div className={styles.secondaryRoomTitle}>
            <RoomName />
          </div>
          <div className={styles.headerControls}>
            <button
              className={styles.controlButton}
              onClick={toggleAudioMute}
              title={isAudioMuted ? 'Unmute room audio' : 'Mute room audio'}
            >
              {isAudioMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
            <button className={styles.enlargeButton} onClick={onToggleEnlarge} title="Toggle size">
              {isEnlarged ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 14h3v3h2v-5H4v2zm3-9H4v2h5V2H7v3zm6 9h3v-2h-5v5h2v-3zm3-12h-2v3h-3v2h5V2z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M2 9h5V4h2v7H2V9zm5 7H2v-2h7v7H7v-5zm7-7h5v2h-7V4h2v5zm5 5h-5v5h-2v-7h7v2z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={styles.secondaryRoomContent}>
          {focusTrack ? (
            <div className={styles.presentationMode}>
              <div className={styles.screenShareView}>
                <FocusLayout trackRef={focusTrack} />
              </div>
              {cameraTracks.length > 0 && (
                <div className={styles.participantCarousel}>
                  <CarouselLayout tracks={cameraTracks} orientation="horizontal">
                    <ParticipantTile />
                  </CarouselLayout>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.gridView}>
              <GridLayout tracks={tracks}>
                <ParticipantTile />
              </GridLayout>
            </div>
          )}

          {/* Hover controls for camera/mic */}
          <div className={`${styles.publishControls} ${showControls ? styles.visible : ''}`}>
            <button
              className={`${styles.publishButton} ${isCameraEnabled ? styles.active : ''}`}
              onClick={toggleCamera}
              title={isCameraEnabled ? 'Disable camera' : 'Enable camera'}
            >
              {isCameraEnabled ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
            <button
              className={`${styles.publishButton} ${isMicEnabled ? styles.active : ''}`}
              onClick={toggleMic}
              title={isMicEnabled ? 'Disable microphone' : 'Enable microphone'}
            >
              {isMicEnabled ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V20h2v-2.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <RoomAudioRenderer volume={isAudioMuted ? 0 : 1} />
        <ConnectionStateToast />
      </div>
    </LayoutContextProvider>
  );
}
