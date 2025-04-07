'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { ConnectionDetails } from '@/lib/types';
import {
  LocalUserChoices,
  PreJoin,
  LiveKitRoom,
  RoomAudioRenderer,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import '../../../styles/PageClientImpl.css';
import { CustomVideoLayoutContextProvider } from '@/app/custom/layout/LayoutContextProvider';
import CustomVideoLayout from '@/app/custom/layout/CustomVideoLayout';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | undefined>(
    undefined,
  );

  const preJoinDefaults = useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);

  const handlePreJoinSubmit = async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomName);
    url.searchParams.append('participantName', values.username);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  };

  const handlePreJoinError = (e: any) => console.error(e);

  return (
    <main data-lk-theme="default" className="main-container">
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div className="pre-join-container">
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{ codec: props.codec, hq: props.hq }}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: { hq: boolean; codec: VideoCodec };
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getE2EEConfig = () => {
    if (typeof window === 'undefined')
      return {
        enabled: false,
        passphrase: undefined,
        worker: undefined,
      };

    const e2eePassphrase = decodePassphrase(location.hash.substring(1));
    const worker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
    const e2eeEnabled = !!(e2eePassphrase && worker);

    return {
      enabled: e2eeEnabled,
      passphrase: e2eePassphrase,
      worker,
    };
  };

  const e2eeConfig = useMemo(() => getE2EEConfig(), []);
  const keyProvider = useMemo(() => new ExternalE2EEKeyProvider(), []);

  const roomOptions = useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeConfig.enabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    return {
      videoCaptureDefaults: {
        deviceId: props.userChoices.videoDeviceId ?? undefined,
        resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
      },
      publishDefaults: {
        dtx: false,
        videoSimulcastLayers: props.options.hq
          ? [VideoPresets.h1080, VideoPresets.h720]
          : [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeConfig.enabled,
        videoCodec,
      },
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      ...(e2eeConfig.enabled && e2eeConfig.worker
        ? { e2ee: { keyProvider, worker: e2eeConfig.worker } }
        : null),
    };
  }, [props.userChoices, props.options.hq, props.options.codec, e2eeConfig]);

  const room = useMemo(() => new Room(roomOptions), [roomOptions]);

  useEffect(() => {
    if (e2eeConfig.enabled && e2eeConfig.passphrase) {
      keyProvider.setKey(decodePassphrase(e2eeConfig.passphrase));
      room.setE2EEEnabled(true).catch((e) => {
        if (e instanceof DeviceUnsupportedError) {
          alert(
            `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
          );
          console.error(e);
        }
      });
    }
  }, [room, e2eeConfig, keyProvider]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return { autoSubscribe: true };
  }, []);

  const router = useRouter();
  const handleOnLeave = () => router.push('/');

  if (!isClient) return null;

  return (
    <LiveKitRoom
      room={room}
      token={props.connectionDetails.participantToken}
      serverUrl={props.connectionDetails.serverUrl}
      connectOptions={connectOptions}
      video={props.userChoices.videoEnabled}
      audio={props.userChoices.audioEnabled}
      onDisconnected={handleOnLeave}
    >
      <CustomVideoLayoutContextProvider>
        <CustomVideoLayout room={room} roomName={props.connectionDetails.roomName} />
        <RoomAudioRenderer />
      </CustomVideoLayoutContextProvider>
    </LiveKitRoom>
  );
}
