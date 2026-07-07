export const WATCH_TOGETHER_TOPIC = 'watch-together';

// Hosts broadcast a heartbeat on this cadence while an embed is active.
export const HEARTBEAT_INTERVAL_MS = 5000;
// Viewers treat three missed beats (plus slack) as "host gone".
export const HEARTBEAT_TIMEOUT_MS = 3 * HEARTBEAT_INTERVAL_MS + 1000;
// Viewers only re-seek when they drift further than this from the host.
export const DRIFT_TOLERANCE_S = 0.6;

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

export type WatchTogetherStreamState = { active: false } | { active: true; file: File };
