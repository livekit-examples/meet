import React from "react"
import { Props } from "./Conference.types"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"

export default function Conference(props: Props) {
  const { token, server } = props

  return (
    <>
      <LiveKitRoom token={token} serverUrl={server} connect={true}>
        <VideoConference />
      </LiveKitRoom>
    </>
  )
}
