import { getCompanionWsUrl } from '../companion';
import type { TorrentInput } from './types';

const COMPANION_TIMEOUT_MS = 1200;
const VIDEO_FILE_RE = /\.(mp4|m4v|webm|ogv|ogg|mov|mkv)$/i;

export type TorrentEngine = 'companion' | 'browser';

export type TorrentSourceStatus = {
  engine: TorrentEngine;
  phase: 'connecting' | 'metadata' | 'buffering' | 'ready' | 'error';
  detail: string;
  progress?: number;
  peers?: number;
  downloadSpeed?: number;
};

export type TorrentFileCandidate = {
  name: string;
  length: number;
};

type BrowserTorrentFile = TorrentFileCandidate & {
  progress: number;
  select: (priority: number) => void;
  streamTo: (video: HTMLVideoElement) => HTMLVideoElement;
};

export type PreparedTorrentSource = {
  engine: TorrentEngine;
  fileName: string;
  cleanup: () => void;
};

class CompanionUnavailableError extends Error {}

export function isMagnetUri(value: string): boolean {
  return /^magnet:\?[^\s]*xt=urn:bt(?:ih|mh):/i.test(value.trim());
}

export function selectLargestVideoFile<T extends TorrentFileCandidate>(files: T[]): T | null {
  return (
    files
      .filter((file) => VIDEO_FILE_RE.test(file.name))
      .sort((left, right) => right.length - left.length)[0] ?? null
  );
}

