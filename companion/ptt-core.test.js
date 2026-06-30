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
    expect(reduce({ talking: false }, { name: 'A', state: 'DOWN' }, KEY)).toEqual({
      talking: false,
      broadcast: null,
    });
  });

  it('matches the talk key case-insensitively', () => {
    expect(reduce({ talking: false }, { name: 'f8', state: 'DOWN' }, KEY)).toEqual({
      talking: true,
      broadcast: 'down',
    });
  });

  it('opens the mic on key down', () => {
    expect(reduce({ talking: false }, { name: 'F8', state: 'DOWN' }, KEY)).toEqual({
      talking: true,
      broadcast: 'down',
    });
  });

  it('does not re-broadcast on auto-repeat while already talking', () => {
    expect(reduce({ talking: true }, { name: 'F8', state: 'DOWN' }, KEY)).toEqual({
      talking: true,
      broadcast: null,
    });
  });

  it('closes the mic on key up', () => {
    expect(reduce({ talking: true }, { name: 'F8', state: 'UP' }, KEY)).toEqual({
      talking: false,
      broadcast: 'up',
    });
  });

  it('ignores key up when not talking', () => {
    expect(reduce({ talking: false }, { name: 'F8', state: 'UP' }, KEY)).toEqual({
      talking: false,
      broadcast: null,
    });
  });
});
