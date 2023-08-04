import { Dispatch } from "redux"
import { loadProfileRequest } from "decentraland-dapps/dist/modules/profile/actions"
import { RouterProps } from "../../../utils/WithRouter"
import { AuthIdentity } from "@dcl/crypto"

export type Props = {
  onFetchProfile: typeof loadProfileRequest
  loggedInAddress?: string
  profileAddress?: string
  isLoading: boolean
  onSubmitConnectForm: (server: string, token: string) => void
  identity: AuthIdentity | null
}

export type MapStateProps = Pick<Props, "loggedInAddress" | "isLoading" | "profileAddress" | "identity">
export type MapDispatchProps = Pick<Props, "onSubmitConnectForm">
export type MapDispatch = Dispatch
type Params = {
  profileAddress?: string
}
export type OwnProps = {
  router: RouterProps<Params>
}
