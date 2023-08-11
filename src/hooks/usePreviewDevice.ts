import { useEffect, useRef, useState } from 'react'
import { log } from '@livekit/components-core'
import { useMediaDevices } from '@livekit/components-react'
import { LocalVideoTrack, LocalAudioTrack, createLocalVideoTrack, VideoPresets, createLocalAudioTrack } from 'livekit-client'

/** @public */
export function usePreviewDevice<T extends LocalVideoTrack | LocalAudioTrack>(
  enabled: boolean,
  deviceId: string,
  kind: 'videoinput' | 'audioinput'
) {
  const [deviceError, setDeviceError] = useState<Error | null>(null)
  const [isCreatingTrack, setIsCreatingTrack] = useState<boolean>(false)

  const devices = useMediaDevices({ kind })
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | undefined>(undefined)

  const [localTrack, setLocalTrack] = useState<T>()
  const [localDeviceId, setLocalDeviceId] = useState<string>(deviceId)

  useEffect(() => {
    setLocalDeviceId(deviceId)
  }, [deviceId])

  const createTrack = async (deviceId: string, kind: 'videoinput' | 'audioinput') => {
    try {
      const track =
        kind === 'videoinput'
          ? await createLocalVideoTrack({
              deviceId: deviceId,
              resolution: VideoPresets.h720.resolution
            })
          : await createLocalAudioTrack({ deviceId })

      const newDeviceId = await track.getDeviceId()
      if (newDeviceId && deviceId !== newDeviceId) {
        prevDeviceId.current = newDeviceId
        setLocalDeviceId(newDeviceId)
      }
      setLocalTrack(track as T)
    } catch (e) {
      if (e instanceof Error) {
        setDeviceError(e)
      }
    }
  }

  const switchDevice = async (track: LocalVideoTrack | LocalAudioTrack, id: string) => {
    await track.setDeviceId(id)
    prevDeviceId.current = id
  }

  const prevDeviceId = useRef(localDeviceId)

  useEffect(() => {
    if (enabled && !localTrack && !deviceError && !isCreatingTrack) {
      log.debug('creating track', kind)
      setIsCreatingTrack(true)
      createTrack(localDeviceId, kind).finally(() => {
        setIsCreatingTrack(false)
      })
    }
  }, [enabled, localTrack, deviceError, isCreatingTrack])

  // switch camera device
  useEffect(() => {
    if (!localTrack) {
      return
    }
    if (!enabled) {
      log.debug(`muting ${kind} track`)
      localTrack.mute().then(() => log.debug(localTrack.mediaStreamTrack))
    } else if (selectedDevice?.deviceId && prevDeviceId.current !== selectedDevice?.deviceId) {
      log.debug(`switching ${kind} device from`, prevDeviceId.current, selectedDevice.deviceId)
      switchDevice(localTrack, selectedDevice.deviceId)
    } else {
      log.debug(`unmuting local ${kind} track`)
      localTrack.unmute()
    }
  }, [localTrack, selectedDevice, enabled, kind])

  useEffect(() => {
    return () => {
      if (localTrack) {
        log.debug(`stopping local ${kind} track`)
        localTrack.stop()
        localTrack.mute()
      }
    }
  }, [])

  useEffect(() => {
    setSelectedDevice(devices.find(dev => dev.deviceId === localDeviceId))
  }, [localDeviceId, devices])

  return {
    selectedDevice,
    localTrack,
    deviceError
  }
}
