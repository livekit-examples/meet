import { connect } from 'react-redux'
import { getData as getProfiles } from 'decentraland-dapps/dist/modules/profile/selectors'
import { RootState } from '../../../../modules/reducer'
import { PeoplePanelToggleButton } from './PeoplePanelToggleButton'
import type { MapStateProps } from './PeoplePanelToggleButton.types'

const mapStateToProps = (state: RootState): MapStateProps => {
  return {
    peopleCount: Object.keys(getProfiles(state)).filter(address => !!address).length
  }
}

export default connect(mapStateToProps)(PeoplePanelToggleButton)
