export function getLiveKitURL(projectUrl: string, region: string | null): string {
  const url = new URL(projectUrl);
  if (region && url.hostname.includes('livekit.cloud')) {
    const hostParts = url.hostname.split('.');
    const regionURL = [hostParts[0], region, ...hostParts].join('.');
    url.hostname = regionURL;
  }
  return url.toString();
}
