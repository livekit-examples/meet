import React from 'react'
import { Props } from './Icons.type'

const ShareScreenIcon = ({ enabled = false, ...props }: Props) => {
  return enabled ? (
    <svg width="29" height="21" viewBox="0 0 29 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="0.96" y="0.96" width="27.08" height="19.08" rx="1.92" stroke="#1E1E1E" strokeWidth="1.92" />
      <path
        d="M14.3471 15.2164V6.16M14.3471 6.16L18.6941 10.5071M14.3471 6.16L10 10.5071"
        stroke="#1E1E1E"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="29" height="21" viewBox="0 0 29 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="0.96" y="0.96" width="27.08" height="19.08" rx="1.92" stroke="white" strokeWidth="1.92" />
      <path
        d="M14.3471 15.2163V6.15997M14.3471 6.15997L18.6941 10.507M14.3471 6.15997L10 10.507"
        stroke="white"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ShareScreenIcon
