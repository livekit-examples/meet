import { describe, it, expect } from 'vitest';
import { getLiveKitURL } from './getLiveKitURL';

describe('getLiveKitURL', () => {
  it('returns the original URL if no region is provided', () => {
    const url = 'https://myproject.livekit.cloud';
    expect(getLiveKitURL(url, null)).toBe(url + '/');
  });

  it('inserts the region into livekit.cloud URLs', () => {
    const url = 'https://myproject.livekit.cloud';
    const region = 'eu';
    expect(getLiveKitURL(url, region)).toBe('https://myproject.eu.production.livekit.cloud/');
  });

  it('inserts the region into livekit.cloud URLs and preserves the staging environment', () => {
    const url = 'https://myproject.staging.livekit.cloud';
    const region = 'eu';
    expect(getLiveKitURL(url, region)).toBe('https://myproject.eu.staging.livekit.cloud/');
  });

  it('returns the original URL for non-livekit.cloud hosts, even with region', () => {
    const url = 'https://example.com';
    const region = 'us';
    expect(getLiveKitURL(url, region)).toBe(url + '/');
  });

  it('handles URLs with paths and query params', () => {
    const url = 'https://myproject.livekit.cloud/room?foo=bar';
    const region = 'ap';
    expect(getLiveKitURL(url, region)).toBe(
      'https://myproject.ap.production.livekit.cloud/room?foo=bar',
    );
  });

  it('accepts hyphenated region labels', () => {
    expect(getLiveKitURL('wss://myproject.livekit.cloud', 'us-west')).toBe(
      'wss://myproject.us-west.production.livekit.cloud/',
    );
  });

  it.each([
    'example.com/x',
    'example.com?',
    'example.com#',
    'example.com\\x',
    'example.com%2Fx',
    'a.b',
    'a@example.com/x',
    'example.com:443/x',
    'EU',
    '-eu',
    'eu-',
    ' eu',
    'eu ',
    'x'.repeat(64),
  ])('rejects invalid region %j', (region) => {
    expect(getLiveKitURL('wss://myproject.livekit.cloud', region)).toBeUndefined();
  });

  it('rejects invalid regions for non-livekit.cloud hosts too', () => {
    expect(getLiveKitURL('wss://example.com', 'example.com/x')).toBeUndefined();
  });

  it('only rewrites hosts that end in .livekit.cloud', () => {
    const url = 'wss://livekit.cloud.example.com';
    expect(getLiveKitURL(url, 'eu')).toBe(url + '/');
  });
});
