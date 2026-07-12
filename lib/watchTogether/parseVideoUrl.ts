export type ParsedVideoUrl = { kind: 'youtube'; videoId: string } | { kind: 'url'; url: string };

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export function parseVideoUrl(input: string): ParsedVideoUrl | null {
  let parsed: URL;
  try {
    const trimmed = input.trim();
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);
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
    } else if (parsed.pathname.startsWith('/live/')) {
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
