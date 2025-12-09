'use client';

import React from 'react';
import { formatChatMessageLinks } from '@livekit/components-react';

/**
 * Chat message formatter with newline support.
 * Wraps LiveKit's formatChatMessageLinks and adds <br/> for line breaks.
 */
export function formatChatMessage(message: string): React.ReactNode {
  return message
    .split('\n')
    .flatMap((line, i) =>
      i === 0
        ? [formatChatMessageLinks(line)]
        : [React.createElement('br', { key: `br-${i}` }), formatChatMessageLinks(line)],
    );
}
