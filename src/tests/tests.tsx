import React from 'react'
import { Provider } from 'react-redux'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import flatten from 'flat'
import { Store } from 'redux'
import { en as dappsEn } from 'decentraland-dapps/dist/modules/translation/defaults'
import { mergeTranslations } from 'decentraland-dapps/dist/modules/translation/utils'
import TranslationProvider from 'decentraland-dapps/dist/providers/TranslationProvider'
import { RootState } from '../modules/reducer'
import * as locales from '../modules/translation/locales'
import { initTestStore } from './store'

export function renderWithProviders(
  component: JSX.Element,
  { preloadedState, store }: { preloadedState?: Partial<RootState>; store?: Store } = {}
) {
  const initializedStore =
    store ||
    initTestStore({
      ...(preloadedState || {}),
      storage: { loading: false },
      translation: {
        data: { en: mergeTranslations<any>(flatten(dappsEn), flatten(locales.en)) },
        locale: 'en'
      }
    })

  const router = (component: React.ReactNode) =>
    createBrowserRouter([
      {
        path: '*',
        element: component
      }
    ])

  function AppProviders({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={initializedStore}>
        <TranslationProvider locales={['en']}>
          <RouterProvider router={router(children)} />
        </TranslationProvider>
      </Provider>
    )
  }

  return render(component, { wrapper: AppProviders })
}
