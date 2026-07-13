export const WATCH_TOGETHER_TOPIC = 'watch-together';

// Hosts broadcast a heartbeat on this cadence while an embed is active.
export const HEARTBEAT_INTERVAL_MS = 2500;
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

export function isWatchSyncMessage(value: unknown): value is WatchSyncMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  if (typeof message.type !== 'string' || !isFiniteNumber(message.ts)) return false;

  if (message.type === 'stop') return true;
  if (message.type === 'play' || message.type === 'pause' || message.type === 'seek') {
    return isFiniteNumber(message.currentTime) && message.currentTime >= 0;
  }
  if (message.type === 'start-embed') {
    return (
      isEmbedKind(message.kind) &&
      typeof message.src === 'string' &&
      message.src.length > 0 &&
      typeof message.hostIdentity === 'string' &&
      message.hostIdentity.length > 0
    );
  }
  if (message.type === 'heartbeat') {
    return (
      isEmbedKind(message.kind) &&
      typeof message.src === 'string' &&
      message.src.length > 0 &&
      typeof message.hostIdentity === 'string' &&
      message.hostIdentity.length > 0 &&
      isFiniteNumber(message.currentTime) &&
      message.currentTime >= 0 &&
      typeof message.isPlaying === 'boolean'
    );
  }
  return false;
}

function isEmbedKind(value: unknown): value is EmbedKind {
  return value === 'url' || value === 'youtube';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export type WatchTogetherEmbedState =
  | { active: false }
  | {
      active: true;
      kind: EmbedKind;
      src: string;
      hostIdentity: string;
      isHost: boolean;
    };

export type TorrentInput =
  | { kind: 'magnet'; magnet: string; name: string }
  | { kind: 'torrent-file'; bytes: Uint8Array; name: string };

export type WatchTogetherStreamSource =
  | { kind: 'file'; file: File }
  | { kind: 'torrent'; input: TorrentInput };

export type WatchTogetherStreamState =
  | { active: false }
  | { active: true; source: WatchTogetherStreamSource };
