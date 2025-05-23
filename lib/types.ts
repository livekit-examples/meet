import { LocalAudioTrack, LocalVideoTrack, videoCodecs } from 'livekit-client';
import { VideoCodec } from 'livekit-client';
import { Dispatch } from 'react';

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

export type KeyBinding = {
  eventName: keyof GlobalEventHandlersEventMap;
  discriminator: (event: KeyboardEvent) => boolean;
  target?: Window | Document | HTMLElement | string;
};

export type KeyBindings = Partial<
  Record<KeyCommand, KeyBinding | [enable: KeyBinding, disable: KeyBinding]>
>;

export enum KeyCommand {
  PTT = 'ptt',
  ToggleMic = 'toggle-mic',
  ToggleCamera = 'toggle-camera',
}

export type SettingsState = {
  keybindings: KeyBindings;
  enablePTT: boolean;
};

export type SettingsStateContextType = {
  state: SettingsState;
  set: Dispatch<React.SetStateAction<SettingsState>>;
};

export type SerializedSettingsState = Omit<SettingsState, 'keybindings'> & {
  keybindings: Record<string, string | undefined>;
};
