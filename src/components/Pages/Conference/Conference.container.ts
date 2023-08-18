import { connect } from 'react-redux'
import { getAddress, isConnecting } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { getServer, getToken, getWorldContentServerUrl, getWorldName } from '../../../modules/conference/selector'
import { isLoggingIn } from '../../../modules/identity/selector'
import { RootState } from '../../../modules/reducer'
import withRouter from '../../../utils/WithRouter'
import Conference from './Conference'
import { MapStateProps } from './Conference.types'

const mapStateToProps = (state: RootState): MapStateProps => ({
  isLoading: isLoggingIn(state) || isConnecting(state),
  loggedInAddress: getAddress(state)?.toLowerCase(),
  server: getServer(state),
  token: getToken(state),
  worldName: getWorldName(state),
  worldContentServerUrl: getWorldContentServerUrl(state)
})

export default withRouter(connect(mapStateToProps)(Conference))
