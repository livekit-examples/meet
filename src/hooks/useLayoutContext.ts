import React, { useContext, useReducer } from 'react'
import { WIDGET_DEFAULT_STATE, PIN_DEFAULT_STATE } from '@livekit/components-core'
import { LayoutContext } from '@livekit/components-react'
import type { WidgetState as LivekitWidgetState, PinState, TrackReference } from '@livekit/components-core'

export type PinAction =
  | {
      msg: 'set_pin'
      trackReference: TrackReference
    }
  | { msg: 'clear_pin' }

export type PinContextType = {
  dispatch?: React.Dispatch<PinAction>
  state?: PinState
}

export function pinReducer(state: PinState, action: PinAction): PinState {
  if (action.msg === 'set_pin') {
    return [action.trackReference]
  } else if (action.msg === 'clear_pin') {
    return []
  } else {
    return { ...state }
  }
}

export type WidgetState = LivekitWidgetState & {
  showPeoplePanel: boolean
}

const widgetDefaultState: WidgetState = {
  ...WIDGET_DEFAULT_STATE,
  showPeoplePanel: false
}

type WidgetContextAction =
  | { msg: 'show_chat' }
  | { msg: 'hide_chat' }
  | { msg: 'toggle_chat' }
  | { msg: 'unread_msg'; count: number }
  | { msg: 'show_people_panel' }
  | { msg: 'hide_people_panel' }
  | { msg: 'toggle_people_panel' }

export type WidgetContextType = {
  dispatch?: React.Dispatch<WidgetContextAction>
  state?: WidgetState
}

function widgetReducer(state: WidgetState, action: WidgetContextAction): WidgetState {
  switch (action.msg) {
    case 'show_chat': {
      return { ...state, showChat: true, unreadMessages: 0 }
    }
    case 'hide_chat': {
      return { ...state, showChat: false }
    }
    case 'toggle_chat': {
      const newState = { ...state, showChat: !state.showChat }
      if (newState.showChat === true) {
        newState.unreadMessages = 0
        newState.showPeoplePanel = false
      }
      return newState
    }
    case 'unread_msg': {
      return { ...state, unreadMessages: action.count }
    }
    case 'show_people_panel': {
      return { ...state, showPeoplePanel: true }
    }
    case 'hide_people_panel': {
      return { ...state, showPeoplePanel: false }
    }
    case 'toggle_people_panel': {
      const newState = { ...state, showPeoplePanel: !state.showPeoplePanel }
      if (newState.showPeoplePanel === true) {
        newState.showChat = false
      }
      return newState
    }
    default: {
      return { ...state }
    }
  }
}

export type LayoutContextType = {
  pin: PinContextType
  widget: WidgetContextType
}

/**
 * @public
 */
export function useCreateLayoutContext(): LayoutContextType {
  const [pinState, pinDispatch] = useReducer(pinReducer, PIN_DEFAULT_STATE)
  const [widgetState, widgetDispatch] = useReducer(widgetReducer, widgetDefaultState)
  return {
    pin: { dispatch: pinDispatch, state: pinState },
    widget: { dispatch: widgetDispatch, state: widgetState }
  }
}

export function useEnsureCreateLayoutContext(layoutContext?: LayoutContextType): LayoutContextType {
  const [pinState, pinDispatch] = useReducer(pinReducer, PIN_DEFAULT_STATE)
  const [widgetState, widgetDispatch] = useReducer(widgetReducer, widgetDefaultState)
  return (
    layoutContext ?? {
      pin: { dispatch: pinDispatch, state: pinState },
      widget: { dispatch: widgetDispatch, state: widgetState }
    }
  )
}

/**
 * @public
 */
export function useLayoutContext(): LayoutContextType {
  const layoutContext = useContext(LayoutContext)
  if (!layoutContext) {
    throw Error('Tried to access LayoutContext context outside a LayoutContextProvider provider.')
  }

  return layoutContext as LayoutContextType
}
