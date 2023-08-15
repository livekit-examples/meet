import React, { useMemo } from 'react'
import classNames from 'classnames'
import { WidgetState, useLayoutContext } from '../../../hooks/useLayoutContext'
import Chat from './Chat'
import PeoplePanel from './PeoplePanel'
import styles from './RightPanel.module.css'

export const RightPanel = () => {
  const layoutContextValue = useLayoutContext()

  const { showChat, showPeoplePanel } = useMemo(() => {
    return layoutContextValue.widget.state as WidgetState
  }, [layoutContextValue.widget.state])

  return (
    <div className={classNames(styles.container, { [styles.open]: showChat || showPeoplePanel })}>
      <PeoplePanel isOpen={showPeoplePanel} />
      <Chat style={{ display: showChat ? 'flex' : 'none' }} />
    </div>
  )
}

export default React.memo(RightPanel)
