import React from "react"
import classNames from "classnames"
import { Props } from "./PageLayout.types"
import styles from "./PageLayout.module.css"

const PageLayout = ({ children, className }: Props) => {
  return (
    <div className={classNames(styles.page, className)}>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default PageLayout
