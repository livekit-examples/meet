import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { VideoCodec } from 'livekit-client';

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
  return ['vp8', 'vp9', 'h264', 'av1'].includes(codec);
}
