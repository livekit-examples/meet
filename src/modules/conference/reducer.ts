import { createReducer } from '@reduxjs/toolkit'
import { setServer, setToken } from './action'

export type ConferenceState = {
  token: string
  server: string
}

export const INITIAL_STATE: ConferenceState = {
  token: '',
  server: ''
}

export const conferenceReducer = createReducer<ConferenceState>(INITIAL_STATE, builder =>
  builder
    .addCase(setServer, (state, action) => {
      state.server = action.payload.server
    })
    .addCase(setToken, (state, action) => {
      state.token = action.payload.token
    })
)
