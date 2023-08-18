import { Dispatch } from 'redux'

export type Props = {
  loggedInAddress?: string
  isLoading: boolean
  server?: string
  token?: string
  worldContentServerUrl: string
  worldName: string
}

export type MapStateProps = Pick<Props, 'loggedInAddress' | 'isLoading' | 'server' | 'token' | 'worldName' | 'worldContentServerUrl'>
export type MapDispatch = Dispatch
