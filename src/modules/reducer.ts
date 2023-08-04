import { configureStore, Reducer, Middleware, AnyAction, combineReducers, Store } from "@reduxjs/toolkit"
import { FeaturesState, featuresReducer as features } from "decentraland-dapps/dist/modules/features/reducer"
import { ModalState, modalReducer as modal } from "decentraland-dapps/dist/modules/modal/reducer"
import { ProfileState, profileReducer as profile } from "decentraland-dapps/dist/modules/profile/reducer"
import {
  StorageState,
  storageReducer as storage,
  storageReducerWrapper,
} from "decentraland-dapps/dist/modules/storage/reducer"
import {
  TranslationState,
  translationReducer as translation,
} from "decentraland-dapps/dist/modules/translation/reducer"
import { WalletState, walletReducer as wallet } from "decentraland-dapps/dist/modules/wallet/reducer"
import { IdentityState, identityReducer as identity } from "./identity/reducer"
import { ConferenceState, conferenceReducer as conference } from "./conference/reducer"

export const createRootReducer = (middlewares: Middleware[], preloadedState = {}) =>
  configureStore({
    reducer: storageReducerWrapper(
      combineReducers<RootState>({
        wallet,
        storage,
        modal: modal as Reducer<ModalState, AnyAction>,
        features: features as Reducer<FeaturesState, AnyAction>,
        translation: translation as Reducer<TranslationState, AnyAction>,
        profile,
        identity,
        conference,
      })
    ),
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: {
          // Ignore these action types
          ignoredActions: [
            "[Request] Login",
            "[Success] Login",
            "Open modal",
            "REDUX_PERSISTENCE_SAVE",
            "REDUX_PERSISTENCE_LOAD",
          ],
          ignoredPaths: ["modal", "identity"],
        },
      }).concat(middlewares),
  })

// We need to build the Store type manually due to the storageReducerWrapper function not propagating the type correctly
export type RootState = {
  identity: IdentityState
  modal: ModalState
  profile: ProfileState
  storage: StorageState
  translation: TranslationState
  wallet: WalletState
  features: FeaturesState
  conference: ConferenceState
}

export type RootStore = Store<RootState>
export type RootReducer = Reducer<RootState>
