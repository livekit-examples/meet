import { describe, expect, it } from 'vitest';
import { VideoPresets, type ExternalE2EEKeyProvider, type VideoCodec } from 'livekit-client';
import { buildCustomRoomOptions, buildManagedRoomOptions } from './roomOptions';

const keyProvider = {} as ExternalE2EEKeyProvider;
const worker = {} as Worker;

describe('buildManagedRoomOptions', () => {
  it('preserves the standard capture, publish, and device defaults', () => {
    expect(
      buildManagedRoomOptions({
        audioDeviceId: 'microphone-id',
        codec: 'vp9',
        e2eeEnabled: false,
        hq: false,
        keyProvider,
        singlePeerConnection: true,
        videoDeviceId: 'camera-id',
        worker: undefined,
      }),
    ).toEqual({
      videoCaptureDefaults: {
        deviceId: 'camera-id',
        resolution: VideoPresets.h720,
      },
      publishDefaults: {
        dtx: false,
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: true,
        videoCodec: 'vp9',
      },
      audioCaptureDefaults: { deviceId: 'microphone-id' },
      adaptiveStream: true,
      dynacast: true,
      webAudioMix: true,
      e2ee: undefined,
      singlePeerConnection: true,
    });
  });

  it('preserves the high-quality presets and encrypted room configuration', () => {
    const options = buildManagedRoomOptions({
      codec: 'h264',
      e2eeEnabled: true,
      hq: true,
      keyProvider,
      singlePeerConnection: false,
      worker,
    });

    expect(options.videoCaptureDefaults).toEqual({
      deviceId: undefined,
      resolution: VideoPresets.h2160,
    });
    expect(options.audioCaptureDefaults).toEqual({ deviceId: undefined });
    expect(options.publishDefaults).toEqual({
      dtx: false,
      videoSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720],
      red: false,
      videoCodec: 'h264',
    });
    expect(options.e2ee).toEqual({ keyProvider, worker });
    expect(options.singlePeerConnection).toBe(false);
  });

  it.each([
    ['vp9', undefined],
    ['av1', undefined],
    ['vp8', 'vp8'],
    ['h264', 'h264'],
  ] satisfies [VideoCodec, VideoCodec | undefined][])(
    '%s codec under E2EE becomes %s',
    (codec, expected) => {
      const options = buildManagedRoomOptions({
        codec,
        e2eeEnabled: true,
        hq: false,
        keyProvider,
        singlePeerConnection: true,
        worker,
      });

      expect(options.publishDefaults?.videoCodec).toBe(expected);
    },
  );
});

describe('buildCustomRoomOptions', () => {
  it('preserves the custom flow defaults without managed capture policy', () => {
    expect(
      buildCustomRoomOptions({
        codec: undefined,
        e2eeEnabled: false,
        keyProvider,
        singlePeerConnection: undefined,
        worker: undefined,
      }),
    ).toEqual({
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: true,
        videoCodec: undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      webAudioMix: true,
      e2ee: undefined,
      singlePeerConnection: undefined,
    });
  });

  it('keeps the requested codec and single-PC setting under E2EE', () => {
    const options = buildCustomRoomOptions({
      codec: 'vp9',
      e2eeEnabled: true,
      keyProvider,
      singlePeerConnection: false,
      worker,
    });

    expect(options.publishDefaults).toEqual({
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      red: false,
      videoCodec: 'vp9',
    });
    expect(options.e2ee).toEqual({ keyProvider, worker });
    expect(options.singlePeerConnection).toBe(false);
  });
});
