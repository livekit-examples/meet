'use client';

import * as React from 'react';
import { SubtitleSettings, defaultSubtitleSettings } from './SubtitlesOverlay';

interface SubtitlesSettingsProps {
  settings: SubtitleSettings;
  onChange: (settings: SubtitleSettings) => void;
}

export function SubtitlesSettings({ settings, onChange }: SubtitlesSettingsProps) {
  const updateSetting = <K extends keyof SubtitleSettings>(key: K, value: SubtitleSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ marginBottom: '0.25rem' }}>Subtitles</h3>
      <section className="lk-button-group">
        <span className="lk-button">Show Subtitles</span>
        <div className="lk-button-group-menu">
          <button
            className="lk-button"
            aria-pressed={settings.enabled}
            onClick={() => updateSetting('enabled', !settings.enabled)}
          >
            {settings.enabled ? 'On' : 'Off'}
          </button>
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

// Hook for managing subtitle settings with localStorage persistence
export function useSubtitleSettings() {
  const [settings, setSettings] = React.useState<SubtitleSettings>(defaultSubtitleSettings);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('subtitle-settings');
      if (saved) {
        setSettings({ ...defaultSubtitleSettings, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error('Failed to load subtitle settings:', e);
    }
    setIsLoaded(true);
  }, []);

  // Listen for storage changes from other components
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subtitle-settings' && e.newValue) {
        try {
          setSettings({ ...defaultSubtitleSettings, ...JSON.parse(e.newValue) });
        } catch (err) {
          console.error('Failed to parse subtitle settings:', err);
        }
      }
    };

    // Also listen for custom event for same-tab updates
    const handleCustomEvent = () => {
      try {
        const saved = localStorage.getItem('subtitle-settings');
        if (saved) {
          setSettings({ ...defaultSubtitleSettings, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error('Failed to load subtitle settings:', e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('subtitle-settings-updated', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('subtitle-settings-updated', handleCustomEvent);
    };
  }, []);

  // Save to localStorage on change and notify other components
  const updateSettings = React.useCallback((newSettings: SubtitleSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('subtitle-settings', JSON.stringify(newSettings));
      // Dispatch custom event to notify same-tab listeners
      window.dispatchEvent(new Event('subtitle-settings-updated'));
    } catch (e) {
      console.error('Failed to save subtitle settings:', e);
    }
  }, []);

  return { settings, updateSettings, isLoaded };
}

export default SubtitlesSettings;
