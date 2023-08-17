import React, { useCallback, useMemo } from 'react'
import classNames from 'classnames'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Button, Header, Profile } from 'decentraland-ui'
import { useLayoutContext } from '../../../../hooks/useLayoutContext'
import type { Props } from './PeoplePanel.types'
import styles from './PeoplePanel.module.css'

const MAX_VISIBLE_PROFILES = 12

/**
 * The PeoplePanel component shows all the participants in a list.
 *
 * @example
 * ```tsx
 * <PeoplePanel isOpen={true} />
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

  const visibleProfiles = useMemo(() => {
    return Object.entries(profiles).slice(0, MAX_VISIBLE_PROFILES)
  }, [profiles])

  const trimmedProfiles = useMemo(() => {
    return Object.entries(profiles).slice(MAX_VISIBLE_PROFILES)
  }, [profiles])

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

      {visibleProfiles.map(([address, profile]) =>
        address ? (
          <div className={`${styles.profile} ProfileContainer`}>
            <Profile key={address} address={address} avatar={profile?.avatars[0]} />
          </div>
        ) : null
      )}

      {visibleProfiles.length === MAX_VISIBLE_PROFILES ? (
        <div className={`${styles.profile} TrimmedProfileContainer`}>
          {trimmedProfiles.slice(0, 3).map(([address, profile]) => (
            <Profile key={address} address={address} avatar={profile?.avatars[0]} imageOnly />
          ))}
          {t('people_panel.more', { name: trimmedProfiles[0][1].avatars[0].name, count: trimmedProfiles.length - 1 })}
        </div>
      ) : null}
    </div>
  )
}

export default React.memo(PeoplePanel)
