'use client';

import * as React from 'react';
import { useRemoteParticipants, useTracks } from '@livekit/components-react';
import { Participant, RemoteParticipant, Track } from 'livekit-client';

import { TRANSLATION_LANGUAGES } from '@/lib/realtime-translation-config';
import { useRemoteTranslation, type TranslationStatus } from '@/lib/useRemoteTranslation';
import styles from '@/styles/TranslationOverlay.module.css';

const DUCKED_ORIGINAL_VOLUME = 0.15;

type ParticipantCaptionState = {
  participantId: string;
  participantName: string;
  translatedSubtitle: string;
  sourceSubtitle: string;
  updatedAt: number;
  status: TranslationStatus;
  error: string | null;
};

function getParticipantLabel(participant: Participant) {
  return participant.name || participant.identity || 'Participant';
}

function getAudioMediaStreamTrack(participant: Participant): MediaStreamTrack | null {
  const audioTrack = participant.getTrackPublication(Track.Source.Microphone)?.audioTrack;
  if (!audioTrack || typeof audioTrack !== 'object') {
    return null;
  }

  const mediaStreamTrack = (audioTrack as { mediaStreamTrack?: unknown }).mediaStreamTrack;
  return mediaStreamTrack instanceof MediaStreamTrack ? mediaStreamTrack : null;
}

function RemoteTranslationSidecar({
  participant,
  enabled,
  language,
  sourceTranscriptionEnabled,
  noiseReductionEnabled,
  translatedVolume,
  onUpdate,
  onRemove,
}: {
  participant: RemoteParticipant;
  enabled: boolean;
  language: string;
  sourceTranscriptionEnabled: boolean;
  noiseReductionEnabled: boolean;
  translatedVolume: number;
  onUpdate: (state: ParticipantCaptionState) => void;
  onRemove: (participantId: string) => void;
}) {
  const sourceTrack = getAudioMediaStreamTrack(participant);
  const translation = useRemoteTranslation({
    enabled: enabled && Boolean(sourceTrack),
    sourceTrack,
    language,
    sourceTranscriptionEnabled,
    noiseReductionEnabled,
    translatedVolume,
  });

  const participantId = participant.identity;
  const participantName = getParticipantLabel(participant);

  React.useEffect(() => {
    onUpdate({
      participantId,
      participantName,
      translatedSubtitle: translation.translatedSubtitle,
      sourceSubtitle: translation.sourceSubtitle,
      updatedAt: Date.now(),
      status: sourceTrack ? translation.status : 'idle',
      error: sourceTrack ? translation.error : null,
    });
  }, [
    onUpdate,
    participantId,
    participantName,
    sourceTrack,
    translation.error,
    translation.sourceSubtitle,
    translation.status,
    translation.translatedSubtitle,
  ]);

  React.useEffect(() => {
    return () => {
      onRemove(participantId);
    };
  }, [onRemove, participantId]);

  return null;
}

function getAggregateStatus(states: ParticipantCaptionState[]): TranslationStatus {
  if (states.some((state) => state.status === 'error')) {
    return 'error';
  }
  if (states.some((state) => state.status === 'connecting')) {
    return 'connecting';
  }
  if (states.some((state) => state.status === 'connected')) {
    return 'connected';
  }
  return 'idle';
}

