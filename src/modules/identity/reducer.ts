import { createReducer } from '@reduxjs/toolkit'
import { AuthIdentity } from '@dcl/crypto'
import { loadingReducer, LoadingState } from 'decentraland-dapps/dist/modules/loading/reducer'
import { loginFailure, loginRequest, loginSuccess, logout } from './action'

export type IdentityState = {
  data: Record<string, AuthIdentity>
  loading: LoadingState
  error: string | null
}

export const INITIAL_STATE: IdentityState = {
  data: {},
  loading: [],
  error: null
}

export const identityReducer = createReducer<IdentityState>(INITIAL_STATE, builder =>
  builder
    .addCase(loginRequest, (state, action) => {
      state.loading = loadingReducer(state.loading, action)
      state.error = null
    })
    .addCase(loginSuccess, (state, action) => {
      state.loading = loadingReducer(state.loading, action)
      state.data[action.payload.address] = action.payload.identity
    })
    .addCase(loginFailure, (state, action) => {
      state.loading = loadingReducer(state.loading, action)
      state.error = action.payload
    })
    .addCase(logout, (state, action) => {
      delete state.data[action.payload]
    })
)
