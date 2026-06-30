'use strict';

/**
 * Pure push-to-talk logic, separated from the keyboard/WebSocket I/O so it can
 * be unit-tested.
 */

function normalizeKeyName(name) {
  return (name || '').toUpperCase();
}

/**
 * Reduce a keyboard event against the current talk state.
 *
 * @param {{ talking: boolean }} state    current state
 * @param {{ name?: string, state?: string }} event  key event (state is 'DOWN' | 'UP')
 * @param {string} pttKey                 configured talk key name
 * @returns {{ talking: boolean, broadcast: 'down' | 'up' | null }}
 *          next state and the message to broadcast (null = nothing changed).
 *
 * Keeps the mic from re-triggering on auto-repeat by only emitting on an actual
 * not-talking -> talking (DOWN) or talking -> not-talking (UP) transition.
 */
function reduce(state, event, pttKey) {
  if (normalizeKeyName(event.name) !== normalizeKeyName(pttKey)) {
    return { talking: state.talking, broadcast: null };
  }
  if (event.state === 'DOWN' && !state.talking) {
    return { talking: true, broadcast: 'down' };
  }
  if (event.state === 'UP' && state.talking) {
    return { talking: false, broadcast: 'up' };
  }
  return { talking: state.talking, broadcast: null };
}

module.exports = { normalizeKeyName, reduce };
