import { LocalAudioTrack, LocalVideoTrack, videoCodecs } from 'livekit-client';
import { VideoCodec } from 'livekit-client';
import { LocalUserChoices as LiveKitLocalUserChoices } from '@livekit/components-core';

// Extend the LocalUserChoices type with our additional properties
export interface LocalUserChoices extends LiveKitLocalUserChoices {
  /**
   * The language code selected by the user.
   * @defaultValue 'en'
   */
  language?: string;
}

export interface SessionProps {
  roomName: string;
  identity: string;
  audioTrack?: LocalAudioTrack;
  videoTrack?: LocalVideoTrack;
  region?: string;
  turnServer?: RTCIceServer;
  forceRelay?: boolean;
}

export interface TokenResult {
  identity: string;
  accessToken: string;
}

export function isVideoCodec(codec: string): codec is VideoCodec {
  return videoCodecs.includes(codec as VideoCodec);
}

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};
