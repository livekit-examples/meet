import React from 'react';
import { ExternalE2EEKeyProvider } from 'livekit-client';
import { decodePassphrase } from './client-utils';

/**
 * Centralizes the E2EE plumbing: it reads the passphrase from the URL hash and
 * owns the (memoized) key provider and encryption worker, so call sites only need
 * to wire the returned values into their Room options.
 */
export function useSetupE2EE() {
  const [e2eePassphrase] = React.useState(() =>
    typeof window !== 'undefined' ? decodePassphrase(location.hash.substring(1)) : undefined,
  );

  const keyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);

  // Memoize the worker so it is created at most once per mount instead of on every
  // render (a new Worker on each render leaks workers and churns the Room options).
  const worker = React.useMemo<Worker | undefined>(
    () =>
      typeof window !== 'undefined' && e2eePassphrase
        ? new Worker(new URL('livekit-client/e2ee-worker', import.meta.url))
        : undefined,
    [e2eePassphrase],
  );

  React.useEffect(() => {
    return () => worker?.terminate();
  }, [worker]);

  const e2eeEnabled = !!(e2eePassphrase && worker);

  return { worker, e2eePassphrase, keyProvider, e2eeEnabled };
}
