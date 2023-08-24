import { formatChatMessageLinks, LiveKitRoom, VideoConference } from '@livekit/components-react';
import { ExternalE2EEKeyProvider, LogLevel, Room, RoomOptions, VideoPresets } from 'livekit-client';
import { useRouter } from 'next/router';
import { DebugMode } from '../../lib/Debug';
import { decodePassphrase } from '../../lib/client-utils';
import { useMemo } from 'react';

export default function CustomRoomConnection() {
  const router = useRouter();
  const { liveKitUrl, token } = router.query;

  const hash = window && window.location.hash;
  const keyProvider = new ExternalE2EEKeyProvider();
  keyProvider.setKey(decodePassphrase(hash.substring(1)));

  const worker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: hash
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, []);

  const room = useMemo(() => new Room(roomOptions), []);

  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }

  return (
    <main data-lk-theme="default">
      {liveKitUrl && (
        <LiveKitRoom room={room} token={token} serverUrl={liveKitUrl} audio={true} video={true}>
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
          <DebugMode logLevel={LogLevel.info} />
        </LiveKitRoom>
      )}
    </main>
  );
}
