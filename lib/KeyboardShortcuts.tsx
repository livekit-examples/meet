import React from 'react';
import { Track } from 'livekit-client';
import { useTrackToggle } from '@livekit/components-react';
import { useSettingsState } from './SettingsContext';
import { KeyCommand } from './types';

export function KeyboardShortcuts() {
  const { state } = useSettingsState() ?? {};
  const { toggle: toggleMic, enabled: micEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  const { toggle: toggleCamera } = useTrackToggle({ source: Track.Source.Camera });
  const [pttHeld, setPttHeld] = React.useState(false);

  React.useEffect(() => {
    const handlers = Object.entries(state.keybindings)
      .flatMap(([command, bind]) => {
        switch (command) {
          case KeyCommand.PTT:
            if (!state.enablePTT || !Array.isArray(bind)) return [];

            const [enable, disable] = bind;
            const t = getEventTarget(enable.target);
            if (!t) return null;

            const on = (event: KeyboardEvent) => {
              if (enable.discriminator(event)) {
                event.preventDefault();
                if (!micEnabled) {
                  setPttHeld(true);
                  toggleMic?.(true);
                }
              }
            };

            const off = (event: KeyboardEvent) => {
              if (disable.discriminator(event)) {
                event.preventDefault();
                if (pttHeld && micEnabled) {
                  setPttHeld(false);
                  toggleMic?.(false);
                }
              }
            };

            t.addEventListener(enable.eventName, on as any);
            t.addEventListener(disable.eventName, off as any);
            return [
              { eventName: enable.eventName, target: t, handler: on },
              { eventName: disable.eventName, target: t, handler: off },
            ];
          case KeyCommand.ToggleMic:
            if (!Array.isArray(bind)) {
              const t = getEventTarget(bind.target);
              if (!t) return null;

              const handler = (event: KeyboardEvent) => {
                if (bind.discriminator(event)) {
                  event.preventDefault();
                  toggleMic?.();
                }
              };
              t.addEventListener(bind.eventName, handler as any);
              return { eventName: bind.eventName, target: t, handler };
            }
          case KeyCommand.ToggleCamera:
            if (!Array.isArray(bind)) {
              const t = getEventTarget(bind.target);
              if (!t) return null;

              const handler = (event: KeyboardEvent) => {
                if (bind.discriminator(event)) {
                  event.preventDefault();
                  toggleCamera?.();
                }
              };
              t.addEventListener(bind.eventName, handler as any);
              return { eventName: bind.eventName, target: t, handler };
            }
          default:
            return [];
        }
      })
      .filter(Boolean) as Array<{
      target: EventTarget;
      eventName: string;
      handler: (event: KeyboardEvent) => void;
    }>;

    return () => {
      handlers.forEach(({ target, eventName, handler }) => {
        target.removeEventListener(eventName, handler as any);
      });
    };
  }, [state, pttHeld, micEnabled, toggleMic]);

  return null;
}

function getEventTarget(
  target: Window | Document | HTMLElement | string = window,
): EventTarget | null {
  const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
  if (!targetElement) {
    console.warn(`Target element not found for ${target}`);
    return null;
  }
  return targetElement;
}
