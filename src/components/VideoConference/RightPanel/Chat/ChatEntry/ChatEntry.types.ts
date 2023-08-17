import { ReceivedChatMessage } from '@livekit/components-core'
import { MessageFormatter } from '@livekit/components-react'

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 * @public
 */
export type OwnProps = React.HTMLAttributes<HTMLLIElement> & {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean
  /** Hide message timestamp. */
  hideTimestamp?: boolean
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter
}

export type Props = OwnProps & {
  address: string
  profiles: ReturnType<typeof import('decentraland-dapps/dist/modules/profile/selectors').getData>
}

export type MapStateProps = Pick<Props, 'address' | 'profiles'>
