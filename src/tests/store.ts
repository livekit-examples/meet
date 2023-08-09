import createSagasMiddleware from 'redux-saga'
import { createStorageMiddleware } from 'decentraland-dapps/dist/modules/storage/middleware'
import { createRootReducer } from '../modules/reducer'
import { rootSaga } from '../modules/saga'

export function initTestStore(preloadedState = {}) {
  const sagasMiddleware = createSagasMiddleware()
  const { storageMiddleware, loadStorageMiddleware } = createStorageMiddleware({
    storageKey: 'profile', // this is the key used to save the state in localStorage (required)
    paths: [['identity', 'data']], // array of paths from state to be persisted (optional)
    actions: [], // array of actions types that will trigger a SAVE (optional)
    migrations: {} // migration object that will migrate your localstorage (optional)
  })
  const store = createRootReducer([sagasMiddleware, storageMiddleware], preloadedState)
  sagasMiddleware.run(rootSaga)
  loadStorageMiddleware(store)

  return store
}
