import { call, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { AuthIdentity } from '@dcl/crypto'
import { isErrorWithMessage } from 'decentraland-dapps/dist/lib/error'
import {
  CONNECT_WALLET_FAILURE,
  CONNECT_WALLET_SUCCESS,
  ChangeAccountAction,
  ConnectWalletFailureAction,
  ConnectWalletSuccessAction,
  ENABLE_WALLET_FAILURE,
  ENABLE_WALLET_SUCCESS,
  EnableWalletFailureAction,
  EnableWalletSuccessAction,
  CHANGE_ACCOUNT,
  enableWalletRequest,
  DISCONNECT_WALLET
} from 'decentraland-dapps/dist/modules/wallet/actions'
import { getAddress, isConnected } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { LoginRequestAction, loginFailure, loginRequest, loginSuccess, logout } from './action'
import { getCurrentIdentity, isLoggingIn } from './selector'
import { generateIdentity } from './utils'

export function* identitySaga() {
  yield takeEvery(loginRequest.type, handleLogin)
  yield takeEvery(CHANGE_ACCOUNT, handleChangeAccount)
  yield takeEvery(CONNECT_WALLET_SUCCESS, handleConnectWalletSuccess)
  yield takeEvery(DISCONNECT_WALLET, handleDisconnectWallet)

  function* handleLogin(action: LoginRequestAction) {
    const providerType = action.payload
    // Check if we need to generate an identity
    try {
      // Check if we need to connect the wallet
      const shouldConnectWallet: boolean = yield select(state => !isConnected(state))
      if (shouldConnectWallet) {
        if (!providerType) {
          throw new Error('Undefined provider type')
        }

        // enable wallet
        yield put(enableWalletRequest(providerType))
        const enableWallet: { success: EnableWalletSuccessAction; failure: EnableWalletFailureAction } = yield race({
          success: take(ENABLE_WALLET_SUCCESS),
          failure: take(ENABLE_WALLET_FAILURE)
        })

        if (!enableWallet.success) {
          yield put(loginFailure(enableWallet.failure.payload.error))
          return
        }

        // connect wallet (a CONNECT_WALLET_REQUEST is dispatched automatically after ENABLE_WALLET_SUCCESS, so we just wait for it to resolve)
        const connectWallet: { success: ConnectWalletSuccessAction; failure: ConnectWalletFailureAction } = yield race({
          success: take(CONNECT_WALLET_SUCCESS),
          failure: take(CONNECT_WALLET_FAILURE)
        })

        if (!connectWallet.success) {
          yield put(loginFailure(connectWallet.failure.payload.error))
          return
        }
      }

      let identity: AuthIdentity = yield select(getCurrentIdentity)
      const address: string = yield select(getAddress)
      // Check if we need  to generate a new identity
      if (!identity) {
        identity = yield call(generateIdentity, address)
      }

      yield put(loginSuccess({ address, identity }))
    } catch (error) {
      yield put(loginFailure(isErrorWithMessage(error) ? error.message : 'Unknown error'))
    }
  }

  function* handleDisconnectWallet() {
    const address: string = yield select(getAddress)
    yield put(logout(address))
  }

  function* handleConnectWalletSuccess(action: ConnectWalletSuccessAction) {
    const { wallet } = action.payload
    const isLoggingInUser: boolean = yield select(isLoggingIn)
    let identity: AuthIdentity = yield select(getCurrentIdentity)
    if (!isLoggingInUser && !identity) {
      identity = yield call(generateIdentity, wallet.address)
    }
    yield put(loginSuccess({ address: wallet.address, identity }))
  }

  function* handleChangeAccount(action: ChangeAccountAction) {
    const { wallet } = action.payload
    let identity: AuthIdentity = yield select(getCurrentIdentity)
    if (!identity) {
      identity = yield call(generateIdentity, wallet.address)
    }
    yield put(loginSuccess({ address: wallet.address, identity }))
  }
}
