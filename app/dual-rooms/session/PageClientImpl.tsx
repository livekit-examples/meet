'use client';

import React from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';
import { SecondaryRoomView } from './SecondaryRoomView';
import { PrimaryRoomView } from './PrimaryRoomView';
import styles from '@/styles/DualRoom.module.css';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  primaryRoomName: string;
  secondaryRoomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<
    { primary: ConnectionDetails; secondary: ConnectionDetails } | undefined
  >(undefined);

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      setPreJoinChoices(values);
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);

      // Fetch connection details for primary room
      const primaryUrl = new URL(url);
      primaryUrl.searchParams.append('roomName', props.primaryRoomName);
      primaryUrl.searchParams.append('participantName', values.username);
      if (props.region) {
        primaryUrl.searchParams.append('region', props.region);
      }

      // Fetch connection details for secondary room
      const secondaryUrl = new URL(url);
      secondaryUrl.searchParams.append('roomName', props.secondaryRoomName);
      secondaryUrl.searchParams.append('participantName', values.username);
      if (props.region) {
        secondaryUrl.searchParams.append('region', props.region);
      }

      const [primaryResp, secondaryResp] = await Promise.all([
        fetch(primaryUrl.toString()),
        fetch(secondaryUrl.toString()),
      ]);

      const [primaryData, secondaryData] = await Promise.all([
        primaryResp.json(),
        secondaryResp.json(),
      ]);

      setConnectionDetails({
        primary: primaryData,
        secondary: secondaryData,
      });
    },
    [props.primaryRoomName, props.secondaryRoomName, props.region],
  );

  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : (
        <DualRoomComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{ codec: props.codec, hq: props.hq }}
        />
      )}
    </main>
  );
}

function DualRoomComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: {
    primary: ConnectionDetails;
    secondary: ConnectionDetails;
  };
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}) {
  const [isSecondaryEnlarged, setIsSecondaryEnlarged] = React.useState(false);

  // E2EE setup (shared passphrase for both rooms)
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  // Create separate key providers for each room
  const primaryKeyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);
  const secondaryKeyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);

  // Primary room options (full quality)
  const primaryRoomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee:
        primaryKeyProvider && worker && e2eeEnabled
          ? { keyProvider: primaryKeyProvider, worker }
          : undefined,
      singlePeerConnection: true,
    };
  }, [props.userChoices, props.options.hq, props.options.codec, e2eeEnabled, worker]);

  // Secondary room options (optimized for lower bandwidth)
  const secondaryRoomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h180],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: {
        deviceId: props.userChoices.videoDeviceId ?? undefined,
        resolution: VideoPresets.h360,
      },
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee:
        secondaryKeyProvider && worker && e2eeEnabled
          ? { keyProvider: secondaryKeyProvider, worker }
          : undefined,
      singlePeerConnection: true,
    };
  }, [props.options.codec, e2eeEnabled, worker, props.userChoices]);

  const primaryRoom = React.useMemo(() => new Room(primaryRoomOptions), []);
  const secondaryRoom = React.useMemo(() => new Room(secondaryRoomOptions), []);

  // Setup E2EE for both rooms
  React.useEffect(() => {
    if (e2eeEnabled) {
      const decodedPassphrase = decodePassphrase(e2eePassphrase);
      Promise.all([
        primaryKeyProvider.setKey(decodedPassphrase),
        secondaryKeyProvider.setKey(decodedPassphrase),
      ])
        .then(() =>
          Promise.all([
            primaryRoom.setE2EEEnabled(true).catch((e) => {
              if (e instanceof DeviceUnsupportedError) {
                alert(
                  `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
                );
                console.error(e);
              } else {
                throw e;
              }
            }),
            secondaryRoom.setE2EEEnabled(true).catch((e) => {
              if (e instanceof DeviceUnsupportedError) {
                alert(
                  `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
                );
                console.error(e);
              } else {
                throw e;
              }
            }),
          ]),
        )
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, primaryRoom, secondaryRoom, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  // Connect both rooms
  React.useEffect(() => {
    primaryRoom.on(RoomEvent.Disconnected, handleOnLeave);
    primaryRoom.on(RoomEvent.EncryptionError, handleEncryptionError);
    primaryRoom.on(RoomEvent.MediaDevicesError, handleError);

    secondaryRoom.on(RoomEvent.EncryptionError, handleEncryptionError);
    secondaryRoom.on(RoomEvent.MediaDevicesError, handleError);

    if (e2eeSetupComplete) {
      // Connect primary room
      primaryRoom
        .connect(
          props.connectionDetails.primary.serverUrl,
          props.connectionDetails.primary.participantToken,
          connectOptions,
        )
        .catch((error) => {
          handleError(error);
        });

      if (props.userChoices.videoEnabled) {
        primaryRoom.localParticipant.setCameraEnabled(true).catch((error) => {
          handleError(error);
        });
      }
      if (props.userChoices.audioEnabled) {
        primaryRoom.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          handleError(error);
        });
      }

      // Connect secondary room (view-only by default - no camera/mic published)
      secondaryRoom
        .connect(
          props.connectionDetails.secondary.serverUrl,
          props.connectionDetails.secondary.participantToken,
          connectOptions,
        )
        .catch((error) => {
          console.error('Secondary room connection error:', error);
        });

      // Don't enable camera/mic for secondary room by default
      // User can enable them explicitly via the secondary room controls
    }

    return () => {
      primaryRoom.off(RoomEvent.Disconnected, handleOnLeave);
      primaryRoom.off(RoomEvent.EncryptionError, handleEncryptionError);
      primaryRoom.off(RoomEvent.MediaDevicesError, handleError);

      secondaryRoom.off(RoomEvent.EncryptionError, handleEncryptionError);
      secondaryRoom.off(RoomEvent.MediaDevicesError, handleError);

      primaryRoom.disconnect();
      secondaryRoom.disconnect();
    };
  }, [
    e2eeSetupComplete,
    primaryRoom,
    secondaryRoom,
    props.connectionDetails,
    props.userChoices,
    connectOptions,
  ]);

  useLowCPUOptimizer(primaryRoom);
  useLowCPUOptimizer(secondaryRoom);

  const toggleSecondaryEnlarged = React.useCallback(() => {
    setIsSecondaryEnlarged((prev) => !prev);
  }, []);

  return (
    <div className={styles.dualRoomContainer} data-secondary-enlarged={isSecondaryEnlarged}>
      <div className={styles.primaryRoom}>
        <RoomContext.Provider value={primaryRoom}>
          <div className="lk-room-container">
            <KeyboardShortcuts />
            <PrimaryRoomView
              chatMessageFormatter={formatChatMessageLinks}
              SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
            />
            <DebugMode />
            <RecordingIndicator />
          </div>
        </RoomContext.Provider>
      </div>

      <div className={styles.secondaryRoom}>
        <RoomContext.Provider value={secondaryRoom}>
          <SecondaryRoomView
            onToggleEnlarge={toggleSecondaryEnlarged}
            isEnlarged={isSecondaryEnlarged}
            room={secondaryRoom}
          />
        </RoomContext.Provider>
      </div>
    </div>
  );
}
