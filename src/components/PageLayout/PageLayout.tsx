import React from 'react'
import classNames from 'classnames'
import Navbar from '../Navbar'
import { Props } from './PageLayout.types'
import styles from './PageLayout.module.css'

const PageLayout = ({ children, className }: Props) => {
  return (
    <div className={classNames(styles.page, className)}>
      <Navbar className={styles.navbar} isFullscreen />
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default PageLayout
