import { connect } from 'react-redux'
import { getAddress, isConnecting } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { setServer, setToken, setWorldRelatedInformation } from '../../../modules/conference/action'
import { config } from '../../../modules/config'
import { getCurrentIdentity, isLoggingIn } from '../../../modules/identity/selector'
import { RootState } from '../../../modules/reducer'
import withRouter from '../../../utils/WithRouter'
import { getPreviouslyLoadedServers } from '../../../utils/worldServers'
import MainPage from './ConnectToWorld'
import { MapDispatch, MapDispatchProps, MapStateProps, OwnProps } from './ConnectToWorld.types'

const mapStateToProps = (state: RootState, ownProps: OwnProps): MapStateProps => {
  const identity = getCurrentIdentity(state)
  return {
    isLoading: isLoggingIn(state) || isConnecting(state),
    loggedInAddress: getAddress(state)?.toLowerCase(),
    previouslyLoadedServers: getPreviouslyLoadedServers(),
    worldsContentServerUrl:
      new URLSearchParams(ownProps.router.location.search).get('worlds-content-server-url') || config.get('WORLDS_CONTENT_SERVER_URL'),
    identity
  }
}

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onSubmitConnectForm: (server: string, token: string, worldsContentServerUrl: string, selectedServer: string) => {
    dispatch(setServer({ server }))
    dispatch(setToken({ token }))
    dispatch(setWorldRelatedInformation({ contentServerUrl: worldsContentServerUrl, name: selectedServer }))
  }
})

export default withRouter(connect(mapStateToProps, mapDispatch)(MainPage))
