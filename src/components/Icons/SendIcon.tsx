import React from 'react'
import { Props } from './Icons.type'

const SendIcon = (props: Props) => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M25.7422 5.75146L14.0085 24.4085L12.2228 15.2179L4.19727 10.3964L25.7422 5.75146Z"
      stroke={props.stroke ?? 'white'}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12.167 15.2561L25.7411 5.75146"
      stroke={props.stroke ?? 'white'}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

export default SendIcon
