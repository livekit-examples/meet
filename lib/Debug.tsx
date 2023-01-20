import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { setLogLevel, LogLevel } from 'livekit-client';

export const useDebugMode = ({ logLevel }: { logLevel?: LogLevel }) => {
  setLogLevel(logLevel ?? 'debug');
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

export const DebugMode = ({ logLevel }: { logLevel?: LogLevel }) => {
  useDebugMode({ logLevel });
  return <></>;
};
