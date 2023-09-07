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

export function encodePassphrase(passphrase: string) {
  return encodeURIComponent(passphrase);
}

export function decodePassphrase(base64String: string) {
  return decodeURIComponent(base64String);
}

export function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}

export function randomString(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
