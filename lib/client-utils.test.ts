import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decodePassphrase,
  encodePassphrase,
  generateRoomId,
  isLowPowerDevice,
  isMeetStaging,
  randomString,
} from './client-utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('randomString', () => {
  it('returns a string of the requested length', () => {
    expect(randomString(16)).toHaveLength(16);
    expect(randomString(0)).toBe('');
  });

  it('only uses lowercase alphanumerics', () => {
    expect(randomString(256)).toMatch(/^[a-z0-9]*$/);
  });
});

describe('generateRoomId', () => {
  it('produces two 4-character groups joined by a dash', () => {
    expect(generateRoomId()).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
  });
});

describe('passphrase encoding', () => {
  it('round-trips strings including special characters', () => {
    const phrase = 'hunter2 % / # ? & =';
    expect(decodePassphrase(encodePassphrase(phrase))).toBe(phrase);
  });
});

describe('isLowPowerDevice', () => {
  it('is true when the CPU reports fewer than 6 logical cores', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 4 });
    expect(isLowPowerDevice()).toBe(true);
  });

  it('is false with 6 or more cores', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
    expect(isLowPowerDevice()).toBe(false);
  });
});

describe('isMeetStaging', () => {
  it('detects the staging host', () => {
    vi.stubGlobal('location', { origin: 'https://meet.staging.livekit.io' });
    expect(isMeetStaging()).toBe(true);
  });

  it('is false for other hosts', () => {
    vi.stubGlobal('location', { origin: 'https://example.com' });
    expect(isMeetStaging()).toBe(false);
  });
});
