import { createFetchComponent } from '@well-known-components/fetch-component'
import { createContentClient } from 'dcl-catalyst-client'
import createSagasMiddleware from 'redux-saga'
import { createStorageMiddleware } from 'decentraland-dapps/dist/modules/storage/middleware'
import { MarketplaceGraphClient } from '../lib/MarketplaceGraphClient'
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
  const worldsContentClient = createContentClient({ url: 'WORLDS_CONTENT_SERVER_URL', fetcher: createFetchComponent() })
  const marketplaceGraphClient = new MarketplaceGraphClient('MARKETPLACE_GRAPH_URL')
  sagasMiddleware.run(rootSaga, worldsContentClient, marketplaceGraphClient)
  loadStorageMiddleware(store)

  return store
}
