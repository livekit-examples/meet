const STORAGE_KEY = 'lk-participant-volumes';
const CHANGE_EVENT = 'lk-participant-volume-change';

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 2;
export const VOLUME_DEFAULT = 1;

type VolumeMap = Record<string, number>;

function read(): VolumeMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as VolumeMap) : {};
  } catch {
    return {};
  }
}

function write(map: VolumeMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function getStoredVolume(identity: string): number | undefined {
  const map = read();
  const v = map[identity];
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, v));
}

export function setStoredVolume(identity: string, volume: number) {
  const clamped = Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, volume));
  const map = read();
  if (clamped === VOLUME_DEFAULT) {
    delete map[identity];
  } else {
    map[identity] = clamped;
  }
  write(map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<{ identity: string; volume: number }>(CHANGE_EVENT, {
        detail: { identity, volume: clamped },
      }),
    );
  }
}

export function subscribeVolumeChange(
  identity: string,
  listener: (volume: number) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ identity: string; volume: number }>).detail;
    if (detail?.identity === identity) listener(detail.volume);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
