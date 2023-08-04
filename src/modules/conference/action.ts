import { createAction } from "@reduxjs/toolkit"

export const setServer = createAction<{ server: string }>("Set Server")

export type SetServerAction = ReturnType<typeof setServer>

export const setToken = createAction<{ token: string }>("Set Token")

export type SetTokenAction = ReturnType<typeof setToken>