export function TranslationOverlay() {
  const remoteParticipants = useRemoteParticipants();
  const micTracks = useTracks([Track.Source.Microphone], { onlySubscribed: true });
  const hasRemoteAudio = micTracks.some((ref) => !ref.participant.isLocal);

  const [panelOpen, setPanelOpen] = React.useState(true);
  const [enabled, setEnabled] = React.useState(false);
  const [language, setLanguage] = React.useState('en');
  const [originalVolume, setOriginalVolume] = React.useState(1);
  const [translatedVolume, setTranslatedVolume] = React.useState(1);
  const [sourceCaptionsEnabled, setSourceCaptionsEnabled] = React.useState(false);
  const [noiseReductionEnabled, setNoiseReductionEnabled] = React.useState(false);
  const [captionStates, setCaptionStates] = React.useState<
    Record<string, ParticipantCaptionState>
  >({});

  const updateCaptionState = React.useCallback((state: ParticipantCaptionState) => {
    setCaptionStates((current) => {
      const previous = current[state.participantId];
      if (
        previous &&
        previous.translatedSubtitle === state.translatedSubtitle &&
        previous.sourceSubtitle === state.sourceSubtitle &&
        previous.status === state.status &&
        previous.error === state.error
      ) {
        return current;
      }

      return {
        ...current,
        [state.participantId]: state,
      };
    });
  }, []);

  const handleEnabledChange = React.useCallback((nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    // Auto-duck the original speakers while translation plays; restore on disable.
    // The slider still lets the listener override this at any time.
    setOriginalVolume(nextEnabled ? DUCKED_ORIGINAL_VOLUME : 1);
  }, []);

  const removeCaptionState = React.useCallback((participantId: string) => {
    setCaptionStates((current) => {
      if (!current[participantId]) {
        return current;
      }

      const next = { ...current };
      delete next[participantId];
      return next;
    });
  }, []);

  React.useEffect(() => {
    for (const participant of remoteParticipants) {
      if (!(participant instanceof RemoteParticipant)) {
        continue;
      }
      participant.setVolume(originalVolume, Track.Source.Microphone);
    }
  }, [originalVolume, remoteParticipants]);

  const activeCaptionStates = Object.values(captionStates);
  const aggregateStatus = getAggregateStatus(activeCaptionStates);
  const aggregateError = activeCaptionStates.find((state) => state.error)?.error ?? null;

  const activeCaption = React.useMemo(() => {
    const withTranslated = activeCaptionStates.filter((state) => state.translatedSubtitle);
    if (withTranslated.length === 0) {
      return null;
    }

    return withTranslated.reduce((latest, state) =>
      state.updatedAt >= latest.updatedAt ? state : latest,
    );
  }, [activeCaptionStates]);

  const showCaptions = enabled && activeCaption?.translatedSubtitle;

  return (
    <>
      {remoteParticipants.map((participant) => {
        if (!(participant instanceof RemoteParticipant)) {
          return null;
        }

        return (
          <RemoteTranslationSidecar
            key={participant.identity}
            participant={participant}
            enabled={enabled}
            language={language}
            sourceTranscriptionEnabled={sourceCaptionsEnabled}
            noiseReductionEnabled={noiseReductionEnabled}
            translatedVolume={translatedVolume}
            onUpdate={updateCaptionState}
            onRemove={removeCaptionState}
          />
        );
      })}

      <div className={styles.overlayRoot}>
        <div className={styles.panel}>
          <div
            className={styles.panelHeader}
            onClick={() => setPanelOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setPanelOpen((current) => !current);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={panelOpen}
          >
            <span className={styles.panelHeaderTitle}>Translation</span>
            <button
              type="button"
              className={styles.collapseButton}
              aria-label={panelOpen ? 'Collapse translation panel' : 'Expand translation panel'}
              onClick={(event) => {
                event.stopPropagation();
                setPanelOpen((current) => !current);
              }}
            >
              {panelOpen ? '−' : '+'}
            </button>
          </div>

          <div className={panelOpen ? styles.panelBody : styles.panelBodyCollapsed}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={enabled}
                disabled={!hasRemoteAudio}
                onChange={(event) => handleEnabledChange(event.target.checked)}
              />
              <span>Enable translation</span>
            </label>

            <div className={styles.row}>
              <label className={styles.rowLabel} htmlFor="translation-language">
                Output language
              </label>
              <select
                id="translation-language"
                className={styles.select}
                value={language}
                disabled={enabled && aggregateStatus === 'connecting'}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {TRANSLATION_LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span>Original volume</span>
                <span>{Math.round(originalVolume * 100)}%</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={100}
                step={5}
                value={Math.round(originalVolume * 100)}
                aria-label="Original remote volume"
                onChange={(event) => setOriginalVolume(Number(event.target.value) / 100)}
              />
            </div>

            <div className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span>Translated volume</span>
                <span>{Math.round(translatedVolume * 100)}%</span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={100}
                step={5}
                value={Math.round(translatedVolume * 100)}
                aria-label="Translated volume"
                onChange={(event) => setTranslatedVolume(Number(event.target.value) / 100)}
              />
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={sourceCaptionsEnabled}
                onChange={(event) => setSourceCaptionsEnabled(event.target.checked)}
              />
              <span>Source captions</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={noiseReductionEnabled}
                onChange={(event) => setNoiseReductionEnabled(event.target.checked)}
              />
              <span>Near-field noise reduction</span>
            </label>

            {enabled && aggregateStatus === 'connecting' ? (
              <p className={styles.status}>Connecting…</p>
            ) : null}

            {aggregateError ? <p className={styles.error}>{aggregateError}</p> : null}

            {!hasRemoteAudio ? (
              <p className={styles.status}>Waiting for remote audio…</p>
            ) : null}
          </div>
        </div>
      </div>

      {showCaptions ? (
        <div className={styles.captionBar} aria-live="polite">
          <span className={styles.speakerLabel}>{activeCaption.participantName}</span>
          <p className={styles.translatedCaption}>{activeCaption.translatedSubtitle}</p>
          {sourceCaptionsEnabled && activeCaption.sourceSubtitle ? (
            <p className={styles.sourceCaption}>{activeCaption.sourceSubtitle}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
