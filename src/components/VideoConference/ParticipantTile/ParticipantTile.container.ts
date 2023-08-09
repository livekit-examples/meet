import { connect } from 'react-redux'
import { getData as getProfiles } from 'decentraland-dapps/dist/modules/profile/selectors'
import { RootState } from '../../../modules/reducer'
import { ParticipantTile } from './ParticipantTile'
import type { MapStateProps } from './ParticipantTile.types'

const mapStateToProps = (state: RootState): MapStateProps => {
  return {
    profiles: getProfiles(state)
  }
}

export default connect(mapStateToProps)(ParticipantTile)
