import { connect } from 'react-redux'
import { getData as getProfiles } from 'decentraland-dapps/dist/modules/profile/selectors'
import { RootState } from '../../../../modules/reducer'
import PeoplePanel from './PeoplePanel'
import type { MapStateProps } from './PeoplePanel.types'

const mapStateToProps = (state: RootState): MapStateProps => {
  return {
    profiles: getProfiles(state)
  }
}

export default connect(mapStateToProps)(PeoplePanel)
