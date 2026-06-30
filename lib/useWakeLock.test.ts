// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

function stubWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined);
  const sentinel = { release, addEventListener: vi.fn() };
  const request = vi.fn().mockResolvedValue(sentinel);
  vi.stubGlobal('navigator', { wakeLock: { request } });
  return { request, release, sentinel };
}

beforeEach(() => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useWakeLock', () => {
  it('requests a screen wake lock on mount', async () => {
    const { request } = stubWakeLock();
    renderHook(() => useWakeLock());
    await act(async () => {});
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('releases the lock on unmount', async () => {
    const { request, release } = stubWakeLock();
    const { unmount } = renderHook(() => useWakeLock());
    await act(async () => {});
    expect(request).toHaveBeenCalled();

    unmount();
    expect(release).toHaveBeenCalled();
  });

  it('does nothing when disabled', async () => {
    const { request } = stubWakeLock();
    renderHook(() => useWakeLock(false));
    await act(async () => {});
    expect(request).not.toHaveBeenCalled();
  });

  it('is a no-op when the Wake Lock API is unsupported', () => {
    vi.stubGlobal('navigator', {});
    expect(() => renderHook(() => useWakeLock())).not.toThrow();
  });
});
