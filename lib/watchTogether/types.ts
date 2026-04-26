export const WATCH_TOGETHER_TOPIC = 'watch-together';

export type WatchSyncMessage =
  | { type: 'start'; magnet: string; hostIdentity: string; ts: number }
  | { type: 'play'; currentTime: number; ts: number }
  | { type: 'pause'; currentTime: number; ts: number }
  | { type: 'seek'; currentTime: number; ts: number }
  | { type: 'heartbeat'; magnet: string; hostIdentity: string; currentTime: number; isPlaying: boolean; ts: number }
  | { type: 'stop'; ts: number };

export type WatchTogetherState =
  | { active: false }
  | {
      active: true;
      magnet: string;
      hostIdentity: string;
      isHost: boolean;
    };
