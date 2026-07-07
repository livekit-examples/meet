'use strict';

/**
 * Pure push-to-talk logic, separated from the keyboard/WebSocket I/O so it can
 * be unit-tested.
 */

function normalizeKeyName(name) {
  return (name || '').toUpperCase();
}

/**
 * Compute the next talking state from a keyboard event.
 *
 * @param {boolean} talking  current talking state
 * @param {{ name?: string, state?: string }} event  key event (state is 'DOWN' | 'UP')
 * @param {string} pttKey    configured talk key name
 * @returns {boolean} next talking state
 *
 * The caller broadcasts only when the value changes, which keeps the mic from
 * re-triggering on key auto-repeat (repeated DOWNs while already talking).
 */
function reduce(talking, event, pttKey) {
  if (normalizeKeyName(event.name) !== normalizeKeyName(pttKey)) {
    return talking;
  }
  if (event.state === 'DOWN') {
    return true;
  }
  if (event.state === 'UP') {
    return false;
  }
  return talking;
}

module.exports = { normalizeKeyName, reduce };
