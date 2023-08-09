import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../reducer'

const getState = (state: RootState) => state.conference

export const getToken = (state: RootState) => getState(state).token
export const getServer = (state: RootState) => getState(state).server

export const isLoading = createSelector([getToken], token => !!token)
