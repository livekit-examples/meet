'use client';

import { useRouter } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import styles from '../../styles/Home.module.css';

function DualRoomSetupContent() {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const [primaryRoomName, setPrimaryRoomName] = useState('');
  const [secondaryRoomName, setSecondaryRoomName] = useState('');

  const startDualRoomMeeting = () => {
    const primary = primaryRoomName || generateRoomId();
    const secondary = secondaryRoomName || generateRoomId();

    if (e2ee) {
      router.push(
        `/dual-rooms/session?primary=${primary}&secondary=${secondary}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/dual-rooms/session?primary=${primary}&secondary=${secondary}`);
    }
  };

  return (
    <main className={styles.main} data-lk-theme="default">
      <div className="header">
        <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" width="360" height="45" />
        <h2>Dual Room Video Conference</h2>
        <p style={{ margin: '1rem 0', maxWidth: '600px' }}>
          Connect to two rooms simultaneously - perfect for monitoring multiple sessions or watching
          screen shares from a separate room.
        </p>
      </div>
      <div className={styles.tabContainer}>
        <div className={styles.tabContent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="primaryRoom">
                <strong>Primary Room</strong> (with full controls)
              </label>
              <input
                id="primaryRoom"
                type="text"
                placeholder="Leave empty for random room name"
                value={primaryRoomName}
                onChange={(ev) => setPrimaryRoomName(ev.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="secondaryRoom">
                <strong>Secondary Room</strong> (view-only, presentation mode)
              </label>
              <input
                id="secondaryRoom"
                type="text"
                placeholder="Leave empty for random room name"
                value={secondaryRoomName}
                onChange={(ev) => setSecondaryRoomName(ev.target.value)}
              />
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                Audio muted by default. Camera/mic can be enabled on hover.
              </small>
            </div>
          </div>

          <button
            style={{ marginTop: '1rem', width: '100%' }}
            className="lk-button"
            onClick={startDualRoomMeeting}
          >
            Start Dual Room Session
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
              <input
                id="use-e2ee"
                type="checkbox"
                checked={e2ee}
                onChange={(ev) => setE2ee(ev.target.checked)}
              />
              <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
            </div>
            {e2ee && (
              <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                <label htmlFor="passphrase">Passphrase</label>
                <input
                  id="passphrase"
                  type="password"
                  value={sharedPassphrase}
                  onChange={(ev) => setSharedPassphrase(ev.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <footer data-lk-theme="default">
        <Link href="/" style={{ marginRight: '1rem' }}>
          Back to Home
        </Link>
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
    </main>
  );
}

export default function DualRoomSetupPage() {
  return (
    <Suspense fallback="Loading">
      <DualRoomSetupContent />
    </Suspense>
  );
}
