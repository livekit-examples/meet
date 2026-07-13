import { describe, expect, it } from 'vitest';
import { isMagnetUri, parseTorrentInput, selectLargestVideoFile } from './torrent-core.js';

describe('isMagnetUri', () => {
  it('accepts v1 and v2 BitTorrent magnets', () => {
    expect(isMagnetUri('magnet:?xt=urn:btih:0123456789abcdef')).toBe(true);
    expect(isMagnetUri('magnet:?dn=Video&xt=urn:btmh:1220abcdef')).toBe(true);
  });

  it('rejects unrelated URLs', () => {
    expect(isMagnetUri('https://example.com/video.mp4')).toBe(false);
    expect(isMagnetUri('magnet:?dn=missing-info-hash')).toBe(false);
  });
});

describe('selectLargestVideoFile', () => {
  it('selects the largest playable file and preserves its index', () => {
    const files = [
      { name: 'readme.txt', length: 1_000 },
      { name: 'sample.mp4', length: 5_000 },
      { name: 'movie.mkv', length: 50_000 },
    ];
    expect(selectLargestVideoFile(files)).toEqual({ file: files[2], index: 2 });
  });

  it('returns null when the torrent has no video', () => {
    expect(selectLargestVideoFile([{ name: 'archive.zip', length: 10 }])).toBeNull();
  });
});

describe('parseTorrentInput', () => {
  it('returns a validated magnet', () => {
    const magnet = 'magnet:?xt=urn:btih:0123456789abcdef';
    expect(parseTorrentInput({ kind: 'magnet', magnet })).toBe(magnet);
  });

  it('decodes a torrent file', () => {
    const result = parseTorrentInput({
      kind: 'torrent-file',
      base64: Buffer.from('torrent').toString('base64'),
    });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe('torrent');
  });

  it('rejects malformed input', () => {
    expect(() => parseTorrentInput({ kind: 'magnet', magnet: 'nope' })).toThrow(
      'Некорректная magnet-ссылка',
    );
  });
});
