import React from 'react'
import { Props } from './Icons.type'

const ChatIcon = (props: Props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={23} viewBox="0 0 24 23" fill="none" {...props}>
    <path
      d="M1.33301 20.7111V3.72228C1.33301 2.49495 2.39429 1.5 3.70344 1.5H20.2965C21.6057 1.5 22.6669 2.49495 22.6669 3.72228V14.8337C22.6669 16.061 21.6057 17.056 20.2965 17.056H7.21316C6.49306 17.056 5.81201 17.3629 5.36216 17.89L2.59943 21.1275C2.1795 21.6196 1.33301 21.3413 1.33301 20.7111Z"
      fill={props?.fill}
      stroke={props?.stroke ?? 'white'}
      strokeWidth="3"
    />
  </svg>
)
export default ChatIcon
