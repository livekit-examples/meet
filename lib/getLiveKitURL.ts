export function getLiveKitURL(projectUrl: string, region: string | null): string {
  const url = new URL(projectUrl);
  if (region && url.hostname.includes('livekit.cloud')) {
    let [projectId, ...hostParts] = url.hostname.split('.');
    if (hostParts[0] !== 'staging') {
      hostParts = ['production', ...hostParts];
    }
    const regionURL = [projectId, region, ...hostParts].join('.');
    url.hostname = regionURL;
  }
  return url.toString();
}
