import { LocalUserChoices } from '@livekit/components-react';

const LOCAL_STORAGE_KEY = 'livekit_meet';

type LocalStorageData = {
  userChoices: LocalUserChoices;
  autoJoinRoom: boolean;
};

export function getLocalStorageData(): LocalStorageData | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    return undefined;
  }
  return JSON.parse(data);
}

export function setLocalStorageData(data: LocalStorageData) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function setLocalStorageAutoJoin(autoJoin: boolean) {
  const data = getLocalStorageData();
  if (!data) return;
  data.autoJoinRoom = autoJoin;
  setLocalStorageData(data);
}
