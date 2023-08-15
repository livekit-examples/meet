import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar as BaseNavbar } from 'decentraland-dapps/dist/containers'
import { locations } from '../../modules/routing/locations'
import UserMenu from '../UserMenu'
import { Props } from './Navbar.types'
import './Navbar.css'

const Navbar = (props: Props) => {
  const { isConnected } = props
  const { pathname, search } = location
  const navigate = useNavigate()

  if (isConnected) {
    props = { ...props, rightMenu: <UserMenu /> }
  }

  const handleOnSignIn = useCallback(() => {
    const searchParams = new URLSearchParams(search)
    const currentRedirectTo = searchParams.get('redirectTo')
    const redirectTo = !currentRedirectTo ? `${pathname}${search}` : currentRedirectTo
    navigate(locations.signIn(redirectTo))
  }, [navigate, pathname, search])

  return <BaseNavbar {...props} isFullscreen={props.isFullscreen} isSignIn={pathname === locations.signIn()} onSignIn={handleOnSignIn} />
}

export default Navbar
