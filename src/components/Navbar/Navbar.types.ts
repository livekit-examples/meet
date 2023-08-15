import { NavbarProps } from 'decentraland-ui/dist/components/Navbar/Navbar'

export type Props = Partial<NavbarProps> & {
  isConnected: boolean
}

export type MapStateProps = Pick<Props, 'isConnected'>
