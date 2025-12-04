'use client';

import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { useSubtitleSettings, SubtitleSettings } from './SubtitlesOverlay';

function EmailPopup({
  onSkip,
  onSubscribe,
  onClose,
  isLoading,
  error,
}: {
  onSkip: () => void;
  onSubscribe: (email: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [email, setEmail] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('summary-email') || '';
    }
    return '';
  });

  const handleSubscribe = () => {
    if (email.trim()) {
      localStorage.setItem('summary-email', email.trim());
      onSubscribe(email.trim());
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '0.5rem',
        zIndex: 100,
        background: 'var(--lk-bg2, #1a1a1a)',
        border: '1px solid var(--lk-border-color, rgba(255,255,255,0.15))',
        borderRadius: '0.5rem',
        padding: '1rem',
        minWidth: '280px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
        Want to receive a summary of this call?
      </p>
      <input
        type="email"
        placeholder="your@email.com (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          background: 'var(--lk-bg, #111)',
          border: '1px solid var(--lk-border-color, rgba(255,255,255,0.15))',
          borderRadius: '0.375rem',
          color: 'white',
          fontSize: '0.875rem',
          marginBottom: '0.75rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <p style={{ color: '#ff4444', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="lk-button"
          onClick={onSkip}
          disabled={isLoading}
          style={{ flex: 1, fontSize: '0.8125rem' }}
        >
          {isLoading ? 'Loading...' : 'Skip'}
        </button>
        <button
          className="lk-button"
          onClick={handleSubscribe}
          disabled={isLoading || !email.trim()}
          style={{
            flex: 1,
            fontSize: '0.8125rem',
            background: 'var(--lk-accent-bg, #ff6352)',
            border: 'none',
          }}
        >
          {isLoading ? 'Loading...' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

export function SubtitlesSettings() {
  const room = useRoomContext();
  const { settings, updateSettings, hasAgent } = useSubtitleSettings();
  const [showPopup, setShowPopup] = React.useState(false);
  const [isSpawning, setIsSpawning] = React.useState(false);
  const [spawnError, setSpawnError] = React.useState<string | null>(null);

  const getPassphrase = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      return hash?.length > 1 ? hash.substring(1) : undefined;
    }
    return undefined;
  };

  const spawnAgent = async (email?: string) => {
    if (!room?.name) {
      setSpawnError('Room not available');
      return false;
    }

    setIsSpawning(true);
    setSpawnError(null);

    try {
      const response = await fetch('/api/agent/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: room.name,
          email: email || undefined,
          e2eePassphrase: getPassphrase(),
        }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || 'Failed to spawn agent');
      }
      return true;
    } catch (error) {
      setSpawnError(error instanceof Error ? error.message : 'Failed');
      return false;
    } finally {
      setIsSpawning(false);
    }
  };

  const handleToggle = () => {
    if (settings.enabled) {
      updateSettings({ ...settings, enabled: false });
    } else if (hasAgent) {
      updateSettings({ ...settings, enabled: true });
    } else {
      setShowPopup(true);
      setSpawnError(null);
    }
  };

  const handleSkip = async () => {
    if (await spawnAgent()) {
      updateSettings({ ...settings, enabled: true });
      setShowPopup(false);
    }
  };

  const handleSubscribe = async (email: string) => {
    if (await spawnAgent(email)) {
      updateSettings({ ...settings, enabled: true });
      setShowPopup(false);
    }
  };

  const updateSetting = <K extends keyof SubtitleSettings>(key: K, value: SubtitleSettings[K]) => {
    updateSettings({ ...settings, [key]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ marginBottom: '0.25rem' }}>Subtitles</h3>

      <section className="lk-button-group">
        <span className="lk-button">Show Subtitles</span>
        <div className="lk-button-group-menu" style={{ position: 'relative' }}>
          <button className="lk-button" aria-pressed={settings.enabled} onClick={handleToggle}>
            {settings.enabled ? 'On' : 'Off'}
          </button>
          {showPopup && (
            <EmailPopup
              onSkip={handleSkip}
              onSubscribe={handleSubscribe}
              onClose={() => !isSpawning && setShowPopup(false)}
              isLoading={isSpawning}
              error={spawnError}
            />
          )}
        </div>
      </section>

      {settings.enabled && (
        <>
          <section className="lk-button-group">
            <span className="lk-button">Font Size</span>
            <div className="lk-button-group-menu">
              <select
                className="lk-button"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                style={{ minWidth: '100px' }}
              >
                <option value={18}>Small</option>
                <option value={24}>Medium</option>
                <option value={32}>Large</option>
                <option value={40}>Extra Large</option>
              </select>
            </div>
          </section>

          <section className="lk-button-group">
            <span className="lk-button">Position</span>
            <div className="lk-button-group-menu">
              <select
                className="lk-button"
                value={settings.position}
                onChange={(e) =>
                  updateSetting('position', e.target.value as 'top' | 'center' | 'bottom')
                }
                style={{ minWidth: '100px' }}
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </section>

          <section className="lk-button-group">
            <span className="lk-button">Background</span>
            <div className="lk-button-group-menu">
              <select
                className="lk-button"
                value={settings.backgroundColor}
                onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                style={{ minWidth: '100px' }}
              >
                <option value="rgba(0, 0, 0, 0.85)">Dark</option>
                <option value="rgba(0, 0, 0, 0.6)">Medium</option>
                <option value="rgba(0, 0, 0, 0.4)">Light</option>
                <option value="transparent">None</option>
              </select>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
