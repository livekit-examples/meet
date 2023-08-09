import { all } from 'redux-saga/effects'
import { createAnalyticsSaga } from 'decentraland-dapps/dist/modules/analytics/sagas'
import { featuresSaga } from 'decentraland-dapps/dist/modules/features/sagas'
import { createProfileSaga } from 'decentraland-dapps/dist/modules/profile/sagas'
import { createWalletSaga } from 'decentraland-dapps/dist/modules/wallet/sagas'
import { config } from './config'
import { identitySaga } from './identity/sagas'
import { modalSagas } from './modal/sagas'
import { translationSaga } from './translation/sagas'

const analyticsSaga = createAnalyticsSaga()

export function* rootSaga() {
  yield all([
    analyticsSaga(),
    createWalletSaga({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      CHAIN_ID: Number(config.get('CHAIN_ID')),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      POLL_INTERVAL: 0,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      TRANSACTIONS_API_URL: 'https://transactions-api.decentraland.org/v1'
    })(),
    translationSaga(),
    identitySaga(),
    modalSagas(),
    createProfileSaga({ peerUrl: config.get('PEER_URL') })(),
    featuresSaga({
      polling: {
        apps: [
          /* Application name here */
        ],
        delay: 60000 /** 60 seconds */
      }
    })
  ])
}
