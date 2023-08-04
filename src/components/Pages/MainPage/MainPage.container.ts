import { connect } from "react-redux"
import { getAddress, isConnecting } from "decentraland-dapps/dist/modules/wallet/selectors"
import { getCurrentIdentity, isLoggingIn } from "../../../modules/identity/selector"
import { RootState } from "../../../modules/reducer"
import withRouter from "../../../utils/WithRouter"
import MainPage from "./MainPage"
import { MapDispatch, MapDispatchProps, MapStateProps, OwnProps } from "./MainPage.types"
import { setServer, setToken } from "../../../modules/conference/action"

const mapStateToProps = (state: RootState, ownProps: OwnProps): MapStateProps => {
  const addressFromPath = ownProps.router.params.profileAddress
  const identity = getCurrentIdentity(state)

  return {
    profileAddress: addressFromPath?.toLowerCase(),
    isLoading: isLoggingIn(state) || isConnecting(state),
    loggedInAddress: getAddress(state)?.toLowerCase(),
    identity,
  }
}

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onSubmitConnectForm: (server: string, token:string) => {
    dispatch(setServer({ server }))
    dispatch(setToken({ token }))
  },
})

export default withRouter(connect(mapStateToProps, mapDispatch)(MainPage))
