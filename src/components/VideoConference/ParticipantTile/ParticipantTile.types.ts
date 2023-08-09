import type { ParticipantClickEvent } from '@livekit/components-core'
import type { Participant, Track, TrackPublication } from 'livekit-client'

/** @public */
export interface OwnProps extends React.HTMLAttributes<HTMLDivElement> {
  disableSpeakingIndicator?: boolean
  participant?: Participant
  source?: Track.Source
  publication?: TrackPublication
  onParticipantClick?: (event: ParticipantClickEvent) => void
  imageSize?: 'normal' | 'large' | 'huge' | 'massive'
}

export type Props = OwnProps & {
  profiles: ReturnType<typeof import('decentraland-dapps/dist/modules/profile/selectors').getData>
}

export type MapStateProps = Pick<Props, 'profiles'>
