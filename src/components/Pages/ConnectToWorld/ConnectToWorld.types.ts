import { Dispatch } from 'redux'
import { AuthIdentity } from '@dcl/crypto'
import { RouterProps } from '../../../utils/WithRouter'

export type Props = {
  loggedInAddress?: string
  isLoading: boolean
  previouslyLoadedServers: string[] | null
  identity: AuthIdentity | null
  worldsContentServerUrl: string
  onSubmitConnectForm: (server: string, token: string, worldsContentServerUrl: string, selectedServer: string) => void
}

export type MapStateProps = Pick<Props, 'loggedInAddress' | 'isLoading' | 'previouslyLoadedServers' | 'identity' | 'worldsContentServerUrl'>
export type MapDispatchProps = Pick<Props, 'onSubmitConnectForm'>
export type MapDispatch = Dispatch

type Params = Record<string, never>
export type OwnProps = {
  router: RouterProps<Params>
}
