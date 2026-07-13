'use client';
import * as React from 'react';
import { useWatchTogether } from './WatchTogetherContext';
import { parseVideoUrl } from './parseVideoUrl';
import { isMagnetUri } from './torrentSource';
import type { TorrentInput } from './types';

type Tab = 'link' | 'file' | 'torrent';

const MAX_TORRENT_FILE_BYTES = 2 * 1024 * 1024;

export function CinemaPanel() {
  const { embed, stream, startEmbed, startStream, startTorrent } = useWatchTogether();
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>('link');
  const [url, setUrl] = React.useState('');
  const [magnet, setMagnet] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const torrentInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const launchUrl = (event: React.FormEvent) => {
    event.preventDefault();
    if (embed.active && !embed.isHost) {
      setError('Сейчас просмотром управляет другой участник. Дождитесь завершения показа.');
      return;
    }
    const parsed = parseVideoUrl(url.trim());
    if (!parsed) {
      setError('Нужна прямая http(s)-ссылка на видео или ссылка YouTube.');
      return;
    }
    if (parsed.kind === 'youtube') startEmbed('youtube', parsed.videoId);
    else startEmbed('url', parsed.url);
    setError(null);
    setOpen(false);
  };

  const launchFile = (file: File | undefined) => {
    if (!file) return;
    if (embed.active && !embed.isHost) {
      setError('Сейчас просмотром управляет другой участник. Дождитесь завершения показа.');
      return;
    }
    if (file.type && !file.type.startsWith('video/')) {
      setError('Выберите видеофайл. Лучше всего работают MP4 (H.264/AAC) и WebM.');
      return;
    }
    startStream(file);
    setError(null);
    setOpen(false);
  };

  const launchTorrent = (input: TorrentInput) => {
    if (embed.active && !embed.isHost) {
      setError('Сейчас просмотром управляет другой участник. Дождитесь завершения показа.');
      return;
    }
    startTorrent(input);
    setError(null);
    setOpen(false);
  };

  const launchMagnet = (event: React.FormEvent) => {
    event.preventDefault();
    const value = magnet.trim();
    if (!isMagnetUri(value)) {
      setError('Нужна корректная magnet-ссылка BitTorrent.');
      return;
    }
    launchTorrent({ kind: 'magnet', magnet: value, name: magnetDisplayName(value) });
  };

  const launchTorrentFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_TORRENT_FILE_BYTES) {
      setError('Файл .torrent слишком большой. Максимальный размер — 2 МБ.');
      return;
    }
    try {
      launchTorrent({
        kind: 'torrent-file',
        bytes: new Uint8Array(await file.arrayBuffer()),
        name: file.name,
      });
    } catch {
      setError('Не удалось прочитать файл .torrent.');
    }
  };

  const active = embed.active || stream.active;
  const activeLabel = stream.active
    ? stream.source.kind === 'file'
      ? stream.source.file.name
      : stream.source.input.name
    : embed.active
      ? embed.kind === 'youtube'
        ? 'YouTube'
        : 'Видео по ссылке'
      : null;

  return (
    <div className="lk-cinema-launcher">
      <button
        type="button"
        className={`lk-cinema-launcher-button${active ? ' lk-cinema-launcher-active' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="lk-cinema-launcher-icon" aria-hidden="true">
          ▶
        </span>
        <span>{activeLabel ?? 'Кинотеатр'}</span>
        {active && <span className="lk-cinema-live-dot" aria-label="Сейчас воспроизводится" />}
      </button>

      {open && (
        <div className="lk-cinema-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="lk-cinema-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cinema-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="lk-cinema-panel-header">
              <div>
                <span className="lk-cinema-eyebrow">WATCH TOGETHER</span>
                <h2 id="cinema-title">Кинотеатр комнаты</h2>
                <p>Запустите видео, и все участники увидят его одновременно.</p>
              </div>
              <button
                type="button"
                className="lk-cinema-close"
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="lk-cinema-tabs" role="tablist" aria-label="Источник видео">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'link'}
                onClick={() => {
                  setTab('link');
                  setError(null);
                }}
              >
                Ссылка или YouTube
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'file'}
                onClick={() => {
                  setTab('file');
                  setError(null);
                }}
              >
                Файл с устройства
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'torrent'}
                onClick={() => {
                  setTab('torrent');
                  setError(null);
                }}
              >
                Торрент
              </button>
            </div>

            {tab === 'link' ? (
              <form className="lk-cinema-link-form" onSubmit={launchUrl}>
                <label htmlFor="cinema-url">Адрес видео</label>
                <div className="lk-cinema-url-row">
                  <input
                    id="cinema-url"
                    value={url}
                    type="text"
                    inputMode="url"
                    autoFocus
                    placeholder="https://youtu.be/... или https://site/video.m3u8"
                    onChange={(event) => {
                      setUrl(event.target.value);
                      setError(null);
                    }}
                  />
                  <button type="submit" className="lk-button" disabled={!url.trim()}>
                    Запустить
                  </button>
                </div>
                <p className="lk-cinema-hint">
                  MP4, WebM, Ogg, HLS (.m3u8), YouTube watch/shorts/embed. Сервер прямого видео
                  должен разрешать воспроизведение из браузера.
                </p>
              </form>
            ) : tab === 'file' ? (
              <div
                className={`lk-cinema-dropzone${dragging ? ' lk-cinema-dropzone-active' : ''}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  launchFile(event.dataTransfer.files[0]);
                }}
              >
                <div className="lk-cinema-file-mark" aria-hidden="true">
                  +
                </div>
                <strong>Перетащите видео сюда</strong>
                <span>Файл не загружается на сервер, а транслируется через LiveKit</span>
                <button
                  type="button"
                  className="lk-button"
                  onClick={() => inputRef.current?.click()}
                >
                  Выбрать файл
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/*,.mkv,.m4v"
                  hidden
                  onChange={(event) => {
                    launchFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </div>
            ) : (
              <div className="lk-cinema-torrent">
                <form className="lk-cinema-link-form" onSubmit={launchMagnet}>
                  <label htmlFor="cinema-magnet">Magnet-ссылка</label>
                  <div className="lk-cinema-url-row">
                    <input
                      id="cinema-magnet"
                      value={magnet}
                      type="text"
                      autoFocus
                      spellCheck={false}
                      placeholder="magnet:?xt=urn:btih:…"
                      onChange={(event) => {
                        setMagnet(event.target.value);
                        setError(null);
                      }}
                    />
                    <button type="submit" className="lk-button" disabled={!magnet.trim()}>
                      Запустить
                    </button>
                  </div>
                </form>
                <div className="lk-cinema-torrent-divider">
                  <span>или</span>
                </div>
                <button
                  type="button"
                  className="lk-button lk-cinema-torrent-file"
                  onClick={() => torrentInputRef.current?.click()}
                >
                  Выбрать файл .torrent
                </button>
                <input
                  ref={torrentInputRef}
                  type="file"
                  accept=".torrent,application/x-bittorrent"
                  hidden
                  onChange={(event) => {
                    void launchTorrentFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <div className="lk-cinema-engine-route" aria-label="Автоматический выбор движка">
                  <span>1</span>
                  <strong>Companion</strong>
                  <i>обычные BitTorrent-пиры</i>
                  <b>→</b>
                  <span>2</span>
                  <strong>WebTorrent</strong>
                  <i>fallback в браузере</i>
                </div>
                <p className="lk-cinema-hint">
                  Сначала используется локальный companion. Если он не установлен или не запущен,
                  кинотеатр автоматически перейдёт на WebTorrent. На сервер приложения torrent-файл
                  не загружается.
                </p>
              </div>
            )}

            {error && <div className="lk-cinema-error">{error}</div>}
            {active && (
              <p className="lk-cinema-replace-note">
                {embed.active && !embed.isHost
                  ? `Сейчас показ ведет ${embed.hostIdentity}. Сменить источник сможет только ведущий.`
                  : 'Новый запуск заменит текущий источник для всей комнаты.'}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function magnetDisplayName(magnet: string): string {
  try {
    const displayName = new URLSearchParams(magnet.slice(magnet.indexOf('?') + 1)).get('dn');
    return displayName?.trim() || 'Torrent';
  } catch {
    return 'Torrent';
  }
}
