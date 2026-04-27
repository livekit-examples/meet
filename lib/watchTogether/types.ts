export const WATCH_TOGETHER_TOPIC = 'watch-together';

export type EmbedKind = 'url' | 'youtube';

export type WatchSyncMessage =
  | { type: 'start-embed'; kind: EmbedKind; src: string; hostIdentity: string; ts: number }
  | { type: 'play'; currentTime: number; ts: number }
  | { type: 'pause'; currentTime: number; ts: number }
  | { type: 'seek'; currentTime: number; ts: number }
  | {
      type: 'heartbeat';
      kind: EmbedKind;
      src: string;
      hostIdentity: string;
      currentTime: number;
      isPlaying: boolean;
      ts: number;
    }
  | { type: 'stop'; ts: number };

export type WatchTogetherEmbedState =
  | { active: false }
  | {
      active: true;
      kind: EmbedKind;
      src: string;
      hostIdentity: string;
      isHost: boolean;
    };

export type WatchTogetherStreamState =
  | { active: false }
  | { active: true; file: File };
