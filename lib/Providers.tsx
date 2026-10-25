'use client';

import { Toaster } from 'react-hot-toast';
import { SettingsStateProvider } from './SettingsContext';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <SettingsStateProvider>
      <Toaster />
      {children}
    </SettingsStateProvider>
  );
}
