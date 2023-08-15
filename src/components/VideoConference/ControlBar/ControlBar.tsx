import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supportsScreenSharing } from '@livekit/components-core'
import {
  ChatToggle,
  DisconnectButton,
  MediaDeviceMenu,
  StartAudio,
  TrackToggle,
  useLocalParticipantPermissions,
  useRoomContext
} from '@livekit/components-react'
import { LocalAudioTrack, LocalVideoTrack, Track } from 'livekit-client'
import ChatIcon from '../../../assets/icons/ChatIcon'
import LeaveIcon from '../../../assets/icons/LeaveIcon'
import { useLayoutContext } from '../../../hooks/useLayoutContext'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { usePreviewTracks } from '../../../hooks/usePreviewTracks'
import { mergeProps } from '../../../utils/mergeProps'
import PeoplePanelToggleButton from './PeoplePanelToggleButton'
import { ControlBarProps, DEFAULT_USER_CHOICES } from './ControlBar.types'
import styles from './ControlBar.module.css'

/**
 * The ControlBar prefab component gives the user the basic user interface
 * to control their media devices and leave the room.
 *
 * @remarks
 * This component is build with other LiveKit components like `TrackToggle`,
 * `DeviceSelectorButton`, `DisconnectButton` and `StartAudio`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ControlBar />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function ControlBar({ variation, controls, ...props }: ControlBarProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const layoutContext = useLayoutContext()
  const {
    options: { videoCaptureDefaults, audioCaptureDefaults }
  } = useRoomContext()

  const isTooLittleSpace = useMediaQuery(`(max-width: ${isChatOpen ? 1000 : 760}px)`)

  const defaultVariation = isTooLittleSpace ? 'minimal' : 'verbose'
  variation ??= defaultVariation

  const visibleControls = { leave: true, ...controls }
  const localPermissions = useLocalParticipantPermissions()

  if (!localPermissions) {
    visibleControls.camera = false
    visibleControls.chat = false
    visibleControls.microphone = false
    visibleControls.screenShare = false
  } else {
    visibleControls.camera ??= localPermissions.canPublish
    visibleControls.microphone ??= localPermissions.canPublish
    visibleControls.screenShare ??= localPermissions.canPublish
    visibleControls.chat ??= localPermissions.canPublishData && controls?.chat
  }

  const showIcon = useMemo(() => variation === 'minimal' || variation === 'verbose', [variation])
  const showText = useMemo(() => variation === 'textOnly' || variation === 'verbose', [variation])

  const browserSupportsScreenSharing = supportsScreenSharing()

  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false)

  const onScreenShareChange = (enabled: boolean) => {
    setIsScreenShareEnabled(enabled)
  }

  const htmlProps = mergeProps({ className: `lk-control-bar ${styles.ControlBarContainer}` }, props)

  const [videoEnabled, setVideoEnabled] = useState<boolean>(visibleControls.camera ?? DEFAULT_USER_CHOICES.videoEnabled)
  const initialVideoDeviceId = (videoCaptureDefaults?.deviceId as string) ?? DEFAULT_USER_CHOICES.videoDeviceId
  const [videoDeviceId, setVideoDeviceId] = useState<string>(initialVideoDeviceId)
  const initialAudioDeviceId = (audioCaptureDefaults?.deviceId as string) ?? DEFAULT_USER_CHOICES.audioDeviceId
  const [audioEnabled, setAudioEnabled] = useState<boolean>(visibleControls.microphone ?? DEFAULT_USER_CHOICES.audioEnabled)
  const [audioDeviceId, setAudioDeviceId] = useState<string>(initialAudioDeviceId)

  const tracks = usePreviewTracks(
    {
      audio: audioEnabled ? { deviceId: initialAudioDeviceId } : false,
      video: videoEnabled ? { deviceId: initialVideoDeviceId } : false
    },
    err => console.error('Error while setting up the pre-join configurations', err)
  )

  const videoEl = useRef(null)

  const videoTrack = useMemo(() => tracks?.filter(track => track.kind === Track.Kind.Video)[0] as LocalVideoTrack, [tracks])
  const audioTrack = useMemo(() => tracks?.filter(track => track.kind === Track.Kind.Audio)[0] as LocalAudioTrack, [tracks])

  useEffect(() => {
    if (layoutContext?.widget.state?.showChat !== undefined) {
      setIsChatOpen(layoutContext?.widget.state?.showChat)
    }
  }, [layoutContext?.widget.state?.showChat])

  useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute()
      videoTrack.attach(videoEl.current)
    }

    return () => {
      videoTrack?.detach()
    }
  }, [videoTrack])

  return (
    <div {...htmlProps}>
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={showIcon}
            initialState={audioEnabled}
            onChange={enabled => setAudioEnabled(enabled)}
          >
            {showText && 'Microphone'}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={audioDeviceId}
              kind="audioinput"
              disabled={!audioTrack}
              tracks={{ audioinput: audioTrack }}
              onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
            />
          </div>
        </div>
      )}
      {visibleControls.camera && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Camera}
            showIcon={showIcon}
            initialState={videoEnabled}
            onChange={enabled => setVideoEnabled(enabled)}
          >
            {showText && 'Camera'}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="videoinput"
              initialSelection={videoDeviceId}
              disabled={!videoTrack}
              tracks={{ videoinput: videoTrack }}
              onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
            />
          </div>
        </div>
      )}
      {visibleControls.screenShare && browserSupportsScreenSharing && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
          showIcon={showIcon}
          onChange={onScreenShareChange}
        >
          {showText && (isScreenShareEnabled ? 'Stop screen share' : 'Share screen')}
        </TrackToggle>
      )}
      {visibleControls.leave && (
        <DisconnectButton>
          {showIcon && <LeaveIcon />}
          {showText && 'Leave'}
        </DisconnectButton>
      )}
      <StartAudio label="Start Audio" />
      <div className={styles.ControlBarRightButtonGroup}>
        {visibleControls.chat && (
          <ChatToggle>
            {showIcon && <ChatIcon />}
            {showText && 'Chat'}
          </ChatToggle>
        )}
        {visibleControls.peoplePanel && <PeoplePanelToggleButton />}
      </div>
    </div>
  )
}
