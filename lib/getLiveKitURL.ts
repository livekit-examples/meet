export function getLiveKitURL(projectUrl: string, region: string | null): string {
  const url = new URL(projectUrl);
  if (region && url.hostname.includes('livekit.cloud')) {
    const [projectId, ...hostParts] = url.hostname.split('.');
    const regionURL = [projectId, region, ...hostParts].join('.');
    url.hostname = regionURL;
  }
  return url.toString();
}
