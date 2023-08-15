import { connect } from 'react-redux'
import { Network } from '@dcl/schemas/dist/dapps/network'
import { getData as getProfiles } from 'decentraland-dapps/dist/modules/profile/selectors'
import { isEnabled } from 'decentraland-dapps/dist/modules/translation/selectors'
import { disconnectWallet } from 'decentraland-dapps/dist/modules/wallet/actions'
import { getAddress, getNetworks, isConnected, isConnecting } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { UserMenu } from 'decentraland-ui/dist/components/UserMenu/UserMenu'
import { RootState } from '../../modules/reducer'
import { MapStateProps, MapDispatch, MapDispatchProps, Props } from './UserMenu.types'

const mapState = (state: RootState): MapStateProps => {
  const isSignedIn = isConnected(state)
  const address = getAddress(state)
  const profile = address ? getProfiles(state)[address] : undefined
  const networks = getNetworks(state)

  const manaBalances: Props['manaBalances'] = {}
  if (isSignedIn) {
    const networkList = Object.values(Network) as Network[]
    for (const network of networkList) {
      const networkData = networks?.[network]
      if (networkData) {
        manaBalances[network] = networks?.[network].mana
      }
    }
  }

  return {
    address,
    manaBalances,
    avatar: profile ? profile.avatars[0] : undefined,
    isSignedIn,
    isSigningIn: isConnecting(state),
    hasActivity: false,
    hasTranslations: isEnabled(state)
  }
}

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onSignOut: () => dispatch(disconnectWallet())
})

const mergeProps = (mapStateProps: MapStateProps, mapDispatchProps: MapDispatchProps) => ({
  ...mapStateProps,
  ...mapDispatchProps
})

export default connect(mapState, mapDispatch, mergeProps)(UserMenu)
