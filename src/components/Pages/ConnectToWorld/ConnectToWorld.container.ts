import { connect } from 'react-redux'
import { getAddress, isConnecting } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { setServer, setToken } from '../../../modules/conference/action'
import { getCurrentIdentity, isLoggingIn } from '../../../modules/identity/selector'
import { RootState } from '../../../modules/reducer'
import withRouter from '../../../utils/WithRouter'
import { getPreviouslyLoadedServers } from '../../../utils/worldServers'
import MainPage from './ConnectToWorld'
import { MapDispatch, MapDispatchProps, MapStateProps } from './ConnectToWorld.types'

const mapStateToProps = (state: RootState): MapStateProps => {
  const identity = getCurrentIdentity(state)

  return {
    isLoading: isLoggingIn(state) || isConnecting(state),
    loggedInAddress: getAddress(state)?.toLowerCase(),
    previouslyLoadedServers: getPreviouslyLoadedServers(),
    identity
  }
}

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onSubmitConnectForm: (server: string, token: string) => {
    dispatch(setServer({ server }))
    dispatch(setToken({ token }))
  }
})

export default withRouter(connect(mapStateToProps, mapDispatch)(MainPage))
