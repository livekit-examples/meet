import { useState, useEffect } from 'react'
import { CreateLocalTracksOptions, LocalTrack, createLocalTracks } from 'livekit-client'

/** @alpha */
export function usePreviewTracks(options: CreateLocalTracksOptions, onError?: (err: Error) => void) {
  const [tracks, setTracks] = useState<LocalTrack[]>()

  useEffect(() => {
    let trackPromise: Promise<LocalTrack[]> | undefined = undefined
    let needsCleanup = false
    if (options.audio || options.video) {
      trackPromise = createLocalTracks(options)
      trackPromise
        .then(tracks => {
          if (needsCleanup) {
            tracks.forEach(tr => tr.stop())
          } else {
            setTracks(tracks)
          }
        })
        .catch(onError)
    } else {
      tracks?.forEach(tr => tr.stop())
      setTracks([])
    }

    return () => {
      needsCleanup = true
      trackPromise?.then(tracks =>
        tracks.forEach(track => {
          track.stop()
        })
      )
    }
  }, [JSON.stringify(options)])

  return tracks
}
