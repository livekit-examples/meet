import React from 'react'
import { Props } from './Icons.type'

const CameraIcon = ({ enabled = true, ...props }: Props) => {
  return enabled ? (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="camara">
        <path
          id="Vector"
          d="M28.28 24.2V30.536C28.28 31.0132 27.8932 31.4 27.416 31.4H11.864C11.3868 31.4 11 31.0132 11 30.536V17.864C11 17.3868 11.3868 17 11.864 17H27.416C27.8932 17 28.28 17.3868 28.28 17.864V24.2ZM28.28 24.2L35.5029 18.1809C36.0656 17.712 36.92 18.1121 36.92 18.8447V29.5554C36.92 30.2879 36.0656 30.6881 35.5029 30.2191L28.28 24.2Z"
          stroke="#FCFCFC"
          strokeWidth="1.92"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ) : (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M28.28 24.2V30.536C28.28 31.0132 27.8932 31.4 27.416 31.4H11.864C11.3868 31.4 11 31.0132 11 30.536V17.864C11 17.3868 11.3868 17 11.864 17H27.416C27.8932 17 28.28 17.3868 28.28 17.864V24.2ZM28.28 24.2L35.5029 18.1809C36.0656 17.712 36.92 18.1121 36.92 18.8447V29.5554C36.92 30.2879 36.0656 30.6881 35.5029 30.2191L28.28 24.2Z"
        stroke="#FCFCFC"
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M35.5 10L8 37.5" stroke="#FCFCFC" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default CameraIcon
