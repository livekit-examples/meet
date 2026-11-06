// A region is a single DNS label, e.g. "eu" or "us-west".
const REGION_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const LIVEKIT_CLOUD_SUFFIX = '.livekit.cloud';

/**
 * Builds the region-pinned LiveKit Cloud URL for `projectUrl`.
 *
 * Returns `undefined` if `region` is not a valid region label, or if the
 * resulting host would no longer be under livekit.cloud. Non-livekit.cloud
 * project URLs are returned unchanged.
 */
export function getLiveKitURL(projectUrl: string, region: string | null): string | undefined {
  const url = new URL(projectUrl);

  if (!region) {
    return url.toString();
  }

  if (!REGION_PATTERN.test(region)) {
    return undefined;
  }

  if (url.hostname.endsWith(LIVEKIT_CLOUD_SUFFIX)) {
    const [projectId, ...hostParts] = url.hostname.split('.');
    const envParts = hostParts[0] === 'staging' ? hostParts : ['production', ...hostParts];

    url.hostname = [projectId, region, ...envParts].join('.');

    if (!url.hostname.endsWith(LIVEKIT_CLOUD_SUFFIX)) {
      return undefined;
    }
  }

  return url.toString();
}
