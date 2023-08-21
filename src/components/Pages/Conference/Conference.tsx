import React, { useCallback, useEffect, useState } from 'react'
import { LiveKitRoom } from '@livekit/components-react'
import '@livekit/components-styles'
import { getAnalytics } from 'decentraland-dapps/dist/modules/analytics/utils'
import { Events } from '../../../modules/analytics/types'
import { VideoConference } from '../../VideoConference/'
import { Props } from './Conference.types'
import './Conference.css'

export default function Conference(props: Props) {
  const { token, server, worldName, worldContentServerUrl, loggedInAddress: userAddress } = props
  const [alreadyDisconnected, setAlreadyDisconnected] = useState(false)
  const analytics = getAnalytics()

  const track = useCallback(
    (event: Events) => {
      if (!worldName || !worldContentServerUrl || !userAddress) return

      analytics.track(event, {
        worldName,
        worldContentServerUrl,
        userAddress
      })
    },
    [worldName, worldContentServerUrl, userAddress]
  )

  const handleConnect = useCallback(() => track(Events.CONNECT), [track])
  const handleDisconnect = useCallback(() => {
    // This is to avoid tracking the disconnect event twice
    if (!alreadyDisconnected) {
      track(Events.DISCONNECT)
      setAlreadyDisconnected(true)
    }
  }, [track, alreadyDisconnected])

  useEffect(() => {
    window.onbeforeunload = () => {
      handleDisconnect()
    }

    return () => {
      window.onbeforeunload = null
    }
  }, [])

  return (
    <>
      <LiveKitRoom
        token={token}
        serverUrl={server}
        connect={true}
        data-lk-theme="default"
        onConnected={handleConnect}
        onDisconnected={handleDisconnect}
      >
        <VideoConference />
      </LiveKitRoom>
    </>
  )
}
