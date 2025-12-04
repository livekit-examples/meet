'use client';

import * as React from 'react';

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
}

const SubtitleContext = React.createContext<SubtitleContextType | null>(null);

export function SubtitleProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<SubtitleSettings>(defaultSubtitleSettings);

  // Load visual settings from localStorage on mount (enabled always starts false)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('subtitle-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          ...defaultSubtitleSettings,
          fontSize: parsed.fontSize ?? defaultSubtitleSettings.fontSize,
          position: parsed.position ?? defaultSubtitleSettings.position,
          backgroundColor: parsed.backgroundColor ?? defaultSubtitleSettings.backgroundColor,
          enabled: false,
        });
      }
    } catch (e) {
      console.error('Failed to load subtitle settings:', e);
    }
  }, []);

  const updateSettings = React.useCallback((newSettings: SubtitleSettings) => {
    setSettings(newSettings);
    // Save visual settings to localStorage (not enabled)
    try {
      localStorage.setItem('subtitle-settings', JSON.stringify({
        fontSize: newSettings.fontSize,
        position: newSettings.position,
        backgroundColor: newSettings.backgroundColor,
      }));
    } catch (e) {
      console.error('Failed to save subtitle settings:', e);
    }
  }, []);

  return (
    <SubtitleContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SubtitleContext.Provider>
  );
}

export function useSubtitleSettings() {
  const context = React.useContext(SubtitleContext);
  if (!context) {
    throw new Error('useSubtitleSettings must be used within SubtitleProvider');
  }
  return context;
}



