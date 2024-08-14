import { VideoConferenceClientImpl } from './VideoConferenceClientImpl';

interface SearchParams {
  liveKitUrl?: string;
  token?: string;
  codec?: string;
}

export default function CustomRoomConnection(props: { searchParams: SearchParams }) {
  const { liveKitUrl, token, codec } = props.searchParams;

  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }

  return (
    <main data-lk-theme="default">
      <VideoConferenceClientImpl liveKitUrl={liveKitUrl} token={token} codec={codec} />
    </main>
  );
}
