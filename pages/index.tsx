import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import styles from '../styles/Home.module.css';

interface TabsProps {
  children: ReactElement[];
  selectedIndex?: number;
  onTabSelected?: (index: number) => void;
}

function Tabs(props: TabsProps) {
  const activeIndex = props.selectedIndex ?? 0;
  if (!props.children) {
    return <></>;
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (props.onTabSelected) props.onTabSelected(index);
        }}
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
      <p style={{ marginTop: 0 }}>Try LiveKit Meet for free with our live demo project.</p>
      <button className="lk-button" onClick={startMeeting}>
        Start Meeting
      </button>
    </div>
  );
}

function CustomConnectionTab({ label }: { label: string }) {
  const router = useRouter();
  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
  };
  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p style={{ marginTop: 0 }}>
        Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
      </p>
      <input
        id="serverUrl"
        name="serverUrl"
        type="url"
        placeholder="LiveKit Server URL: wss://*.livekit.cloud"
        required
      />
      <textarea
        id="token"
        name="token"
        placeholder="Token"
        required
        rows={9}
        style={{ padding: '1px 2px', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

export const getServerSideProps: GetServerSideProps<{ tabIndex: number }> = async ({
  query,
  res,
}) => {
  res.setHeader('Cache-Control', 'public, max-age=7200');
  const tabIndex = query.tab === 'custom' ? 1 : 0;
  return { props: { tabIndex } };
};

const Home = ({ tabIndex }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push({ query: { tab } });
  }
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" width="360" height="45" />
          <h2>
            Open source video conferencing app built on{' '}
            <a href="https://github.com/livekit/components-js?ref=meet" rel="noopener">
              LiveKit&nbsp;Components
            </a>
            ,{' '}
            <a href="https://livekit.io/cloud?ref=meet" rel="noopener">
              LiveKit&nbsp;Cloud
            </a>{' '}
            and Next.js.
          </h2>
        </div>
        <Tabs selectedIndex={tabIndex} onTabSelected={onTabSelected}>
          <DemoMeetingTab label="Demo" />
          <CustomConnectionTab label="Custom" />
        </Tabs>
      </main>
      <footer data-lk-theme="default">
        Hosted on{' '}
        <a href="https://livekit.io/cloud?ref=meet" rel="noopener">
          LiveKit Cloud
        </a>
        . Source code on{' '}
        <a href="https://github.com/livekit/meet?ref=meet" rel="noopener">
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
