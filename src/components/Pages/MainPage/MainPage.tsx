import React, { ChangeEvent, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Divider from "semantic-ui-react/dist/commonjs/elements/Divider/Divider"
import { t } from "decentraland-dapps/dist/modules/translation/utils"
import { Loader } from "decentraland-ui"
import { locations } from "../../../modules/routing/locations"
import { getView } from "../../../utils/view"
import { PageLayout } from "../../PageLayout"
import { Props } from "./MainPage.types"
import styles from "./MainPage.module.css"
import { flatFetch } from "../../../utils/flat-fetch"
import { signedFetch } from "../../../utils/auth"
import { AuthIdentity } from "@dcl/crypto"

function MainPage(props: Props) {
  const [selectedServer, setSelectedServer] = useState("")
  const [isConnectingToServer, setIsConnectingToServer] = useState(false)

  const { isLoading, onFetchProfile, profileAddress, loggedInAddress, identity, onSubmitConnectForm } = props
  const tabs: { displayValue: string; value: string }[] = [
    { displayValue: t("tabs.overview"), value: t("tabs.overview") },
  ]

  const navigate = useNavigate()

  useEffect(() => {
    if (profileAddress) {
      onFetchProfile(profileAddress)
    }
  }, [profileAddress])

  useEffect(() => {
    if (!profileAddress && !loggedInAddress && !isLoading) {
      navigate(locations.signIn(locations.root()))
    }
  }, [isLoading, loggedInAddress, profileAddress])
  const view = getView(loggedInAddress, profileAddress)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedServer(e.target.value)
  }

  async function livekitConnect(identity: AuthIdentity, worldServer: string, worldName: string) {
    const aboutResponse = await flatFetch(`${worldServer}/world/${worldName}/about`)
    console.log(aboutResponse.text)
    if (aboutResponse.status === 200) {
      const url = JSON.parse(aboutResponse.text!)
        ["comms"]["fixedAdapter"].replace("signed-login:", "")
        .replace("get-comms-adapter", "cast-adapter")
      const response = await signedFetch(
        url,
        identity,
        {
          method: "POST",
        },
        {
          signer: "dcl:explorer",
          intent: "dcl:explorer:comms-handshake",
        }
      )

      if (response.status === 200) {
        console.log(response.text)
        return JSON.parse(response.text!)
      } else {
        let message = ""
        try {
          message = JSON.parse(response.text || "")?.message
        } catch (e) {
          message = response.text || ""
        }
        throw Error(message)
      }
      // throw Error(`Failed to connect to LiveKit: ${JSON.stringify(response.text || response.json?.message)}`)
    } else if (aboutResponse.status === 404) {
      throw Error(`World ${worldName} not found`)
    }
    throw Error("An error has occurred")
  }

  const handleClick = () => {
    livekitConnect(identity!, "https://worlds-content-server.decentraland.zone", selectedServer)
      .then((response: { url: string; token: string }) => {
        onSubmitConnectForm(response.url, response.token)
        navigate(`/meet/${encodeURIComponent(response.url)}?token=${encodeURIComponent(response.token)}`)
      })
      .catch((err) => {
        console.error("ERROR livekit connect", err)
      })
  }

  return (
    <PageLayout>
      {isLoading || isConnectingToServer ? (
        <Loader active />
      ) : (
        <div className={styles.MainPage}>
          <div className={styles.infoContainer}>
            <Divider />

            <div>
              <input name="server" value={selectedServer} onChange={handleChange} />

              <button onClick={handleClick}>Connect</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default MainPage
