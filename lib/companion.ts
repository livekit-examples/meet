export const DEFAULT_COMPANION_WS_URL = 'ws://127.0.0.1:7331';

export function getCompanionWsUrl(): string {
  const companionUrl = process.env.NEXT_PUBLIC_COMPANION_WS_URL;
  if (companionUrl !== undefined) return companionUrl;

  // Keep a legacy custom PTT endpoint working, but an empty PTT override should
  // disable only push-to-talk rather than the companion's other capabilities.
  return process.env.NEXT_PUBLIC_PTT_WS_URL || DEFAULT_COMPANION_WS_URL;
}

export function getPushToTalkWsUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PTT_WS_URL ??
    process.env.NEXT_PUBLIC_COMPANION_WS_URL ??
    DEFAULT_COMPANION_WS_URL
  );
}
