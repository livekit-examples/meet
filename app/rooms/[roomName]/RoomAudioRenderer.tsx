import { getTrackReferenceId } from '@livekit/components-core';
import { Track, ParticipantKind } from 'livekit-client';
import * as React from 'react';
import { useLocalParticipant, useTracks } from '@livekit/components-react/hooks';
import { AudioTrack, TrackReference } from '@livekit/components-react';


export function RoomAudioRenderer() {
  const tracks = useTracks(
    [Track.Source.Microphone, Track.Source.ScreenShareAudio, Track.Source.Unknown],
    {
      updateOnlyOn: [],
      onlySubscribed: true,
    },
  ).filter((ref) => !ref.participant.isLocal && ref.publication.kind === Track.Kind.Audio);
  const {localParticipant} = useLocalParticipant();
  const currentLanguage = localParticipant?.attributes?.language;

  // we don't have a language set so we don't know how to handle the multiple audio tracks
  // this should not happen
  if (!currentLanguage) {
    return null;
  }


  const matchingTracks: TrackReference[] = [];
  const originalTracks: TrackReference[] = [];

  for (const track of tracks) {
    if (track.participant.attributes?.language === currentLanguage ||
        (track.participant.kind === ParticipantKind.AGENT && track.publication.trackName.endsWith(`-${currentLanguage}`))
    ) {
        matchingTracks.push(track);
    } else if (track.participant.kind !== ParticipantKind.AGENT) {
        originalTracks.push(track);
    }
  }


  return (
    <div style={{ display: 'none' }}>
      {matchingTracks.map((trackRef) => (
        <AudioTrack
          key={getTrackReferenceId(trackRef)}
          trackRef={trackRef}
          volume={1.0}
          muted={false}
        />
      ))}
      {originalTracks.map((trackRef) => (
        <AudioTrack
          key={getTrackReferenceId(trackRef)}
          trackRef={trackRef}
          volume={0.4}
          muted={false}
        />
      ))}
    </div>
  );
}
