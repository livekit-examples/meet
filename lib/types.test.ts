import { describe, expect, it, vi } from 'vitest';

// Avoid loading the full browser-oriented SDK in the test environment.
vi.mock('livekit-client', () => ({
  videoCodecs: ['vp8', 'h264', 'vp9', 'av1'],
}));

import { isVideoCodec } from './types';

describe('isVideoCodec', () => {
  it('accepts known codecs', () => {
    for (const codec of ['vp8', 'h264', 'vp9', 'av1']) {
      expect(isVideoCodec(codec)).toBe(true);
    }
  });

  it('rejects unknown codecs', () => {
    expect(isVideoCodec('mp3')).toBe(false);
    expect(isVideoCodec('h265')).toBe(false);
    expect(isVideoCodec('')).toBe(false);
  });
});
