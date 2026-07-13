import { describe, expect, it } from 'vitest';
import { isLoopbackOrigin } from './origin-core.js';

describe('isLoopbackOrigin', () => {
  it('allows local development origins', () => {
    expect(isLoopbackOrigin('http://localhost:3000')).toBe(true);
    expect(isLoopbackOrigin('https://127.0.0.1:3443')).toBe(true);
    expect(isLoopbackOrigin('http://[::1]:3000')).toBe(true);
  });

  it('rejects remote, opaque, and malformed origins', () => {
    expect(isLoopbackOrigin('https://chat.example.com')).toBe(false);
    expect(isLoopbackOrigin('null')).toBe(false);
    expect(isLoopbackOrigin(undefined)).toBe(false);
  });
});
