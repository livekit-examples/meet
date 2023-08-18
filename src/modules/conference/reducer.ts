import { createReducer } from '@reduxjs/toolkit'
import { setServer, setToken, setWorldRelatedInformation } from './action'

export type ConferenceState = {
  token: string
  server: string
  worlds: {
    contentServerUrl: string
    name: string
  }
}

export const INITIAL_STATE: ConferenceState = {
  token: '',
  server: '',
  worlds: {
    contentServerUrl: '',
    name: ''
  }
}

export const conferenceReducer = createReducer<ConferenceState>(INITIAL_STATE, builder =>
  builder
    .addCase(setServer, (state, action) => {
      state.server = action.payload.server
    })
    .addCase(setToken, (state, action) => {
      state.token = action.payload.token
    })
    .addCase(setWorldRelatedInformation, (state, action) => {
      const { contentServerUrl, name } = action.payload

      state.worlds = {
        contentServerUrl,
        name
      }
    })
)
