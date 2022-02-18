#!/usr/bin/env node
import React from 'react'
import { render, useApp, useInput } from 'ink'
import App from './components/FuzzyList'
import { CounterContextProvider } from './state/Provider'
import { Provider } from 'react-redux'
import { store } from './state/store'

// const enterAltScreenCommand = '\x1b[?1049h'
// const leaveAltScreenCommand = '\x1b[?1049l'
// process.stdout.write(enterAltScreenCommand)
// process.on('exit', () => {
//   process.stdout.write(leaveAltScreenCommand)
// })

const Wrapper = ({ children }: { children: any }) => {
  const { exit } = useApp()
  useInput((input, key) => {
    if (key.escape) {
      setTimeout(() => process.exit(0), 50)
      exit()
    }
  })
  return <>{children}</>
}

render(
  <Wrapper>
    <Provider store={store}>
      {/* <CounterContextProvider> */}
      <App />
      {/* </CounterContextProvider> */}
    </Provider>
  </Wrapper>
)
