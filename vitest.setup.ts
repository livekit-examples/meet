import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Shared teardown so individual test files don't have to remember it:
// unmount rendered components and undo vi.stubGlobal / vi.stubEnv.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
