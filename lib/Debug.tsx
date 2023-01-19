import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { setLogLevel } from 'livekit-client';

export const useDebugMode = () => {
  setLogLevel('debug');
  const room = useRoomContext();
  React.useEffect(() => {
    // @ts-expect-error
    window.__lk_room = room;

    return () => {
      // @ts-expect-error
      window.__lk_room = undefined;
    };
  });
};

export const DebugMode = () => {
  useDebugMode();
  return <></>;
};
