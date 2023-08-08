import { Dispatch } from 'redux'
import { AuthIdentity } from '@dcl/crypto'
import { RouterProps } from '../../../utils/WithRouter'

export type Props = {
  loggedInAddress?: string
  isLoading: boolean
  previouslyLoadedServers: string[] | null
  identity: AuthIdentity | null
  onSubmitConnectForm: (server: string, token: string) => void
}

export type MapStateProps = Pick<Props, 'loggedInAddress' | 'isLoading' | 'previouslyLoadedServers' | 'identity'>
export type MapDispatchProps = Pick<Props, 'onSubmitConnectForm'>
export type MapDispatch = Dispatch

// TODO: world-content-server qs
type Params = {
  profileAddress?: string
}
export type OwnProps = {
  router: RouterProps<Params>
}
