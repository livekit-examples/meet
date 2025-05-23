'use client';

import React, { createContext, SetStateAction, useCallback, useContext, useMemo } from 'react';
import type {
  SettingsState,
  SettingsStateContextType,
  SerializedSettingsState,
  KeyBindings,
  KeyCommand,
} from './types';
import { defaultKeyBindings, commonKeyBindings } from './keybindings';
import { usePersistToLocalStorage } from './persistence';

const AUXILIARY_USER_CHOICES_KEY = `lk-auxiliary-user-choices`;

const initialState: SettingsState = {
  keybindings: defaultKeyBindings,
  enablePTT: false,
};

function serializeSettingsState(state: SettingsState): SerializedSettingsState {
  return {
    ...state,
    keybindings: Object.entries(state.keybindings).reduce(
      (acc, [key, value]) => {
        const commonName = Object.entries(commonKeyBindings).find(([_, v]) => v === value)?.[0];
        if (commonName) {
          acc[key] = commonName;
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  };
}

function deserializeSettingsState(state: SerializedSettingsState): SettingsState {
  return {
    ...state,
    keybindings: {
      ...defaultKeyBindings,
      ...Object.entries(state.keybindings).reduce((acc, [key, commonName]) => {
        const commonBinding = commonKeyBindings[commonName as keyof typeof commonKeyBindings];
        if (commonBinding) {
          acc[key as keyof typeof defaultKeyBindings] = commonBinding;
        }
        return acc;
      }, {} as KeyBindings),
    },
  };
}

const SettingsStateContext = createContext<SettingsStateContextType>({
  state: initialState,
  set: () => {},
});

const SettingsStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, set] = usePersistToLocalStorage<SerializedSettingsState>(
    AUXILIARY_USER_CHOICES_KEY,
    serializeSettingsState(initialState),
  );

  const deserializedState = useMemo(() => deserializeSettingsState(state), [state]);

  console.info({ deserializedState });

  const setSettingsState = useCallback(
    (dispatch: SetStateAction<SettingsState>) => {
      if (typeof dispatch === 'function') {
        set((prev) => {
          const next = serializeSettingsState(dispatch(deserializeSettingsState(prev)));
          return next;
        });
      } else {
        set(serializeSettingsState(dispatch));
      }
    },
    [set],
  );

  return (
    <SettingsStateContext.Provider value={{ state: deserializedState, set: setSettingsState }}>
      {children}
    </SettingsStateContext.Provider>
  );
};

const useSettingsState = () => {
  const ctx = useContext(SettingsStateContext);
  if (ctx === null) {
    throw new Error('useSettingsState must be used within SettingsStateProvider');
  }
  return ctx!;
};

export { useSettingsState, SettingsStateProvider, SettingsStateContext };
