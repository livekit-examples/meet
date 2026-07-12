import { describe, expect, it } from 'vitest';
import { parseVideoUrl } from './parseVideoUrl';

describe('parseVideoUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts a YouTube id from %s', (url, videoId) => {
    expect(parseVideoUrl(url)).toEqual({ kind: 'youtube', videoId });
  });

  it('accepts a direct video URL without an explicit protocol', () => {
    expect(parseVideoUrl('media.example.com/movie.mp4')).toEqual({
      kind: 'url',
      url: 'https://media.example.com/movie.mp4',
    });
  });

  it.each(['file:///movie.mp4', 'javascript:alert(1)', 'not a url', 'https://youtube.com/watch'])(
    'rejects an unsupported or malformed URL: %s',
    (url) => expect(parseVideoUrl(url)).toBeNull(),
  );
});
