import React from 'react';
import { Track } from 'livekit-client';
import { useLocalParticipant, useTrackToggle } from '@livekit/components-react';
import { useSettingsState } from './SettingsContext';
import { KeyCommand } from './types';

export function KeyboardShortcuts() {
  const { state } = useSettingsState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const { toggle: toggleMic, pending: pendingMicChange } = useTrackToggle({ source: Track.Source.Microphone });
  const { toggle: toggleCamera, pending: pendingCameraChange } = useTrackToggle({ source: Track.Source.Camera });

  const pttHeldRef = React.useRef(false);

  React.useEffect(() => {
    const handlers = Object.entries(state.keybindings)
      .flatMap(([command, binding]) => {
        switch (command) {
          case KeyCommand.PTT:
            if (!state.enablePTT || !Array.isArray(binding)) return [];

            const [enable, disable] = binding;
            const t = getEventTarget(enable.target);
            if (!t) return null;

            const on = async (event: KeyboardEvent) => {
              if (enable.guard(event)) {
                event.preventDefault();
                if (!isMicrophoneEnabled) {
                  pttHeldRef.current = true;
                  localParticipant?.setMicrophoneEnabled(true);
                }
              }
            };

            const off = async (event: KeyboardEvent) => {
              if (disable.guard(event)) {
                event.preventDefault();
                if (pttHeldRef.current && isMicrophoneEnabled) {
                  pttHeldRef.current = false;
                  localParticipant?.setMicrophoneEnabled(false);
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
            if (!Array.isArray(binding)) {
              const t = getEventTarget(binding.target);
              if (!t) return null;

              const handler = async (event: KeyboardEvent) => {
                if (binding.guard(event) && !pendingMicChange) {
                  event.preventDefault();
                  toggleMic?.().catch(console.error);
                }
              };
              t.addEventListener(binding.eventName, handler as any);
              return { eventName: binding.eventName, target: t, handler };
            }
          case KeyCommand.ToggleCamera:
            if (!Array.isArray(binding)) {
              const t = getEventTarget(binding.target);
              if (!t) return null;

              const handler = async (event: KeyboardEvent) => {
                if (binding.guard(event) && !pendingCameraChange) {
                  event.preventDefault();
                  toggleCamera?.().catch(console.error);
                }
              };
              t.addEventListener(binding.eventName, handler as any);
              return { eventName: binding.eventName, target: t, handler };
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
  }, [state, toggleCamera, pendingCameraChange, toggleMic, pendingMicChange, localParticipant, isMicrophoneEnabled]);

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
