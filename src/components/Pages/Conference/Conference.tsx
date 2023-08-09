import React from 'react'
import { LiveKitRoom } from '@livekit/components-react'
import '@livekit/components-styles'
import { VideoConference } from '../../VideoConference/Videoconference'
import { Props } from './Conference.types'
import './Conference.css'

export default function Conference(props: Props) {
  const { token, server } = props

  return (
    <>
      <LiveKitRoom token={token} serverUrl={server} connect={true} data-lk-theme="default">
        <VideoConference />
      </LiveKitRoom>
    </>
  )
}
