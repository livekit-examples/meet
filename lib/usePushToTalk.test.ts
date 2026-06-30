// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { usePushToTalk } from './usePushToTalk';

type Handler = ((ev: any) => void) | null;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: Handler = null;
  onmessage: Handler = null;
  onclose: Handler = null;
  onerror: Handler = null;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.({});
  });

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = 1;
    this.onopen?.({});
  }

  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

function makeRoom() {
  const setMicrophoneEnabled = vi.fn().mockResolvedValue(undefined);
  return {
    room: { localParticipant: { setMicrophoneEnabled } } as any,
    setMicrophoneEnabled,
  };
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket as any);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('usePushToTalk', () => {
  it('connects to the default companion URL', () => {
    const { room } = makeRoom();
    renderHook(() => usePushToTalk(room));
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe('ws://127.0.0.1:7331');
  });

  it('mutes the mic and reports connected once the companion opens', () => {
    const { room, setMicrophoneEnabled } = makeRoom();
    const { result } = renderHook(() => usePushToTalk(room));
    act(() => FakeWebSocket.instances[0].open());
    expect(result.current.connected).toBe(true);
    expect(setMicrophoneEnabled).toHaveBeenCalledWith(false);
  });

  it('opens the mic while the key is held and closes it on release', () => {
    const { room, setMicrophoneEnabled } = makeRoom();
    const { result } = renderHook(() => usePushToTalk(room));
    const ws = FakeWebSocket.instances[0];
    act(() => ws.open());
    setMicrophoneEnabled.mockClear();

    act(() => ws.emit({ type: 'ptt', state: 'down' }));
    expect(result.current.talking).toBe(true);
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(true);

    act(() => ws.emit({ type: 'ptt', state: 'up' }));
    expect(result.current.talking).toBe(false);
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
  });

  it('ignores unrelated or malformed messages', () => {
    const { room, setMicrophoneEnabled } = makeRoom();
    const { result } = renderHook(() => usePushToTalk(room));
    const ws = FakeWebSocket.instances[0];
    act(() => ws.open());
    setMicrophoneEnabled.mockClear();

    act(() => ws.emit({ type: 'other' }));
    act(() => ws.onmessage?.({ data: 'not-json' }));
    expect(setMicrophoneEnabled).not.toHaveBeenCalled();
    expect(result.current.talking).toBe(false);
  });

  it('reconnects after the socket closes', () => {
    vi.useFakeTimers();
    const { room } = makeRoom();
    renderHook(() => usePushToTalk(room));
    expect(FakeWebSocket.instances).toHaveLength(1);

    act(() => FakeWebSocket.instances[0].onclose?.({}));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('does nothing when the endpoint is disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_PTT_WS_URL', '');
    const { room } = makeRoom();
    renderHook(() => usePushToTalk(room));
    expect(FakeWebSocket.instances).toHaveLength(0);
  });
});
