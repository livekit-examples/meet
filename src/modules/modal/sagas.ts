import { put, takeEvery } from 'redux-saga/effects'
import { closeModal } from 'decentraland-dapps/dist/modules/modal/actions'
import { loginSuccess } from '../identity/action'

export function* modalSagas() {
  yield takeEvery(loginSuccess.type, handleLoginSuccess)

  function* handleLoginSuccess() {
    yield put(closeModal('LoginModal'))
  }
}
