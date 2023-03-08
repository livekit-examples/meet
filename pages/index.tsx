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
        className="lk-button"
        onClick={() => setActiveIndex(index)}
        aria-pressed={activeIndex === index}
      >
        {child?.props.label}
      </button>
    );
  });
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
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
    <div className={styles.tabContent}>
      <div className="lk-form-control" style={{ width: '100%' }}>
        <center>
          <button
            style={{ fontSize: '1.25rem', paddingInline: '1.25rem', margin: '2rem 0' }}
            className="lk-button"
            onClick={startMeeting}
          >
            Start Meeting
          </button>
        </center>
      </div>
    </div>
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
    <div className={styles.tabContent}>
      <div className="lk-form-control" style={{ width: '100%' }}>
        {/* <label>LiveKit URL</label> */}
        <div className={styles.userInputs}>
          <input
            type="url"
            placeholder="URL"
            onChange={(ev) => setLiveKitUrl(ev.target.value)}
          ></input>
          {/* <label>Token</label> */}
          <input
            type="text"
            placeholder="Token"
            onChange={(ev) => setToken(ev.target.value)}
          ></input>
        </div>
        <button
          style={{
            fontSize: '1.25rem',
            paddingInline: '1.25rem',
            width: '100%',
            marginTop: '0.5rem',
          }}
          className="lk-button"
          onClick={join}
        >
          Connect
        </button>
      </div>
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
      <footer data-lk-theme="default" style={{ fontFamily: 'var(--lk-font-family)' }}>
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
