import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthIdentity } from '@dcl/crypto'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Button, Loader, SelectField, Field, DropdownProps, Form } from 'decentraland-ui'
import meetOnDecentralandImg from '../../../assets/images/meet-on-decentraland.png'
import { locations } from '../../../modules/routing/locations'
import { signedFetch } from '../../../utils/auth'
import { isErrorMessage } from '../../../utils/errors'
import { flatFetch } from '../../../utils/flat-fetch'
import { addServerToPreviouslyLoaded } from '../../../utils/worldServers'
import { PageLayout } from '../../PageLayout'
import { Props } from './ConnectToWorld.types'
import styles from './ConnectToWorld.module.css'

function ConnectToWorld(props: Props) {
  const [selectedServer, setSelectedServer] = useState('')
  const [error, setError] = useState<string>('')
  const [availableServers, setAvailableServers] = useState<string[]>([])
  const [isConnectingToServer, setIsConnectingToServer] = useState(false)

  const { isLoading, loggedInAddress, identity, previouslyLoadedServers, worldsContentServerUrl, onSubmitConnectForm } = props

  const navigate = useNavigate()

  useEffect(() => {
    if (!loggedInAddress && !isLoading) {
      navigate(locations.signIn(locations.root(worldsContentServerUrl)))
    }
  }, [isLoading, loggedInAddress])

  useEffect(() => {
    if (previouslyLoadedServers) {
      setAvailableServers(previouslyLoadedServers)
      setSelectedServer(previouslyLoadedServers[0])
    }
  }, [previouslyLoadedServers, setAvailableServers])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setError('')
      setSelectedServer(e.target.value)
    },
    [setSelectedServer]
  )

  const handleSelectChange = useCallback(
    (_event: React.SyntheticEvent<HTMLElement>, { value }: DropdownProps) => {
      setError('')
      const newOption = value as string
      if (!availableServers.includes(newOption)) setAvailableServers([...availableServers, newOption])
      setSelectedServer(newOption)
    },
    [availableServers, setAvailableServers, setSelectedServer]
  )

  async function livekitConnect(identity: AuthIdentity, worldServer: string, worldName: string) {
    const aboutResponse = await flatFetch(`${worldServer}/world/${worldName}/about`)
    console.log(aboutResponse.text)
    if (aboutResponse.status === 200) {
      const url = JSON.parse(aboutResponse.text!)
        ['comms']['fixedAdapter'].replace('signed-login:', '')
        .replace('get-comms-adapter', 'cast-adapter')
      const response = await signedFetch(
        url,
        identity,
        {
          method: 'POST'
        },
        {
          signer: 'dcl:explorer',
          intent: 'dcl:explorer:comms-handshake'
        }
      )

      if (response.status === 200) {
        console.log(response.text)
        return JSON.parse(response.text!)
      } else {
        let message = ''
        try {
          message = JSON.parse(response.text || '')?.message
        } catch (e) {
          message = response.text || ''
        }
        throw Error(message)
      }
      // throw Error(`Failed to connect to LiveKit: ${JSON.stringify(response.text || response.json?.message)}`)
    } else if (aboutResponse.status === 404) {
      throw Error(`World ${worldName} not found`)
    }
    throw Error('An error has occurred')
  }

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      setError('')
      setIsConnectingToServer(true)

      try {
        if (!identity) return

        const response: { url: string; token: string } = await livekitConnect(identity, worldsContentServerUrl, selectedServer)
        onSubmitConnectForm(response.url, response.token)
        addServerToPreviouslyLoaded(selectedServer)
        navigate(`/meet/${encodeURIComponent(response.url)}?token=${encodeURIComponent(response.token)}`)
      } catch (error) {
        console.error('ERROR livekit connect', error)
        if (isErrorMessage(error)) setError(error.message)
      } finally {
        setIsConnectingToServer(false)
      }
    },
    [identity, selectedServer, onSubmitConnectForm]
  )

  return (
    <PageLayout>
      {isLoading ? (
        <Loader active />
      ) : (
        <div className={styles.ConnectToWorld}>
          <div className={styles.content}>
            <h4 className={styles.title}>{t('connect_to_world.title')}</h4>
            <p className={styles.description}>{t('connect_to_world.description')}</p>
            <img
              className={styles.img}
              src={meetOnDecentralandImg}
              alt={t('connect_to_world.image_alt')}
              aria-label={t('connect_to_world.image_alt')}
            />
            <Form className={styles.form}>
              <div className={styles.inputContainer}>
                <label className={styles.label} htmlFor="server">
                  {t('connect_to_world.input_label')}
                </label>
                {availableServers.length > 0 ? (
                  <SelectField
                    value={selectedServer}
                    options={availableServers.map(server => ({
                      value: server,
                      text: server
                    }))}
                    onAddItem={handleSelectChange}
                    onChange={handleSelectChange}
                    allowAdditions
                    error={!!error}
                    message={error}
                  />
                ) : (
                  <Field
                    name="server"
                    value={selectedServer}
                    onChange={handleChange}
                    placeholder={t('connect_to_world.input_placeholder')}
                    error={!!error}
                    message={error}
                    onEnter={handleClick}
                  />
                )}
              </div>
              <Button
                primary
                onClick={handleClick}
                fluid
                disabled={!selectedServer || isConnectingToServer}
                type="submit"
                loading={isConnectingToServer}
              >
                {t('connect_to_world.cta')}
              </Button>
            </Form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default ConnectToWorld
