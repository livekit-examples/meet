import { connect } from 'react-redux'
import { getData as getProfiles } from 'decentraland-dapps/dist/modules/profile/selectors'
import { getAddress } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { RootState } from '../../../../../modules/reducer'
import ChatEntry from './ChatEntry'
import type { MapStateProps } from './ChatEntry.types'

const mapStateToProps = (state: RootState): MapStateProps => {
  return {
    address: getAddress(state) as string,
    profiles: getProfiles(state)
  }
}

export default connect(mapStateToProps)(ChatEntry)
