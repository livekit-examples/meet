import { useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { setupChat, useObservableState } from '../utils/chat'

/** @public */
export function useChat() {
  const room = useRoomContext()
  const [setup, setSetup] = useState<ReturnType<typeof setupChat>>()
  const isSending = useObservableState(setup?.isSendingObservable, false)
  const chatMessages = useObservableState(setup?.messageObservable, [])

  useEffect(() => {
    const setupChatReturn = setupChat(room)
    setSetup(setupChatReturn)
    return setupChatReturn.destroy
  }, [room])

  return { send: setup?.send, chatMessages, isSending }
}
