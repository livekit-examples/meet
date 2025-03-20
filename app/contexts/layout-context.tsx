import { createContext, useContext } from 'react';

type LayoutContextType = {
  // isSettingsOpen: SettingsContextType,
  // isChatOpen: ChatContextType,
  isParticipantsListOpen: ParticipantsListContextType;
};

export const CustomLayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useCustomLayoutContext(): LayoutContextType {
  const customLayoutContext = useContext(CustomLayoutContext);
  if (!customLayoutContext) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.');
  }
  return customLayoutContext;
}

interface CustomLayoutContextProviderProps {
  layoutContextValue: LayoutContextType;
  children: React.ReactNode;
}

export function CustomLayoutContextProvider({
  layoutContextValue,
  children,
}: CustomLayoutContextProviderProps) {
  return (
    <CustomLayoutContext.Provider value={layoutContextValue}>
      {' '}
      {children}{' '}
    </CustomLayoutContext.Provider>
  );
}

export type SettingsAction = {
  msg: 'toggle_settings';
};

export type SettingsContextType = {
  dispatch?: React.Dispatch<SettingsAction>;
  state?: boolean;
};

export type ChatAction = {
  msg: 'toggle_chat';
};

export type ChatContextType = {
  dispatch?: React.Dispatch<ChatAction>;
  state?: boolean;
};

export type ParticipantsListAction = {
  msg: 'toggle_participants_list';
};

export type ParticipantsListContextType = {
  dispatch?: React.Dispatch<ParticipantsListAction>;
  state?: boolean;
};
