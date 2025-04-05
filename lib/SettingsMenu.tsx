'use client';
import * as React from 'react';
import { LocalAudioTrack, Track } from 'livekit-client';
import {
  useMaybeLayoutContext,
  useLocalParticipant,
  MediaDeviceMenu,
  TrackToggle,
  useRoomContext,
} from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';

/**
 * @alpha
 */
export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  showSettings: boolean;
}

/**
 * @alpha
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();

  const settings = React.useMemo(() => {
    return {
      media: { camera: true, microphone: true, label: 'Media Devices', speaker: true },
      effects: { label: 'Effects' },
    };
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings).filter((t) => t !== undefined) as Array<keyof typeof settings>,
    [settings],
  );
  const { microphoneTrack } = useLocalParticipant();

  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = React.useState(true);
  const [isNoiseFilterPending, setIsNoiseFilterPending] = React.useState(false);

  React.useEffect(() => {
    const micPublication = microphoneTrack;
    if (micPublication && micPublication.track instanceof LocalAudioTrack) {
      const currentProcessor = micPublication.track.getProcessor();
      if (currentProcessor && currentProcessor.name === 'livekit-noise-filter') {
        setIsNoiseFilterPending(true);
        (currentProcessor as KrispNoiseFilterProcessor)
          .setEnabled(isNoiseFilterEnabled)
          .finally(() => setIsNoiseFilterPending(false));
      } else if (!currentProcessor && isNoiseFilterEnabled) {
        setIsNoiseFilterPending(true);
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
          .catch((e) => console.error('Failed to load noise filter', e))
          .finally(() => setIsNoiseFilterPending(false));
      }
    }
  }, [isNoiseFilterEnabled, microphoneTrack]);

  if (!props.showSettings) return null;

  return (
    <div className="settings-menu" {...props}>
      <div className="tabs">
        {tabs.map(
          (tab) =>
            settings[tab] && (
              <button
                className={`tab lk-button`}
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
      <div className="tab-content" style={{ padding: '1rem' }}>
        {activeTab === 'media' && (
          <>
            {settings.media && settings.media.camera && (
              <div>
                <h3>Camera</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="videoinput" />
                  </div>
                </section>
              </div>
            )}
            {settings.media && settings.media.microphone && (
              <div>
                <h3>Microphone</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Microphone}>Microphone</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audioinput" />
                  </div>
                </section>
              </div>
            )}
            {settings.media && settings.media.speaker && (
              <div>
                <h3>Speaker & Headphones</h3>
                <section className="lk-button-group">
                  <span className="lk-button">Audio Output</span>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audiooutput"></MediaDeviceMenu>
                  </div>
                </section>
              </div>
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
                disabled={isNoiseFilterPending}
              ></input>
            </section>
          </>
        )}
      </div>
      <button
        className={`lk-button settingsCloseButton`}
        onClick={() => layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' })}
      >
        Close
      </button>
    </div>
  );
}