export function formatTorrentSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '0 Б/с';
  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} МБ/с`;
  }
  return `${Math.round(bytesPerSecond / 1024)} КБ/с`;
}

export async function prepareTorrentSource(
  video: HTMLVideoElement,
  input: TorrentInput,
  onStatus: (status: TorrentSourceStatus) => void,
  signal: AbortSignal,
): Promise<PreparedTorrentSource> {
  try {
    return await prepareWithCompanion(video, input, onStatus, signal);
  } catch (error) {
    if (!(error instanceof CompanionUnavailableError) || signal.aborted) throw error;
    onStatus({
      engine: 'browser',
      phase: 'connecting',
      detail: 'Companion не найден, запускаю WebTorrent в браузере…',
    });
    return prepareWithBrowser(video, input, onStatus, signal);
  }
}

function prepareWithCompanion(
  video: HTMLVideoElement,
  input: TorrentInput,
  onStatus: (status: TorrentSourceStatus) => void,
  signal: AbortSignal,
): Promise<PreparedTorrentSource> {
  if (signal.aborted) {
    return Promise.reject(new DOMException('Torrent source aborted', 'AbortError'));
  }
  const wsUrl = getCompanionWsUrl();
  if (!wsUrl) return Promise.reject(new CompanionUnavailableError('Companion disabled'));

  return new Promise((resolve, reject) => {
    const requestId = createRequestId();
    let socket: WebSocket;
    let capable = false;
    let settled = false;
    let prepared = false;

    const finishWithError = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      socket?.close();
      reject(error);
    };

    const stop = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'torrent-stop', requestId }));
      }
      socket?.close();
    };

    const onAbort = () => {
      stop();
      finishWithError(new DOMException('Torrent source aborted', 'AbortError'));
    };

    const timer = window.setTimeout(() => {
      finishWithError(new CompanionUnavailableError('Torrent capability timeout'));
    }, COMPANION_TIMEOUT_MS);

    try {
      socket = new WebSocket(wsUrl);
    } catch {
      clearTimeout(timer);
      reject(new CompanionUnavailableError('Companion connection failed'));
      return;
    }

    signal.addEventListener('abort', onAbort, { once: true });
    onStatus({ engine: 'companion', phase: 'connecting', detail: 'Проверяю companion…' });

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'capabilities' }));
    };

    socket.onmessage = (event) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(String(event.data)) as Record<string, unknown>;
      } catch {
        return;
      }

      if (message.type === 'hello') {
        const capabilities = Array.isArray(message.capabilities) ? message.capabilities : [];
        if (!capabilities.includes('torrent')) return;
        capable = true;
        clearTimeout(timer);
        socket.send(
          JSON.stringify({
            type: 'torrent-start',
            requestId,
            input: serializeTorrentInput(input),
          }),
        );
        onStatus({
          engine: 'companion',
          phase: 'metadata',
          detail: 'Companion подключён, получаю метаданные…',
        });
        return;
      }

      if (message.requestId !== requestId) return;
      if (message.type === 'torrent-status') {
        onStatus({
          engine: 'companion',
          phase: message.phase === 'ready' ? 'ready' : 'buffering',
          detail: typeof message.detail === 'string' ? message.detail : 'Загрузка…',
          progress: finiteNumber(message.progress),
          peers: finiteNumber(message.peers),
          downloadSpeed: finiteNumber(message.downloadSpeed),
        });
      } else if (message.type === 'torrent-ready') {
        const streamUrl = typeof message.streamUrl === 'string' ? message.streamUrl : '';
        const fileName = typeof message.fileName === 'string' ? message.fileName : input.name;
        if (!streamUrl) {
          finishWithError(new Error('Companion вернул пустой адрес видеопотока.'));
          return;
        }
        prepared = true;
        settled = true;
        video.crossOrigin = 'anonymous';
        video.src = streamUrl;
        resolve({ engine: 'companion', fileName, cleanup: stop });
      } else if (message.type === 'torrent-error') {
        const error = new Error(
          typeof message.message === 'string' ? message.message : 'Ошибка companion.',
        );
        if (prepared) {
          onStatus({ engine: 'companion', phase: 'error', detail: error.message });
        } else {
          finishWithError(error);
        }
      }
    };

    socket.onerror = () => {
      if (!capable) finishWithError(new CompanionUnavailableError('Companion unavailable'));
    };
    socket.onclose = () => {
      if (!settled) {
        finishWithError(
          capable
            ? new Error('Companion отключился во время подготовки торрента.')
            : new CompanionUnavailableError('Companion unavailable'),
        );
      } else if (prepared && !signal.aborted) {
        onStatus({
          engine: 'companion',
          phase: 'error',
          detail: 'Связь с companion потеряна.',
        });
      }
    };
  });
}

async function prepareWithBrowser(
  video: HTMLVideoElement,
  input: TorrentInput,
  onStatus: (status: TorrentSourceStatus) => void,
  signal: AbortSignal,
): Promise<PreparedTorrentSource> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Браузер не поддерживает service worker, необходимый WebTorrent.');
  }

  const registration = await ensureWebTorrentWorker(signal);
  // The minified browser bundle intentionally has no TypeScript declaration.
  // @ts-expect-error browser distribution is provided by the webtorrent package
  const webTorrentModule = await import('webtorrent/dist/webtorrent.min.js');
  if (signal.aborted) throw new DOMException('Torrent source aborted', 'AbortError');

  const WebTorrent = webTorrentModule.default ?? webTorrentModule;
  const client = new WebTorrent();
  let statusTimer: number | undefined;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.clearInterval(statusTimer);
    signal.removeEventListener('abort', cleanup);
    try {
      client.destroy(() => {});
    } catch {}
  };

  try {
    client.createServer({ controller: registration }, 'browser');
  } catch (error) {
    cleanup();
    throw error;
  }
  signal.addEventListener('abort', cleanup, { once: true });

  return new Promise((resolve, reject) => {
    let prepared = false;
    const fail = (error: unknown) => {
      cleanup();
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      if (prepared) {
        onStatus({ engine: 'browser', phase: 'error', detail: normalizedError.message });
      } else {
        reject(normalizedError);
      }
    };
    client.on('error', fail);
    onStatus({ engine: 'browser', phase: 'metadata', detail: 'Ищу WebTorrent-пиров…' });

    const torrentId = input.kind === 'magnet' ? input.magnet : input.bytes;
    const torrent = client.add(torrentId, (readyTorrent: any) => {
      if (signal.aborted) return;
      const file = selectLargestVideoFile<BrowserTorrentFile>(readyTorrent.files);
      if (!file) {
        fail(new Error('В торренте не найден поддерживаемый видеофайл.'));
        return;
      }

      readyTorrent.files.forEach((candidate: any) => candidate.deselect());
      file.select(10);
      video.removeAttribute('crossorigin');
      file.streamTo(video);

      const report = () => {
        onStatus({
          engine: 'browser',
          phase: file.progress >= 1 ? 'ready' : 'buffering',
          detail: `${file.name} · ${Math.round(file.progress * 100)}%`,
          progress: file.progress,
          peers: readyTorrent.numPeers,
          downloadSpeed: readyTorrent.downloadSpeed,
        });
      };
      report();
      statusTimer = window.setInterval(report, 1000);
      prepared = true;
      resolve({ engine: 'browser', fileName: file.name, cleanup });
    });
    torrent.on('error', fail);
  });
}

async function ensureWebTorrentWorker(signal: AbortSignal): Promise<ServiceWorkerRegistration> {
  if (signal.aborted) throw new DOMException('Torrent source aborted', 'AbortError');
  const registration = await navigator.serviceWorker.register('/webtorrent-sw.min.js', {
    scope: '/',
  });
  if (signal.aborted) throw new DOMException('Torrent source aborted', 'AbortError');
  const worker = registration.active ?? registration.installing ?? registration.waiting;
  if (!worker) throw new Error('Не удалось запустить WebTorrent service worker.');
  if (worker.state !== 'activated') {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        signal.removeEventListener('abort', onAbort);
        worker.removeEventListener('statechange', onStateChange);
      };
      const onAbort = () => {
        cleanup();
        reject(new DOMException('Torrent source aborted', 'AbortError'));
      };
      const onStateChange = () => {
        if (worker.state === 'activated') {
          cleanup();
          resolve();
        } else if (worker.state === 'redundant') {
          cleanup();
          reject(new Error('WebTorrent service worker остановлен браузером.'));
        }
      };
      signal.addEventListener('abort', onAbort, { once: true });
      worker.addEventListener('statechange', onStateChange);
      onStateChange();
    });
  }
  return registration;
}

function serializeTorrentInput(input: TorrentInput) {
  if (input.kind === 'magnet') return input;
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < input.bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...input.bytes.subarray(offset, offset + chunkSize));
  }
  return { kind: input.kind, name: input.name, base64: btoa(binary) };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function createRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}
