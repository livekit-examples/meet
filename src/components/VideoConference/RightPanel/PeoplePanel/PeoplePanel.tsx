import React, { useCallback } from 'react'
import classNames from 'classnames'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Button, Header, Profile } from 'decentraland-ui'
import { useLayoutContext } from '../../../../hooks/useLayoutContext'
import type { Props } from './PeoplePanel.types'
import styles from './PeoplePanel.module.css'

/**
 * The PeoplePanel component shows all the participants in a list.
 *
 * @example
 * ```tsx
 * <PeoplePanel />
 * ```
 * @public
 */
export const PeoplePanel: React.FC<Props> = ({ profiles, isOpen }: Props) => {
  const layoutContext = useLayoutContext()

  const handleClosePanel = useCallback(() => {
    const { dispatch } = layoutContext.widget
    if (dispatch) {
      dispatch({ msg: 'hide_people_panel' })
    }
  }, [layoutContext])

  return (
    <div className={classNames(styles.container, { [styles['open']]: isOpen })}>
      <div className={styles.headerContainer}>
        <Header className={styles.title} size="medium">
          {t('people_panel.title')}
        </Header>
        <Button className={styles.close} onClick={handleClosePanel} />
      </div>
      <Header className={styles.subtitle} size="medium">
        {t('people_panel.subtitle')}
      </Header>

      {Object.entries(profiles).map(([address, profile]) =>
        address ? (
          <div className={`${styles.profile} ProfileContainer`}>
            <Profile key={address} address={address} avatar={profile?.avatars[0]} />
          </div>
        ) : null
      )}
    </div>
  )
}

export default React.memo(PeoplePanel)
