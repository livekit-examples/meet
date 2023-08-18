import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../reducer'

const getState = (state: RootState) => state.conference

export const getToken = (state: RootState) => getState(state).token
export const getServer = (state: RootState) => getState(state).server

const getWorlds = (state: RootState) => getState(state).worlds
export const getWorldName = (state: RootState) => getWorlds(state).name
export const getWorldContentServerUrl = (state: RootState) => getWorlds(state).contentServerUrl

export const isLoading = createSelector([getToken], token => !!token)
