import { GridLayout } from '@livekit/components-react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };

  return (
    <>
      <main>
        <div className="header">
          <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" width="480" height="60" />
          <h2>
            Open source video conferencing app built on LiveKit&nbsp;Components, LiveKit&nbsp;Cloud,
            and Next.js.
          </h2>
        </div>
        <button style={{ fontSize: '1.25rem', paddingInline: '1.25rem' }} className="lk-button" onClick={startMeeting}>
          Start Meeting
        </button>
      </main>
      <footer>
        Hosted on{' '}
        <a href="https://livekit.io/cloud?ref=meet" target="_blank" rel="noreferrer">
          LiveKit Cloud
        </a>
        . Source code on{' '}
        <a
          href="https://github.com/livekit/components-js?ref=meet"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
      </footer>
    </>
  );
};

export default Home;

function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}

function randomString(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
