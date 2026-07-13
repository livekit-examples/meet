'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { parseTorrentInput, selectLargestVideoFile } = require('./torrent-core');

class TorrentService {
  constructor({ port }) {
    this.port = port;
    this.active = null;
    this.operation = Promise.resolve();
  }

  attachSocket(socket, { enableTorrent = true } = {}) {
    this.sendHello(socket, enableTorrent);
    socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (message.type === 'capabilities') {
        this.sendHello(socket, enableTorrent);
      } else if (message.type === 'torrent-start' && enableTorrent) {
        this.operation = this.operation
          .then(() => this.start(socket, message))
          .catch(async (error) => {
            this.sendError(socket, message.requestId, error);
            await this.stop(socket, message.requestId);
          });
      } else if (message.type === 'torrent-stop' && enableTorrent) {
        this.operation = this.operation.then(() => this.stop(socket, message.requestId));
      }
    });
    socket.on('close', () => {
      if (this.active?.owner === socket) {
        const requestId = this.active.requestId;
        this.operation = this.operation.then(() => this.stop(socket, requestId));
      }
    });
  }

  sendHello(socket, enableTorrent = true) {
    this.send(socket, {
      type: 'hello',
      version: 2,
      capabilities: enableTorrent ? ['ptt', 'torrent'] : ['ptt'],
    });
  }

  async start(socket, message) {
    const requestId = validRequestId(message.requestId);
    const torrentId = parseTorrentInput(message.input);
    await this.stop();

    const WebTorrent = (await import('webtorrent')).default;
    const client = new WebTorrent();
    let sessionDir;
    let server;
    try {
      const token = crypto.randomBytes(24).toString('base64url');
      server = client.createServer({
        hostname: '127.0.0.1',
        origin: '*',
        pathname: `/torrent/${token}`,
      });
      sessionDir = await fs.mkdtemp(path.join(os.tmpdir(), 'livekit-companion-torrent-'));
    } catch (error) {
      await destroyClient(client);
      if (sessionDir) await fs.rm(sessionDir, { recursive: true, force: true });
      throw error;
    }
    const active = {
      client,
      file: null,
      owner: socket,
      requestId,
      server,
      sessionDir,
      statusTimer: null,
      torrent: null,
    };
    this.active = active;

    client.on('error', (error) => {
      if (this.active === active) this.sendError(socket, requestId, error);
    });
    await listen(server, this.port);
    if (this.active !== active) return;

    this.sendStatus(active, 'metadata', 'Получаю метаданные и ищу пиры…');
    const torrent = client.add(
      torrentId,
      { path: sessionDir, destroyStoreOnDestroy: true },
      (readyTorrent) => this.onTorrentReady(active, readyTorrent),
    );
    active.torrent = torrent;
    torrent.on('error', (error) => {
      if (this.active === active) this.sendError(socket, requestId, error);
    });
    torrent.on('noPeers', () => {
      if (this.active === active) {
        this.sendStatus(active, 'buffering', 'Пиры пока не найдены…');
      }
    });
  }

  onTorrentReady(active, torrent) {
    if (this.active !== active) return;
    const selected = selectLargestVideoFile(torrent.files);
    if (!selected) {
      this.sendError(active.owner, active.requestId, new Error('В торренте нет видеофайла.'));
      this.operation = this.operation.then(() => this.stop());
      return;
    }

    torrent.files.forEach((file) => file.deselect());
    selected.file.select(10);
    active.file = selected.file;
    active.statusTimer = setInterval(() => this.report(active), 1000);
    this.report(active);

    const streamUrl = `http://127.0.0.1:${this.port}${selected.file.streamURL}`;
    this.send(active.owner, {
      type: 'torrent-ready',
      requestId: active.requestId,
      fileName: selected.file.name,
      streamUrl,
    });
  }

  report(active) {
    if (this.active !== active || !active.torrent || !active.file) return;
    const progress = active.file.progress;
    this.sendStatus(
      active,
      progress >= 1 ? 'ready' : 'buffering',
      `${active.file.name} · ${Math.round(progress * 100)}%`,
    );
  }

  sendStatus(active, phase, detail) {
    this.send(active.owner, {
      type: 'torrent-status',
      requestId: active.requestId,
      phase,
      detail,
      progress: active.file?.progress ?? 0,
      peers: active.torrent?.numPeers ?? 0,
      downloadSpeed: active.torrent?.downloadSpeed ?? 0,
    });
  }

  sendError(socket, requestId, error) {
    this.send(socket, {
      type: 'torrent-error',
      requestId: typeof requestId === 'string' ? requestId : '',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  send(socket, message) {
    if (socket?.readyState === 1) socket.send(JSON.stringify(message));
  }

  async stop(socket, requestId) {
    const active = this.active;
    if (!active) return;
    if (socket && active.owner !== socket) return;
    if (requestId && active.requestId !== requestId) return;
    this.active = null;
    clearInterval(active.statusTimer);
    await destroyClient(active.client);
    await fs.rm(active.sessionDir, { recursive: true, force: true });
  }

  async close() {
    await this.operation;
    await this.stop();
  }
}

function validRequestId(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128) {
    throw new Error('Некорректный requestId.');
  }
  return value;
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.server.off('error', onError);
      resolve();
    };
    server.server.once('error', onError);
    server.server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

function destroyClient(client) {
  return new Promise((resolve) => {
    if (!client || client.destroyed) {
      resolve();
      return;
    }
    client.destroy(() => resolve());
  });
}

module.exports = { TorrentService };
