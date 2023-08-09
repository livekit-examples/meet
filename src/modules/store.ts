import { createLogger } from 'redux-logger'
import createSagasMiddleware from 'redux-saga'
import { Env } from '@dcl/ui-env'
import { createAnalyticsMiddleware } from 'decentraland-dapps/dist/modules/analytics/middleware'
import { createStorageMiddleware } from 'decentraland-dapps/dist/modules/storage/middleware'
import { config } from './config'
import { createRootReducer } from './reducer'
import { rootSaga } from './saga'

export function initStore() {
  const sagasMiddleware = createSagasMiddleware()
  const isDev = config.is(Env.DEVELOPMENT)
  const loggerMiddleware = createLogger({
    collapsed: () => true,
    predicate: (_: any, action) => isDev || action.type.includes('Failure')
  })
  const analyticsMiddleware = createAnalyticsMiddleware(config.get('SEGMENT_API_KEY'))
  const { storageMiddleware, loadStorageMiddleware } = createStorageMiddleware({
    storageKey: 'profile', // this is the key used to save the state in localStorage (required)
    paths: [['identity', 'data']], // array of paths from state to be persisted (optional)
    actions: ['[Success] Login', 'Logout'], // array of actions types that will trigger a SAVE (optional)
    migrations: {} // migration object that will migrate your localstorage (optional)
  })
  const store = createRootReducer([sagasMiddleware, loggerMiddleware, analyticsMiddleware, storageMiddleware])
  if (isDev) {
    const _window = window as any
    // eslint-disable-next-line @typescript-eslint/unbound-method
    _window.getState = store.getState
  }

  sagasMiddleware.run(rootSaga)
  loadStorageMiddleware(store)

  return store
}
