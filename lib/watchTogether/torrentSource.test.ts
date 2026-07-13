import { describe, expect, it } from 'vitest';
import { formatTorrentSpeed, isMagnetUri, selectLargestVideoFile } from './torrentSource';

describe('isMagnetUri', () => {
  it('accepts BitTorrent v1 and v2 magnets', () => {
    expect(isMagnetUri('magnet:?xt=urn:btih:0123456789abcdef')).toBe(true);
    expect(isMagnetUri('magnet:?dn=Video&xt=urn:btmh:1220abcdef')).toBe(true);
  });

  it('rejects non-torrent input', () => {
    expect(isMagnetUri('https://example.com/movie.mp4')).toBe(false);
    expect(isMagnetUri('magnet:?dn=no-info-hash')).toBe(false);
  });
});

describe('selectLargestVideoFile', () => {
  it('selects the largest supported video', () => {
    const files = [
      { name: 'notes.txt', length: 999_999 },
      { name: 'sample.mp4', length: 10_000 },
      { name: 'feature.mkv', length: 100_000 },
    ];
    expect(selectLargestVideoFile(files)).toBe(files[2]);
  });

  it('returns null without a supported video', () => {
    expect(selectLargestVideoFile([{ name: 'archive.zip', length: 100 }])).toBeNull();
  });
});

describe('formatTorrentSpeed', () => {
  it('formats byte rates for the host panel', () => {
    expect(formatTorrentSpeed(0)).toBe('0 Б/с');
    expect(formatTorrentSpeed(128 * 1024)).toBe('128 КБ/с');
    expect(formatTorrentSpeed(1.5 * 1024 * 1024)).toBe('1.5 МБ/с');
  });
});
