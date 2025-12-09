'use client';

import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind, RemoteParticipant } from 'livekit-client';
import styles from '@/styles/Subtitles.module.css';

export interface SubtitleSettings {
  enabled: boolean;
  fontSize: number;
  position: 'top' | 'center' | 'bottom';
  backgroundColor: string;
}

export const defaultSubtitleSettings: SubtitleSettings = {
  enabled: false,
  fontSize: 24,
  position: 'bottom',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
};

interface SubtitleContextType {
  settings: SubtitleSettings;
  updateSettings: (settings: SubtitleSettings) => void;
  hasAgent: boolean;
  summaryEmail: string | null;
  setSummaryEmail: (email: string | null) => void;
}

const SubtitleContext = React.createContext<SubtitleContextType | null>(null);

export function useSubtitleSettings() {
  const context = React.useContext(SubtitleContext);
  if (!context) {
    throw new Error('useSubtitleSettings must be used within SubtitleProvider');
  }
  return context;
}

const AGENT_NAME = 'LiveKit Transcription';

export function SubtitleProvider({ children }: { children: React.ReactNode }) {
  const room = useRoomContext();
  const [settings, setSettings] = React.useState<SubtitleSettings>(defaultSubtitleSettings);
  const [hasAgent, setHasAgent] = React.useState(false);
  const [summaryEmail, setSummaryEmail] = React.useState<string | null>(null);

  // Load visual settings and email from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('subtitle-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({
          ...prev,
          fontSize: parsed.fontSize ?? prev.fontSize,
          position: parsed.position ?? prev.position,
          backgroundColor: parsed.backgroundColor ?? prev.backgroundColor,
        }));
      }
      // Load saved email
      const savedEmail = localStorage.getItem('summary-email');
      if (savedEmail) {
        setSummaryEmail(savedEmail);
      }
    } catch (e) {
      console.error('Failed to load subtitle settings:', e);
    }
  }, []);

  // Check for agent presence
  const checkAgent = React.useCallback(() => {
    if (!room) {
      setHasAgent(false);
      return;
    }
    for (const p of room.remoteParticipants.values()) {
      if (p.name === AGENT_NAME) {
        setHasAgent(true);
        return;
      }
    }
    setHasAgent(false);
  }, [room]);

  React.useEffect(() => {
    if (!room) return;
    checkAgent();
    room.on(RoomEvent.ParticipantConnected, checkAgent);
    room.on(RoomEvent.ParticipantDisconnected, checkAgent);
    return () => {
      room.off(RoomEvent.ParticipantConnected, checkAgent);
      room.off(RoomEvent.ParticipantDisconnected, checkAgent);
    };
  }, [room, checkAgent]);

  const updateSettings = React.useCallback((newSettings: SubtitleSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(
        'subtitle-settings',
        JSON.stringify({
          fontSize: newSettings.fontSize,
          position: newSettings.position,
          backgroundColor: newSettings.backgroundColor,
        }),
      );
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, []);

  const updateSummaryEmail = React.useCallback((email: string | null) => {
    setSummaryEmail(email);
    try {
      if (email) {
        localStorage.setItem('summary-email', email);
      } else {
        localStorage.removeItem('summary-email');
      }
    } catch (e) {
      console.error('Failed to save summary email:', e);
    }
  }, []);

  return (
    <SubtitleContext.Provider
      value={{
        settings,
        updateSettings,
        hasAgent,
        summaryEmail,
        setSummaryEmail: updateSummaryEmail,
      }}
    >
      {children}
    </SubtitleContext.Provider>
  );
}

interface SubtitleLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  expireAt: number;
}

function calculateDisplayTime(text: string, queueLength: number = 0): number {
  const charsPerSecond = 15;
  const calculated = (text.length / charsPerSecond) * 1000;
  const baseTime = Math.max(2000, Math.min(8000, calculated));

  // Reduce display time when queue is backing up
  // Queue 0-1: full time, Queue 2: 70%, Queue 3+: 50%
  if (queueLength >= 3) return Math.max(1000, baseTime * 0.5);
  if (queueLength >= 2) return Math.max(1500, baseTime * 0.7);
  return baseTime;
}

