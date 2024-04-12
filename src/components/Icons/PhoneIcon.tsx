import React from 'react'
import { Props } from './Icons.type'

const PhoneIcon = (props: Props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" fill="none" {...props}>
    <path
      d="M1.59961 1.66504C1.59961 8.08588 5.60104 12.4595 12.208 12.4595"
      stroke={props?.stroke ?? 'white'}
      strokeWidth="1.44"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.2082 11.9941V9.83621C12.2082 9.51588 11.9966 9.23408 11.689 9.14477L9.69381 8.56552C9.46247 8.49836 9.21287 8.55134 9.02876 8.70668L6.3457 10.9705"
      stroke={props?.stroke ?? 'white'}
      strokeWidth="0.72"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.15576 1.66474L4.31332 1.62516C4.63359 1.61929 4.91924 1.82571 5.01418 2.13165L5.62992 4.11585C5.70131 4.34592 5.65292 4.59645 5.50098 4.78338L3.28675 7.50751"
      stroke={props?.stroke ?? 'white'}
      strokeWidth="0.72"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default PhoneIcon
