import { createAction } from '@reduxjs/toolkit'
import { AuthIdentity } from '@dcl/crypto'
import { ProviderType } from '@dcl/schemas'

export const loginRequest = createAction<ProviderType>('[Request] Login')
export const loginSuccess = createAction<{ address: string; identity: AuthIdentity }>('[Success] Login')
export const loginFailure = createAction<string>('[Failure] Login')

export type LoginRequestAction = ReturnType<typeof loginRequest>
export type LoginSuccessAction = ReturnType<typeof loginSuccess>
export type LoginFailureAction = ReturnType<typeof loginFailure>

export const logout = createAction<string>('Logout')
