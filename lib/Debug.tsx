import * as React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { setLogLevel, LogLevel, RemoteTrackPublication } from 'livekit-client';
import { tinykeys } from 'tinykeys';

export const useDebugMode = ({ logLevel }: { logLevel?: LogLevel }) => {
  setLogLevel(logLevel ?? 'debug');
  const room = useRoomContext();

  React.useEffect(() => {
    // @ts-expect-error
    window.__lk_room = room;

    return () => {
      // @ts-expect-error
      window.__lk_room = undefined;
    };
  }, []);
};

export const DebugMode = ({ logLevel }: { logLevel?: LogLevel }) => {
  const room = useRoomContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const [, setRender] = React.useState({});

  useDebugMode({ logLevel });

  React.useEffect(() => {
    if (window) {
      const unsubscribe = tinykeys(window, {
        'Shift+D': () => {
          console.log('setting open');
          setIsOpen((open) => !open);
        },
      });

      // timer to re-render
      const interval = setInterval(() => {
        setRender({});
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  if (typeof window === 'undefined' || !isOpen) {
    return null;
  }

  const handleSimulate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (value == '') {
      return;
    }
    event.target.value = '';
    let isReconnect = false;
    switch (value) {
      case 'signal-reconnect':
        isReconnect = true;

      // fall through
      default:
        // @ts-expect-error
        room.simulateScenario(value);
    }
  };

  const lp = room.localParticipant;

  if (!isOpen) {
    return <></>;
  } else {
    return (
      <div
        style={{ position: 'absolute', top: '0', background: 'rgba(0,0,0,0.6)', padding: '1rem' }}
      >
        <details open>
          <summary>
            <b>Published tracks</b>
          </summary>
          <div style={{ paddingLeft: '1rem' }}>
            {Array.from(lp.tracks.values()).map((t) => (
              <>
                <div>
                  <p>
                    {t.source.toString()}
                    &nbsp;<span>{t.trackSid}</span>
                  </p>
                </div>
                <table>
                  <tbody>
                    <tr>
                      <td>Kind</td>
                      <td>
                        {t.kind}&nbsp;
                        {t.kind === 'video' && (
                          <span>
                            {t.track?.dimensions?.width}x{t.track?.dimensions?.height}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Bitrate</td>
                      <td>{Math.ceil(t.track!.currentBitrate / 1000)} kbps</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ))}
          </div>
        </details>
        <details>
          <summary>
            <b>Remote Participants</b>
          </summary>
          {Array.from(room.participants.values()).map((p) => (
            <details key={p.sid} style={{ paddingLeft: '1rem' }}>
              <summary>
                <b>
                  {p.identity}
                  <span></span>
                </b>
              </summary>
              <div style={{ paddingLeft: '1rem' }}>
                {Array.from(p.tracks.values()).map((t) => (
                  <>
                    <div>
                      <span>
                        {t.source.toString()}
                        &nbsp;<span>{t.trackSid}</span>
                      </span>
                    </div>
                    <table>
                      <tbody>
                        <tr>
                          <td>Kind</td>
                          <td>
                            {t.kind}&nbsp;
                            {t.kind === 'video' && (
                              <span>
                                {t.dimensions?.width}x{t.dimensions?.height}
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td>Status</td>
                          <td>{trackStatus(t)}</td>
                        </tr>
                        {t.track && (
                          <tr>
                            <td>Bitrate</td>
                            <td>{Math.ceil(t.track.currentBitrate / 1000)} kbps</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                ))}
              </div>
            </details>
          ))}
        </details>
      </div>
    );
  }
};

function trackStatus(t: RemoteTrackPublication): string {
  if (t.isSubscribed) {
    return t.isEnabled ? 'enabled' : 'disabled';
  } else {
    return 'unsubscribed';
  }
}
