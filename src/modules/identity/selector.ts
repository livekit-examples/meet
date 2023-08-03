import { createSelector } from '@reduxjs/toolkit'
import { AuthIdentity } from '@dcl/crypto'
import { isLoadingType } from 'decentraland-dapps/dist/modules/loading/selectors'
import { getAddress } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { RootState } from '../reducer'
import { loginRequest } from './action'

function isValid(identity: AuthIdentity) {
  return Date.now() < +new Date(identity.expiration)
}

const getState = (state: RootState) => state.identity
const getData = (state: RootState) => getState(state).data
const getLoading = (state: RootState) => getState(state).loading
export const getError = (state: RootState) => getState(state).error

export const isLoggingIn = createSelector([getLoading], loadingState => isLoadingType(loadingState, loginRequest.type))
export const getCurrentIdentity = createSelector([getAddress, getData], (currentAddress, identities) => {
  if (currentAddress) {
    const identity = identities[currentAddress]
    if (!!identities[currentAddress] && isValid(identity)) {
      return identity
    }
  }
  return null
})
export const isLoggedIn = createSelector([getCurrentIdentity], identity => {
  return !!identity
})
