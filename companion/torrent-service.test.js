import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { TorrentService } from './torrent-service.js';

class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1;
    this.sent = [];
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }
}

describe('TorrentService capability handshake', () => {
  it('advertises PTT and torrent support when a browser connects', () => {
    const service = new TorrentService({ port: 7332 });
    const socket = new FakeSocket();
    service.attachSocket(socket);
    expect(socket.sent).toEqual([{ type: 'hello', version: 2, capabilities: ['ptt', 'torrent'] }]);
  });

  it('answers an explicit capabilities request', () => {
    const service = new TorrentService({ port: 7332 });
    const socket = new FakeSocket();
    service.attachSocket(socket);
    socket.emit('message', JSON.stringify({ type: 'capabilities' }));
    expect(socket.sent).toHaveLength(2);
    expect(socket.sent[1].capabilities).toContain('torrent');
  });

  it('advertises only PTT when torrent access is not trusted', () => {
    const service = new TorrentService({ port: 7332 });
    const socket = new FakeSocket();
    service.attachSocket(socket, { enableTorrent: false });
    expect(socket.sent[0].capabilities).toEqual(['ptt']);

    socket.emit(
      'message',
      JSON.stringify({
        type: 'torrent-start',
        requestId: 'blocked',
        input: { kind: 'magnet', magnet: 'magnet:?xt=urn:btih:0123456789abcdef' },
      }),
    );
    expect(service.active).toBeNull();
  });
});