export function SubtitlesOverlay() {
  const room = useRoomContext();
  const { settings } = useSubtitleSettings();
  const [lines, setLines] = React.useState<SubtitleLine[]>([]);
  const lineIdRef = React.useRef(0);
  const queueRef = React.useRef<SubtitleLine[]>([]);
  const rafRef = React.useRef<number | null>(null);
  const hasActiveContent = React.useRef(false);

  // Process subtitles - clean expired lines and show queued ones
  // All logic in single setLines call to avoid race conditions
  const processSubtitles = React.useCallback(() => {
    const now = Date.now();

    setLines((prev) => {
      // Filter out expired lines
      let result = prev.filter((l) => l.expireAt > now);
      const queueLength = queueRef.current.length;

      // When queue is building up, aggressively expire older lines
      // Keep only the most recent line when queue has 2+ items waiting
      if (queueLength >= 2 && result.length > 1) {
        result = result.slice(-1);
      }

      // Show next line from queue if:
      // - No lines are currently showing, OR
      // - Queue is building up (show new content faster)
      const shouldShowNext = result.length === 0 || queueLength > 0;

      if (shouldShowNext && queueLength > 0) {
        const nextLine = queueRef.current.shift()!;
        nextLine.timestamp = now;
        nextLine.expireAt = now + calculateDisplayTime(nextLine.text, queueRef.current.length);
        result = [...result.slice(-1), nextLine]; // Keep max 2 lines
      }

      // Track if we have content to display (for RAF optimization)
      hasActiveContent.current = result.length > 0 || queueRef.current.length > 0;

      return result;
    });
  }, []);

  // RAF loop - only runs when there's active content
  const tick = React.useCallback(() => {
    processSubtitles();

    // Continue loop only if there's content to process
    if (hasActiveContent.current) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, [processSubtitles]);

  // Start RAF loop when needed
  const startLoop = React.useCallback(() => {
    if (rafRef.current === null && settings.enabled) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick, settings.enabled]);

  // Handle visibility change - immediately clean up when tab becomes visible
  React.useEffect(() => {
    if (!settings.enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Process immediately when tab becomes visible
        processSubtitles();
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.enabled, processSubtitles, startLoop]);

  // Clean up RAF when disabled
  React.useEffect(() => {
    if (!settings.enabled && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [settings.enabled]);

  React.useEffect(() => {
    if (!room || !settings.enabled) return;

    const handleData = (
      payload: Uint8Array,
      _participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      if (topic !== 'lk.subtitle') return;

      try {
        const raw = new TextDecoder().decode(payload).trim();
        if (!raw) return;

        const data = JSON.parse(raw);
        const now = Date.now();
        const newLine: SubtitleLine = {
          id: `sub-${lineIdRef.current++}`,
          speaker: data.speaker || 'Unknown',
          text: data.text || raw,
          timestamp: now,
          expireAt: now + calculateDisplayTime(data.text || raw),
        };

        queueRef.current.push(newLine);

        // If queue is backing up, skip older items more aggressively
        // Keep only last 2 items to prevent falling too far behind
        if (queueRef.current.length > 2) {
          queueRef.current = queueRef.current.slice(-2);
        }

        // Start processing loop
        startLoop();
      } catch (e) {
        console.error('Failed to parse subtitle:', e);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      queueRef.current = [];
    };
  }, [room, settings.enabled, startLoop]);

  if (!settings.enabled || lines.length === 0) return null;

  const positionClass = {
    top: styles.positionTop,
    center: styles.positionCenter,
    bottom: styles.positionBottom,
  }[settings.position];

  return (
    <div
      className={`${styles.subtitlesContainer} ${positionClass}`}
      style={
        {
          '--subtitle-font-size': `${settings.fontSize}px`,
          '--subtitle-bg': settings.backgroundColor,
        } as React.CSSProperties
      }
    >
      <div className={styles.subtitlesInner}>
        {lines.map((line) => (
          <div key={line.id} className={styles.subtitleLine}>
            <span className={styles.speaker}>{line.speaker}</span>
            <span className={styles.text}>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
