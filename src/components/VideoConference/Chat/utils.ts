import { DataTopic, sendMessage, setupDataMessageHandler } from '@livekit/components-core'
import { ReceivedChatMessage } from '@livekit/components-react'
import { DataPacket_Kind, Participant, Room } from 'livekit-client'
import * as React from 'react'
import { BehaviorSubject, Subject, takeUntil, map, scan, filter } from 'rxjs'
import type { Observable } from 'rxjs'
import { Packet } from '@dcl/protocol/out-js/decentraland/kernel/comms/rfc4/comms.gen'

/**
 * @internal
 */
export function useObservableState<T>(observable: Observable<T> | undefined, startWith: T) {
  const [state, setState] = React.useState<T>(startWith)
  React.useEffect(() => {
    // observable state doesn't run in SSR
    if (typeof window === 'undefined' || !observable) return
    const subscription = observable.subscribe(setState)
    return () => subscription.unsubscribe()
  }, [observable])
  return state
}

export function cloneSingleChild(children: React.ReactNode | React.ReactNode[], props?: Record<string, any>, key?: any) {
  return React.Children.map(children, child => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if (React.isValidElement(child) && React.Children.only(children)) {
      return React.cloneElement(child, { ...props, key })
    }
    return child
  })
}

export function setupChat(room: Room) {
  const onDestroyObservable = new Subject<void>()
  const messageSubject = new Subject<{
    payload: Uint8Array
    topic: string | undefined
    from: Participant | undefined
  }>()

  /** Subscribe to all messages send over the wire. */
  const { messageObservable } = setupDataMessageHandler(room)
  messageObservable.pipe(takeUntil(onDestroyObservable)).subscribe(messageSubject)

  /** Build up the message array over time. */
  const messagesObservable = messageSubject.pipe(
    map(msg => {
      const packet = Packet.decode(msg.payload)
      return { packet, msg }
    }),
    filter(({ packet }) => packet.message?.$case === 'chat'),
    map(({ packet, msg }) => {
      if (packet.message?.$case === 'chat') {
        const { timestamp, message } = packet.message.chat
        return { from: msg.from, timestamp, message }
      }
      throw new Error('Found msg without chat')
    }),
    scan<ReceivedChatMessage, ReceivedChatMessage[]>((acc, value) => [...acc, value], []),
    takeUntil(onDestroyObservable)
  )

  const isSending$ = new BehaviorSubject<boolean>(false)

  const send = async (message: string) => {
    const encodedMsg = Packet.encode({
      message: {
        $case: 'chat',
        chat: {
          timestamp: Date.now(),
          message: message
        }
      }
    }).finish()
    isSending$.next(true)
    try {
      await sendMessage(room.localParticipant, encodedMsg, undefined, {
        kind: DataPacket_Kind.RELIABLE
      })
      messageSubject.next({
        payload: encodedMsg,
        topic: DataTopic.CHAT,
        from: room.localParticipant
      })
    } finally {
      isSending$.next(false)
    }
  }

  function destroy() {
    onDestroyObservable.next()
    onDestroyObservable.complete()
  }

  return { messageObservable: messagesObservable, isSendingObservable: isSending$, send, destroy }
}
