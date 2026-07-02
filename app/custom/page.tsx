import { videoCodecs } from 'livekit-client';
import { VideoConferenceClientImpl } from './VideoConferenceClientImpl';
import { isVideoCodec } from '@/lib/types';

export default async function CustomRoomConnection(props: {
  searchParams: Promise<{
    liveKitUrl?: string;
    token?: string;
    codec?: string;
    singlePC?: string;
  }>;
}) {
  const { liveKitUrl, token, codec, singlePC } = await props.searchParams;
  if (typeof liveKitUrl !== 'string') {
    return <h2>缺少 LiveKit 服务器地址</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>缺少 LiveKit 访问令牌</h2>;
  }
  if (codec !== undefined && !isVideoCodec(codec)) {
    return <h2>无效的编解码器，可选值为 [{videoCodecs.join(', ')}]。</h2>;
  }

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      <VideoConferenceClientImpl
        liveKitUrl={liveKitUrl}
        token={token}
        codec={codec}
        singlePeerConnection={singlePC === 'true'}
      />
    </main>
  );
}
