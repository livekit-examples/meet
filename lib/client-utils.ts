import { useEffect, useState } from 'react';

export function useServerUrl(region?: string) {
  const [serverUrl, setServerUrl] = useState<string | undefined>();
  useEffect(() => {
    let endpoint = `/api/url`;
    if (region) {
      endpoint += `?region=${region}`;
    }
    fetch(endpoint).then(async (res) => {
      if (res.ok) {
        const body = await res.json();
        console.log(body);
        setServerUrl(body.url);
      } else {
        throw Error('Error fetching server url, check server logs');
      }
    });
  });
  return serverUrl;
}

export function encodePassphrase(bytes: Uint8Array) {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('');
  return btoa(binString);
}

export function decodePassphrase(base64String: string) {
  const binString = atob(base64String);
  // @ts-ignore
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}
