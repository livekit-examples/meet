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

  // Load visual settings from localStorage
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

  return (
    <SubtitleContext.Provider value={{ settings, updateSettings, hasAgent }}>
      {children}
    </SubtitleContext.Provider>
  );
}

interface SubtitleLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  displayTime: number;
}

function calculateDisplayTime(text: string): number {
  const charsPerSecond = 15;
  const calculated = (text.length / charsPerSecond) * 1000;
  return Math.max(2000, Math.min(8000, calculated));
}

export function SubtitlesOverlay() {
  const room = useRoomContext();
  const { settings } = useSubtitleSettings();
  const [lines, setLines] = React.useState<SubtitleLine[]>([]);
  const lineIdRef = React.useRef(0);
  const queueRef = React.useRef<SubtitleLine[]>([]);
  const currentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const currentLineIdRef = React.useRef<string | null>(null);

  const showNext = React.useCallback(() => {
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (currentLineIdRef.current) {
      setLines((prev) => prev.filter((l) => l.id !== currentLineIdRef.current));
      currentLineIdRef.current = null;
    }

    if (queueRef.current.length === 0) return;

    const nextLine = queueRef.current.shift()!;
    nextLine.timestamp = Date.now();
    currentLineIdRef.current = nextLine.id;

    setLines((prev) => [...prev.slice(-2), nextLine]);

    currentTimeoutRef.current = setTimeout(() => {
      setLines((prev) => prev.filter((l) => l.id !== nextLine.id));
      currentLineIdRef.current = null;
      showNext();
    }, nextLine.displayTime);
  }, []);

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
        const newLine: SubtitleLine = {
          id: `sub-${lineIdRef.current++}`,
          speaker: data.speaker || 'Unknown',
          text: data.text || raw,
          timestamp: Date.now(),
          displayTime: calculateDisplayTime(data.text || raw),
        };

        queueRef.current.push(newLine);

        if (queueRef.current.length > 2) {
          showNext();
        } else if (!currentLineIdRef.current) {
          showNext();
        }
      } catch (e) {
        console.error('Failed to parse subtitle:', e);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      if (currentTimeoutRef.current) clearTimeout(currentTimeoutRef.current);
    };
  }, [room, settings.enabled, showNext]);

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
