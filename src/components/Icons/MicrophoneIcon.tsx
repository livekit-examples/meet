import React from 'react'
import { Props } from './Icons.type'

const MicrophoneIcon = ({ enabled = true, ...props }: Props) => {
  return enabled ? (
    <svg width="21" height="29" viewBox="0 0 21 29" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M14.4468 5.03394C14.4468 2.80606 12.6407 1 10.4128 1C8.18496 1 6.37891 2.80606 6.37891 5.03394V13.1018C6.37891 15.3297 8.18496 17.1358 10.4128 17.1358C12.6407 17.1358 14.4468 15.3297 14.4468 13.1018V5.03394Z"
        stroke="white"
        strokeWidth="1.92"
      />
      <path
        d="M1 11.7573V13.1019C1 18.3003 5.21414 22.5144 10.4125 22.5144C15.6109 22.5144 19.8251 18.3003 19.8251 13.1019V11.7573"
        stroke="white"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4128 22.5145V27.8931M10.4128 27.8931H6.37891M10.4128 27.8931H14.4468"
        stroke="white"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19.4468 7.03394C19.4468 4.80606 17.6407 3 15.4128 3C13.185 3 11.3789 4.80606 11.3789 7.03394V15.1018C11.3789 17.3297 13.185 19.1358 15.4128 19.1358C17.6407 19.1358 19.4468 17.3297 19.4468 15.1018V7.03394Z"
        stroke="white"
        strokeWidth="1.92"
      />
      <path
        d="M6 13.7573V15.1019C6 20.3003 10.2141 24.5144 15.4125 24.5144C20.6109 24.5144 24.8251 20.3003 24.8251 15.1019V13.7573"
        stroke="white"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4128 24.5145V29.8931M15.4128 29.8931H11.3789M15.4128 29.8931H19.4468"
        stroke="white"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M28.5 1L1 28.5" stroke="#FCFCFC" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default MicrophoneIcon
