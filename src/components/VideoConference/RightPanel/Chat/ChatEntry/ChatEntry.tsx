import React, { useMemo } from 'react'
import { tokenize, createDefaultGrammar } from '@livekit/components-core'
import classNames from 'classnames'
import Profile from 'decentraland-dapps/dist/containers/Profile'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Props } from './ChatEntry.types'
import styles from './ChatEntry.module.css'

/**
 * The `ChatEntry` component holds and displays one chat message.
 *
 * @example
 * ```tsx
 * <Chat>
 *   <ChatEntry />
 * </Chat>
 * ```
 * @see `Chat`
 * @public
 */
export function ChatEntry({ entry, hideName = false, hideTimestamp = false, messageFormatter, address, profiles, ...props }: Props) {
  const formattedMessage = useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message
  }, [entry.message, messageFormatter])

  const time = new Date(entry.timestamp)
  const locale = navigator ? navigator.language : 'en-US'

  return (
    <li
      className={classNames('lk-chat-entry', styles.chatEntry, { [styles.sameSender]: hideName && hideTimestamp })}
      title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
      data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
      {...props}
    >
      {(!hideTimestamp || !hideName) && (
        <span className={styles.info}>
          {entry.from?.identity && <Profile address={entry.from?.identity} imageOnly size="normal" />}
          {!hideName && entry.from?.identity && (
            <strong className={styles.name}>
              {entry.from?.identity === address ? t('chat_entry.you') : profiles[entry.from?.identity].avatars[0].name}
            </strong>
          )}
          {!hideTimestamp && <span className={styles.timestamp}>{time.toLocaleTimeString(locale, { timeStyle: 'short' })}</span>}
        </span>
      )}
      <span className={styles.message}>{formattedMessage}</span>
    </li>
  )
}

/** @public */
export function formatChatMessageLinks(message: string): React.ReactNode {
  return tokenize(message, createDefaultGrammar()).map((tok, i) => {
    if (typeof tok === 'string') {
      return tok
    } else {
      const content = tok.content.toString()
      const href = tok.type === 'url' ? (/^http(s?):\/\//.test(content) ? content : `https://${content}`) : `mailto:${content}`
      return (
        <a className="lk-chat-link" key={i} href={href} target="_blank" rel="noreferrer">
          {content}
        </a>
      )
    }
  })
}

export default React.memo(ChatEntry)
