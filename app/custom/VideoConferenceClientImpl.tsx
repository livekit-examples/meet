'use client';

import { formatChatMessageLinks, RoomContext } from '@livekit/components-react';
import { CustomVideoConference } from '@/lib/CustomVideoConference';
import { LogLevel, Room, RoomConnectOptions, type VideoCodec } from 'livekit-client';
import { DebugMode } from '@/lib/Debug';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerformanceOptimiser';
import { useWakeLock } from '@/lib/useWakeLock';
import { usePushToTalk } from '@/lib/usePushToTalk';
import { PushToTalkIndicator } from '@/lib/PushToTalkIndicator';
import { buildCustomRoomOptions } from '@/lib/roomOptions';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
  singlePeerConnection: boolean | undefined;
}) {
  const { worker, e2eePassphrase, keyProvider, e2eeEnabled } = useSetupE2EE();

  const [e2eeSetupComplete, setE2eeSetupComplete] = useState(false);

  const roomOptions = useMemo(() => {
    return buildCustomRoomOptions({
      codec: props.codec,
      e2eeEnabled,
      keyProvider,
      singlePeerConnection: props.singlePeerConnection,
      worker,
    });
  }, [e2eeEnabled, props.codec, props.singlePeerConnection, keyProvider, worker]);

  const room = useMemo(() => new Room(roomOptions), [roomOptions]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  useEffect(() => {
    if (e2eeEnabled && e2eePassphrase) {
      keyProvider.setKey(e2eePassphrase).then(() => {
        room.setE2EEEnabled(true).then(() => {
          setE2eeSetupComplete(true);
        });
      });
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, e2eePassphrase, keyProvider, room, setE2eeSetupComplete]);

  useEffect(() => {
    if (e2eeSetupComplete) {
      room.connect(props.liveKitUrl, props.token, connectOptions).catch((error) => {
        console.error(error);
      });
      room.localParticipant.enableCameraAndMicrophone().catch((error) => {
        console.error(error);
      });
    }
  }, [room, props.liveKitUrl, props.token, connectOptions, e2eeSetupComplete]);

  useLowCPUOptimizer(room);

  useWakeLock();
  const pushToTalk = usePushToTalk(room);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <PushToTalkIndicator {...pushToTalk} />
        <CustomVideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={
            process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
          }
        />
        <DebugMode logLevel={LogLevel.debug} />
      </RoomContext.Provider>
    </div>
  );
}
