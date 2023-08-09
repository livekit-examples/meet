import { Dispatch } from 'redux'
import { RouterProps } from '../../../utils/WithRouter'

export type Props = {
  loggedInAddress?: string
  profileAddress?: string
  isLoading: boolean
  server?: string
  token?: string
}

export type MapStateProps = Pick<Props, 'loggedInAddress' | 'isLoading' | 'profileAddress' | 'server' | 'token'>
export type MapDispatch = Dispatch
type Params = {
  profileAddress?: string
}
export type OwnProps = {
  router: RouterProps<Params>
}
