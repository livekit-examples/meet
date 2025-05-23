import { type KeyBinding, KeyBindings, KeyCommand } from './types';

export function isControlElement(event: Event) {
  return (
    event.target instanceof HTMLButtonElement ||
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLLabelElement ||
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLOptionElement ||
    event.target instanceof HTMLTextAreaElement ||
    (event.target instanceof HTMLElement && event.target.isContentEditable)
  );
}

export function isMouseButton(value: number, event: Event) {
  return event instanceof MouseEvent && event.button === value;
}

export const commonKeyBindings: Record<
  string,
  KeyBinding | [enable: KeyBinding, disable: KeyBinding]
> = {
  spacebar: [
    {
      eventName: 'keydown',
      discriminator: (event) => {
        return event.code === 'Space' && !isControlElement(event);
      },
    },
    {
      eventName: 'keyup',
      discriminator: (event) => event.code === 'Space',
    },
  ],
  leftMouse: [
    {
      eventName: 'mousedown',
      discriminator: (event) => {
        return isMouseButton(0, event) && !isControlElement(event);
      },
    },
    {
      eventName: 'mouseup',
      discriminator: (event) => isMouseButton(0, event),
    },
  ],
  middleMouse: [
    {
      eventName: 'mousedown',
      discriminator: (event) => isMouseButton(1, event),
    },
    {
      eventName: 'mouseup',
      discriminator: (event) => isMouseButton(1, event),
    },
  ],
  metaShiftA: {
    eventName: 'keydown',
    discriminator: (event) => event.key === 'A' && (event.ctrlKey || event.metaKey),
  },
  metaShiftV: {
    eventName: 'keydown',
    discriminator: (event) => event.key === 'V' && (event.ctrlKey || event.metaKey),
  },
} as const;

export const defaultKeyBindings: KeyBindings = {
  [KeyCommand.PTT]: commonKeyBindings.spacebar,
  [KeyCommand.ToggleMic]: commonKeyBindings.metaShiftA,
  [KeyCommand.ToggleCamera]: commonKeyBindings.metaShiftV,
};

export const keybindingOptions: Partial<
  Record<
    KeyCommand,
    { label: string; binds: KeyBinding | [enable: KeyBinding, disable: KeyBinding] }[]
  >
> = {
  [KeyCommand.PTT]: [
    {
      label: 'Spacebar',
      binds: commonKeyBindings.spacebar,
    },
    {
      label: 'Left Mouse Button',
      binds: commonKeyBindings.leftMouse,
    },
    {
      label: 'Middle Mouse Button',
      binds: commonKeyBindings.middleMouse,
    },
  ],
};
