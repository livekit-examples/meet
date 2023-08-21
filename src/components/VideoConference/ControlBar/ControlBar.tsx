import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supportsScreenSharing } from '@livekit/components-core'
import {
  ChatToggle,
  DisconnectButton,
  MediaDeviceMenu,
  StartAudio,
  TrackToggle,
  useLocalParticipantPermissions,
  useRoomContext,
  useTrackToggle
} from '@livekit/components-react'
import classNames from 'classnames'
import { LocalAudioTrack, LocalVideoTrack, Track } from 'livekit-client'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Button, Popup } from 'decentraland-ui'
import { useLayoutContext } from '../../../hooks/useLayoutContext'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { usePreviewTracks } from '../../../hooks/usePreviewTracks'
import { mergeProps } from '../../../utils/mergeProps'
import { CameraIcon, ChatIcon, MicrophoneIcon, PhoneIcon, ShareScreenIcon } from '../../Icons'
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
  const [confirmStopSharing, setConfirmStopSharing] = useState(false)
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
    visibleControls.peoplePanel = false
  } else {
    visibleControls.camera ??= localPermissions.canPublish
    visibleControls.microphone ??= localPermissions.canPublish
    visibleControls.screenShare ??= localPermissions.canPublish
    visibleControls.chat ??= localPermissions.canPublishData && controls?.chat
  }

  const showIcon = useMemo(() => variation === 'minimal' || variation === 'verbose', [variation])
  const showText = useMemo(() => variation === 'textOnly' || variation === 'verbose', [variation])

  const browserSupportsScreenSharing = supportsScreenSharing()

  const handleStopScreenShare = useCallback(() => {
    toggleScreenShare()
    setConfirmStopSharing(false)
  }, [])

  const htmlProps = mergeProps({ className: styles.ControlBarContainer }, props)

  const [videoEnabled, setVideoEnabled] = useState<boolean>(visibleControls.camera ?? DEFAULT_USER_CHOICES.videoEnabled)
  const initialVideoDeviceId = (videoCaptureDefaults?.deviceId as string) ?? DEFAULT_USER_CHOICES.videoDeviceId
  const [videoDeviceId, setVideoDeviceId] = useState<string>(initialVideoDeviceId)
  const initialAudioDeviceId = (audioCaptureDefaults?.deviceId as string) ?? DEFAULT_USER_CHOICES.audioDeviceId
  const [audioEnabled, setAudioEnabled] = useState<boolean>(visibleControls.microphone ?? DEFAULT_USER_CHOICES.audioEnabled)
  const [audioDeviceId, setAudioDeviceId] = useState<string>(initialAudioDeviceId)

  const { enabled: isScreenShareEnabled, toggle: toggleScreenShare } = useTrackToggle({
    source: Track.Source.ScreenShare,
    captureOptions: { audio: true, selfBrowserSurface: 'include' }
  })

  const handleOpen = () => {
    if (!isScreenShareEnabled) {
      toggleScreenShare()
    } else {
      setConfirmStopSharing(true)
    }
  }

  const handleClose = () => {
    setConfirmStopSharing(false)
  }

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
      <div className={styles.ControlBarCenterButtonGroup}>
        {visibleControls.microphone && (
          <div className={styles.controlBarButtonGroup}>
            <TrackToggle
              className={classNames(styles.controlBarButton, { [styles.disabled]: !audioEnabled })}
              source={Track.Source.Microphone}
              showIcon={false}
              initialState={audioEnabled}
              onChange={enabled => setAudioEnabled(enabled)}
            >
              <MicrophoneIcon enabled={audioEnabled} />
            </TrackToggle>
            <div className={`lk-button-group-menu ${styles.controlBarMenuButton}`}>
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
          <div className={styles.controlBarButtonGroup}>
            <TrackToggle
              className={classNames(styles.controlBarButton, { [styles.disabled]: !videoEnabled })}
              source={Track.Source.Camera}
              showIcon={false}
              initialState={videoEnabled}
              onChange={enabled => setVideoEnabled(enabled)}
            >
              <CameraIcon enabled={videoEnabled} />
            </TrackToggle>
            <div className={`lk-button-group-menu ${styles.controlBarMenuButton}`}>
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
          <Popup
            position="top left"
            open={confirmStopSharing}
            on="click"
            closeOnTriggerBlur
            onOpen={handleOpen}
            onClose={handleClose}
            content={
              <Button className={styles.stopSharingButton} onClick={handleStopScreenShare}>
                <div className={styles.stopSharingCloseButton} />
                {t('control_bar.stop_sharing')}
              </Button>
            }
            trigger={
              <button className={classNames('lk-button', styles.controlBarButton, { [styles.screenShareEnabled]: isScreenShareEnabled })}>
                <ShareScreenIcon enabled={isScreenShareEnabled} />
              </button>
            }
            basic
            style={{
              backgroundColor: 'transparent',
              padding: 0
            }}
          />
        )}
        {visibleControls.leave && (
          <DisconnectButton className={styles.disconnectButton}>
            {showIcon && <PhoneIcon />}
            {t('control_bar.leave')}
          </DisconnectButton>
        )}
      </div>
      <StartAudio label="Start Audio" />
      <div className={styles.ControlBarRightButtonGroup}>
        {visibleControls.chat && (
          <ChatToggle className={styles.chatToggleButton}>
            {showIcon && <ChatIcon className={styles.chatToggleIcon} />}
            {showText && 'Chat'}
          </ChatToggle>
        )}
        {visibleControls.peoplePanel && <PeoplePanelToggleButton />}
      </div>
    </div>
  )
}
