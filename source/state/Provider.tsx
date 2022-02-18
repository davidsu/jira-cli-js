/* eslint-disable react/prop-types */
import React, { useState, createContext, useEffect } from 'react'
import { store } from './store'

// Create Context Object
export const CounterContext = createContext({ state: store.getState(), dispatch: store.dispatch })

// Create a provider for components to consume and subscribe to changes
export const CounterContextProvider = props => {
  const [state, setState] = useState(store.getState())
  useEffect(() => {
    store.subscribe(() => {
      setState(store.getState())
    })
  })

  return <CounterContext.Provider value={{ state, dispatch: store.dispatch }}>{props.children}</CounterContext.Provider>
}
