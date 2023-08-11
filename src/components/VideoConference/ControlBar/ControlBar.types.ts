import { ControlBarControls as BaseControlBarControls, ControlBarProps as BaseControlBarProps } from '@livekit/components-react'

export const DEFAULT_USER_CHOICES = {
  videoEnabled: false,
  audioEnabled: false,
  videoDeviceId: 'default',
  audioDeviceId: 'default'
}

/** @public */
export type ControlBarControls = BaseControlBarControls

/** @public */
export interface ControlBarProps extends BaseControlBarProps {
  variation?: 'minimal' | 'verbose' | 'textOnly'
  controls?: ControlBarControls
}
