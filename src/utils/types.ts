import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client'

declare global {
  interface Window {
    localStream: MediaStream
    localAudio: HTMLAudioElement
  }
}

export interface SessionProps {
  roomName: string
  identity: string
  audioTrack?: LocalAudioTrack
  videoTrack?: LocalVideoTrack
  region?: string
  turnServer?: RTCIceServer
  forceRelay?: boolean
}

export interface TokenResult {
  identity: string
  accessToken: string
}
