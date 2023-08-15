import React, { useCallback, useMemo } from 'react'
import classNames from 'classnames'
import { Label } from 'decentraland-ui'
import PeopleIcon from '../../../../assets/icons/PeopleIcon'
import { WidgetState, useLayoutContext } from '../../../../hooks/useLayoutContext'
import type { Props } from './PeoplePanelToggleButton.types'
import styles from './PeoplePanelToggleButton.module.css'

export const PeoplePanelToggleButton: React.FC<Props> = ({ peopleCount = 0, onClick }) => {
  const layoutContext = useLayoutContext()

  const isPeoplePanelActive = useMemo(() => {
    return (layoutContext.widget.state as WidgetState).showPeoplePanel
  }, [layoutContext.widget.state])

  const handleTogglePeoplePanel = useCallback(() => {
    const { dispatch } = layoutContext.widget
    if (dispatch) {
      dispatch({ msg: 'toggle_people_panel' })
    }
  }, [layoutContext])

  return (
    <>
      <button
        className={classNames('lk-button', styles.button, { [styles.buttonActive]: isPeoplePanelActive })}
        onClick={onClick ?? handleTogglePeoplePanel}
      >
        <PeopleIcon className={styles.peopleIcon} />
      </button>
      <Label size="small" circular className={styles.label} content={peopleCount} />
    </>
  )
}

export default React.memo(PeoplePanelToggleButton)
