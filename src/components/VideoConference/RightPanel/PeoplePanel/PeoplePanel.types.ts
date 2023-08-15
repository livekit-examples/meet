export type Props = {
  profiles: ReturnType<typeof import('decentraland-dapps/dist/modules/profile/selectors').getData>
  isOpen: boolean
}

export type MapStateProps = Pick<Props, 'profiles'>
