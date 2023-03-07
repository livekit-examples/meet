import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import styles from '../styles/Home.module.css';

function Tabs(props: { children: ReactElement[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!props.children) {
    return <></>;
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        onClick={() => setActiveIndex(index)}
        className={activeIndex === index ? 'lk-button tab-button active' : 'lk-button tab-button'}
      >
        {child?.props.label}
      </button>
    );
  });
  return (
    <div>
      <div>{tabs}</div>
      {props.children[activeIndex]}
    </div>
  );
}

function DemoMeetingTab({ label }: { label: string }) {
  const router = useRouter();
  const startMeeting = () => {
    router.push(`/rooms/${generateRoomId()}`);
  };
  return (
    <button
      style={{ fontSize: '1.25rem', paddingInline: '1.25rem' }}
      className="lk-button"
      onClick={startMeeting}
    >
      Start Meeting
    </button>
  );
}

function CustomConnectionTab({ label }: { label: string }) {
  const [liveKitUrl, setLiveKitUrl] = useState<string | undefined>();
  const [token, setToken] = useState<string | undefined>();

  const router = useRouter();
  const join = () => {
    router.push(`/custom/?liveKitUrl=${liveKitUrl}&token=${token}`);
  };
  return (
    <div>
      <label>
        LiveKit URL
        <input type="url" onChange={(ev) => setLiveKitUrl(ev.target.value)}></input>
      </label>
      <label>
        Token
        <input type="text" onChange={(ev) => setToken(ev.target.value)}></input>
      </label>
      <button
        style={{ fontSize: '1.25rem', paddingInline: '1.25rem' }}
        className="lk-button"
        onClick={join}
      >
        Connect
      </button>
    </div>
  );
}

const Home: NextPage = () => {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" width="480" height="60" />
          <h2>
            Open source video conferencing app built on LiveKit&nbsp;Components, LiveKit&nbsp;Cloud,
            and Next.js.
          </h2>
        </div>
        <Tabs>
          <DemoMeetingTab label="Demo" />
          <CustomConnectionTab label="Custom" />
        </Tabs>
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
