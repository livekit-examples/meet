import React from "react"
import { Props } from "./Conference.types"
import { LiveKitRoom } from "@livekit/components-react"
import { VideoConference } from "../../VideoConference/Videoconference"
import "@livekit/components-styles"
import "./Conference.css"

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
