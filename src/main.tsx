/* eslint-disable import/order */
import 'semantic-ui-css/semantic.min.css'
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { getAnalytics } from 'decentraland-dapps/dist/modules/analytics/utils'
import ModalProvider from 'decentraland-dapps/dist/providers/ModalProvider'
import TranslationProvider from 'decentraland-dapps/dist/providers/TranslationProvider'
import WalletProvider from 'decentraland-dapps/dist/providers/WalletProvider'
import * as modals from './components/Modals'
import ConnectToWorld from './components/Pages/ConnectToWorld'
import SignInPage from './components/Pages/SignInPage'
import { initStore } from './modules/store'
import * as locales from './modules/translation/locales'
import Conference from './components/Pages/Conference'
// These CSS styles must be defined last to avoid overriding other styles
import 'decentraland-ui/dist/themes/alternative/light-theme.css'
import './index.css'

const SiteRoutes = () => {
  const location = useLocation()
  const analytics = getAnalytics()

  useEffect(() => {
    analytics.page()
  }, [location, analytics])

  return (
    <Routes>
      <Route path="/" element={<ConnectToWorld />} />
      <Route path="sign-in" element={<SignInPage />} />
      <Route path="/meet/:server" element={<Conference />} />
      <Route path="*" element={<ConnectToWorld />} />
    </Routes>
  )
}

const component = () => {
  return (
    <React.StrictMode>
      <Provider store={initStore()}>
        <WalletProvider>
          <TranslationProvider locales={Object.keys(locales)}>
            <ModalProvider components={modals}>
              <BrowserRouter>
                <SiteRoutes />
              </BrowserRouter>
            </ModalProvider>
          </TranslationProvider>
        </WalletProvider>
      </Provider>
    </React.StrictMode>
  )
}

ReactDOM.render(component(), document.getElementById('root') as HTMLElement)
