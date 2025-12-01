'use client';

import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind, RemoteParticipant } from 'livekit-client';
import styles from '@/styles/Subtitles.module.css';

export interface SubtitleSettings {
  enabled: boolean;
  fontSize: number; // 18-40
  position: 'top' | 'center' | 'bottom';
  backgroundColor: string;
}

export const defaultSubtitleSettings: SubtitleSettings = {
  enabled: true,
  fontSize: 24,
  position: 'bottom',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
};

interface SubtitleLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  displayTime: number; // calculated display time in ms
}

// Calculate display time based on text length
// Average reading speed: ~200 words per minute = ~3.3 words per second
// Average word length: ~5 characters
// So roughly 16-17 characters per second for comfortable reading
// Min 2s, max 8s
function calculateDisplayTime(text: string): number {
  const charsPerSecond = 15;
  const minTime = 2000; // 2 seconds
  const maxTime = 8000; // 8 seconds
  const calculated = (text.length / charsPerSecond) * 1000;
  return Math.max(minTime, Math.min(maxTime, calculated));
}

interface SubtitlesOverlayProps {
  settings: SubtitleSettings;
}

export function SubtitlesOverlay({ settings }: SubtitlesOverlayProps) {
  const room = useRoomContext();
  const [lines, setLines] = React.useState<SubtitleLine[]>([]);
  const lineIdRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const queueRef = React.useRef<SubtitleLine[]>([]);
  const currentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const currentLineIdRef = React.useRef<string | null>(null);

  // Show next subtitle from queue
  const showNext = React.useCallback(() => {
    // Clear any pending timeout
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    // Remove current line immediately if exists
    if (currentLineIdRef.current) {
      setLines((prev) => prev.filter((l) => l.id !== currentLineIdRef.current));
      currentLineIdRef.current = null;
    }

    // Nothing in queue
    if (queueRef.current.length === 0) {
      return;
    }

    // Get next line
    const nextLine = queueRef.current.shift()!;
    nextLine.timestamp = Date.now();
    currentLineIdRef.current = nextLine.id;

    setLines((prev) => [...prev.slice(-2), nextLine]); // Keep max 3 lines

    // Schedule next subtitle
    currentTimeoutRef.current = setTimeout(() => {
      setLines((prev) => prev.filter((l) => l.id !== nextLine.id));
      currentLineIdRef.current = null;
      showNext();
    }, nextLine.displayTime);
  }, []);

  // Listen for data messages on lk.subtitle topic
  React.useEffect(() => {
    if (!room || !settings.enabled) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      if (topic !== 'lk.subtitle') return;

      try {
        const raw = new TextDecoder().decode(payload).trim();
        if (!raw) return;

        // Parse JSON: {speaker, text}
        const data = JSON.parse(raw);
        const speaker = data.speaker || 'Unknown';
        const text = data.text || raw;
        const displayTime = calculateDisplayTime(text);

        const newLine: SubtitleLine = {
          id: `sub-${lineIdRef.current++}`,
          speaker,
          text,
          timestamp: Date.now(),
          displayTime,
        };

        queueRef.current.push(newLine);

        // If queue is growing (more than 2), immediately switch to next
        if (queueRef.current.length > 2) {
          showNext();
        } else if (!currentLineIdRef.current) {
          showNext();
        }
      } catch (e) {
        console.error('Failed to parse subtitle:', e);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
      }
    };
  }, [room, settings.enabled, showNext]);

  if (!settings.enabled || lines.length === 0) {
    return null;
  }

  const positionClass = {
    top: styles.positionTop,
    center: styles.positionCenter,
    bottom: styles.positionBottom,
  }[settings.position];

  return (
    <div
      ref={containerRef}
      className={`${styles.subtitlesContainer} ${positionClass}`}
      style={
        {
          '--subtitle-font-size': `${settings.fontSize}px`,
          '--subtitle-font-family': '"TWK Everett", sans-serif',
          '--subtitle-bg': settings.backgroundColor,
          '--subtitle-text': '#f0f0f0',
        } as React.CSSProperties
      }
    >
      <div className={styles.subtitlesInner}>
        {lines.map((line, index) => {
          // Calculate fade based on display time
          const age = Date.now() - line.timestamp;
          const fadeStart = line.displayTime * 0.7; // Start fading at 70%
          const opacity = age > fadeStart ? 1 - (age - fadeStart) / (line.displayTime * 0.3) : 1;

          return (
            <div
              key={line.id}
              className={styles.subtitleLine}
              style={{
                opacity: Math.max(0, Math.min(1, opacity)),
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <span className={styles.speaker}>{line.speaker}</span>
              <span className={styles.text}>{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SubtitlesOverlay;
