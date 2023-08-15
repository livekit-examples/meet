export type Props = {
  peopleCount?: number
  onClick?: () => void
}

export type MapStateProps = Pick<Props, 'peopleCount'>
