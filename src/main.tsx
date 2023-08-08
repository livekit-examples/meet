/* eslint-disable import/order */
import "semantic-ui-css/semantic.min.css"
import React from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import ModalProvider from "decentraland-dapps/dist/providers/ModalProvider"
import TranslationProvider from "decentraland-dapps/dist/providers/TranslationProvider"
import WalletProvider from "decentraland-dapps/dist/providers/WalletProvider"
import * as modals from "./components/Modals"
import MainPage from "./components/Pages/MainPage"
import SignInPage from "./components/Pages/SignInPage"
import { initStore } from "./modules/store"
import * as locales from "./modules/translation/locales"
import Conference from "./components/Pages/Conference"
// These CSS styles must be defined last to avoid overriding other styles
import "decentraland-ui/dist/themes/alternative/light-theme.css"
import "./index.css"

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/accounts/:profileAddress?",
    element: <MainPage />,
  },
  {
    path: "sign-in",
    element: <SignInPage />,
  },
  {
    path: "/meet/:server",
    element: <Conference />,
  },
])

const component = (
  <React.StrictMode>
    <Provider store={initStore()}>
      <WalletProvider>
        <TranslationProvider locales={Object.keys(locales)}>
          <ModalProvider components={modals}>
            <RouterProvider router={router} />
          </ModalProvider>
        </TranslationProvider>
      </WalletProvider>
    </Provider>
  </React.StrictMode>
)

ReactDOM.render(component, document.getElementById("root") as HTMLElement)
