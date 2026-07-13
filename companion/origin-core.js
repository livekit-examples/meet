'use strict';

function isLoopbackOrigin(origin) {
  if (typeof origin !== 'string') return false;
  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
    );
  } catch {
    return false;
  }
}

module.exports = { isLoopbackOrigin };
