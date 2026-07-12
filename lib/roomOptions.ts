import {
  VideoPresets,
  type ExternalE2EEKeyProvider,
  type RoomOptions,
  type VideoCodec,
} from 'livekit-client';

type EncryptionOptions = {
  e2eeEnabled: boolean;
  keyProvider: ExternalE2EEKeyProvider;
  worker: Worker | undefined;
};

type ManagedRoomOptions = EncryptionOptions & {
  audioDeviceId?: string;
  codec?: VideoCodec;
  hq: boolean;
  singlePeerConnection: boolean;
  videoDeviceId?: string;
};

type CustomRoomOptions = EncryptionOptions & {
  codec: VideoCodec | undefined;
  singlePeerConnection: boolean | undefined;
};

function getEncryptionOptions({
  e2eeEnabled,
  keyProvider,
  worker,
}: EncryptionOptions): RoomOptions['e2ee'] {
  return e2eeEnabled && worker ? { keyProvider, worker } : undefined;
}

export function buildManagedRoomOptions(options: ManagedRoomOptions): RoomOptions {
  let videoCodec: VideoCodec | undefined = options.codec || 'vp9';
  if (options.e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
    videoCodec = undefined;
  }

  return {
    videoCaptureDefaults: {
      deviceId: options.videoDeviceId ?? undefined,
      resolution: options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    },
    publishDefaults: {
      dtx: false,
      videoSimulcastLayers: options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !options.e2eeEnabled,
      videoCodec,
    },
    audioCaptureDefaults: {
      deviceId: options.audioDeviceId ?? undefined,
    },
    adaptiveStream: true,
    dynacast: true,
    webAudioMix: true,
    e2ee: getEncryptionOptions(options),
    singlePeerConnection: options.singlePeerConnection,
  };
}

export function buildCustomRoomOptions(options: CustomRoomOptions): RoomOptions {
  return {
    publishDefaults: {
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      red: !options.e2eeEnabled,
      videoCodec: options.codec,
    },
    adaptiveStream: { pixelDensity: 'screen' },
    dynacast: true,
    webAudioMix: true,
    e2ee: getEncryptionOptions(options),
    singlePeerConnection: options.singlePeerConnection,
  };
}
