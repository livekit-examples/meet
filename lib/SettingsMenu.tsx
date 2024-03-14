'use client';
import * as React from 'react';
import { LocalAudioTrack, Track } from 'livekit-client';
import {
  useMaybeLayoutContext,
  useLocalParticipant,
  MediaDeviceMenu,
  TrackToggle,
} from '@livekit/components-react';
import styles from '../styles/SettingsMenu.module.css';

/**
 * @alpha
 */
export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * @alpha
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();

  const settings = React.useMemo(() => {
    return {
      media: { camera: true, microphone: true, label: 'Media Devices', speaker: false },
      effects: { label: 'Effects' },
    };
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings) as Array<keyof typeof settings>,
    [settings],
  );
  const { microphoneTrack } = useLocalParticipant();

  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = React.useState(true);

  React.useEffect(() => {
    const micPublication = microphoneTrack;
    if (micPublication && micPublication.track instanceof LocalAudioTrack) {
      const currentProcessor = micPublication.track.getProcessor();
      if (currentProcessor && !isNoiseFilterEnabled) {
        micPublication.track.stopProcessor();
      } else if (!currentProcessor && isNoiseFilterEnabled) {
        import('@livekit/krisp-noise-filter')
          .then(({ KrispNoiseFilter, isKrispNoiseFilterSupported }) => {
            if (!isKrispNoiseFilterSupported()) {
              console.error('Enhanced noise filter is not supported for this browser');
              setIsNoiseFilterEnabled(false);
              return;
            }
            micPublication?.track
              // @ts-ignore
              ?.setProcessor(KrispNoiseFilter())
              .then(() => console.log('successfully set noise filter'));
          })
          .catch((e) => console.error('Failed to load noise filter', e));
      }
    }
  }, [isNoiseFilterEnabled, microphoneTrack]);

  return (
    <div className="settings-menu" style={{ width: '100%' }} {...props}>
      <div className={styles.tabs}>
        {tabs.map(
          (tab) =>
            settings[tab] && (
              <button
                className={`${styles.tab} lk-button`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={tab === activeTab}
              >
                {
                  // @ts-ignore
                  settings[tab].label
                }
              </button>
            ),
        )}
      </div>
      <div className="tab-content">
        {activeTab === 'media' && (
          <>
            {settings.media && settings.media.camera && (
              <>
                <h3>Camera</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="videoinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media && settings.media.microphone && (
              <>
                <h3>Microphone</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Microphone}>Microphone</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audioinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media && settings.media.speaker && (
              <>
                <h3>Speaker & Headphones</h3>
                <section>
                  <MediaDeviceMenu kind="audiooutput"></MediaDeviceMenu>
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'effects' && (
          <>
            <h3>Audio</h3>
            <section>
              <label htmlFor="noise-filter"> Enhanced Noise Cancellation</label>
              <input
                type="checkbox"
                id="noise-filter"
                onChange={(ev) => setIsNoiseFilterEnabled(ev.target.checked)}
                checked={isNoiseFilterEnabled}
              ></input>
            </section>
          </>
        )}
      </div>
      <button
        className={`lk-button ${styles.settingsCloseButton}`}
        onClick={() => layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' })}
      >
        Close
      </button>
    </div>
  );
}
