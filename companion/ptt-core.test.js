import { describe, expect, it } from 'vitest';
import { normalizeKeyName, reduce } from './ptt-core.js';

describe('normalizeKeyName', () => {
  it('uppercases the name', () => {
    expect(normalizeKeyName('f8')).toBe('F8');
  });
  it('handles a missing name', () => {
    expect(normalizeKeyName(undefined)).toBe('');
    expect(normalizeKeyName('')).toBe('');
  });
});

describe('reduce', () => {
  const KEY = 'F8';

  it('ignores keys other than the configured one', () => {
    expect(reduce(false, { name: 'A', state: 'DOWN' }, KEY)).toBe(false);
    expect(reduce(true, { name: 'A', state: 'UP' }, KEY)).toBe(true);
  });

  it('matches the talk key case-insensitively', () => {
    expect(reduce(false, { name: 'f8', state: 'DOWN' }, KEY)).toBe(true);
  });

  it('starts talking on key down', () => {
    expect(reduce(false, { name: 'F8', state: 'DOWN' }, KEY)).toBe(true);
  });

  it('stays talking on auto-repeat (no transition, so the caller does not re-broadcast)', () => {
    expect(reduce(true, { name: 'F8', state: 'DOWN' }, KEY)).toBe(true);
  });

  it('stops talking on key up', () => {
    expect(reduce(true, { name: 'F8', state: 'UP' }, KEY)).toBe(false);
  });

  it('stays quiet on key up when not talking', () => {
    expect(reduce(false, { name: 'F8', state: 'UP' }, KEY)).toBe(false);
  });
});
