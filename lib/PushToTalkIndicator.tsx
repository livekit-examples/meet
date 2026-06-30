import * as React from 'react';
import type { PushToTalkState } from './usePushToTalk';

/**
 * Small badge shown while the push-to-talk companion is connected, so the user
 * knows the call is in walkie-talkie mode and whether the mic is currently open.
 */
export function PushToTalkIndicator({ connected, talking }: PushToTalkState) {
  if (!connected) {
    return null;
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: '0.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.85rem',
        pointerEvents: 'none',
        backgroundColor: talking ? 'var(--lk-danger3, #c92f2f)' : 'rgba(0, 0, 0, 0.6)',
        color: 'var(--lk-fg, #fff)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
        transition: 'background-color 0.1s ease',
      }}
    >
      <span aria-hidden>🎙️</span>
      <span>{talking ? 'Говорите…' : 'Рация подключена — зажмите клавишу'}</span>
    </div>
  );
}
