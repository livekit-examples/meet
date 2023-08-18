import React, { useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { default as SignIn } from 'decentraland-dapps/dist/containers/SignInPage'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Button } from 'decentraland-ui'
import { DOCS_URL } from '../../../utils/constants'
import { PageLayout } from '../../PageLayout'
import { Props } from './SignInPage.types'
import styles from './SignInPage.module.css'

const SignInPage = (props: Props) => {
  const { isConnected, onConnect } = props

  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const navigate = useNavigate()

  const handleLearnMore = useCallback(() => {
    window.open(DOCS_URL, '_blank', 'noopener noreferrer')
  }, [])

  useEffect(() => {
    if (redirectTo && isConnected) {
      navigate(decodeURIComponent(redirectTo))
    }
  }, [redirectTo, isConnected, navigate])

  return (
    <PageLayout>
      <div className={styles.SignIn}>
        <div className={styles.content}>
          <SignIn isConnected={isConnected} handleLoginConnect={onConnect} />
          <Button inverted onClick={handleLearnMore}>
            {t('global.learn_more')}
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

export default SignInPage
