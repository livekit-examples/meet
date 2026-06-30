import React from 'react';

/**
 * Keeps the screen awake while in a call (Screen Wake Lock API).
 *
 * The browser automatically releases the lock when the tab is hidden, so we
 * re-acquire it whenever the document becomes visible again. Unsupported
 * browsers (and failures, e.g. low battery) degrade gracefully to a no-op.
 */
export function useWakeLock(enabled: boolean = true) {
  React.useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== 'visible') {
        return;
      }
      try {
        sentinel = await navigator.wakeLock.request('screen');
        sentinel.addEventListener('release', () => {
          sentinel = null;
        });
      } catch (err) {
        // e.g. NotAllowedError when the tab isn't visible, or low-power mode.
        console.warn('Screen wake lock request failed', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        request();
      }
    };

    request();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [enabled]);
}
