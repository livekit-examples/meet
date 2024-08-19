import { VideoConferenceClientImpl } from './VideoConferenceClientImpl';

export default function CustomRoomConnection(props: {
  searchParams: {
    liveKitUrl?: string;
    token?: string;
    codec?: string;
  };
}) {
  const { liveKitUrl, token, codec } = props.searchParams;
  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }
  if (
    !(
      codec === 'vp8' ||
      codec === 'vp9' ||
      codec === 'h264' ||
      codec === 'av1' ||
      codec === undefined
    )
  ) {
    return <h2>Invalid codec, if defined it has to be 'vp8', 'vp9', 'h264' or 'av1'.</h2>;
  }

  return (
    <main data-lk-theme="default">
      <VideoConferenceClientImpl liveKitUrl={liveKitUrl} token={token} codec={codec} />
    </main>
  );
}
