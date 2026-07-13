import { describe, expect, it } from 'vitest';
import { isWatchSyncMessage } from './types';

describe('isWatchSyncMessage', () => {
  it('accepts valid synchronization messages', () => {
    expect(isWatchSyncMessage({ type: 'play', currentTime: 12.5, ts: 1 })).toBe(true);
    expect(
      isWatchSyncMessage({
        type: 'heartbeat',
        kind: 'youtube',
        src: 'dQw4w9WgXcQ',
        hostIdentity: 'host',
        currentTime: 12.5,
        isPlaying: true,
        ts: 1,
      }),
    ).toBe(true);
  });

  it.each([
    null,
    { type: 'play', currentTime: -1, ts: 1 },
    { type: 'stop', ts: Number.NaN },
    { type: 'heartbeat', kind: 'unknown', ts: 1 },
    { type: 'start-embed', kind: 'url', src: '', hostIdentity: 'host', ts: 1 },
  ])('rejects malformed messages', (message) => {
    expect(isWatchSyncMessage(message)).toBe(false);
  });
});
