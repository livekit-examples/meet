import React, { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Divider from "semantic-ui-react/dist/commonjs/elements/Divider/Divider"
import { t } from "decentraland-dapps/dist/modules/translation/utils"
import { Tabs } from "decentraland-ui/dist/components/Tabs/Tabs"
import { Loader } from "decentraland-ui"
import { locations } from "../../../modules/routing/locations"
import { getView } from "../../../utils/view"
import { PageLayout } from "../../PageLayout"
import { Props } from "./MainPage.types"
import styles from "./MainPage.module.css"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"

function MainPage(props: Props) {
  const { isLoading, onFetchProfile, profileAddress, loggedInAddress } = props
  const tabs: { displayValue: string; value: string }[] = [
    { displayValue: t("tabs.overview"), value: t("tabs.overview") },
  ]

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0].value)

  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedTab(tab)
    },
    [setSelectedTab]
  )
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

  return (
    <PageLayout>
      {isLoading ? (
        <Loader active />
      ) : (
        <div className={styles.MainPage}>
          <div className={styles.infoContainer}>
            <Divider />
            <Tabs>
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.value} active={selectedTab === tab.value} onClick={() => handleTabChange(tab.value)}>
                  <span className={styles.tab}>{tab.displayValue}</span>
                </Tabs.Tab>
              ))}
            </Tabs>
            <LiveKitRoom token="" serverUrl="wss://dcl.livekit.cloud" connect={true}>
              <VideoConference />
            </LiveKitRoom>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default MainPage
