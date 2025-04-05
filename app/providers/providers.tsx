import React from 'react';
import { Toaster } from '../custom/toast/toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster />
      {children}
    </>
  );
}
