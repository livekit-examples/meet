import type { ChatMessage, ReceivedChatMessage } from '@livekit/components-core'
import { MessageFormatter } from '@livekit/components-react'

export type { ChatMessage, ReceivedChatMessage }

export type Props = React.HTMLAttributes<HTMLDivElement> & {
  isOpen: boolean
  messageFormatter?: MessageFormatter
}
