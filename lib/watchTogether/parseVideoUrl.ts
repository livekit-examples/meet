export type ParsedVideoUrl =
  | { kind: 'youtube'; videoId: string }
  | { kind: 'url'; url: string };

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
]);

export function parseVideoUrl(input: string): ParsedVideoUrl | null {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) {
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = parsed.pathname.replace(/^\//, '').split('/')[0] || null;
    } else if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v');
    } else if (parsed.pathname.startsWith('/shorts/')) {
      id = parsed.pathname.split('/')[2] ?? null;
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.split('/')[2] ?? null;
    }
    if (id && /^[\w-]{6,}$/.test(id)) return { kind: 'youtube', videoId: id };
    return null;
  }
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    return { kind: 'url', url: parsed.toString() };
  }
  return null;
}
