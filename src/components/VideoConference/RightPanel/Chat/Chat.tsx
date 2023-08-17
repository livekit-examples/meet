import React, { useCallback, useEffect, useRef } from 'react'
import type { ChatMessage } from '@livekit/components-core'
import { useLocalParticipant } from '@livekit/components-react'
import classNames from 'classnames'
import { t } from 'decentraland-dapps/dist/modules/translation/utils'
import { Button, Header, Input } from 'decentraland-ui'
import SendIcon from '../../../../assets/icons/SendIcon'
import { useChat } from '../../../../hooks/useChat'
import { useLayoutContext } from '../../../../hooks/useLayoutContext'
import { cloneSingleChild } from '../../../../utils/chat'
import ChatEntry from './ChatEntry'
import { Props } from './Chat.types'
import styles from './Chat.module.css'

/**
 * The Chat component adds a basis chat functionality to the LiveKit room. The messages are distributed to all participants
 * in the room. Only users who are in the room at the time of dispatch will receive the message.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <Chat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export default function Chat({ messageFormatter, isOpen, ...props }: Props) {
  const { send, chatMessages, isSending } = useChat()
  const inputRef = useRef<HTMLInputElement>(null)
  const ulRef = useRef<HTMLUListElement>(null)

  const layoutContext = useLayoutContext()
  const lastReadMsgAt = useRef<ChatMessage['timestamp']>(0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      if (send) {
        await send(inputRef.current.value)
        inputRef.current.value = ''
        inputRef.current.focus()
      }
    }
  }

  useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight })
    }
  }, [ulRef, chatMessages])

  useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) {
      return
    }

    if (
      layoutContext.widget.state?.showChat &&
      chatMessages.length > 0 &&
      lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
    ) {
      lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp
      return
    }

    const unreadMessageCount = chatMessages.filter(msg => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current).length

    const { widget } = layoutContext
    if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
      widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount })
    }
  }, [chatMessages, layoutContext?.widget])

  const handleClosePanel = useCallback(() => {
    const { dispatch } = layoutContext.widget
    if (dispatch) {
      dispatch({ msg: 'hide_chat' })
    }
  }, [layoutContext])

  const localParticipant = useLocalParticipant().localParticipant

  return (
    <div {...props} className={classNames(styles.container, { [styles['open']]: isOpen })}>
      <div className={styles.headerContainer}>
        <Header className={styles.title} size="medium">
          {t('chat_panel.title')}
        </Header>
        <Button className={styles.close} onClick={handleClosePanel} />
      </div>
      <ul className={classNames(styles.chatMessages, 'lk-list', 'lk-chat-messages')} ref={ulRef}>
        {props.children
          ? chatMessages.map((msg, idx) =>
              cloneSingleChild(props.children, {
                entry: msg,
                key: idx,
                messageFormatter
              })
            )
          : chatMessages.map((msg, idx, allMsg) => {
              // If the time delta between two messages is bigger than 60s show timestamp.
              const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000
              const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from && hideTimestamp

              return (
                <ChatEntry
                  key={idx}
                  hideName={hideName}
                  hideTimestamp={hideName === false ? false : hideTimestamp} // If we show the name always show the timestamp as well.
                  entry={msg}
                  messageFormatter={messageFormatter}
                />
              )
            })}
      </ul>
      {localParticipant.permissions?.canPublish && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input className={styles.input} disabled={isSending} placeholder="Enter a message">
            <input ref={inputRef} />
            <Button type="submit" className={styles.button} basic size="small" disabled={isSending}>
              <SendIcon />
            </Button>
          </Input>
        </form>
      )}
    </div>
  )
}
