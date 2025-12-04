'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRoomContext } from '@livekit/components-react';
import { SummaryTooltip } from './SummaryTooltip';
import { useAgentPresence } from './useAgentPresence';
import { SubtitleSettings } from './SubtitlesOverlay';

interface SubtitlesToggleProps {
  settings: SubtitleSettings;
  onToggle: (enabled: boolean) => void;
}

/**
 * Subtitles toggle button that injects itself into the LiveKit ControlBar.
 * Uses React Portal to teleport into .lk-control-bar element.
 */
export function SubtitlesToggle({ settings, onToggle }: SubtitlesToggleProps) {
  const room = useRoomContext();
  const { hasAgent } = useAgentPresence();
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [isSpawning, setIsSpawning] = React.useState(false);
  const [spawnError, setSpawnError] = React.useState<string | null>(null);
  const [controlBar, setControlBar] = React.useState<Element | null>(null);

  // Find the control bar element and inject our button
  React.useEffect(() => {
    const findControlBar = () => {
      const bar = document.querySelector('.lk-control-bar');
      if (bar) {
        setControlBar(bar);
      }
    };

    // Try immediately
    findControlBar();

    // Also observe DOM changes in case control bar renders later
    const observer = new MutationObserver(() => {
      if (!controlBar) {
        findControlBar();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [controlBar]);

  // Get E2EE passphrase from URL hash if present
  const getPassphrase = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        return hash.substring(1);
      }
    }
    return undefined;
  }, []);

  // Spawn agent via API
  const spawnAgent = React.useCallback(
    async (email?: string) => {
      if (!room?.name) {
        setSpawnError('Room not available');
        return false;
      }

      setIsSpawning(true);
      setSpawnError(null);

      try {
        const passphrase = getPassphrase();
        const response = await fetch('/api/agent/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: room.name,
            email: email || undefined,
            e2eePassphrase: passphrase,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to spawn agent');
        }

        return true;
      } catch (error) {
        console.error('Failed to spawn agent:', error);
        setSpawnError(error instanceof Error ? error.message : 'Failed to start transcription');
        return false;
      } finally {
        setIsSpawning(false);
      }
    },
    [room?.name, getPassphrase],
  );

  // Handle button click
  const handleClick = React.useCallback(() => {
    if (settings.enabled) {
      // Turn off subtitles
      onToggle(false);
    } else {
      // Turning on - check if agent present
      if (hasAgent) {
        onToggle(true);
      } else {
        // Show tooltip to spawn agent
        setShowTooltip(true);
        setSpawnError(null);
      }
    }
  }, [settings.enabled, hasAgent, onToggle]);

  // Handle skip (no email)
  const handleSkip = React.useCallback(async () => {
    const success = await spawnAgent();
    if (success) {
      onToggle(true);
      setShowTooltip(false);
    }
  }, [spawnAgent, onToggle]);

  // Handle subscribe (with email)
  const handleSubscribe = React.useCallback(
    async (email: string) => {
      const success = await spawnAgent(email);
      if (success) {
        onToggle(true);
        setShowTooltip(false);
      }
    },
    [spawnAgent, onToggle],
  );

  // Close tooltip
  const handleCloseTooltip = React.useCallback(() => {
    if (!isSpawning) {
      setShowTooltip(false);
      setSpawnError(null);
    }
  }, [isSpawning]);

  const buttonContent = (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className="lk-button"
        onClick={handleClick}
        aria-pressed={settings.enabled}
        title={settings.enabled ? 'Disable subtitles' : 'Enable subtitles'}
      >
        <SubtitlesIcon enabled={settings.enabled} />
      </button>
      {showTooltip && (
        <SummaryTooltip
          onSkip={handleSkip}
          onSubscribe={handleSubscribe}
          onClose={handleCloseTooltip}
          isLoading={isSpawning}
          error={spawnError}
        />
      )}
    </div>
  );

  // Use portal to inject into control bar
  if (!controlBar) {
    return null;
  }

  return createPortal(buttonContent, controlBar);
}

function SubtitlesIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ opacity: enabled ? 1 : 0.6 }}
    >
      <rect
        x="1"
        y="3"
        width="14"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M4 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 10.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default SubtitlesToggle;
